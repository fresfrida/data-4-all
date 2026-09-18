# 3goods Handoff

Last updated: session 6 (same machine as session 5) — removed the independent `role` switcher state
per explicit user request (3G-043 / DECISIONS.md D-045, supersedes D-004), committed, pushed, and
redeployed to production. See "Completed this session" below. Prior entry: session 5, first live
`npm run db:seed` + full live-browser verification pass against the real Supabase project.

**Live URL: https://3goods.vercel.app** (separate Vercel project from the map site at
`002-data-4-life.vercel.app`, account `frescyliafrida-9461`, project id
`prj_nhnDkGhaFGNGYOX7wqY0x0ymKGpT`). Redeploy with `vercel deploy --prod --yes` from inside `3goods/`
after any change you want reflected there. `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set as
Production env vars on this project (`vercel env ls production` to confirm) — set in session 5.

## Current task
**3G-043 (role-state simplification) done and deployed — see "Completed this session" below. Nothing
blocking; see "Priority list" for what's next.**

## Completed this session (session 6)
- **3G-043 — removed independent `role` state, collapsed to 3 identity states** (see DECISIONS.md
  D-045 for full detail; supersedes D-004). Summary:
  - `SessionContext.jsx`: `role` is now `identity?.role ?? null`, never stored; `setRole` deleted;
    `logout()` always resets to the same neutral `{ isLoggedIn: false, identity: null }`.
  - `RoleSwitcher.jsx` deleted; `DesktopTopNav.jsx`/`MobileHeader.jsx` no longer render it. The
    existing `DemoLoginButton` ("Log in"/"Log out") is now the only header identity control.
  - `DonationForm.jsx`/`NeedsManagement.jsx`/`MyOrganisation.jsx`/`Me.jsx`: added/reordered an
    `!isLoggedIn` check before the role-mismatch check, reusing the `EmptyState` + login-prompt
    pattern already established in `Me.jsx`/`Updates.jsx`/`ChatList.jsx`. `ChatDetail.jsx` gained the
    same `!isLoggedIn` guard (previously had none at all — a pre-existing gap, not a regression).
  - `DiscoverNeeds.jsx` hero: restored the original 3-CTA intent per user confirmation — guest and
    organisation see "Browse Items" + "Relief Map", logged-in donor sees "Donate Items" instead; two
    always-logged-in-assuming pills collapsed to one guest pill or one merged logged-in pill.
  - Translation copy updated in `en.json`/`vi.json` to match (both files, key parity maintained).
  - Stopped, per explicit user confirmation, on two points that were genuinely ambiguous rather than
    guessing: what the guest hero CTA should say (resolved: restore the original "Browse Items"
    design rather than inventing new copy), and what the guest context pill should say (resolved:
    "Browsing as guest").
  - Verified live: `npm run i18n:check` (170/170), `npm run build`, and a full headless-Chrome-+-CDP
    browser pass at mobile (390px) and desktop (1280px) — guest state, login-as-Donor, an
    organisation-only page visited as donor (new mismatch copy), logout back to the identical guest
    state, login-as-Organisation (Needs Management + My Organisation both load real seeded data),
    guest Item Detail (no Request button, no crash) vs. logged-in-organisation Item Detail (button
    present). Zero console errors (pre-existing React Router v7 future-flag warnings only).
  - Committed (`git log` for the exact hash — see commit message "Remove independent role switcher
    state..."), pushed to `claude/supabase-connection-status-9rhtx1`, redeployed to
    `https://3goods.vercel.app` via `vercel deploy --prod --yes`, verified live post-deploy.

## Completed prior session (session 5)
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
- **Killed the stale duplicate dev server** on port 5173 (`002-data-4-life/3goods`, no `-ag` — a
  different, older checkout on this machine; see D-044-adjacent note removed below, now resolved).
- **Deleted the 6 test-data item rows** found live (5 "Smoke Test Donation Item" + 1 "Live QA test
  donation (delete me)" this session's own testing added — 7 total including a duplicate found at
  cleanup time) plus their dependent `requests`/`conversations`/`messages` rows, in FK-safe order
  (cleared one item's self-referencing `accepted_request_id` first, then messages → conversation →
  requests → items). Verified 0 rows remain matching those titles.
- **Committed and pushed** the D-044 fix + RoleSwitcher + messages.js fix + this session's docs
  updates to `claude/supabase-connection-status-9rhtx1` (commit `442084d`).
- **Found and fixed a real deployment gap**: the live `3goods` Vercel project (recreated at some point
  between session 4 and 5, evidently without a HANDOFF update) had **no env vars set at all** —
  `vercel env ls production` came back empty, meaning its most recent deploy (9h before this session)
  was running with no Supabase connection. Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as
  Production env vars, then `vercel deploy --prod --yes` from inside `3goods/`. Verified live:
  `curl` 200 on `/` and the `/discover` deep link, and a live browser check of
  `https://3goods.vercel.app/discover` rendering exactly the 7 real seeded items (post-cleanup) with
  no console errors.

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
- ~~Stale duplicate checkout at `002-data-4-life/3goods` (no `-ag`) running on port 5173~~ — resolved
  this session: that process (PID 90252, running since the prior Thursday) was killed. If it comes
  back, it's a different, older git checkout on this machine, not this repo — this checkout
  (`002-data-4-life-ag`) is the one to develop against, and its dev server should come up on 5173
  again now that the port is free (it was previously forced to 5174).
- ~~Live Supabase test-data pollution~~ — resolved this session: deleted the 6 "Smoke Test Donation
  Item" rows and 1 "Live QA test donation (delete me)" row (7 total — see "Completed this session")
  plus their dependent requests/conversations/messages. The live `items` table now holds only the 8
  real seed rows (7 available + `10kg bag of rice`, reserved).
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
- This checkout's `npm run dev` (PID 19631, was on port 5174 while 5173 was occupied by the stale
  checkout above — now that that's killed, a restart would claim 5173) was left running in the
  background; the headless Chrome verification instances were stopped at the end of the session. A
  fresh session should feel free to restart either — nothing depends on keeping them alive across
  sessions.
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
- **(session 6)** `npm run i18n:check` → 170/170 keys in sync. `npm run build` → succeeds (504 KB JS
  bundle, gzip 143 KB). Live browser pass (headless Chrome + CDP, mobile 390px + desktop 1280px)
  covering the full identity-state matrix: guest home/nav/hero, `/donate/new` as guest (login prompt,
  not role-mismatch), login-as-Donor, an organisation-only page visited as donor (mismatch copy),
  logout (back to identical guest state), login-as-Organisation with Needs Management + My
  Organisation loading real data, guest vs. logged-in-organisation Item Detail (Request button
  present only for the latter). Zero console errors (pre-existing React Router v7 warnings only).

## Checks still needed
- ChatList and NeedsManagement at desktop width specifically (see caveat above).
- A forced-error-state check for screens beyond the three touched by 3G-017's validation-message
  work (Me, MyOrganisation, OrganisationProfile, ChatDetail, Updates) hasn't been done by triggering
  a real thrown error in the browser — `ErrorState`/`useAsync` wiring was verified by code path only
  for those.

## Exact next action
Everything pending at the start of session 6 is done: the 3G-043 role-state simplification is
committed and pushed to `claude/supabase-connection-status-9rhtx1`, live-verified, and redeployed to
`https://3goods.vercel.app`. Nothing is blocking — pick up the priority list below. One thing worth a
deliberate decision rather than just picking up: this branch still hasn't been merged to `main` —
confirm with the user whether/when to open that PR (carried over from session 5, still open).

### Priority list (unblocked — 3G-042 and 3G-043 are both verified live end to end, including production)
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
- All of session 5's pending confirmations (D-042 additive SQL, committing the diff, deleting
  test-data rows, the stray duplicate checkout) were resolved in session 5 per explicit user
  instruction.
- Session 6's two genuinely-ambiguous hero-copy questions (guest CTA, guest context pill) were both
  confirmed with the user before implementing — see DECISIONS.md D-045 for the resolutions.
- Whether/when to merge `claude/supabase-connection-status-9rhtx1` into `main` — not done this
  session, no PR opened.
- If continuing into Phase 2, worth a quick confirmation on D-012 (3goods' category taxonomy vs. the
  root map site's) before wiring the map API client, since that's the point where the two
  taxonomies would first sit side by side in one screen.
