# AERIS + Supabase setup

## 1. Create the project

1. Create one Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In **Project Settings → API**, copy the Project URL and the publishable key (older projects may label this the anon key).
3. In **Project Settings → API**, copy the service-role key only for server configuration. Never place it in a `NEXT_PUBLIC_` variable, browser code, screenshots, or source control.

## 2. Configure local environment

Copy `.env.example` to `.env.local`, then set these values:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=server_only_service_role_key
```

The `NEXT_PUBLIC_` pair is intentionally safe to expose to the browser. The service-role key is server-only and is used only by the protected admin role-assignment route.

## 3. Apply the database migration

In Supabase Dashboard, open **SQL Editor**, paste and run:

`supabase/migrations/202609210001_initial_aeris_schema.sql`

Or, after installing and authenticating the Supabase CLI, link the project and run `supabase db push`. The migration creates all tables, indexes, auth signup trigger, updated-at triggers, grants, and RLS policies.

## 4. Authentication and role flow

Registration and login use Supabase Auth email/password. A database trigger creates `public.profiles` after every Auth signup and assigns the only safe default role: `user`. Email confirmation links return to `/auth/callback`, which exchanges the code for cookie-backed SSR sessions.

The app sends a user to `/user`, `/admin`, or `/government` according to the database profile role. Those pages make a server-side role check; RLS remains the enforcement point for database data.

## 5. Role setup

Create the first account through `/login`. It starts as `user`.

To bootstrap the first administrator, run this once in the SQL Editor, replacing the email:

```sql
update public.profiles set role = 'admin' where email = 'admin@example.com';
```

Sign in as that administrator and use `/admin` to assign `government` to another already-registered account. The assignment route verifies the caller is an admin server-side and uses the service-role key; normal profile updates do not have permission to alter `profiles.role`.

## 6. RLS model

- `profiles`, `user_health_profiles`, `health_baselines`, and `telemetry_readings` are private to their owner. Admins get only the explicitly defined operational access.
- `risk_alerts` and `emergency_requests` are owner-private; admins can operate on them.
- `government_incidents` is a distinct minimized incident feed. Government users can read and update it, but cannot read profiles, raw telemetry, health profiles, or private emergency request data.
- Every exposed table has RLS enabled, explicit grants, and per-operation policies using `auth.uid()` and the protected `private.current_role()` function.

The direct test template is at `supabase/tests/aeris_rls.test.sql`. With the Supabase CLI/database test environment configured, run `supabase test db` to verify allow/deny behavior independently of the UI.

## 7. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login`. The existing Arduino serial bridge remains optional and runs separately with `npm run serial`.

## 8. Test matrix

For a **user** account: register, sign in, open `/user`, update their settings, and confirm `/admin` and `/government` redirect to `/unauthorized`.

For an **admin** account: bootstrap or assign the role, sign in, open `/admin`, update a test account's role, and confirm `/government` is denied.

For a **government** account: have an admin assign the role, sign in, open `/government`, and confirm `/admin` is denied. Create an SOS request as a user, then confirm the government view shows only the minimized incident and cannot retrieve that user's health profile or telemetry.

Run the RLS SQL test above after applying the migration. It explicitly verifies that another user cannot access private profile rows and that government can read only the minimized incident feed.
