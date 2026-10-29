-- AERIS full database setup for a NEW, empty Supabase project.
-- Paste into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Generated from supabase/migrations (run in order). If your tables already exist,
-- run only supabase/migrations/202610290001_admin_escalation.sql instead.

-- ================================================================
-- supabase/migrations/202609210001_initial_aeris_schema.sql
-- ================================================================
-- AERIS Supabase schema: identities, private health data, operational requests,
-- and a deliberately separate government-facing incident feed.
create schema if not exists private;

create type public.emergency_request_type as enum ('sos', 'food', 'obstacle', 'threshold');
create type public.request_status as enum ('submitted', 'reviewing', 'verified', 'resolved', 'rejected');
create type public.alert_severity as enum ('low', 'medium', 'high', 'critical');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin', 'government')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_health_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age integer check (age between 0 and 130),
  sex text check (sex in ('Male', 'Female', 'Other')),
  height_cm numeric(5,2) check (height_cm between 30 and 300),
  weight_kg numeric(6,2) check (weight_kg between 1 and 700),
  blood_pressure_systolic integer check (blood_pressure_systolic between 40 and 300),
  blood_pressure_diastolic integer check (blood_pressure_diastolic between 20 and 200),
  activity_level text check (activity_level in ('Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete')),
  known_resting_hr integer check (known_resting_hr between 20 and 300),
  known_hrv_baseline numeric(7,2) check (known_hrv_baseline >= 0),
  health_notes text,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  emergency_contact_phone text,
  enable_sms_alerts boolean not null default false,
  enable_whatsapp_alerts boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.health_baselines (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  baseline jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.telemetry_readings (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  captured_at timestamptz not null default now(),
  source text not null default 'dashboard',
  heart_rate numeric(6,2), hrv numeric(7,2), body_temp numeric(5,2), spo2 numeric(5,2),
  ambient_temp numeric(5,2), humidity numeric(5,2), pressure numeric(7,2),
  external_aqi integer, gait_variability numeric(6,2), gait_symmetry numeric(6,2),
  steps integer, cadence numeric(7,2), walking_speed numeric(7,2),
  payload jsonb not null default '{}'::jsonb
);

create table public.risk_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  alert_key text not null,
  severity public.alert_severity not null,
  title text not null,
  trigger_text text not null,
  supporting_signals jsonb not null default '[]'::jsonb,
  recommended_action text not null,
  acknowledged_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, alert_key, created_at)
);

create table public.emergency_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_type public.emergency_request_type not null,
  severity public.alert_severity not null default 'high',
  title text not null,
  details text,
  recommended_action text,
  location_lat numeric(9,6), location_lon numeric(9,6),
  vitals jsonb not null default '{}'::jsonb,
  status public.request_status not null default 'submitted',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (location_lat between -90 and 90 or location_lat is null),
  check (location_lon between -180 and 180 or location_lon is null)
);

-- This table intentionally excludes contact details, full profile data, and raw vitals.
create table public.government_incidents (
  id uuid primary key default gen_random_uuid(),
  emergency_request_id uuid unique not null references public.emergency_requests(id) on delete cascade,
  incident_type public.emergency_request_type not null,
  severity public.alert_severity not null,
  status public.request_status not null default 'submitted',
  location_lat numeric(9,6), location_lon numeric(9,6),
  summary text not null,
  responder_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index telemetry_readings_user_captured_at_idx on public.telemetry_readings(user_id, captured_at desc);
create index risk_alerts_user_created_at_idx on public.risk_alerts(user_id, created_at desc);
create index emergency_requests_user_created_at_idx on public.emergency_requests(user_id, created_at desc);
create index emergency_requests_status_created_at_idx on public.emergency_requests(status, created_at desc);
create index government_incidents_status_created_at_idx on public.government_incidents(status, created_at desc);

create or replace function private.set_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''), 'user');
  return new;
end;
$$;

create or replace function private.create_government_incident()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.government_incidents (
    emergency_request_id, incident_type, severity, status, location_lat, location_lon, summary
  ) values (
    new.id, new.request_type, new.severity, new.status, new.location_lat, new.location_lon,
    left(coalesce(new.title, 'Emergency request'), 500)
  );
  return new;
end;
$$;

create or replace function private.current_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger user_health_profiles_updated_at before update on public.user_health_profiles for each row execute function private.set_updated_at();
create trigger health_baselines_updated_at before update on public.health_baselines for each row execute function private.set_updated_at();
create trigger emergency_requests_updated_at before update on public.emergency_requests for each row execute function private.set_updated_at();
create trigger government_incidents_updated_at before update on public.government_incidents for each row execute function private.set_updated_at();
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
create trigger emergency_request_created after insert on public.emergency_requests for each row execute function private.create_government_incident();

alter table public.profiles enable row level security;
alter table public.user_health_profiles enable row level security;
alter table public.health_baselines enable row level security;
alter table public.telemetry_readings enable row level security;
alter table public.risk_alerts enable row level security;
alter table public.emergency_requests enable row level security;
alter table public.government_incidents enable row level security;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select on public.profiles, public.user_health_profiles, public.health_baselines, public.telemetry_readings, public.risk_alerts, public.emergency_requests, public.government_incidents to authenticated;
grant insert on public.user_health_profiles, public.health_baselines, public.telemetry_readings, public.risk_alerts, public.emergency_requests to authenticated;
grant update (full_name, email, phone, updated_at) on public.profiles to authenticated;
grant update on public.user_health_profiles, public.health_baselines, public.risk_alerts, public.emergency_requests, public.government_incidents to authenticated;
grant delete on public.telemetry_readings, public.risk_alerts, public.emergency_requests to authenticated;

create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated using ((select auth.uid()) = id or (select private.current_role()) = 'admin');
create policy "profiles_update_self_without_role" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "health_profile_select_own" on public.user_health_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "health_profile_insert_own" on public.user_health_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "health_profile_update_own" on public.user_health_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "health_profile_delete_own" on public.user_health_profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "baselines_select_own" on public.health_baselines for select to authenticated using ((select auth.uid()) = user_id);
create policy "baselines_insert_own" on public.health_baselines for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "baselines_update_own" on public.health_baselines for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "baselines_delete_own" on public.health_baselines for delete to authenticated using ((select auth.uid()) = user_id);

create policy "telemetry_select_own_or_admin" on public.telemetry_readings for select to authenticated using ((select auth.uid()) = user_id or (select private.current_role()) = 'admin');
create policy "telemetry_insert_own" on public.telemetry_readings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "telemetry_update_own" on public.telemetry_readings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "telemetry_delete_own" on public.telemetry_readings for delete to authenticated using ((select auth.uid()) = user_id);

create policy "alerts_select_own_or_admin" on public.risk_alerts for select to authenticated using ((select auth.uid()) = user_id or (select private.current_role()) = 'admin');
create policy "alerts_insert_own" on public.risk_alerts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "alerts_update_own_or_admin" on public.risk_alerts for update to authenticated using ((select auth.uid()) = user_id or (select private.current_role()) = 'admin') with check ((select auth.uid()) = user_id or (select private.current_role()) = 'admin');
create policy "alerts_delete_own_or_admin" on public.risk_alerts for delete to authenticated using ((select auth.uid()) = user_id or (select private.current_role()) = 'admin');

create policy "requests_select_own_or_admin" on public.emergency_requests for select to authenticated using ((select auth.uid()) = user_id or (select private.current_role()) = 'admin');
create policy "requests_insert_own" on public.emergency_requests for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "requests_update_admin_only" on public.emergency_requests for update to authenticated using ((select private.current_role()) = 'admin') with check ((select private.current_role()) = 'admin');
create policy "requests_delete_own_or_admin" on public.emergency_requests for delete to authenticated using ((select auth.uid()) = user_id or (select private.current_role()) = 'admin');

create policy "government_incidents_select_government" on public.government_incidents for select to authenticated using ((select private.current_role()) = 'government');
create policy "government_incidents_update_government" on public.government_incidents for update to authenticated using ((select private.current_role()) = 'government') with check ((select private.current_role()) = 'government');

revoke all on function private.set_updated_at() from public;
revoke all on function private.handle_new_user() from public;
revoke all on function private.create_government_incident() from public;
revoke all on function private.current_role() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_role() to authenticated;


-- ================================================================
-- supabase/migrations/202610250001_qr_login_requests.sql
-- ================================================================
-- Scan-to-log-in, tied to a mobile number.
--
-- Flow: a browser asks to log in for a mobile number and shows a QR code. A
-- phone that is already signed in to the AERIS account registered with that
-- same number scans it and approves; the browser is then signed in.
--
-- Rows are only ever read or written by server routes using the service role,
-- so RLS is enabled with no policies (nothing is exposed to anon/auth keys).

-- Normalises a phone number to E.164. Bare 10-digit numbers are treated as Indian (+91).
create or replace function private.normalize_phone(raw text)
returns text language sql immutable set search_path = '' as $$
  select case
    when raw is null or regexp_replace(raw, '\D', '', 'g') = '' then null
    when length(regexp_replace(raw, '\D', '', 'g')) = 10 then '+91' || regexp_replace(raw, '\D', '', 'g')
    else '+' || regexp_replace(raw, '\D', '', 'g')
  end
$$;

create table public.qr_login_requests (
  id uuid primary key default gen_random_uuid(),
  -- sha256 of a secret only the requesting browser knows; required to claim the session
  secret_hash text not null,
  -- E.164 mobile number the login is for; only an account with this number can approve
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'consumed')),
  user_id uuid references auth.users(id) on delete cascade,
  device_label text not null default 'Unknown device',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 minutes',
  approved_at timestamptz,
  consumed_at timestamptz
);

create index qr_login_requests_expires_at_idx on public.qr_login_requests (expires_at);

alter table public.qr_login_requests enable row level security;
revoke all on table public.qr_login_requests from anon, authenticated;

-- Save the account's own mobile number on sign-up (previously it was dropped).
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    'user',
    private.normalize_phone(coalesce(new.phone, new.raw_user_meta_data ->> 'phone'))
  );
  return new;
end;
$$;

-- Normalise numbers already stored so they match what QR login compares against.
update public.profiles set phone = private.normalize_phone(phone) where phone is not null;


-- ================================================================
-- supabase/migrations/202610290001_admin_escalation.sql
-- ================================================================
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

