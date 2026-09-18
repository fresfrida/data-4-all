# 3goods Handoff

Last updated: session 5 (user's local machine, real network access) — ran `npm run db:seed` against
the live Supabase project for the first time and did a full live-browser verification pass; both had
been blocked in session 4's cloud sandbox. See "Completed this session" below. Prior entry: session 4
(cloud/web session), reconciled the codebase against the actual live Supabase database (3G-042 /
DECISIONS.md D-042).

**Live URL: https://3goods.vercel.app** (separate Vercel project from the map site at
`002-data-4-life.vercel.app`, account `frescyliafrida-9461`). Redeploy with `vercel deploy --prod
--yes` from inside `3goods/` after any change you want reflected there. Not redeployed this session —
this session's changes are dev-server-verified only; see "Exact next action."

## Current task
**3G-042 fully verified live this session (see below). Next: commit the pending diff, clean up test
data, redeploy — see "Exact next action."**

## Completed this session (session 5)
- **`npm run db:seed` run and verified against the live Supabase project** for the first time —
  blocked in session 4's cloud sandbox by network egress policy, works cleanly from this local
  machine. All 8 seed items' `category_id` resolved correctly via the categories name→id map, no FK
  violations (confirms the category-id trim/diagnostics fix from an earlier commit, `9f8de89`/
  `5e78de9`, actually fixed the problem it targeted).
- **Full live-browser verification pass** (headless Chrome via raw CDP — `chromium-cli` and
  Playwright/Puppeteer weren't available in this environment; see "Known issues" for the driver
  setup) at mobile (390px) and desktop (1280px), against the real Supabase-backed app on
  `localhost:5174`:
  - Discover Items: real seeded items render with correct category/area/donor; category filter chips
    all present.
  - Item Detail, demo-login-gated Request flow as organisation (from logged-out — this is the D-044
    race-condition path).
  - Needs Management: existing needs list + add-need form both render for a logged-in organisation.
  - ChatList/ChatDetail: existing seeded conversation renders (system message + donor message), sent
    a new live message successfully as the logged-in organisation.
  - DonationForm: filled and submitted while logged out, resolved the demo-login prompt, donation
    was created against the live DB and redirected to its item page with the correct donor attributed
    — this is the exact "submit-while-logged-out" scenario the uncommitted `requireLogin` fix
    (DECISIONS.md D-044) was written for.
  - Zero crashes, clean console throughout (only pre-existing React Router v7 future-flag deprecation
    warnings — harmless, unrelated).
- Documented the `requireLogin`/`loggedInIdentity` race-condition fix as DECISIONS.md D-044 (the fix
  itself predates this session — found uncommitted at session start — this session added the write-up
  and the live verification evidence).
- KANBAN.md 3G-042 updated from "code-level done" to fully verified.

## Completed prior session (session 4)
- **3G-042 — reconciled the codebase against the real live Supabase schema.** The user had already
  created and partially seeded a Supabase project (ref `hizvkpspyglvpgictqif`, tagged PRODUCTION,
  categories table seeded with 8 rows) independently of what D-041's `schema.sql` assumed — real
  `uuid` primary keys, snake_case columns, a normalized `categories` table, a real `users` table,
  and several fields D-041's code depended on missing entirely (no `updates` table, plain-text
  `organisations.name` instead of bilingual, no Storage bucket for photos, etc.).
  - Rewrote `supabase/schema.sql` to document the actual live shape, plus an additive-migration
    section (new nullable columns / one new table) restoring real features the live shape had
    simplified away — bilingual org text, item Vietnamese titles, need tags, notes, the
    accepted-request link, the conversation-by-request lookup, translated system chat messages.
  - Gave every service (`itemsService`, `needsService`, `organisationsService`, `requestsService`,
    `chatService`, `updatesService`) a `fromRow`/`toRow` mapping layer so the DB's real column names
    never leak past the service boundary — **zero screen or component changes were needed.**
  - Rewrote `storageService.js`: photos are now a client-side base64 read (`FileReader`), not a
    Storage bucket upload — the live schema has an `image_base64` column, no bucket.
  - Added `src/data/ids.js` (fixed uuids for every seed record) and updated every `src/data/*.js`
    file + `scripts/seed-supabase.mjs` to match — seeding stays idempotent against `uuid`-typed
    columns instead of the old human-readable string ids.
  - Removed the stale 3G-040 Backlog entry (a migration doc that never got written because the real
    migration happened a different way) and added `validation.photoTooLarge` to both locale files.
  - Full reasoning/detail: DECISIONS.md D-042.
  - **Verification status**: `npm run i18n:check` (168/168) and `npm run build` both pass. **Not yet
    verified**: `npm run db:seed` has not actually been run against the live project — this session
    is a cloud sandbox whose network egress policy blocks `*.supabase.co`, so seeding and any live
    browser check need to happen from an environment with real network access (the user's computer,
    or a redeployed Vercel instance). The user also still needs to confirm the additive SQL from
    D-042 has actually been run against the live project (it was given to them inline in chat, not
    committed as a file, since most of it long-predates this file's existence in the session).

## Prior session's current task (superseded above, kept for history)
**Phase 1 Polish & Phase 2 Map Integration Completed.**
- **Accent Color Update**: `#52afe0` (bluish accent) replaces orange across `tailwind.config.js` and all UI elements.
- **8 Official Donation Categories Restored**: `Rice`, `Clothes`, `Books`, `Household Items`, `Non-Perishable Food`, `Hygiene Products`, `Children Items`, `Miscellaneous`.
- **Responsive Mobile/Tablet/Desktop Hero Landing Page**: Built on `/` (`DiscoverNeeds.jsx`) with dynamic gradient hero card, quick CTAs ("Donate Items", "Relief Heatmap", "Browse Items"), impact stats, and 8-category filter bar.
- **Phase 2 Map Integration (3G-020..023)**:
  - `src/features/map/vendor/` with `mapView.js`, `geo.js`, `scoring.js`.
  - `mapApiClient.js` loading disaster GeoJSON, OpenStreetMap community facilities, metro hubs, and item needs.
  - `VietnamMapView` and `MapScreenShell` with single-active-layer selection (Hazard Heatmap, Poverty Index, Coverage Gap).
  - Explicit data separation disclaimer banners distinguishing OSM facilities from verified 3goods relief organisations.

## Completed this session
- **3G-041 — reconciled a sitewide Footer + i18n key growth that was already on disk but never
  logged** (files were last touched ~08:40-09:06 the morning of this resume, after the prior
  session's own checkpoint): `Footer.jsx` wired into `AppShell.jsx`; locale files grew 133 → 166
  keys. `npm run i18n:check` (166/166) and `npm run build` both verified passing. Not yet re-checked
  live in a browser at either width — see "Checks still needed".
- Full Kanban/CLAUDE.md/DECISIONS/HANDOFF workflow (3G-001).
- Entire Phase 0 scaffold + the core donation journey (3G-002..016) — see KANBAN.md for the detailed
  per-task evidence; summary: router + every real screen wired up, full service/storage layer,
  Vietnam seed data, and a live end-to-end walkthrough (organisation requests an item → donor accepts
  → chat opens → status advances) confirmed working on both mobile (390px) and desktop (1440px).
- **3G-017 — formalised the i18n architecture** (this was the user's explicit follow-up request,
  building on the ad hoc translation work from earlier in Phase 1):
  - `src/i18n/locales/{en,vi}.json` are now the single source of all UI wording (125 keys each);
    `translations.js` just re-exports them.
  - `VITE_DEFAULT_LANGUAGE` env var (`.env.example`) sets the first-time-visitor default language;
    a returning visitor's own stored choice always wins over it.
  - `src/lib/errors.js`'s `AppError(code, params)` + `translateError(err, t)` — every service throws
    a code, never an English sentence.
  - `UpdateNotification.type`/`params` and system chat `Message.systemCode`/`params` replace
    pre-rendered `text` — see DECISIONS.md D-016. `lib/messageText.js` is the one shared render-time
    resolver used by both `ChatList` and `ChatDetail`.
  - Every remaining hardcoded English string across every screen and shared component was moved into
    the locale files (full list in KANBAN.md's 3G-017 entry).
  - `scripts/check-i18n-keys.mjs` (`npm run i18n:check`, also runs before `npm run build`) statically
    fails if `en.json`/`vi.json` key sets ever diverge.
- **Two real bugs found and fixed during verification** (not just written and assumed correct —
  see DECISIONS.md D-017 and D-018 for full detail):
  - D-017: `DonationForm`/`NeedsManagement`/`ItemDetail` were translating an error to a string at
    throw time and storing *that string* in state, so a language switch while the error was showing
    did nothing. Fixed by storing the raw error object and translating only at render time.
  - D-018: `lib/db.js`'s `STORAGE_VERSION` needed a bump (`v1` → `v2`) because a browser with
    pre-existing localStorage data from before the `text` → `type`+`params` shape change kept
    serving the *old* shape forever, which showed up live as literal `{itemTitle}` placeholders
    never being interpolated on the Updates screen.
- KANBAN.md fully reconciled: 3G-017 moved to Done with detailed verification evidence; D-014 marked
  resolved.
- **3G-038 — deployed to Vercel**, per explicit request ("any cloud push for checking?"). New,
  separate Vercel project (`3goods`), production alias `https://3goods.vercel.app`. Verified live
  with `curl` (home + two deep-linked routes all 200) and a screenshot matching the local dev server.

## Known issues / caveats
- **A second, stale checkout exists on this machine at
  `/Users/ff/Desktop/ProjectsAI/ProjectsHackathons/002-data-4-life/3goods` (no `-ag` suffix) with its
  own `npm run dev` left running since Thursday, bound to port 5173.** It's a different, older git
  state (missing the automatic-JSX-runtime dev transform working correctly — hitting it threw
  `ReferenceError: React is not defined` and rendered blank) and is *not* the repo this session (or
  any prior 3goods session) has been working in — this checkout (`002-data-4-life-ag`) runs on
  **port 5174**. Found by this session when an early smoke-test screenshot came back blank/erroring;
  cost real time to diagnose (`lsof -iTCP:5173`/`:5174` is the fast way to tell them apart). Worth
  killing that stray process (`lsof -ti:5173 | xargs kill`) or deleting that checkout entirely if it's
  not intentionally kept around — check with the user first, it wasn't investigated further this
  session beyond confirming it's a different directory.
- **Live Supabase `items` table has test-data pollution**: 5 pre-existing rows titled "Smoke Test
  Donation Item" (category Rice, all reusing the same bundled clothes photo — clearly leftover from
  earlier manual UI testing, not from `db:seed`) plus 1 new row this session's live-test added,
  titled "Live QA test donation (delete me)". None of this came from `src/data/items.js` / the seed
  script (which only ever upserts its own 8 fixed-uuid rows) — it's accumulated through the actual
  donation form UI. Harmless (valid rows, doesn't break anything) but visible in a live demo. Delete
  via the Supabase dashboard's table editor (project ref `hizvkpspyglvpgictqif`) — filter `items` by
  `title` containing "Smoke Test" or "delete me" before deleting, not by `donor_id`, since real seed
  items share the same demo donor.
- No git repository exists anywhere in `002-data-4-life/` — this Kanban is the only change record.
  (Note: `002-data-4-life-ag`, this checkout's parent folder, *is* a git repo — that's a different,
  newer setup from the plain `002-data-4-life` folder referenced by the point above and elsewhere in
  this file's older entries.)
- `/map` is an intentional placeholder (D-015) — Phase 2 not started, correctly deprioritised.
- The demo login prompt is role-agnostic — see D-013 for why that's an accepted tradeoff, not a bug.
- A pre-existing Vite build warning (`organisationsService.js` both statically and dynamically
  imported, from `requestsService.updateRequestStatus`'s lazy import) is harmless and unrelated to
  this session's work — not touched, would be a one-line refactor (make the import static) if it's
  ever worth silencing.
- `npm run dev` (localhost:5173) was left running in the background; the headless Chrome verification
  instance (port 9444) was stopped at the end of this session. A fresh session should feel free to
  restart either — nothing depends on keeping them alive across sessions.
- Desktop-width verification this session covered Discover Items, Item Detail, My Organisation, Chat
  Detail, and Updates (via the i18n verification pass) in addition to what Phase 1 already checked;
  ChatList and NeedsManagement have only been checked at mobile width across both sessions combined —
  low risk (same responsive patterns throughout) but worth a quick screenshot before calling 3G-036
  (desktop polish) fully done.

## Checks run
- `npm run i18n:check` → `i18n keys in sync: 125 keys in both en.json and vi.json.`
- `npm run build` → succeeds (242 KB JS bundle, gzip 73.5 KB), `i18n:check` runs first automatically.
- Live browser verification (headless Chrome + CDP) covering: form-input preservation across a live
  language switch; a forced service-level validation error translating correctly, including a live
  re-translation on language switch with no resubmission; notification text interpolation in both
  languages; system chat message translation with user-typed messages correctly left untranslated;
  a full request → accept → chat regression pass in Vietnamese at mobile and desktop widths.
- `grep` sweep confirming no hardcoded English left in JSX text nodes or
  `placeholder`/`aria-label`/`title` attributes anywhere in `src/`.
- **(session 5)** `npm run db:seed` against the real live Supabase project → completes with no FK
  violations. Live browser pass (headless Chrome + raw CDP, mobile 390px + desktop 1280px) against
  real seeded data: Discover Items, Item Detail, organisation Request flow from logged-out (D-044
  path), Needs Management, Chat list/detail + live message send, DonationForm submit-while-logged-out
  (D-044 path) — all clean, no crashes, no unexpected console errors.

## Checks still needed
- ChatList and NeedsManagement at desktop width specifically (see caveat above).
- A forced-error-state check for screens beyond the three touched by 3G-017's validation-message
  work (Me, MyOrganisation, OrganisationProfile, ChatDetail, Updates) hasn't been done by triggering
  a real thrown error in the browser — `ErrorState`/`useAsync` wiring was verified by code path only
  for those.

## Exact next action (3G-042 is now fully live-verified — see "Completed this session (session 5)")
1. **Commit the pending diff** (was uncommitted at this session's start, now live-verified): the
   `requireLogin`/`loggedInIdentity` race-condition fix (D-044) across `SessionContext.jsx`,
   `DonationForm.jsx`, `ItemDetail.jsx`, `NeedsManagement.jsx`, `ChatDetail.jsx`'s `senderId` fix, the
   new `RoleSwitcher` nav control in `DesktopTopNav.jsx`/`MobileHeader.jsx`, and the `messages.js`
   sender-id correction. Not committed by this session — commits are user-requested only.
2. **Clean up live test data** — delete the "Smoke Test Donation Item" ×5 and "Live QA test donation
   (delete me)" rows from the live `items` table (see "Known issues" above for how).
3. **Resolve the stray duplicate checkout** on port 5173 (see "Known issues" above) — confirm with
   the user whether to kill it, delete the checkout, or leave it; it's not part of this repo's history.
4. Redeploy to Vercel once the above is done — the `3goods` project referenced earlier in this file no
   longer exists under the connected account (`list_projects` returned empty in session 4), so it
   needs to be recreated from wherever the deploy actually happens, and its env vars
   (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`) set fresh.

### Prior priority list (now unblocked — 3G-042 is verified live)
1. Phase 2 map integration (3G-020 onward) — the next big feature area, per the original priority
   order (map was always meant to come after the core journey).
2. Phase 3 polish items: 3G-035 (FilterSheet), 3G-036 (the two remaining desktop screenshots above),
   3G-037 (accessibility pass — a11y labels are now translated but a full focus-state/aria-current
   audit hasn't been done).

To resume dev environment:
```
cd 3goods   # path depends on which machine/session — see git remote for the actual checkout
npm install
npm run dev
npm run i18n:check   # quick sanity check that locale files are still in sync
```

## Decisions genuinely needing the user
- ~~Confirm the D-042 additive SQL has actually been run against the live Supabase project~~ —
  resolved this session: `npm run db:seed` completing with no FK violations confirms it was run.
- OK to commit the pending diff (D-044 fix + RoleSwitcher + messages.js fix)? Not committed
  automatically — see "Exact next action" #1.
- OK to delete the stray test-data rows from the live `items` table, and/or kill or delete the stray
  duplicate checkout on port 5173? See "Known issues" and "Exact next action" #2–3 — left alone this
  session pending confirmation, since both touch state outside this repo (a live database and a
  second checkout on disk).
- If continuing into Phase 2, worth a quick confirmation on D-012 (3goods' category taxonomy vs. the
  root map site's) before wiring the map API client, since that's the point where the two
  taxonomies would first sit side by side in one screen.
