# 3goods Handoff

Last updated: session 3 resume — reconciled undocumented work found already on disk (3G-041, sitewide
Footer + i18n growth) that predates this note; see "Completed this session" below. Prior entry:
session 2, completion of Phase 1 Aesthetics & 8 Categories + Phase 2 Map Integration (3G-020..023).

**Live URL: https://3goods.vercel.app** (separate Vercel project from the map site at
`002-data-4-life.vercel.app`, account `frescyliafrida-9461`). Redeploy with `vercel deploy --prod
--yes` from inside `3goods/` after any change you want reflected there.

## Current task
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
- No git repository exists anywhere in `002-data-4-life/` — this Kanban is the only change record.
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

## Checks still needed
- ChatList and NeedsManagement at desktop width specifically (see caveat above).
- A forced-error-state check for screens beyond the three touched by 3G-017's validation-message
  work (Me, MyOrganisation, OrganisationProfile, ChatDetail, Updates) hasn't been done by triggering
  a real thrown error in the browser — `ErrorState`/`useAsync` wiring was verified by code path only
  for those.

## Exact next action
No single next action is mandated — Phase 1's core journey and 3G-017 are both done and the board is
caught up. Pick one of, in roughly this priority order:
1. Phase 2 map integration (3G-020 onward) — the next big feature area, per the original priority
   order (map was always meant to come after the core journey).
2. Phase 3 polish items: 3G-035 (FilterSheet), 3G-036 (the two remaining desktop screenshots above),
   3G-037 (accessibility pass — a11y labels are now translated but a full focus-state/aria-current
   audit hasn't been done).

To resume dev environment:
```
cd /Users/ff/Desktop/ProjectsAI/ProjectsHackathons/002-data-4-life/3goods
npm run dev
npm run i18n:check   # quick sanity check that locale files are still in sync
```

## Decisions genuinely needing the user
None blocking. If continuing into Phase 2, worth a quick confirmation on D-012 (3goods' 4-category
seed data vs. the root map site's now-8-category JSON) before wiring the map API client, since that's
the point where the two taxonomies would first sit side by side in one screen.
