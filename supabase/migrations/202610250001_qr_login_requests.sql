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
