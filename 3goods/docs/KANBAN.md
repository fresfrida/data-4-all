# 3goods Kanban

Columns: Backlog | Ready | In Progress | Verify | Done | Blocked
Only one task In Progress at a time. IDs are stable — never renumber, only re-file.

---

## In Progress

(none — Phase 0 and the Phase 1 core journey are checkpointed below; see HANDOFF.md for the
suggested next task)

## Ready

- **3G-035** — FilterSheet full build (sort, location, category, condition, delivery/pickup, "matches
  our needs") — Discover Items currently has inline category chips + search only (stub, per 3G-012's
  original acceptance).

## Verify

(none — everything below that reached this column has been re-verified and moved to Done this
session; see each Done entry's evidence)

## Backlog — Phase 3: secondary screens & polish

- **3G-031** Organisation Profile — polish pass (currently functional: mission, needs, past received,
  verified/demo badges; missing: richer layout, past-donation photos)
- **3G-032** Donor Me / My Organisation — polish pass (currently functional: donations + incoming
  requests with Accept, org profile + requests made; missing: settings placeholder, saved orgs)
- **3G-033** Updates feed — polish pass (currently functional: list + read/unread + mark-read on
  open; missing: richer event-type icons/grouping)
- **3G-034** ChatList — polish pass (currently functional: list conversations + last message preview)
- **3G-036** Desktop responsive pass across every screen (Discover Needs/Items and Item Detail
  verified at ~1440px this session; Me/MyOrganisation/NeedsManagement/Chat not yet checked at
  desktop width)
- **3G-037** Accessibility pass (focus states, aria-current, labeled inputs, focus trap in FilterSheet)
- **3G-039** Proposal doc only: move `features/map` into a standalone repo (paths, deploy settings) — do not execute

## Done

- **3G-048** — Punch-list pass: footer/nav rename, real heatmap + priority key bar, live hero stats with
  count-up, Organisations search, home = hero + Organisations board (see DECISIONS.md D-050)
  - Deliverable: footer/Updates/Me links and the logged-in organisation nav now use the existing
    `nav.organisations` / `nav.itemsDonated` keys (dead `nav.discover`/`nav.discoverNeeds` removed).
    Shared `OrganisationsBoard` (search by org name/area + category chips) rendered on both `/` (under the
    hero) and `/organisations`. Hero stats: donors (`users.role='donor'`), verified organisations only,
    distinct organisation areas, each with a scroll-into-view count-up (`useCountUp`). Map: scored
    province data wired in (was raw GADM with no scores → every province "no data"), wrapper-side grey-anchored
    ramp (`heatColors.js`), priority chips lose the "(high)" text and gain a High/Medium/Low key bar, invented
    fallback scores removed. Banner: login state bold, disclaimer regular. "Verified (demo)" → "Verified".
    Also fixed: mobile footer hidden under the fixed bottom nav; stat labels truncating at 375px; double ✓ on
    the org card badge. Live data: deleted the 5 stale orgs + 6 stale users (user-approved).
  - Deps: none. Acceptance: `npm run i18n:check`, `npm run build`, 375px + 1280px checks in EN + VI.
  - Evidence: `npm run i18n:check` → 180/180 keys in sync. `npm run build` → succeeds. Live browser
    (headless Chrome + CDP): Home/Organisations/Map/footer at 375px and 1280px in EN and VI; search "hanoi" →
    1 org, "zzzz" → empty state in VI; hero stats read 5/4/5 and count up from 0; map layers colour with
    greys at the low end; logged-in org nav + "✓ Verified" + separate demo badge. Zero console errors.

- **3G-047** — Landing page split (hero-only `/` + needs board moved to `/organisations`); hero stats
  swap to Registered Donors; donation-form/Me.jsx copy and ordering fixes (see DECISIONS.md D-049)
  - Deliverable: new `Home.jsx` at `/` (hero only); `DiscoverNeeds.jsx` moved to `/organisations` with
    hero removed, restyled to match `DiscoverItems.jsx`'s simple page pattern. New
    `usersService.getDonorCount()`; hero's 3rd stat tile swapped from Relief Needs to Registered
    Donors. `DonationForm.jsx`'s "Add need" button (copy-paste bug, wrong action) fixed to "Add";
    field label now "Collection time windows (if necessary)". `Me.jsx` request-row bubbles reordered
    (Chat first, only when applicable; then status; then Accept/Undo/Reopen). Cleaned up dead
    `homeRoute` code in the nav components while in the area.
  - Deps: none. Acceptance: `npm run i18n:check` passes, `npm run build` succeeds, live-browser check
    of both new pages and the two smaller fixes.
  - Evidence: `npm run i18n:check` → 179/179 keys in sync. `npm run build` → succeeds. Live browser
    (headless Chrome + CDP, mobile 390px): `/` renders hero-only, `/organisations` renders the full
    needs board correctly (intro text, filters, 5 org cards), guest nav's "Organisations" link lands
    there correctly, donation form shows the corrected label/button, `Me.jsx` shows Chat first only
    on rows with an actual conversation. Zero console errors.
  - **Resolved in 3G-048**: the stale rows were deleted with the user's approval. Original note: the hero's "Registered Donors"/"Verified Organisations"/"Provinces
    Covered" tiles are correctly DB-derived but still show inflated numbers (10/10/10) because the 5
    stale duplicate organisation rows + 6 stale user rows from earlier this session were never
    actually deleted — two attempts to delete them this session were both blocked by a tool-level
    safety guard on bulk cloud-storage deletes. Needs explicit user action or re-confirmation to
    finish; see HANDOFF.md.

- **3G-046** — New kitchen item; map category translations fixed; every org needs Clothes; guest nav
  split into Organisations/Items Donated (see DECISIONS.md D-048)
  - Deliverable: `item018` "Assorted kitchen appliances & cookware" (Household Items). Confirmed
    `item001`'s rice photo was never broken (it's `reserved`, so it's correctly excluded from the
    browse grid by design). `MapScreenShell.jsx`'s stale hardcoded category-translation map replaced
    with a lookup against the real `data/categories.js` list — fixes untranslated category labels on
    the Relief Map screen. Added a Clothes need to all 5 organisations. Guest-only bottom/top nav now
    shows "Organisations" + "Items Donated" instead of one "Discover" item; logged-in nav unchanged.
    Fixed a desktop nav pill truncation bug found while verifying (both languages, not just Vietnamese).
  - Deps: none. Acceptance: `npm run i18n:check` passes, `npm run build` succeeds, live-browser check
    of the map, needs board, and guest nav in both languages at both breakpoints.
  - Evidence: `npm run i18n:check` → 176/176 keys in sync. `npm run build` → succeeds. `npm run
    db:seed` → `[items] seeded 18 rows`, `[needs] seeded 15 rows`. Live browser (headless Chrome +
    CDP): Relief Map's "Suggested Relief Item Categories" shows all 8 categories correctly translated
    in EN and VI; needs board shows Clothes on all 5 orgs; guest nav reads "Organisations / Items
    Donated / Map" with no truncation at mobile (390px) or desktop (1280px) in either language;
    logged-in organisation nav confirmed unchanged (still 5 items). Zero console errors.

- **3G-045** — Items support an optional 2nd category; needs-board pills show categories not tags;
  sitewide banner shows login state (see DECISIONS.md D-047)
  - Deliverable: `items.secondary_category_id` (nullable FK, added via manual Supabase SQL — anon
    key has no DDL access) lets an item optionally list under a second category (e.g. children's
    books under both Books and Children Items), capped at one extra, never unbounded.
    `itemsService`/`DiscoverItems`/`ItemCard`/`ItemDetail`/`DonationForm` all updated to read, filter,
    display, and set it. Applied to `item003`/`item010`, then (follow-up, same session) reviewed the
    full 17-item catalog for other genuine cases and added 2 more: `item006` "Baby clothes bundle"
    (Clothes + Children Items — baby-specific clothing) and `item009` "Assorted pantry staples"
    (Non-Perishable Food + Rice — its own description says it includes rice). Deliberately left the
    rest single-category — a few had incidental mentions (a couple of kids' shoes in an otherwise
    general clothes bin) that didn't rise to "predominantly about the second category." Home page
    needs-board pills switched from
    tag labels to category labels (deduped per org). Sitewide "Demonstration data..." banner now
    appends "Please log in." / "Logged in as Donor." / "Logged in as Organisation.". Also found and
    fixed (via a plain `npm run db:seed` re-run): Hanoi Community Pantry had 0 live `needs` rows
    despite 2 being defined in seed data — root cause unclear, predates this session.
  - Deps: none. Acceptance: `npm run i18n:check` passes, `npm run build` succeeds, live-browser check
    of the full category-filter/badge/form flow.
  - Evidence: `npm run i18n:check` → 174/174 keys in sync. `npm run build` → succeeds. `npm run
    db:seed` → `[items] seeded 17 rows`, `[needs] seeded 10 rows` (was silently 8 before, missing
    Hanoi Community Pantry's 2). After the 2-item follow-up, re-verified live: filtering to "Rice"
    surfaces "Assorted pantry staples" (badges: Non-Perishable Food, Rice); filtering to "Children
    Items" surfaces all 4 cross-tagged items including "Baby clothes bundle" (badges: Clothes,
    Children Items). Live browser (headless Chrome + CDP, mobile 390px): guest/donor
    banner text correct; Discover Items filtered to "Children Items" surfaces both children's-books
    items (primary category Books) plus the direct Children Items listing, each with both category
    badges; Item Detail shows "Books · Children Items · Hue"; needs board shows all 5 organisations
    with deduped category-name pills. Zero console errors.

- **3G-044** — Populated real item photos from user-supplied stock images (`assets/items/` outside the
  repo, not committed — see DECISIONS.md D-046)
  - Deliverable: attached a matching photo to 7 existing seed items that had none (`item001`–`item007`
    — the 7th, `item004` "School bag, lightly used", added in a follow-up once the user supplied a
    matching photo after the initial pass) and added 9 brand-new items (`item009`–`item017`) built
    around the remaining photos, each with a real title/description/category/condition/area/donor.
    Images copied into `public/demo-items/` (16 files total) and referenced by static path — same
    pattern `item008`'s existing photo already used, not base64-in-DB (see D-046 for why). New fixed
    uuids added to `ids.js` for `item009`–`item017`. One image (`food_to_donate.png`) deliberately
    skipped as a near-duplicate of two other food photos already used. Backpacks categorized as
    Miscellaneous per user correction (no category/tag fit them well otherwise). Every original seed
    item (`item001`–`item008`) now has a photo.
  - Deps: none. Acceptance: `npm run build` succeeds, `npm run db:seed` completes without error, live
    browser check that every new/updated item's photo actually renders.
  - Evidence: `npm run build` → succeeds. `npm run db:seed` → `[items] seeded 17 rows` against the
    live Supabase project, no FK/category errors. Live browser (headless Chrome + CDP, mobile 390px):
    Discover Items shows 15 photos, all 15 report `complete && naturalWidth>0` (no broken images);
    spot-checked Item Detail for a new item (Assorted pantry staples — both need-tags rendered) and
    an existing item that got a new photo (10kg bag of rice, still correctly `Reserved`). Zero console
    errors.

- **3G-043** — Removed independent `role` state; collapsed to exactly 3 identity states (logged out /
  Donor / Organisation) — see DECISIONS.md D-045 (supersedes D-004)
  - Deliverable: `role` is now derived from `identity?.role` in `SessionContext.jsx`, never stored
    independently; `RoleSwitcher.jsx` deleted along with its usage in `DesktopTopNav.jsx`/
    `MobileHeader.jsx`; the existing `DemoLoginButton` ("Log in"/"Log out") is now the sole header
    identity control, opening the existing `DemoLoginPrompt` Donor/Organisation picker. `logout()`
    always returns to the same neutral guest state. `DonationForm.jsx`/`NeedsManagement.jsx`/
    `MyOrganisation.jsx`/`Me.jsx` reordered to check `!isLoggedIn` before a role mismatch, so a guest
    gets a login prompt instead of a "wrong role" message; `ChatDetail.jsx` gained the same
    `!isLoggedIn` guard `ChatList.jsx` already had (was a latent gap). Home page hero
    (`DiscoverNeeds.jsx`) restored the original 3-CTA design intent: guest/organisation see "Browse
    Items" + "Relief Map", logged-in donor sees "Donate Items" instead; the two always-assumed-logged-
    in context pills collapsed to one "Browsing as guest" pill (logged out) or one merged "Logged in
    as {name} · {role}" pill (logged in). Translation copy updated in both locales to match (`Log in`
    instead of `Switch demo role`, etc).
  - Deps: none. Acceptance: `npm run i18n:check` passes, `npm run build` succeeds, live-browser pass
    at mobile + desktop confirming all 3 states and the transitions between them.
  - Evidence: `npm run i18n:check` → 170/170 keys in sync; `npm run build` → succeeds (504 KB JS
    bundle, gzip 143 KB), same pre-existing `organisationsService.js` warning, unrelated. Live browser
    (headless Chrome + CDP) at mobile (390px) and desktop (1280px): guest home (Log in button,
    Browsing-as-guest pill, Browse Items + Map CTAs, no Donate CTA); `/donate/new` as guest shows the
    login prompt, not a role-mismatch message; login-as-Donor (merged pill, Donate CTA, donor nav);
    an organisation-only page visited while logged in as donor shows the new mismatch copy; logout
    returns to the identical guest state; login-as-Organisation with Needs Management and My
    Organisation both loading real seeded Supabase data; guest viewing Item Detail sees no Request
    button (no crash); logged-in organisation viewing the same item does see it. Zero console errors
    (pre-existing React Router v7 future-flag warnings only).

- **3G-042** — Reconciled the codebase against the actual live Supabase schema (removes 3G-040,
  which was stale — a real migration happened without going through that planned doc)
  - Deliverable: `supabase/schema.sql` now documents the real live production schema (project ref
    `hizvkpspyglvpgictqif`) instead of the shape D-041 assumed, plus an additive-migration section
    restoring bilingual org text, item Vietnamese titles/need tags/notes, the accepted-request link,
    need tags, conversation-by-request lookup, and translated system chat messages. Every service
    (`itemsService`, `needsService`, `organisationsService`, `requestsService`, `chatService`,
    `updatesService`) gained a `fromRow`/`toRow` mapping layer so screens/components needed zero
    changes. `storageService.js` was rewritten to base64-encode photos client-side (the live schema
    has no Storage bucket, just an `image_base64` column). `src/data/ids.js` gives every seed record
    a fixed uuid so `npm run db:seed` stays idempotent against `uuid`-typed columns. Full detail in
    DECISIONS.md D-042.
  - Deps: none. Acceptance: `npm run i18n:check` passes, `npm run build` succeeds.
  - Evidence: `npm run i18n:check` → 168/168 keys in sync; `npm run build` → succeeds (502 KB JS
    bundle, gzip 143 KB), same pre-existing `organisationsService.js` dynamic-import warning as
    before (harmless, unrelated).
  - **Live-verified this session** (from the user's own machine, real network access to
    `*.supabase.co`): `npm run db:seed` completes cleanly — all 8 items' `category_id` resolved via
    the name→id map with no FK violations (confirms the additive SQL was already run against the
    live project, and the category-id trim/diagnostics fix from a prior commit holds). Full live
    browser pass (headless Chrome + CDP, mobile 390px and desktop 1280px) against the real Supabase
    data: Discover Items (seeded items render with correct category/area/donor), Item Detail,
    demo-login-gated Request flow as organisation, Needs Management, ChatList/ChatDetail including
    sending a live message, and DonationForm submit-while-logged-out — all exercised the
    `requireLogin`/`loggedInIdentity` race-condition fix (see D-044) with zero crashes and a clean
    console (only pre-existing React Router v7 future-flag warnings, unrelated). 3G-042 is now fully
    verified, not just built.
  - **Test-data cleanup**: found 6 pre-existing "Smoke Test Donation Item" rows plus 1 new one added
    by this session's own DonationForm live-test (title "Live QA test donation (delete me)") —
    leftover from earlier manual UI testing against this same project, not from `db:seed`. Deleted
    all 7 plus their dependent requests/conversations/messages (FK-safe order), per explicit user
    instruction. Live `items` table now holds only the 8 real seed rows.
  - **Deployed**: committed + pushed (`442084d`), then `vercel deploy --prod --yes` to the existing
    `3goods` Vercel project after discovering and setting its (previously missing)
    `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` env vars — see HANDOFF.md. Verified live at
    https://3goods.vercel.app/discover rendering the real (now-clean) seed data with no console
    errors.

- **3G-041** — Sitewide Footer component + i18n key growth (undocumented work found on session
  resume, reconciled after the fact — see HANDOFF.md)
  - Deliverable: `src/components/layout/Footer.jsx` (brand mark, copyright, nav links to Discover
    Needs/Items/Map, placeholder Privacy/About/Contact), wired into `AppShell.jsx` below `<Outlet/>`.
    Locale files grew from 133 to 166 keys (`footer.*` — 6 keys — plus additions across `hero.*`,
    `map.*`, `screens.*` picked up during the same pass).
  - Deps: none. Acceptance: `npm run i18n:check` passes, `npm run build` succeeds.
  - Evidence: `npm run i18n:check` → 166/166 keys in sync; `npm run build` → succeeds (279.6 KB JS
    bundle, gzip 84.6 KB), same pre-existing `organisationsService.js` dynamic-import warning as
    before (harmless, unrelated). Not yet checked live in-browser at either width — do that before
    considering this fully done, not just built.

- **3G-020..023** — Phase 2: Map Integration + Phase 1 Hero Landing Page & #52afe0 Aesthetics + 8 Categories
  - Deliverable:
    - **3G-020**: Vendored Leaflet/SVG map rendering code (`mapView.js`, `geo.js`, `scoring.js`) into `src/features/map/vendor/`.
    - **3G-021**: Map API client (`mapApiClient.js`) fetching regional disaster GeoJSON, OpenStreetMap facilities, metro hubs, and disaster item needs.
    - **3G-022**: `VietnamMapView` React wrapper and `MapScreenShell` with single-active-layer toggle (Hazard, Priority, Coverage Gap), summary cards, and nearby 3goods organisation discovery.
    - **3G-023**: Explicit data separation disclaimer banners separating OSM community facilities from verified 3goods relief organisations.
    - **Phase 1 Aesthetics & Hero Page**: `#52afe0` bluish accent theme across Tailwind, responsive mobile/tablet/desktop Hero Landing Page at `/`, and restored all 8 official donation categories (`Rice`, `Clothes`, `Books`, `Household Items`, `Non-Perishable Food`, `Hygiene Products`, `Children Items`, `Miscellaneous`).
  - Evidence: `npm run i18n:check` passed (133/133 keys match in EN and VI), `npm run build` succeeded (265.8 KB JS bundle).

- **3G-038** — Deploy 3goods to Vercel as its own project; confirm deep-link refresh works in production
  - Deliverable: separate Vercel project from the root map site (`002-data-4-life.vercel.app`).
  - Deps: none. Acceptance: deployed URL loads, and deep-linked/refreshed routes don't 404.
  - Evidence: deployed via `vercel deploy --prod --yes` from inside `3goods/` — user account
    `frescyliafrida-9461`, new project `3goods` created, production alias
    **https://3goods.vercel.app**. Build ran `npm run i18n:check` (125/125 keys in sync) then `vite
    build` successfully on Vercel's build machine. Verified live: `curl` returned 200 for `/`,
    `/item/item-001`, and `/donate/new` (confirms `vercel.json`'s SPA rewrite handles deep links in
    production, not just locally); screenshot of the live URL at mobile width
    (`live_3goods_mobile.png`) matches the local dev server pixel-for-pixel.

- **3G-017** — Formalise centralised EN/VI i18n architecture (user-requested follow-up to D-014)
  - Deliverable: `src/i18n/locales/{en,vi}.json` as the single source of wording (125 keys each,
    `translations.js` now just re-exports them); `VITE_DEFAULT_LANGUAGE` env var support in
    `LocaleContext.jsx` (`.env.example` added, falls back to `en`, always overridden by a returning
    visitor's own stored choice); a static key-parity checker (`scripts/check-i18n-keys.mjs`, wired
    into `npm run i18n:check` and into `npm run build`); `src/lib/errors.js`'s `AppError` class +
    `translateError()` so every service throws a code (`validation.*`) instead of an English
    sentence; `UpdateNotification`/system chat `Message` records changed from pre-rendered `text` to
    `type`/`systemCode` + `params`, resolved at render time (`lib/messageText.js`, `Updates.jsx`) —
    see DECISIONS.md D-016; every remaining hardcoded string across all screens/components moved
    into the locale files (DonationForm, Me, MyOrganisation, NeedsManagement, OrganisationProfile,
    ItemDetail, ChatList, ChatDetail, Updates, NotFound, MapScreen, NeedChip, LoadingState,
    ErrorState, OrganisationCard, nav landmarks).
  - Deps: none. Acceptance: `npm run i18n:check` passes (125/125 keys match); `npm run build`
    succeeds; switching EN⇄VI shows no leftover English UI chrome outside a user's own typed content
    or literal seed titles.
  - Verification evidence (live browser, headless Chrome + CDP, this session):
    1. **Form input survives a language switch mid-typing** (requirement: "preserve their current
       form inputs") — typed an item title on `/donate/new` in EN, switched to VI: every label
       flipped language, the typed title stayed exactly as typed. Screenshots
       `i18n_1_form_en_filled.png` / `i18n_2_form_vi_after_switch.png`.
    2. **Validation errors translate, including live mid-display** — forced a service-level
       `AppError` (removed `required` attrs, submitted an incomplete donation form) and confirmed
       the Vietnamese message rendered correctly; then, **without resubmitting**, switched to EN and
       confirmed the *same* stored error re-rendered as "Item title is required." — proving it's
       translated at render time, not frozen at throw time. This caught and fixed a real bug (see
       D-017): screenshots `i18n_3d_error_vi_LIVE.png` / `i18n_4d_error_en_LIVE.png`.
    3. **Notifications interpolate correctly in both languages** — `/updates` showed
       `Your request for "10kg bag of rice" was accepted` in EN and
       `Yêu cầu của bạn cho "10kg bag of rice" đã được chấp nhận` in VI — the surrounding sentence
       translates, the seeded item title (English, per D-005-adjacent "never auto-translate seed
       titles") does not. This caught and fixed a second real bug (see D-018 — stale localStorage
       shape from before the `text`→`type`+`params` change; fixed via a storage version bump).
       Screenshots `i18n_5b_updates_en_fixed.png` / `i18n_6b_updates_vi_fixed.png`.
    4. **System chat messages translate; user-typed messages never do** — opened the accepted
       request's conversation: the system message read "Request accepted. You can arrange collection
       here." in EN and "Yêu cầu đã được chấp nhận. Bạn có thể sắp xếp việc nhận tại đây." in VI,
       while both user-typed messages ("Thank you! Can we collect this on Saturday?" / "Yes, pick-up
       in Hanoi works...") stayed in English in both cases. Screenshots `i18n_7c_chat_detail_vi.png`
       / `i18n_8c_chat_detail_en.png`, desktop width (1440px).
    5. **Full core-journey regression pass in Vietnamese**, mobile (390px) and desktop (1440px):
       Discover Items, Item Detail (request flow re-run end to end, produced a real new
       `DonationRequest` record, confirmed via localStorage), Needs Management (add/remove/priority
       toggle), My Organisation. Screenshots `final_1..6_*.png`.
    6. `npm run i18n:check` → `i18n keys in sync: 125 keys in both en.json and vi.json.` `npm run
       build` → succeeds (242 KB JS bundle, gzip 73.5 KB).

- **3G-001** — Initialize workflow docs. Evidence: `3goods/CLAUDE.md`,
  `3goods/docs/{KANBAN,DECISIONS,HANDOFF}.md` all exist with full agreed scope.
- **3G-002** — Scaffold Vite + React + Tailwind project. Evidence: `npm install` completed clean
  (131 packages), `npm run dev` serves at `http://localhost:5173/` with no errors, confirmed by
  screenshot (`j1_home_donor.png`).
- **3G-003** — i18n scaffolding. Evidence: `LanguageSwitcher` EN/VI toggle changes rendered text
  live across nav, roles, categories, and seeded organisation content — confirmed by screenshot
  (`m3_vi_home_fixed.png` vs `j1_home_donor.png`), locale persists via `3goods.locale`.
- **3G-004** — SessionContext. Evidence: demo login as Organisation then Donor both worked live
  (`j2_org_home.png`, `j7_me_before_accept.png`); `requireLogin` gate exercised on Request/Accept/
  post-donation actions; role switch while logged in swaps identity per D-004.
- **3G-005** — Storage engine + service layer skeleton. Evidence: full live request→accept→chat
  flow below ran entirely through services on top of `db.js` (localStorage-backed); grep confirms
  no screen imports `src/data/*.js` or `localStorage` directly.
- **3G-006** — Vietnam seed data. Evidence: 8 items, 5 organisations, 10 needs, users, requests,
  conversations, messages, updates all render correctly in both languages; demo-data banner visible
  on every screen.
- **3G-007** — AppShell + navigation + switchers. Evidence: mobile bottom nav + desktop top nav both
  render role-correct item sets (`j2_org_home.png` mobile, desktop home screenshot), demo login/
  logout and role/language switchers all functional.
- **3G-008** — Router skeleton. Evidence: `src/main.jsx` + `src/app/{AppProviders,routes}.jsx`
  wire every route in `lib/constants.js`'s `ROUTES` to a real screen (not placeholders — see
  3G-010..016); navigated via both real clicks and direct URLs during verification with no
  blank/broken pages; `NotFound` catches unmatched paths.
- **3G-010** — Needs Management. Evidence: `/my-organisation/needs` add/remove/mark-priority all
  exercised live (`m1_needs_management.png`), gated on organisation role + demo login.
- **3G-011** — Donation Form. Evidence: posted a real new item ("Test blankets (E2E check)") through
  the full form (category → need tags → area → delivery option), redirected to its detail page, then
  confirmed it appears in Discover Items sorted newest-first (`k3_donation_form_filled.png`,
  `k4_after_post_donation.png`, `k5_discover_with_new_item.png`). Photo picker shows local preview
  + explicit not-uploaded notice per D-008; no photo file is sent to the service layer.
- **3G-012** — Discover Items. Evidence: category filter chips + search input both functional,
  item grid shows bundled photo (`clothes-stack.jpg`) and category-icon fallbacks correctly colour-
  coded (`k5_discover_with_new_item.png`).
- **3G-013** — Item Detail + Request. Evidence: requested "Box of canned food (mixed)" live as the
  demo organisation (`j4`/`j5` screenshots); button correctly hidden for donor role and for the
  donor's own listings; "Request item" → "Requested" state transition confirmed.
- **3G-014** — Request Status (My Donations + Requests Made). Evidence: `j6_my_organisation.png`
  showed the new pending request; `j7_me_before_accept.png` showed all three organisations'
  pending requests on one item with Accept buttons; `j8_me_after_accept.png` confirmed acceptance
  reserved the item and derived the other two as "No longer available" without mutating their
  stored request records (D-009 verified live, not just by code review).
- **3G-015** — Minimal chat for an accepted request. Evidence: accepting auto-created a conversation
  with the system message "Request accepted. You can arrange collection here." (`j9_chat_list.png`);
  opened it, advanced status Accepted → Arranging collection → (button then correctly offered Mark
  as completed) via `k1_chat_detail.png`/`k2_chat_after_advance.png`, both at desktop width (1440px).
- **3G-016** — StatusBadge + EmptyState + loading/error wiring. Evidence: `StatusBadge` renders
  consistently across Item Detail/My Donations/Requests Made/Chat; `LoadingState`/`ErrorState`/
  `EmptyState` are the only fallback paths used by every screen's `useAsync` call (grep-verified —
  no screen hand-rolls its own loading/error markup).

## Blocked

(none)
