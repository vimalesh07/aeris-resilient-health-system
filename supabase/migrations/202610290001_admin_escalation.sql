-- Admin review before government escalation.
--
-- Previously every emergency request was copied straight into the government
-- feed by a trigger. Now requests wait in the admin queue; an admin either
-- escalates one (creating an anonymised government incident) or declines /
-- handles it internally (it never reaches the government feed).

drop trigger if exists emergency_request_created on public.emergency_requests;
drop function if exists private.create_government_incident();

alter table public.emergency_requests
  add column admin_decision text check (admin_decision in ('escalated', 'declined')),
  add column admin_notes text,
  add column escalated_at timestamptz;

alter table public.government_incidents
  add column escalated_by uuid references public.profiles(id) on delete set null,
  add column escalated_at timestamptz not null default now();

create index emergency_requests_admin_decision_created_at_idx on public.emergency_requests (admin_decision, created_at desc);

-- Admin-only: create the anonymised incident and mark the request escalated.
-- Idempotent: escalating twice returns the same incident.
create or replace function public.escalate_emergency_request(
  p_request_id uuid,
  p_summary text,
  p_severity public.alert_severity default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  req public.emergency_requests;
  incident_id uuid;
begin
  if coalesce(private.current_role(), '') <> 'admin' then
    raise exception 'Administrator role required.' using errcode = '42501';
  end if;
  if coalesce(length(trim(p_summary)), 0) < 10 then
    raise exception 'A public summary of at least 10 characters is required.' using errcode = '22023';
  end if;

  select * into req from public.emergency_requests where id = p_request_id for update;
  if not found then
    raise exception 'Emergency request not found.' using errcode = 'P0002';
  end if;
  if req.admin_decision = 'declined' then
    raise exception 'This request was already declined and cannot be escalated.' using errcode = '22023';
  end if;

  insert into public.government_incidents (
    emergency_request_id, incident_type, severity, status, location_lat, location_lon, summary, escalated_by
  ) values (
    req.id, req.request_type, coalesce(p_severity, req.severity), 'submitted',
    req.location_lat, req.location_lon, left(trim(p_summary), 500), (select auth.uid())
  )
  on conflict (emergency_request_id) do nothing;

  select id into incident_id from public.government_incidents where emergency_request_id = req.id;

  if req.admin_decision is null then
    update public.emergency_requests set
      admin_decision = 'escalated',
      status = 'verified',
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      escalated_at = now()
    where id = req.id;
  end if;

  return incident_id;
end;
$$;

-- Admin-only: close a request without involving the government.
-- p_resolved = true means "handled internally", false means "not valid".
create or replace function public.decline_emergency_request(
  p_request_id uuid,
  p_notes text,
  p_resolved boolean default false
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  req public.emergency_requests;
begin
  if coalesce(private.current_role(), '') <> 'admin' then
    raise exception 'Administrator role required.' using errcode = '42501';
  end if;
  if coalesce(length(trim(p_notes)), 0) < 3 then
    raise exception 'A reason of at least 3 characters is required.' using errcode = '22023';
  end if;

  select * into req from public.emergency_requests where id = p_request_id for update;
  if not found then
    raise exception 'Emergency request not found.' using errcode = 'P0002';
  end if;
  if req.admin_decision = 'escalated' then
    raise exception 'This request was already escalated to the government.' using errcode = '22023';
  end if;

  update public.emergency_requests set
    admin_decision = 'declined',
    status = case when p_resolved then 'resolved'::public.request_status else 'rejected'::public.request_status end,
    -- Keep any earlier note (e.g. a user cancellation) above the admin's reason.
    admin_notes = case when admin_notes is null then left(trim(p_notes), 1000) else admin_notes || E'\n' || left(trim(p_notes), 1000) end,
    reviewed_by = (select auth.uid()),
    reviewed_at = now()
  where id = req.id;
end;
$$;

-- Owner-only: mark the caller's latest pending request (last 30 min) as a false alarm.
create or replace function public.cancel_my_emergency_request()
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  cancelled_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  update public.emergency_requests set
    status = 'resolved',
    admin_notes = 'Cancelled by user (false alarm)'
  where id = (
    select id from public.emergency_requests
    where user_id = (select auth.uid())
      and admin_decision is null
      and status in ('submitted', 'reviewing')
      and created_at > now() - interval '30 minutes'
    order by created_at desc
    limit 1
  )
  returning id into cancelled_id;

  return cancelled_id;
end;
$$;

-- Mirror the government's progress back onto the request so admins can see it.
create or replace function private.sync_request_status_from_incident()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.emergency_requests set status = new.status where id = new.emergency_request_id;
  return new;
end;
$$;

create trigger government_incident_status_synced
  after update of status on public.government_incidents
  for each row when (old.status is distinct from new.status)
  execute function private.sync_request_status_from_incident();

revoke all on function public.escalate_emergency_request(uuid, text, public.alert_severity) from public;
revoke all on function public.decline_emergency_request(uuid, text, boolean) from public;
revoke all on function public.cancel_my_emergency_request() from public;
revoke all on function private.sync_request_status_from_incident() from public;
grant execute on function public.escalate_emergency_request(uuid, text, public.alert_severity) to authenticated;
grant execute on function public.decline_emergency_request(uuid, text, boolean) to authenticated;
grant execute on function public.cancel_my_emergency_request() to authenticated;

-- Live admin queue.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'emergency_requests'
     ) then
    alter publication supabase_realtime add table public.emergency_requests;
  end if;
end;
$$;
