# Prompt: Admin review → Government escalation flow

Copy everything below the line into your coding agent.

---

You are working in the AERIS repo (Next.js 16 App Router + Supabase, TypeScript, Tailwind v4, `motion/react`). Before writing code, read the relevant guides in `node_modules/next/dist/docs/` (this Next.js version has breaking changes; e.g. route handler `params` is a Promise). Match the existing code style, the UI primitives in `components/ui/*` (Card, CardHeader, Badge, Button, Dialog, Field, Select, Segmented, useToast), and `PortalShell`.

## Goal

Every alert or message a user sends must go to the **Admin dashboard first**. An admin reviews it and decides one of:

1. **Escalate to Government**: an anonymised incident is created in the Government panel.
2. **Handle internally / Decline**: it never reaches the Government panel. The admin's reason is recorded.

The Government panel must show **only** incidents that an admin has escalated.

## How the code works today (verified)

- User-side sends: `hooks/useTelemetry.tsx` posts to `/api/notify` with `type` = `sos | food | obstacle | threshold | cancel`. Sources: SOS countdown (`EmergencySosModal`), `components/dashboard/ReportCard.tsx` (obstacle/food), and automatic `threshold` posts for every new High/Critical alert from `lib/alerts.ts`.
- `app/api/notify/route.ts` inserts into `public.emergency_requests` (all types except `cancel`), then sends Telegram/Fast2SMS to the emergency contact.
- **Problem:** in `supabase/migrations/202609210001_initial_aeris_schema.sql`, trigger `emergency_request_created` runs `private.create_government_incident()` on every insert. So every request currently goes straight to `public.government_incidents`, with no admin step.
- `app/admin/page.tsx` + `components/AdminDashboard.tsx` show only counts and a role changer. There is no request queue.
- `app/government/page.tsx` + `components/GovernmentDashboard.tsx` read `government_incidents` (RLS: government role only).
- Enums: `request_status` = `submitted | reviewing | verified | resolved | rejected`. RLS: admins can select/update `emergency_requests`. Nobody has INSERT on `government_incidents`.

## Requirements

### 1. Database: new migration `supabase/migrations/2026XXXX0001_admin_escalation.sql` (do not edit the initial migration)

- `drop trigger if exists emergency_request_created on public.emergency_requests;` (keep or drop the old function, but nothing may auto-create incidents any more).
- Add to `public.emergency_requests`:
  - `admin_decision text check (admin_decision in ('escalated','declined'))`, null meaning pending
  - `admin_notes text`
  - `escalated_at timestamptz`
  - Reuse existing `reviewed_by`, `reviewed_at`, `status`.
- Add to `public.government_incidents`: `escalated_by uuid references public.profiles(id) on delete set null`, `escalated_at timestamptz not null default now()`.
- Create `public.escalate_emergency_request(p_request_id uuid, p_summary text, p_severity public.alert_severity default null)` as `security definer`, `set search_path = ''`:
  - Raise an exception unless `private.current_role() = 'admin'`.
  - Lock the request row (`for update`). Raise if it's missing or already declined.
  - Insert into `government_incidents` (type, severity = `coalesce(p_severity, request.severity)`, `status = 'submitted'`, lat/lon, `summary = left(p_summary, 500)`, `escalated_by = auth.uid()`). Use `on conflict (emergency_request_id) do nothing` so it is idempotent.
  - Update the request: `admin_decision='escalated'`, `status='verified'`, `reviewed_by`, `reviewed_at`, `escalated_at`.
  - Return the incident id. `revoke all ... from public; grant execute ... to authenticated;`
- Create `public.decline_emergency_request(p_request_id uuid, p_notes text)`, same admin guard. Sets `admin_decision='declined'`, `status='rejected'` (or `'resolved'` if the admin chooses "handled internally"; add a `p_resolved boolean` param), plus `admin_notes`, `reviewed_by`, `reviewed_at`. It must refuse if the request was already escalated.
- Optional, recommended: a trigger on `government_incidents` update that mirrors `status` back to the linked `emergency_requests.status`, so admins see the government's progress.
- Add `public.emergency_requests` to the `supabase_realtime` publication (for the live admin queue).
- Index: `create index on public.emergency_requests (admin_decision, created_at desc);`
- Update `supabase/tests/aeris_rls.test.sql`: a new request does NOT appear for the government role; a user and a government account cannot call either RPC; after an admin escalates, government can see the incident; escalate is idempotent; you can't decline after escalating.

### 2. User submissions (`app/api/notify/route.ts`, `hooks/useTelemetry.tsx`)

- Keep the Telegram/SMS emergency-contact dispatch exactly as it is. Personal safety messages must not wait for an admin.
- **Dedupe automatic `threshold` alerts:** before inserting, skip if the same user already has a pending (`admin_decision is null`) request with the same `request_type` and `title` created in the last 10 minutes. Otherwise the admin queue floods.
- For `type: 'cancel'`: update the user's most recent pending request (last 30 minutes) to `status='resolved'`, `admin_notes='Cancelled by user (false alarm)'`. Add an RLS policy or a small security-definer RPC that lets the owner do only this. Admins should see that it was cancelled.
- Return `requestId` in the JSON response. Optionally show "Sent to AERIS coordinators" in `PushNotificationToast`.

### 3. Admin API: `app/api/admin/requests/[id]/route.ts`

- `PATCH` body: `{ action: 'review' | 'escalate' | 'decline', summary?: string, severity?: 'low'|'medium'|'high'|'critical', notes?: string, resolved?: boolean }`.
- Auth: `getAuthContext()`. Return JSON 401 if signed out and 403 if the role isn't `admin`. Do not redirect from an API route.
- `review` sets `status='reviewing'` only while it is still `submitted`.
- `escalate`: `summary` is required, 10–500 chars. Call `supabase.rpc('escalate_emergency_request', ...)`.
- `decline`: `notes` is required, 3–1000 chars. Call `decline_emergency_request`.
- Validate input and return clear error messages. Follow the pattern in `app/api/admin/roles/route.ts`.

### 4. Admin dashboard UI (`app/admin/page.tsx`, `components/AdminDashboard.tsx`, new `components/admin/RequestQueue.tsx`)

- Server-fetch the latest 100 `emergency_requests` with `profiles(full_name, email, phone)` embedded, sorted pending-first, then by severity (critical→low), then newest.
- Add a **"Pending review"** stat card with the count of `admin_decision is null`. Keep the existing stats and role manager, placed below the queue.
- The queue card uses a `Segmented` filter: **Pending | Escalated | Declined | All**.
- Each row shows: type icon (reuse the `TYPE_ICON`/`TYPE_LABEL` maps from `GovernmentDashboard`, extracted to a shared `lib/incident-meta.ts`), severity badge, title, user name, relative time, and a status/decision badge.
- Expanding a row (or opening a Dialog) shows the full details: `details`, `recommended_action`, vitals (HR, SpO₂, body temp), a location link to `https://maps.google.com/?q=lat,lon`, user contact, and admin notes. Opening a `submitted` request fires `action: 'review'`.
- Actions on pending requests:
  - **Send to Government** opens a Dialog with an editable **public summary**, prefilled as `"<TYPE_LABEL> · <title> · <severity>"`. Show a visible warning: *"Do not include names, phone numbers or health readings. Government sees only this summary, type, severity and location."* It also has a severity override select and a Confirm button.
  - **Handle internally** / **Decline** opens a Dialog with a required reason textarea and a radio for "Resolved by us" vs "Not valid / rejected".
- Optimistic update with rollback, plus a success/error toast on each action. Disable buttons while a request is in flight.
- **Live updates:** subscribe with the browser Supabase client (`lib/supabase/browser.ts`) to `postgres_changes` on `emergency_requests`. On insert, show a toast "New SOS from …" and call `router.refresh()`. Fall back to polling `router.refresh()` every 20s if realtime fails. Unsubscribe on unmount.
- Local mode (`!hasSupabaseEnv()`): render the queue with an empty state ("No requests yet") and don't crash.
- Mobile: rows stack, and action buttons are full-width and at least 44px tall.

### 5. Government panel (`app/government/page.tsx`, `components/GovernmentDashboard.tsx`)

- No query change is needed (incidents now exist only after escalation), but also select `escalated_at` and show "Escalated by AERIS admin · <time>".
- Update the copy: description *"Incidents verified and escalated by AERIS administrators. Identities and personal health data are hidden."* Empty state: *"Nothing escalated yet."*
- Optional: let government update incident status (`reviewing → resolved`) through a small PATCH route. The existing RLS already allows government UPDATE.

### 6. Privacy and safety rules (must hold)

- Government never receives `user_id`, name, email, phone, or `vitals`. Only type, severity, status, lat/lon, and the admin-written summary.
- Only admins can escalate or decline. This is enforced in SQL (RPC guard), not only in the UI.
- A request can't be both escalated and declined. Escalation is idempotent.
- No hardcoded secrets. Don't change the Telegram/SMS behaviour.

### 7. Done when

- `npm run build` passes with no type errors.
- Manual test: as a user, press SOS and submit a food request. As admin, both appear live under Pending. Escalate one: it appears in `/government` and is gone from Pending. Decline the other with a reason: it never appears in `/government`.
- Triggering the same automatic threshold alert repeatedly creates only one pending request per 10 minutes.
- RLS tests updated and passing.
- Summarise the changed files and any manual Supabase steps (run the migration, realtime publication) at the end.
