# 3goods — Project Instructions

Vietnam-based donation coordination prototype. Donors list usable items; organisations browse them,
publish "we currently need" lists, and request items. **Not a marketplace** — never use price, cart,
checkout, payment, buyer protection, shipping, or buy/sell language anywhere (code, copy, or commit
messages). Use: Donate, Request, Needs, Collection, Organisation, Donor.

No repository-level CLAUDE.md existed before this one (checked at init — see DECISIONS.md D-001).
This file is project-local to `3goods/` and does not apply to the sibling map site at the repo root.

## Scope boundary

- 3goods lives entirely in `002-data-4-life/3goods/` as its **own** Vite project (own `package.json`,
  own `index.html`, own Vercel deployment). It does not share build tooling with the root site.
- `002-data-4-life/{index.html,web/,data/,api/}` is the **existing Vietnam disaster-relief map
  site** — a separate, already-shipped product. Do not edit it while working on 3goods.
- Map integration lives only in `3goods/src/features/map/`. Code under
  `src/features/map/vendor/` is a verbatim copy of the root site's rendering logic
  (`web/mapView.js`, `web/geo.js`, `web/scoring.js`). Treat it as read-only — wrap it, don't
  "improve" it in place. If a real change to the map's rendering is ever needed, make it in the
  root site first, then re-copy.
- There is no git repository at `002-data-4-life/` (checked at init). This workflow's file-based
  Kanban is the only change-tracking that exists — keep it honest.

## Commands

```
cd 3goods
npm install
npm run dev        # local dev server
npm run build       # runs i18n:check, then production build → dist/
npm run preview     # serve the production build locally
npm run i18n:check  # fails if en.json/vi.json key sets don't match exactly
```

Deploy (separate Vercel project from the root site): from inside `3goods/`, `vercel deploy --prod`.
First deploy will prompt to link/create a project — accept the suggested name or set one explicitly;
record the resulting project name/URL in `docs/HANDOFF.md`. `vercel.json` in this folder rewrites all
paths to `index.html` so deep-linked/refreshed routes (e.g. `/item/item-001`) don't 404 — see that
file's comment for why.

## Architecture rules (see `docs/DECISIONS.md` for the reasoning)

- **Components never import seed data or touch Supabase directly.** All data access goes through
  `src/services/*.js` (async functions: `getItems`, `createDonation`, `getNeeds`, `createRequest`,
  `getMessages`, etc.). Services call `src/lib/db.js`, the one storage engine, backed by Supabase/
  Postgres (see `supabase/schema.sql` for tables + RLS). No real auth — every table uses a single
  permissive policy; don't reuse this pattern for real user data without adding real auth first.
  `.env.local` needs `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (see `.env.example`); `npm run
  db:seed` pushes `src/data/*.js` into the real tables (idempotent via the fixed uuids in
  `src/data/ids.js`, safe to re-run).
  - **Areas are rows of the live `provinces` table** (all 63 provinces, D-062), read through `referenceDataService.getAreas()`;
    an "area id" is a province `slug`, stored as text in `organisations.city` / `items.area`. There is no static area list.
  - **The live database's column names/shapes don't match this app's camelCase model 1:1**
    (uuid `category_id`/`org_id`/`donor_id` foreign keys instead of plain-text fields, a single
    `image_base64` instead of a `photoPaths` array, `organisations.name`/`description` as plain
    text instead of bilingual `{en, vi}`, no `updates` table in the original live schema, etc. — see
    DECISIONS.md D-042 for the full reconciliation). Every service's `fromRow`/`toRow`-style
    functions are the *only* place that translation happens — screens and components keep using
    the same shapes documented in `src/data/types.js` regardless of what the DB column is actually
    called. When adding a new service function, follow this pattern rather than leaking a raw
    Supabase row shape into a screen.
- **Donation photos are stored as base64** (D-042 supersedes D-041's Storage-bucket approach):
  `DonationForm` reads the first selected file as a base64 data URL via `services/storageService.js`
  (no network call, no bucket), and it goes in `photoPaths[0]` — the same field seed items already
  used for bundled `public/demo-items/` images. Only one photo per item is supported (the live
  schema has room for exactly one).
- **Business rules live in the service layer, not in screens.** E.g. `requestsService.acceptRequest`
  is responsible for enforcing "one accepted organisation per listing," updating item status, and
  ensuring a conversation + update notification exist — a screen never orchestrates that by calling
  three services itself.
- **`role` vs `session` are different concerns** (`SessionContext`): `role` picks which nav/UI
  renders (donor or organisation view) and is freely switchable for testing; `session` is the demo
  "logged in as" identity that gates posting/requesting/editing. See D-004.
- **i18n**: all UI copy goes through `useTranslate()`, backed by `src/i18n/locales/{en,vi}.json` —
  those two files are the *only* place wording changes happen; `src/i18n/translations.js` just
  re-exports them. No hardcoded English strings in JSX, including `aria-label`/`placeholder`/`title`
  attributes. Run `npm run i18n:check` (also runs automatically before `npm run build`) after
  editing either locale file — it fails if the two files' key sets don't match exactly. The default
  language for a first-time visitor is configurable via `VITE_DEFAULT_LANGUAGE` (`.env.example`); a
  returning visitor's own stored choice always wins over it.
  - **Statuses and system-generated events are language-independent codes, not stored text.**
    `UpdateNotification.type` + `params`, and a system chat `Message.systemCode` + `params`, are
    looked up under `notifications.*` / `systemMessages.*` in the current locale at render time
    (`getMessageText()` in `lib/messageText.js` for chat, direct `t()` call in `Updates.jsx`). Never
    add a `text`/pre-rendered-English field to either of these — see DECISIONS.md D-016.
  - **Services throw `AppError(code, params)`** (`src/lib/errors.js`), never `new Error("English
    sentence")`. Screens turn it into display text with `translateError(err, t)`, which looks up
    `validation.{code}`. This is what lets the same validation failure read correctly regardless of
    which language the person hit it in.
  - Seeded demo content (org names, item titles, category/tag labels) carries both an `en` and `vi`
    string directly on the record; user-entered content (a donor's own item title, a typed chat
    message) is stored and shown exactly as typed and is never routed through `t()` or auto-translated.
- **Map vs organisation data stay separate records, never merged.** Disaster-context data (province
  scores, OSM facility pins) comes only from the map API client
  (`src/features/map/api/mapApiClient.js`) hitting the root site's deployed `/api/*` endpoints.
  3goods organisations come only from `organisationsService`. The client calls all five endpoints (`provinces`,
  `facilities`, `metro-hubs`, `item-needs`, `meta`) on the deployed root map site (base URL
  `VITE_MAP_API_BASE_URL`, default `https://002-data-4-life.vercel.app`). If the API is unreachable it falls back to
  the bundled `public/data/` snapshot (a copy of what the API serves) and the map shows a notice — see D-057.
  The vendored `mapView.js`/`geo.js` are verbatim copies of the root site's `web/` files (compare with `cmp`); the
  base-map land around Vietnam is `neighbour_land.json`, built by `3goods-map/src/build_neighbour_land.mjs` (D-061). A facility pin from OpenStreetMap is
  never presented as a registered 3goods organisation, and no score is invented where the map API
  returns `null`. The one bridge is a *computed match*: a pin within 150 m of an organisation's optional exact `location` gets a popup
  that links to that organisation (`features/map/facilityMatching.js`, D-073); the two records stay separate and the popup labels each
  for what it is. Unmatched pins offer an interest form (`facility_interests`), not registration.

## Verification requirement

Before moving any UI task to Done: check it at a mobile width (~375px) and a desktop width
(~1280px). Use the Chrome DevTools Protocol screenshot workflow already established in this
project's chat history (headless Chrome + `Emulation.setDeviceMetricsOverride`, not the `--screenshot`
CLI flag, which renders inaccurately). If verification genuinely isn't possible, say so in
`docs/HANDOFF.md` instead of skipping it silently.

## Resume procedure (do this first in a new session)

1. Read this file, `docs/KANBAN.md`, `docs/HANDOFF.md`, and `docs/DECISIONS.md`.
2. Run `ls -la 3goods/src` (and `git status` once a repo exists) — `HANDOFF.md` is a snapshot taken
   at the last checkpoint, not guaranteed to match the code exactly.
3. Reconcile: if a task marked Done doesn't actually work, move it back and log why in DECISIONS.md.
4. State the current task ID and the next concrete action, then continue — don't ask the user to
   re-explain settled requirements.

## Checkpoint procedure

Update `docs/KANBAN.md` and `docs/HANDOFF.md` after each task changes state, before switching tasks,
and before ending a session. Don't wait until context is nearly full. Never record passwords, tokens,
or real personal data in any of these files (there shouldn't be any in a demo-login prototype).
