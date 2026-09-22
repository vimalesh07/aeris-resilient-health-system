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
