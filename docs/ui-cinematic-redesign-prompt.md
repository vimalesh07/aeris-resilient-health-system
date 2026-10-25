# Prompt: Take the AERIS UI to a cinematic, next-level design

> Paste everything below into your AI design/coding assistant (Claude, ChatGPT, v0, etc.).

---

You are a senior product designer and design engineer who has shipped award-level interfaces (Apple Health, Linear, Arc, Vercel, Stripe, Nothing OS level of polish). I want you to redesign the UI of my app **AERIS** so it feels **cinematic, premium and unforgettable** — while staying fast, accessible and trustworthy, because people use it in health emergencies.

## 1. What AERIS is

AERIS is a personal **health + climate safety** platform built for India (hackathon project, team "Straw Hats").

- A wearable (Arduino/ESP8266 + MAX30102 pulse-oximeter sensor) streams **heart rate and blood oxygen**; the app also tracks body temperature, movement, local **weather and air quality** (Open-Meteo).
- It learns the user's **personal baseline** and combines five signals (heart & oxygen 30%, body temperature 20%, heat strain 20%, air & weather 15%, movement 15%) into one **overall risk score from 0–100** (Safe 0–30, Monitor 31–60, Critical 61–100).
- **Emergency SOS**: 10-second countdown, then sends vitals + live GPS to a Telegram response channel; cancelling afterwards sends a "false alarm" message.
- Three portals: **Personal** (end users), **Admin** (role management), **Government** (anonymised incident feed).
- Works offline with demo data when no wearable is connected.

Users: everyday people (students, outdoor workers, elderly) on mid-range **Android phones**, plus judges/demo viewers on laptops.

## 2. Tech stack (use these — don't introduce new frameworks)

- **Next.js 16** (App Router, Turbopack), **React 19**, TypeScript
- **Tailwind CSS v4** with CSS-variable design tokens (`@theme inline`), light + dark themes via `<html data-theme="light|dark">`
- **Motion** (`motion/react`, formerly Framer Motion) for all animation; `MotionConfig reducedMotion="user"`
- **three.js** (a 3D wireframe "digital twin" human body with vitals pinned to body parts)
- **Leaflet + OpenStreetMap** maps
- **lucide-react** icons, **Geist / Geist Mono** fonts (`next/font`)
- shadcn-style primitives on **@base-ui/react**; Supabase for auth/data

## 3. The current UI (as it is now)

**Design language:** clean, clinical "Apple Health meets Linear". Light theme default (canvas `#F5F6F8`, white cards), full dark theme (canvas `#0A0E13`, cards `#121821`). Brand colour **AERIS red `#DC2626`** used sparingly (SOS, active nav, primary buttons). Semantic colours: success green, warning amber, danger red, info blue. Cards are `rounded-2xl`, 1px borders, soft shadows. Type is Geist, sentence case, plain-language copy ("You're within your normal range"). Numbers use tabular figures and animate (count-up) when they change.

**App shell (Personal portal):**
- Desktop (≥1024px): fixed left sidebar (logo, nav groups "Monitor" / "Tools", data-source card "Demo data / Wearable live", big red **Emergency SOS** button at the bottom); sticky translucent top bar with page name, connection pill and an account menu (theme toggle, "Demo tools" switch, portal switcher, log out).
- Mobile: top bar + **bottom tab bar** (Home, Climate, Safe places, Assistant, More) + floating red **SOS** button; "More" opens a bottom sheet with all sections.
- Optional amber "Demo" strip under the top bar with scenario chips (Normal, Stress, Heat strain, Fever, Exercise, Monsoon, Heatwave 44°C, Cyclone, Smog AQI 395, Fall).
- Every screen has its own URL (`/user`, `/user/stress`, `/user/climate`, `/user/safe-places`, `/user/assistant`, `/user/trends`, `/user/settings`). Screens crossfade in (fade + 8px rise).

**Screens:**
1. **Dashboard** — greeting header; 4 vital tiles (Heart rate, Blood oxygen, Body temp, Outside weather) with status badges; "Overall risk" card (big score, coloured 0–100 scale with moving marker, 5 contributor bars, "Why this score" dialog, "Ask the assistant"); "Body view" card with the dark 3D digital twin; Alerts feed; "Report to relief teams" card (blocked path / food & water).
2. **Stress & recovery** — stress score with 4 weighted bars, daily check-in (6 questions, 1–5 ratings), recovery score, activity, "Mind reset" (guided breathing dialog with an expanding/contracting circle), recent readings table.
3. **Climate health** — heat strain card with advice, air quality (AQI + pollutants), weather tiles, "Climate and your body" insights, Leaflet map.
4. **Safe places** — emergency call buttons (112 / 108 / 1077), search + "Near me", category filter chips, map + list of hospitals / health centres / shelters / pharmacies with Call and Directions.
5. **AI assistant** — chat bubbles, Cloud vs On-device toggle, suggestion chips, typing indicator.
6. **Trends** — summary stats, line charts (heart rate, body temp) with hover crosshair + dashed baseline, heat-exposure table, movement stats.
7. **Settings** — side tabs: Profile, Baselines, Alerts & contacts, Wearable (live sensor log), Privacy.

**Overlays:** SOS dialog (big countdown ring, vitals, location, "Cancel — I'm safe" / "Send now"), "Are you OK?" high-heart-rate check (10 s), push-alert toast with delivery status, toasts.

**Other portals:** Admin console (stat tiles, change-role form with confirm dialog), Government incident feed (severity filters, expandable rows), 403 page.

**Login page (separate, older style):** dark navy page with a radial glow, three role cards (User / Admin / Government) and a new **"Scan to log in"** panel: enter mobile number → QR code with an animated scan line → phone (already signed in, same registered number) approves → browser logs in.

## 4. What I want from you

Make AERIS feel **cinematic** — like the opening of a sci-fi film crossed with a premium medical device — without becoming slow, noisy or hard to read.

Please deliver:

1. **Three distinct art directions** (name, mood board in words, colour + lighting, typography, motion personality, one sentence on why it fits a health-safety product). Then **recommend one**.
2. **Design tokens** for the chosen direction, written as Tailwind v4 CSS variables for both light and dark (surfaces, text, brand, semantic, risk tiers, elevation, glow, radius, blur, motion durations/easings, z-index scale). Keep WCAG AA contrast (4.5:1 text, 3:1 UI).
3. **Signature "hero moments"** — the 5–7 moments that make people say "wow", for example:
   - first-load / login reveal sequence,
   - the risk score "reveal" (score counting up, ring/scale sweeping in, contributors cascading),
   - the 3D digital twin (lighting, bloom, heartbeat pulse synced to live BPM, colour shift by risk),
   - the SOS countdown (full-screen takeover, pulse, haptics where available),
   - live vital tiles (micro-motion that feels alive but calm),
   - screen-to-screen transitions (shared-element / layout animations),
   - QR "scan to log in" success.
   For each: storyboard (frames with timings in ms), exact Motion code (`motion/react`), and the reduced-motion fallback.
4. **A motion system**: named presets (e.g. `enter`, `exit`, `emphasis`, `alert`, `ambient`) with spring/duration values, stagger rules, what may loop and what must never loop, and a performance budget (transform/opacity only, 60fps on a mid-range Android, max simultaneous animations).
5. **Screen-by-screen redesign** of all screens listed above (layout at 390px and 1440px, hierarchy, what changes and why). Keep every existing feature and plain-language copy.
6. **Component specs** for the new look: card, stat/vital tile, risk ring, badge, button set, segmented control, dialog/sheet, toast, chart style, map overlays, nav (sidebar + bottom bar).
7. **Implementation plan** for my stack: ordered steps, which files/components to touch, code snippets (React 19 + Tailwind v4 + Motion), and how to keep the 3D scene and maps performant (lazy-load, pause when off-screen, cap pixel ratio).
8. **Anti-patterns to avoid** — things that would make it look cheap or hurt trust (e.g. neon everywhere, glassmorphism on body text, constant pulsing, auto-playing sound, motion that delays the SOS button).

## 5. Hard rules (non-negotiable)

- **Safety first:** the SOS button and any critical alert must be instantly visible, reachable in one tap, and never delayed or hidden by animation. Critical states must not rely on colour alone (icon + text too).
- **Accessibility:** WCAG 2.2 AA, visible focus rings, 44×44px touch targets, keyboard support, screen-reader labels, `prefers-reduced-motion` fully respected.
- **Performance:** fast on low-end Android and slow networks; no layout shift; animate only `transform` and `opacity`; lazy-load heavy parts (3D, maps).
- **Both themes** must look intentional — design dark mode as a first-class "night / cinema" mode, not an inverted afterthought.
- **Honest data:** clearly label demo data vs live wearable data; never show fabricated results as real.
- Keep the AERIS red brand, the plain-language tone, and all current features and flows.
- No new UI frameworks; Motion for animation, Tailwind for styling, lucide for icons.

Start with the three art directions and your recommendation, then continue through the deliverables in order.
