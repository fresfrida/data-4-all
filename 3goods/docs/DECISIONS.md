# 3goods Decisions

Format: **D-XXX — decision.** Why. (Deferred questions at the bottom.)

## D-001 — No pre-existing project instructions found
Checked `002-data-4-life/` at init: no `CLAUDE.md`, no `.claude/`, no `.git` repository anywhere in
the tree. `3goods/CLAUDE.md` is therefore new, not a merge of anything, and there is no git history
to reconcile against — the file-based Kanban here is the only change record.

## D-002 — Stack: plain JS, Vite, React Router v6, Tailwind v3, own subfolder
Per user confirmation. `3goods/` is fully independent tooling from the root map site (separate
`package.json`, dev server, build, deploy) so neither can break the other.

## D-003 — Donor nav: Discover Needs at `/`, plus explicit links
The five donor tabs (Updates, Map, +, Chat, Me) don't literally include Discover Needs. Resolved
per user: it's the default route reached via the header logo, **and** a visible "Discover needs"
link is placed on the donor Updates screen and Me screen so it's never hidden behind the logo alone.

## D-004 — `role` and `session` (demo login) are separate state (superseded by D-045)
- `role`: which nav/UI renders (`donor` | `organisation`). Freely switchable via `RoleSwitcher` for
  testing, independent of login state.
- `session`: `{ isLoggedIn, identity }`, set by demo login/logout, persisted to `localStorage`
  under `3goods.session`. Gates posting an item, requesting an item, and editing needs.
Rationale: the spec asks for both "keep the role switcher available for testing" and "posting,
requesting, editing needs should prompt for demo login" — these are different gates. Logging out
clears `identity` but leaves `role` alone, so nav doesn't disappear ("returns to a public browsing
state" means logged-out, not nav-less).
Demo login identities: logging in as Donor uses a fixed demo donor user; logging in as Organisation
attaches to one seeded organisation record (so "My Organisation" has real seed data to show as
"yours"). Both are visibly labeled as demo, never asked for a password.

**Superseded by D-045**: independent `role` state turned out to produce a 4th, confusing UI state —
a guest could flavor themselves as "donor" or "organisation" before ever logging in, so a
role-mismatch message could show to someone who was never actually logged in as anything. D-045
removes `role` as separate state entirely; the demo login identities and their "visibly labeled as
demo, no password" property described above are unchanged.

## D-005 — One category field, tags underneath, no duplicate field
The map's four shared categories (Food, Household Items, Clothes, Books) are the only `category`
values. `DonationForm` collects **one** category, then need tags scoped to that category (e.g.
hygiene items are tags under Household Items, not their own category). There is no second
"matching need category" field — the category itself is what gets matched against organisation
needs.

## D-006 — A category/tag match is a suggestion, never a confirmation
`ItemDetail` may show "This may match \<Organisation\>'s current need for \<tag\>" when tags
overlap with a published need, worded as a suggestion. It never implies the organisation has
agreed to accept the item — only an explicit Request + Accept does that.

## D-007 — Vendor `MapView` window-listener cleanup is a known gap, left alone
The copied `web/mapView.js` attaches `window`-level `mousemove`/`mouseup` listeners in
`_wirePanZoom()` and never removes them. Per instructions the vendor copy is read-only. Mitigation
for this prototype: `VietnamMapView`'s React wrapper keeps a single mount reference and does not
remount on every route re-visit; if duplicate-listener symptoms (map panning acting oddly after
repeated navigation) show up in testing, that's the cause — fix belongs in the root site's
`mapView.js` first, then re-copy, not in the wrapper.

## D-008 — Donation photos: local preview only, never base64-in-localStorage (superseded, see below)
Original decision (localStorage era): `DonationForm` used `URL.createObjectURL()` for instant local
preview only and showed explicit copy that nothing was persisted — specifically to avoid bloating
`localStorage` with base64 image data. Seed/demo items instead referenced bundled files under
`3goods/public/demo-items/`; items without a bundled photo fell back to a category icon.

**Superseded by D-041** (Supabase migration): now that there's a real backend, this constraint no
longer applies. `DonationForm` uploads selected files to the public `item-photos` Storage bucket via
`services/storageService.js` and stores the returned public URL(s) in the item's `photoPaths` — see
D-041. Seed/demo items still reference the bundled `public/demo-items/` files (unchanged, cheaper
than re-uploading demo images), and the category-icon fallback for photo-less items is unchanged.

## D-041 — Supabase/Postgres replaces localStorage as the storage engine
Executes what 3G-040 had only proposed. `src/lib/db.js` keeps the exact same exported function
signatures (`getAll/getById/insert/update/remove/makeId`) — only the implementation changed, from
`localStorage` to `supabase.from(table)` calls — so no service or screen needed to change *why* it
calls what it calls, only that a few call sites were missing `await` (see below). No real auth
(D-004 unchanged): every table and the `item-photos` bucket use a single permissive RLS policy
(`for all to anon, authenticated using (true)`) — same trust level `localStorage` always had (none).
Do not carry this schema/policy pattern into anything handling real user data without adding real
auth and tighter per-row policies first.
- Schema + policies: `supabase/schema.sql` (run once via the Supabase SQL Editor).
- One-time seed of `src/data/*.js` into the real tables: `npm run db:seed`
  (`scripts/seed-supabase.mjs`, idempotent via upsert-on-id).
- Env: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env.local` (see `.env.example`); the anon
  key is meant to be public (ships in the client bundle) — access control is the RLS policy, not
  secrecy of this key.
- **Real bug the migration exposed**: `getAll(table)` was called and its result chained/filtered
  synchronously in six places across `itemsService`, `requestsService`, `chatService`,
  `needsService`, `organisationsService`, and `updatesService` (e.g.
  `getAll("conversations").find(...)`), relying on the old engine being secretly synchronous despite
  every service function already being declared `async` (a deliberate choice for exactly this future
  swap — see the old code comments). Once `getAll` does a real network round-trip, chaining a sync
  array method directly onto it throws. Fixed by adding `await` at each call site before further
  reading (matches the pattern of D-017/D-018: a bug that only surfaces once the assumption it was
  hiding behind changes, not something a code read alone would have caught).
- Not yet done: real multi-user testing (two browsers/devices seeing the same data), Vercel env vars
  for the live deployment, and a live-browser verification pass — see HANDOFF.md.

## D-042 — Reconciled the codebase against the actual live Supabase schema (supersedes D-041's schema)
A separate Claude Code session (this repo's cloud/web session) found that the real Supabase project
the user had already created and partially seeded (project ref `hizvkpspyglvpgictqif`, tagged
PRODUCTION) does **not** match what D-041's `schema.sql` assumed — it was built independently
(8 tables: `categories`, `conversations`, `items`, `messages`, `needs`, `organisations`, `requests`,
`users`), with snake_case columns, real Postgres `uuid` primary keys (`gen_random_uuid()`), a
normalized `categories` table, and a real `users` table, none of which the D-041 code accounted for.
Rather than pick one side and redo the other, both were reconciled:
- **`supabase/schema.sql`** now documents the actual live schema exactly, plus an "additive
  migration" section (safe `alter table add column if not exists` / new `create table`) that
  restores fields the live schema simplified away but that were real, working features: bilingual
  organisation name/description (`name_vi`/`description_vi`), demo/past-donations badges
  (`is_demo`, `past_received_item_ids`), item Vietnamese titles/need tags/notes (`title_vi`,
  `need_tags`, `notes`), the "which request got accepted" link (`items.accepted_request_id`), the
  specific need-tag matching field (`needs.tag`), the conversation-by-request lookup
  (`conversations.request_id`), and translated system chat messages (`messages.system_code`,
  `params`, `sender_role`). The notifications/"Updates" feed has no live equivalent at all, so it's
  a brand-new `updates` table, not a restore.
- **Every service** (`itemsService`, `needsService`, `organisationsService`, `requestsService`,
  `chatService`, `updatesService`) now has an internal `fromRow`/`toRow`-style mapping layer between
  the live snake_case/uuid DB shape and this app's existing camelCase `Item`/`Need`/etc. shapes
  (`src/data/types.js`) — screens and components were **not** touched, since they only ever went
  through services. `referenceDataService.js` gained `getCategoryDbId`/`getCategorySlugFromDbId` to
  translate between the app's stable category slug (e.g. `"Rice"`) and the live `categories.id`
  uuid (which can't be hardcoded — it was already randomly generated when the user first seeded
  that table by hand).
- **`storageService.js` was rewritten**, not just remapped: the live schema stores a single
  `image_base64` text column per item/message instead of a Storage bucket path, so photo "upload"
  is now a browser-side `FileReader` base64 read with no network call and no bucket to manage. Only
  one photo per item is supported now (down from D-041's multiple-photo array) — see the
  `photoPaths` note in CLAUDE.md.
- **Seed data got fixed uuids**: `src/data/ids.js` holds one `crypto.randomUUID()` per seed record
  (organisations, users, items, needs, requests, conversations, messages, updates), replacing the
  old human-readable string ids (`"item-001"`) that can't be stored in a `uuid` column. Every
  `src/data/*.js` file and `scripts/seed-supabase.mjs` were updated to use them; the flavour donor
  names on items 003–008 (Linh Tran, Duc Pham, etc.) are now real `users` rows too, since
  `items.donor_id` is a foreign key rather than a free-text `donorName`.
- 3G-040 (`docs/MIGRATION.md`, in KANBAN's Backlog) is stale — a real migration happened without
  going through that planned doc. Its Backlog entry is removed rather than written up after the
  fact.
- Not yet done from this session: the user still needs to run the additive SQL above against the
  live project (given to them inline, not as a file) if they haven't already; `npm run db:seed`
  hasn't been run or verified from this environment (this cloud sandbox's network egress doesn't
  allow reaching `*.supabase.co` — see HANDOFF.md); no live-browser verification pass yet.

## D-043 — Real donors can optionally add a Vietnamese title; no auto-translation
Follow-up to D-042: user raised that `items.title_vi` only ever gets populated for hand-authored
seed data — a real donor posting through `DonationForm` had no way to provide one, so every live
item would show only its English title to Vietnamese-language viewers too. Considered three options:
a shared generic `translations` table (rejected — adds a join/extra query for 2 fields on 2 tables,
pure overhead at this scale, doesn't address the actual gap anyway), real machine translation via an
API (rejected — network latency + cost + an API dependency, and reverses the existing "never
auto-translate user content" rule from D-016/D-017), or a plain optional second input (chosen).
`DonationForm` now has an optional "Vietnamese title" field next to the required English one —
blank is fine, falls back to the English title exactly like seed data already does via
`item.titleVi ?? item.title`. Deliberately scoped to *title only* (not description/notes/condition):
title is the one field shown in item cards, search results, and chat headers, so it carries the most
value per bit of added form friction; other fields stay English-only user content, consistent with
the app's existing "shown exactly as typed" policy for everything else a donor writes. — "One accepted organisation per listing" lives in `requestsService`
`requestsService.acceptRequest(requestId)` is the single place that enforces this: it checks the
item has no existing accepted request, sets the item to reserved, marks the given request accepted,
and leaves other pending requests on that item as-is in storage but displays them as "no longer
available" by comparing against the item's `acceptedRequestId` — so no other request record is
silently mutated by an unrelated organisation's action.

## D-010 — Standalone map repo move: proposed, not executed
Tracked as 3G-039 (proposal doc only). Not moving `features/map` during this build, per instruction.

## D-011 — Supabase/Postgres migration: documented, not built
Tracked as 3G-040 (`docs/MIGRATION.md`), written once the service-layer shape stabilizes after
Phase 1. All current data access already goes through async service functions specifically so this
swap is additive later, not a rewrite.

## D-012 — 3goods uses 4 categories (Food/Household Items/Clothes/Books), independent of the map's current JSON
The map site's own `data/donation_items_by_disaster.json` was changed to an 8-category scheme
(Rice, Clothes, Books, Household Items, Non-Perishable Food, Hygiene Products, Children Items,
Miscellaneous) earlier in this project's history. The 3goods spec, written afterward, asks to
"use the map's four shared categories: Food, Household Items, Clothes, and Books" — the scheme
from *before* that change. Since 3goods has its own independent seed data
(`src/data/categories.js`) rather than reading the map's live JSON, there's no technical conflict —
but flagging it here so it isn't mistaken for a mistake. Followed the literal, more recent
instruction: 4 categories, with the original 8-item list (rice packs, hygiene products, baby items,
school bags, miscellaneous essentials, etc.) preserved as **tags** nested under those 4. If this
was meant to mean "use whatever the map currently has," say so and this is a one-file change
(`src/data/categories.js`).

## D-013 — The demo login prompt doesn't force the role an action needs
`requireLogin(action)` opens one shared modal offering both "Continue as Donor" and "Continue as
Organisation," regardless of which role triggered it (e.g. clicking "Post donation" while logged
out still offers both choices). Picking the "wrong" one for that action is possible but harmless in
this prototype — `role` and `session.identity` are set together, and the screen's own role guard
(e.g. `DonationForm` requires `role === "donor"`) still applies after login. Not tightening this
further; a role-aware prompt would be a small, low-priority follow-up, not a correctness issue.

## D-014 — i18n sweep is incomplete outside nav/data/status copy — RESOLVED by 3G-017
Originally: secondary screens (Me, MyOrganisation, NeedsManagement, OrganisationProfile,
ChatList/ChatDetail, NotFound) had hardcoded English microcopy — section headers, empty-state/guest
messages, form placeholders. **Closed in 3G-017** (this session): every remaining hardcoded string
was moved into `i18n/locales/{en,vi}.json` and every screen/component now renders through `t()` —
see D-016/D-017/D-018 below for the architecture that made this formal rather than ad hoc. Verified
via `grep` (no bare English strings left in JSX text or `placeholder`/`aria-label`/`title`
attributes) and live browser testing in both languages at mobile and desktop widths.

## D-015 — Map screen is an honest placeholder, not a stub pretending to work
`/map` renders a plain "not wired up yet" message instead of fake map UI. Phase 2 (3G-020..023) is
correctly deprioritised behind the core donation journey per explicit instruction — this keeps that
true in the UI too, rather than a nav item that goes somewhere misleading.

## D-016 — Statuses and system-generated events are codes + params, never stored text
Formalised in 3G-017, per the explicit requirement that "future wording changes happen in the
translation files without editing individual screens." Two record types were changed:
- `UpdateNotification`: dropped its pre-rendered `text` field in favour of `type` (a key under
  `notifications.*`) + `params` (interpolation values, e.g. `{itemTitle}`). `Updates.jsx` renders
  `t(\`notifications.${type}\`, params)`.
- A system chat `Message` (senderId `"system"`): dropped `text` in favour of `systemCode` (a key
  under `systemMessages.*`) + `params`. `lib/messageText.js`'s `getMessageText()` is the one shared
  place both `ChatList` (preview) and `ChatDetail` (full thread) resolve this, so the two screens
  can't drift on how a system message renders.
A **user-authored** chat message keeps its literal `text` and is never routed through either
mechanism — see D-005-adjacent principle "never auto-translate what a person typed," reaffirmed here
because it would have been easy to accidentally generalize the code+params pattern to *all*
messages. Verified live: the same stored notification/system-message record renders correctly in
whichever language is active, including switching language *after* the record was created — see
D-018 for why that required a storage version bump partway through this change.

## D-017 — A displayed error must store the raw error, not a pre-translated string
Found live during 3G-017 verification, not just by code review: `DonationForm`, `NeedsManagement`,
and `ItemDetail` originally did `setSubmitError(translateError(err, t))` — translating once, at
throw time, into a plain string kept in React state. Switching language while that error was still
on screen did nothing, because the stored string was already frozen in whatever language was active
when the error fired (confirmed with a screenshot pair showing a Vietnamese error surviving a switch
to English). Fixed by storing the raw `AppError` object (`setSubmitError(err)`) and calling
`translateError(err, t)` only inside the JSX at render time, so a language switch re-renders it
correctly like everything else. This is the general rule: anything derived from `t()` that gets
stored in state instead of computed at render time will exhibit the same bug — computed-at-render is
the pattern to default to.

## D-018 — `lib/db.js` STORAGE_VERSION bumped v1 → v2 for the D-016 shape change
Found live during 3G-017 verification: a browser with existing `3goods.v1.updates` /
`3goods.v1.messages` localStorage data kept the *old* shape (`text` field) forever, because
`db.js`'s `load()` only seeds from `src/data/*.js` on a cache miss — it never re-validates an
existing cached record's shape against the current seed shape. Symptom seen live: the Updates screen
rendered the literal, un-interpolated string `Your request for "{itemTitle}" was accepted` instead
of substituting the real title, because the cached record had no `params` field to read. Fixed by
bumping `STORAGE_VERSION` to `"v2"`, which changes every storage key (e.g. `3goods.v1.updates` →
`3goods.v2.updates`) and forces a fresh seed load for every table. General rule for future sessions:
**bump `STORAGE_VERSION` whenever a record's shape changes, not only when its seed values change** —
a seed-value-only change is safe to leave under the same version since old and new records are
structurally compatible; a shape change is not.

## D-044 — `requireLogin(action)` passes the resolved identity as an argument, not via closure
Found live-testing DonationForm's submit-while-logged-out path (uncommitted going into this session,
verified live against the real Supabase project in this one): `requireLogin`'s prompt path calls
`loginAs(role)` then immediately invokes the caller's remembered `action` in the same tick, but
`loginAs`'s `setSession` hasn't re-rendered yet — a caller that closed over its own `identity` from
`useSession()` (e.g. `doSubmit`'s `identity.id`) would still read the *pre-login* value (`null`) and
crash. Fixed by having `requireLogin`/`resolveLoginPrompt` pass the resolved identity into `action`
as an argument (`action(session.identity)` on the already-logged-in path,
`action(DEMO_IDENTITY_BY_ROLE[role])` on the prompt-resolution path) instead of the callee reading
`identity` from its own closure. `DonationForm.doSubmit`, `ItemDetail.onRequest`, and
`NeedsManagement.onAdd` all updated to take `loggedInIdentity` as a parameter. General rule: any
`requireLogin`-gated callback needs the identity it acts on to come from the callback's argument, not
from `useSession()` in its enclosing scope — the enclosing scope's `identity` can still be stale when
the prompt path resolves it inline.
Live-verified this session (see 3G-042 in KANBAN.md): request-while-logged-out, donation-post-while-
logged-out, and chat-message-send all exercised this exact path against the real Supabase-backed app
with no crash.

## D-045 — Removed independent `role` state; there are exactly three identity states (supersedes D-004)
User-requested (3G-043): collapse the 4-state model (guest-flavored-donor, guest-flavored-org,
logged-in-donor, logged-in-org) down to the 3 states the product actually has — logged out (guest),
logged in as Donor, logged in as Organisation. `role` is no longer stored; it's derived at render
time as `identity?.role ?? null` (`SessionContext.jsx`). Concretely:
- `readInitial()`/`session` shape dropped the separate `role` field — just `{ isLoggedIn, identity }`.
  A stored session is only ever restored if `isLoggedIn` is true and `identity.role` is valid;
  anything else falls back to the single logged-out default.
- `logout()` now resets to that same `{ isLoggedIn: false, identity: null }` state unconditionally —
  no more "clears identity but leaves role alone." Every logout returns to the identical neutral
  guest state, regardless of which role was active before.
- `setRole()` and `RoleSwitcher.jsx` are deleted outright — there is no way to pick a role before
  logging in. `DemoLoginButton.jsx` (existing component, unchanged) is now the only header identity
  control: "Log in" when logged out (opens `DemoLoginPrompt`, the existing Donor/Organisation demo
  picker — same modal `requireLogin`-gated actions already used), "Log out" when logged in.
- Every screen that gated on `role !== "donor"`/`role !== "organisation"` directly
  (`DonationForm.jsx`, `NeedsManagement.jsx`, `MyOrganisation.jsx`, `Me.jsx`) now checks
  `!isLoggedIn` *first* and shows a login prompt (reusing the `EmptyState` + `requireLogin(() => {})`
  pattern `Me.jsx`/`Updates.jsx`/`ChatList.jsx` already had) — the role-mismatch message only shows
  for the rare case of actually being logged in as the *other* role (e.g. an organisation directly
  visiting `/me`). Copy changed from "Switch to the X view (top of the page)" (referenced the deleted
  switcher) to "This page is for X — you're logged in as Y." `ChatDetail.jsx` had no login gate at
  all (a latent gap, not previously flagged since it doesn't early-return on `role`) — given the same
  `!isLoggedIn` guard for consistency with `ChatList.jsx`.
- `ItemDetail.jsx`'s `role === "organisation"` Request-button gate needed no code change — it now
  naturally reads as "only a logged-in organisation sees this," since a guest's derived `role` is
  `null`. Decided against adding a guest-facing "log in to request" prompt in its place (kept scope
  minimal, not requested).
- Home page hero (`DiscoverNeeds.jsx`) restores the original 3-CTA design intent (documented in
  HANDOFF.md's session-2 notes: "Donate Items", "Relief Heatmap", "Browse Items" — "Browse Items"
  had been dropped somewhere along the way and folded into a role-conditional slot). Guest and
  organisation both see "📦 Browse Items" (→ `/discover`, no login needed — browsing already works
  without an account) + "🗺️ Relief Map"; only a logged-in donor sees "+ Donate Items" in that slot.
  Confirmed with the user rather than guessed, since "Donate Items" for a guest would imply a
  register flow that doesn't exist. The two context pills ("Viewing as: {role}" / "Demo account:
  {name}", both assumed always-logged-in) collapsed to: a single "Browsing as guest" pill when
  logged out, or one merged "Logged in as {name} · {role}" pill when logged in.
- Translation copy updated in both `en.json`/`vi.json`: `demo.loginPrompt` "Switch demo role" → "Log
  in"; `demo.loginAsDonor`/`loginAsOrganisation` "Switch to X (demo)" → "Log in as X (demo)"; added
  `demo.browsingAsGuest`; removed unused `role.switchLabel`; `hero.ctaBrowse` "Browse Needs" → "Browse
  Items" (was defined but never wired into the JSX until now).
Live-verified this session (headless Chrome + CDP, mobile 390px and desktop 1280px): guest home page
(Log in button, Browsing-as-guest pill, Browse Items + Map CTAs, no Donate CTA), `/donate/new` as
guest shows the login prompt not a role-mismatch message, login-as-Donor (merged pill, Donate CTA,
donor nav), visiting an organisation-only page while logged in as donor shows the new mismatch copy,
logout returns to the exact same guest state, login-as-Organisation (Needs Management and My
Organisation both load real seeded data), a guest viewing Item Detail sees no Request button (no
crash), a logged-in organisation viewing the same item does see it. Zero console errors throughout
(previously-seen React Router v7 future-flag warnings are pre-existing and unrelated).

## D-046 — Seed item photos: static `public/demo-items/` paths, not base64-in-DB
User supplied 16 stock photos (`assets/items/` — a folder outside `3goods/`, not committed, not part
of this repo) to populate real item photos: 6 attached to existing seed items that had none, 9 became
brand-new items (3G-044). These are large PNGs (up to ~830KB each); base64-encoding all 15 into the
`items.image_base64` column (as D-042 does for a real donor's live-uploaded photo via
`storageService.js`) would mean ~1MB+ of text per row and a materially heavier `items` table for
purely bundled demo content. Used the same pattern `item008`'s original photo already established
instead: copy the file into `public/demo-items/`, reference it by its static `/demo-items/<name>.png`
path in `photoPaths[0]`. `seed-supabase.mjs` passes `photoPaths[0]` straight through as
`image_base64` either way — the column doesn't care whether the string is a data URI or a path, and
`<img src={photo}>` in `ItemDetail`/`ItemCard` renders both identically, so no code changed. **This
split is deliberate and should stay**: bundled/seed demo photos → static public path; a real donor's
own upload through `DonationForm` → base64 via `storageService.js` (unchanged, still the only way to
get a new photo into the live app without editing `public/` and re-seeding).
One image (`food_to_donate.png`) was deliberately not used — near-duplicate of two other food photos
already assigned, and its bread/apples/garlic don't fit any category well. Category assignment for
the two backpack/luggage images was corrected mid-session from a first guess of "Household Items" to
**Miscellaneous** per explicit user feedback — no existing need-tag fits general bags/luggage, and
`needTags` is not a required field, so both items ship with an empty tag list rather than a forced
mismatch.
Follow-up (same session): the user supplied one more photo, `children_school_bag.png`, for `item004`
"School bag, lightly used" — the one original seed item that had launched with `photoPaths: []` and
was still missing one after the initial pass above. Same treatment (static path, not base64). Every
original seed item (`item001`–`item008`) now has a photo.

## D-047 — Items support an optional 2nd category; needs remain single-category, unlimited via multiple entries
User asked whether an item could belong to two categories (e.g. a children's book under both Books
and Children Items) and, separately, whether an organisation's needs could span more than 2
categories. These are different questions with different answers:
- **Needs**: already unbounded — an organisation publishes one `needs` row per category/tag it wants
  (see seed data: Hanoi Community Pantry has both Rice and Household Items needs), and
  `NeedsManagement.jsx`'s `createNeed` has no cap on how many an org can add. No schema change; this
  was a misunderstanding surfaced while reviewing the needs-board UI (see below), not a real gap.
- **Items**: were genuinely capped at exactly one category (`items.category_id`, a single FK — see
  D-005). Added `items.secondary_category_id`, a second nullable FK to `categories`, applied via a
  manual `alter table` in the Supabase SQL editor (anon key has no DDL access — PostgREST doesn't
  expose `ALTER TABLE` at all, regardless of key permissions; this is a recurring pattern for schema
  changes in this project, see D-042's original additive migration). Deliberately a single extra
  column, not an array or join table: **at most one extra category, never unbounded many** — chosen
  because unlimited categories-per-item would force `DonationForm`'s need-tag picker (currently
  scoped to one category's tag list via `getTagsForCategory`) into meaningfully more UI complexity for
  a case (a second category) that's rare in practice. `null` is the overwhelming common case.
  - `itemsService.js` maps `secondary_category_id` ↔ `item.secondaryCategory` (undefined when absent);
    `getItems({category})` and `DiscoverItems.jsx`'s client-side filter both match on *either*
    category so an item still surfaces under both its filter chips. `ItemCard`/`ItemDetail` show a
    second badge when present. `DonationForm.jsx` gained a second, optional `<select>` ("Also list
    under") that excludes whatever the primary category currently is.
  - Applied to the two children's-books items (`item003`, `item010`): `category: "Books"` +
    `secondaryCategory: "Children Items"`.
  - **Follow-up, same session**: user asked to review the full 17-item catalog for other genuine
    cases. Added 2 more — `item006` "Baby clothes bundle (0-12 months)" (`Clothes` +
    `secondaryCategory: "Children Items"` — baby-specific clothing, same logic as the books) and
    `item009` "Assorted pantry staples" (`Non-Perishable Food` + `secondaryCategory: "Rice"` — its own
    description names rice as a contents item). Deliberately left the rest single-category: a few had
    only incidental mentions of a second category (e.g. "Lightly used clothes & shoes" mentions a
    couple of kids' sneakers inside an otherwise general adult-clothes bin; "Assorted backpacks" are
    generic hiking bags, not specifically school bags) — general rule applied: a second category is
    for items that are *predominantly* about that category, not items that merely touch on it.
- **Found and fixed along the way**: while reviewing the needs board, discovered Hanoi Community
  Pantry had **zero** live `needs` rows even though `src/data/needs.js` defines two for it
  (`need003`/`need004`) — root cause unclear (predates this session, not caused by anything done
  here; the DB had no error, the rows were simply never persisted). Re-running `npm run db:seed`
  (idempotent) inserted them fresh with no further changes needed.
- **Also fixed this session** (same investigation, unrelated to the category work itself): the home
  page's "Discover needs by Organisation" board was showing need **tag** labels ("Rice packs",
  "Canned food & noodles") as its pills, not the 8 top-level **category** names used everywhere else
  in the app (filter chips, item badges) — confusing, per the user. Switched to category labels,
  deduped per organisation (an org with two Books-category needs now shows one "Books" chip, not two,
  taking the `priority` star if *any* of its needs in that category is a priority).
- **Also**: the sitewide "Demonstration data..." banner (visible on every page) now appends the
  current login state — "Please log in.", "Logged in as Donor.", or "Logged in as Organisation." —
  per explicit user request, so login state is visible outside the home page hero (which already had
  this via its guest/logged-in pill, but only on `/`).
Live-verified (headless Chrome + CDP, mobile 390px): guest banner reads "...Please log in."; donor
banner reads "...Logged in as Donor."; Discover Items filtered to "Children Items" correctly surfaces
both children's-books items (primary category Books) alongside the actual Children Items listing,
each showing both category badges; Item Detail shows "Books · Children Items · Hue"; the needs board
shows 5 organisations (Hanoi Community Pantry restored) with deduped category-name pills. Zero
console errors.

## D-048 — Guest nav split into Organisations/Items Donated; map's category translations fixed; every org needs Clothes
Several small user-reported fixes done together:
- **New item**: `item018` "Assorted kitchen appliances & cookware" (Household Items, tag `cookware`)
  from a user-supplied photo (`KitchenAppliances.jpg` → `public/demo-items/kitchen-appliances.jpg`),
  same treatment as 3G-044/3G-045's items.
- **Rice sack photo "disappeared" — it hadn't.** `item001`'s photo is correctly wired and renders
  fine; `item001` is deliberately seeded `status: "reserved"` (D-042/D-009 — so logging in
  immediately shows a real in-progress collection), and Discover Items only lists `"available"` items
  by default. A reserved item is still visible on its own Item Detail page, just not the browse grid.
  No code change; confirmed live in production.
- **Map's "Suggested Relief Item Categories" showed untranslated English for some categories.** Root
  cause: `MapScreenShell.jsx` had a hardcoded `CATEGORY_NAME_MAP` with a *stale* pre-3goods taxonomy
  ("Canned Food", "Blankets", "Medical Kits", "Clean Water") that no longer matches what
  `public/data/donation_items_by_disaster.json` actually returns — which, it turns out, already uses
  3goods' exact 8 category slugs (confirmed by inspecting the file directly). Any category not in the
  stale map fell through to the raw untranslated slug. Fixed by deleting the duplicate hardcoded map
  entirely and looking labels up from `data/categories.js`'s `getCategoryById` (the one real source of
  truth for category labels) instead — this also means the map can never drift out of sync with the
  category list again, unlike the hardcoded copy that already had.
  - Note: this doesn't fully resolve D-012 (whether the map's *taxonomy itself* is authoritative vs.
    3goods') — it turns out they already agree in practice for this particular data file, which made
    the immediate bug a translation-lookup bug, not a taxonomy-mismatch bug. Worth re-checking D-012
    if the map's other data sources (facility categories, disaster-type labels) turn out to diverge.
- **Every organisation now has a Clothes need** (`need011`–`need015`, one per org) — none had one
  before despite Clothes being a core category. Alternates `adult_clothes`/`childrens_clothes` tags.
- **Guest nav reorganised**: replaced the single "Discover" (→ `/`) item with two —
  "Organisations" (→ `/`, the needs board) and "Items Donated" (→ `/discover`, the items board) —
  **guest-only**; logged-in donor/organisation nav is unchanged (still exactly 5 items each), per
  explicit user confirmation after discussing the mobile bottom nav's fixed layout (it evenly splits
  width across however many items `getNavItems()` returns — was a hardcoded "exactly five" assumption
  in a comment, now just descriptive, not enforced). Root complaint this addresses: the bottom nav's
  Map icon visibly jumped position between a 2-item guest bar and a 5-item logged-in bar; guest is now
  its own consistent 3-item bar (Organisations, Items Donated, Map) rather than an inconsistent 2.
  - **Found while verifying live**: the desktop top nav's per-item pill width (`w-[128px]`, fixed)
    truncated both new labels in *both* languages ("Organisati…" / "Items Dona…" in English,
    "Vật phẩm đ…" in Vietnamese) — not a translation-length-only issue, English overflowed too.
    Fixed by widening to `w-[152px]` and additionally shortening the Vietnamese `itemsDonated` label
    from "Vật phẩm đã quyên góp" to "Đồ quyên góp" (still accurate, more consistent in length with
    this nav's other short labels).
Live-verified (headless Chrome + CDP, mobile 390px + desktop 1280px, both languages): kitchen item
renders and filters correctly; rice sack item confirmed intact on both dev and production; map's 8
suggested categories all translate correctly in EN and VI; needs board shows Clothes on all 5 orgs;
guest bottom nav reads "Organisations / Items Donated / Map" (VI: "Các tổ chức / Đồ quyên góp / Bản
đồ") with no truncation at either breakpoint; logged-in organisation nav confirmed unchanged. Zero
console errors throughout.

## D-049 — Landing page split into Home (hero only) + Discover Needs moved to its own page; hero stats swap; two copy fixes; Me.jsx bubble order
Several more user-reported fixes:
- **Landing page split**: `/` used to be the hero *and* the full "Discover needs by Organisation"
  board stacked underneath it. Per explicit user request, these are now two pages, mirroring how
  Discover Items already works: `/` → new `Home.jsx`, hero only (title, guest/login pill, CTA
  buttons, stats strip); `/organisations` → `DiscoverNeeds.jsx` (unchanged content, just the hero
  removed and restyled to the same simple header+filter+grid pattern `DiscoverItems.jsx` already
  uses). `ROUTES.discoverNeeds` changed from `"/"` to `"/organisations"`; added `ROUTES.home = "/"`.
  Every existing `ROUTES.discoverNeeds` reference (Updates/Me/Footer's "Discover needs" links, the
  guest nav's "Organisations" item) needed no code change — they already used the constant, not a
  hardcoded path, so they followed automatically. `NotFound.jsx`'s "back to home" link changed to
  `ROUTES.home` explicitly (it was pointing at the needs board before, which would now be wrong).
  Also deleted a bit of pre-existing dead code (`homeRoute` in `DesktopTopNav`/`MobileHeader`, computed
  but never read since at least 3G-043 — its meaning would have drifted further out of sync with this
  change, better gone than stale).
- **Hero stats were already DB-derived, just wrong**: the user assumed the 3 stat tiles were
  hardcoded; they were always computed from live `organisations`/`needs` queries, but the "10
  Organisations" / "10 Provinces" numbers were inflated by the still-unresolved stale-duplicate-org
  issue from earlier in this session (see the "Known issues" carried in HANDOFF.md — investigated
  twice now, deletion blocked both times by tool-level safety guards on bulk deletes; needs the user's
  own hand or explicit re-confirmation to finish). Per request, swapped the 3rd tile from "Active
  Relief Needs" to "Registered Donors" — added `usersService.getDonorCount()` (new file; first
  service to read the `users` table directly rather than only through `itemsService`'s internal donor
  name lookups). The other two tiles (orgs, provinces) keep their existing live-query logic unchanged
  — once the stale rows are actually deleted, all three numbers self-correct with no further code
  change needed.
- **`DonationForm.jsx`'s collection-windows "Add" button said "Add need"** — a copy-paste artifact,
  reusing `actions.addNeed` (genuinely meant for `NeedsManagement`'s add-a-need button) for a
  completely different action. New `actions.addWindow` key ("Add"/"Thêm"). Field label changed to
  "Collection time windows (if necessary)" (new `fields.collectionWindowsOptional` key, kept separate
  from the existing `fields.collectionWindows` key since that one is still used as a factual label on
  Item Detail, where "(if necessary)" would read oddly).
- **`Me.jsx`'s request-row bubbles reordered**: Chat now comes first (only shown once a conversation
  actually exists — i.e. after acceptance; a still-`requested` row has no conversation yet, so no Chat
  bubble), then the status badge, then Accept/Undo/Reopen. Previously Chat was last, and a generic
  "Chat" link always showed even pre-acceptance (linking to the whole chat list, not anything
  specific to that request).
- **On "why do we have arranging_collection, is this a state?"**: yes, deliberately — it's the real
  in-between state once an organisation accepts a request but before collection is actually done,
  advanced via buttons inside `ChatDetail.jsx` (`accepted` → "Mark as arranging collection" →
  `arranging_collection` → "Mark as completed" → `completed`), tracked because the chat's own UI needs
  to know which advancement button to show next. `Me.jsx`'s simplified view was already collapsing it
  correctly (both `accepted` and `arranging_collection` show the same "Undo" button — the status badge
  text is the only place the distinction surfaces there), so no code change was needed for the
  behavior described; removing the status itself would be a larger, separate change (touches
  `REQUEST_STATUSES`, `ChatDetail.jsx`'s advancement flow, D-009's request lifecycle, seed data) not
  requested here.
Live-verified (headless Chrome + CDP, mobile 390px): `/` renders hero-only with no console errors;
`/organisations` renders the needs board with intro text, filters, and org cards, matching
`DiscoverItems.jsx`'s visual pattern; guest nav's "Organisations" link correctly lands on the new
page; `DonationForm`'s collection-windows section reads "Collection time windows (if necessary)" +
"Add"; `Me.jsx` shows Chat first only when applicable (confirmed across `requested` — no chat,
`arranging_collection` — chat + Undo, rows).

## D-050 — Punch-list pass: shared Organisations board on `/` and `/organisations`; real map scores; live hero stats
- **Home = hero + Organisations board again (reverses D-049's split).** Per the user, `/` shows the hero
  *and* the Organisations board; `/organisations` still shows it full-page. Implemented once as
  `components/needs/OrganisationsBoard.jsx` (h2 on `/` because the hero owns the h1); `DiscoverNeeds.jsx` is a
  thin wrapper. No pagination yet (user: "if required in the future").
- **Labels**: the guest nav already used `nav.organisations`/`nav.itemsDonated`; only the footer, two
  Updates/Me links and the logged-in organisation nav still used the old `nav.discover*` keys. Chose a global
  rename to the two existing keys and deleted the dead ones. Side effect: "Items Donated" wraps to two lines in
  the 5-slot organisation bottom nav at 375px (D-048 had avoided this by leaving that nav alone).
- **Hero stats**: donors = `users.role = 'donor'` (already fetched-cheap, one table read; distinct
  `items.donor_id` would miss donors who haven't listed anything); verified organisations = `verified = true`;
  provinces = distinct `areaId` across organisations (all orgs, not just verified — "where we operate").
  `AREAS` has 8 entries including "Mekong Delta" (a region), so its length is not "provinces". "All use ++" was
  read as "count-up animation for all three" (`useCountUp`, IntersectionObserver, reduced-motion safe).
- **Stale live rows deleted** (user-approved, exact ids from HANDOFF): 6 `users`, then 5 `organisations`. Checked
  first that no other table referenced them (only one stale user → one stale org). Not reversible; the seed
  script would re-create canonical rows only.
- **The heatmap was never coloured**: `public/data/vn_provinces.geojson` was raw GADM boundaries (63 features,
  zero score fields), so every province hit the vendor "no data" fill (blue-tinted `#94a3b8`) and
  `properties.province` never matched anything (panel fell back to "Vietnam" with made-up 8.2 / 16.8% / 65%
  numbers). Replaced it with the scored FeatureCollection from `3goods-map/data/vn_map_data.js` (data copy, the
  root-site-first rule for vendor *code* is untouched) and mapped the real field names in the wrapper
  (`poverty_pct`→`poverty_rate`, `coverage_gap`→`coverage_gap_score`, single `disaster_type`→`disaster_types`
  split on "; ", item-needs key "Typhoon"→"Storm", default province "Ha Tinh"→"HàTĩnh"). Province names in the
  data have no spaces ("HàTĩnh"); `formatProvince` re-inserts them for display. Invented fallback numbers removed
  (CLAUDE.md: never invent a score) — a missing value shows "—". Per-province recommended categories merge all of
  a province's disaster types, keeping the highest priority per category. Nearby-organisation matching used to
  compare org *names* with the province and never matched; replaced with an explicit area-id → province table.
- **Greyscale**: vendor `scoreRamp` starts at a warm stone grey and paints no-data blue-slate. Rather than edit
  vendor code, `features/map/heatColors.js` re-fills the `.province` paths after each vendor render using the same
  gold/terracotta/maroon stops but anchored at neutral grey (136,136,136) with neutral grey (160,160,160) for no
  data. Re-applied after every `setField`/`setShowFacilities` (both re-render the SVG).
- **Priority chips**: "(high)" text stripped; red/amber/grey now map to high/medium/low (low was amber before).
  Priority stays available to screen readers via an `sr-only` span + `title`. A High/Medium/Low key bar sits above
  the chips. `map.priority*` locale strings are now capitalised because the key bar reuses them.
- **Banner**: "Please log in." / "Logged in as X." is `<strong>`, the disclaimer is `font-normal`.
- **"Verified (demo)" → "Verified"** (`screens.verifiedBadge`, both locales). The standalone demo badge on every
  card/profile was already separate and stays. `OrganisationCard` also prepended its own "✓", giving a double tick;
  removed the prefix there.
- **"What is OSM Pins?"**: the "Show OSM Pins" toggle shows OpenStreetMap community facility points (hospitals,
  shelters, etc.) — context from the map data set, never registered 3goods organisations (CLAUDE.md map data
  separation rule, task 3G-023). Copy left unchanged pending the user's decision.
- **rice photo (item001)**: no change — live row already has `/demo-items/rice-sack.png` (D-046 keeps bundled seed
  photos as static paths, not base64); it's `reserved`, so it's absent from the Discover Items grid by design.
- Small fixes found while verifying: the fixed mobile bottom nav covered the footer (added `pb-16 sm:pb-0` to
  `<main>`); hero stat labels truncated at 375px (allowed to wrap).

## D-051 — Demo login picks a specific seeded account; tab title; em dashes
- **Picker, not a fixed pair.** The login prompt is two steps: role, then a list of real accounts. All seeded
  accounts are selectable (5 donors, 5 organisations); no subset. Still a demo: no password, same
  "demo access only" notice. `SessionContext.loginAs(identity)` and `resolveLoginPrompt(identity)` take the
  identity object; the hardcoded `DEMO_IDENTITY_BY_ROLE` table was removed. A session already stored in
  localStorage keeps working (same identity shape).
- **Source of the list**: `usersService.getLoginIdentities()` reads `users` + `organisations`. Donors are
  `users.role = 'donor'`. Organisation identities join each organisation to its `users` row via `org_id`:
  `id` is the users row id, `organisationId` the organisations row id, `name` the English org name (an
  organisation with no users row would silently not appear).
- **Why 4 new `users` rows**: chat messages FK `sender_id` to `users(id)`, and organisation screens use
  `identity.id` as the sender, so an organisation without its own users row could log in but not chat. Only
  Hanoi Community Pantry had one. Added rows for the other four (`OTHER_ORG_USERS`, ids in `ids.js`) and
  upserted them live by id. They have role `organisation`, so the "Registered Donors" stat is unchanged.
- **Tab title** is `3goods` in `index.html`; no route sets `document.title`.
- **Em dashes** replaced only in `en.json`/`vi.json` values (9 each): colon for "label: detail", period for
  two-sentence gates, parentheses for the "(fictional, not a real charity)" aside. Placeholders like
  `{sizeKb}` untouched.

## D-052 — Pre-demo bug fixes: request actions, blank-message investigation, quantity/unit
- **Accept feedback.** `useRequestActions(refresh)` sets `busy` the moment the button is tapped (inside the
  login-gated action, so a dismissed login prompt can't strand it) and clears it only after the action *and* the
  screen's refetch are done, so the button can't flash back to "Accept" on stale data and a double tap can't post
  the "request accepted" chat message twice. `useAsync` keeps the previous `data` during a reload and gained
  `refresh()` (a promise). Me/ItemDetail show the full-page spinner only for a first load or a different
  donor/item (`data.donorId` / `data.itemId` guard against showing another user's stale data), otherwise a small
  "Updating…" hint. `acceptRequest`'s independent writes (request status + item reserved; system message +
  notification) now run in parallel; the conversation still has to exist before its message.
- **Donor acts from the item page.** `RequestRow` (extracted from Me.jsx) is shared by Me and ItemDetail; ItemDetail
  loads organisations + conversations only for the owning donor. Me's previously hardcoded English request labels
  now use locale keys. The Accept button shows for any `requested` row, same as before (D-009: several requests can
  be accepted).
- **"Every new chat creates a blank message row" — not reproduced.** Only three call sites write to `messages`:
  `sendMessage` (rejects empty text), `postSystemMessage` (only called by `acceptRequest`), and the seed script.
  `ensureConversationForRequest` writes only `conversations`. Live check: two fresh accepts produced two conversations
  with exactly one message each, `sender_id` null, `body` null, `system_code = request_accepted` (per D-016/D-042 a
  system message stores its code, never text), and the whole table has 0 rows with neither `body` nor `system_code`.
  The row that looks empty is that system message viewed in the table editor. It renders as "Request accepted. You
  can arrange collection here." in both chat list and thread. No live cleanup was needed. Added an invariant guard
  (`postSystemMessage` throws `systemCodeRequired` without a code). Deliberately did **not** add a text `body` to
  system rows (D-016).
- **Organisation confirmation update.** `createRequest` pushes `request_submitted` to the requesting organisation
  (target = organisation id, as for other organisation notifications) alongside the donor's `item_requested`.
- **Quantity + unit.** `needs.quantity`/`unit` already existed; `items.quantity`/`unit` do not (confirmed by probing
  the live table). `unit` is a code from a fixed list (`kg, pieces, boxes, bags, sets, packs`, `lib/quantity.js`),
  labelled from `units.*` with a `_one` form for a quantity of 1; unknown legacy text is shown as typed. Quantity is
  optional, a whole number ≥ 1 (`quantityInvalid`); unit is only stored with a quantity. On the organisations board a
  category pill shows the *sum* of its needs' quantities only when every quantified need shares a unit, otherwise
  nothing (no kg + boxes). Seeded needs have no quantities (none invented).
- **Item migration (run by the user; the anon key can't do DDL):**
  `alter table items add column if not exists quantity integer;`
  `alter table items add column if not exists unit text;`
  `itemsService` only writes those two columns when a quantity is entered, so listings without one keep working
  before the SQL is applied; a listing *with* one fails with the generic error until it is. Display paths were
  verified against an injected API response, not real stored data.

## D-053 — Enforce D-009 in acceptRequest / deriveDisplayStatus; Undo releases the item; seed need quantities
- **Bug, not a product choice.** D-009 says one accepted organisation per listing, but `acceptRequest` never checked
  (its comment claimed it did), `deriveDisplayStatus` returned `request.status` unchanged, and the Accept button gated
  on the raw status. Fix: `acceptRequest` throws the existing `itemAlreadyReserved` when the item's
  `acceptedRequestId` is a *different* request (or the item is reserved with no accepted id); accepting a request
  that is already past "requested" is a no-op (see D-055). `deriveDisplayStatus` returns "unavailable" for a `requested` request whose item is held by another request; the
  sibling's stored row is never mutated (D-009's derived-status rule). `RequestRow` (Me + ItemDetail) and the
  organisation's own item-page pill use it; an "unavailable" row shows no button.
- **Undo/Re-open now releases the item** — its own behaviour change, recorded as D-054.
- **Seed quantities** (user-supplied): need001 200 kg, 002 100 cans, 003 300 kg, 004 50 pieces, 005 100 books, 006 80
  sets, 007 40 pieces, 008 60 pieces, 009 100 packs, 010 120 pieces. Applied to `src/data/needs.js`, the seed script
  mapping, and the live rows (targeted update by fixed id). Added units `cans` ("lon") and `books` ("cuốn").
- **UAT cleanup.** One "UAT TEST MESSAGE" lived *inside the seeded rice conversation*, so only that message was
  deleted (deleting "its conversation and request" would have removed the seeded in-progress collection). The other
  belonged to a separate test chain (item "UAT TEST - Rice Pack 20260919" → request → conversation → notifications),
  deleted in full including the test item, which the request could not be removed without.
- Not done: removing an item from an organisation's `past_received_item_ids` on Re-open (see HANDOFF).

## D-054 — Undo / Re-open of the accepted request releases the item (behaviour change; user-approved)
- **Before:** `revertRequestToPending` (the donor's "Undo" on an accepted/arranging request and "Re-open" on a
  completed one) only set that request back to `requested`. The item stayed `reserved` with `accepted_request_id`
  still pointing at it.
- **Why that had to change:** once D-053 made a pending sibling display as "no longer available" whenever the item is
  held by a *different* request, the leftover reservation would have stranded every sibling: nobody accepted, item
  still reserved, all other organisations locked out with no way for the donor to pick one.
- **Now:** if the reverted request is the one the item is held by (`item.acceptedRequestId === requestId`), the item
  is released via `reopenItemAvailability` (status `available`, `accepted_request_id` cleared). Reverting a request
  that does *not* hold the item (e.g. a declined one) leaves the item alone.
- **Consequences to know:** the item is browsable in Discover Items again after Undo; siblings return from "No
  longer available" to plain "Requested" and can be accepted. The existing conversation and its "request accepted"
  system message are kept. Known gap, unchanged: Re-open of a *completed* request does not remove the item from the
  organisation's `past_received_item_ids` (HANDOFF).
- **Verified live** (production, EN + VI): accept → sibling locked → chat → completed → Re-open → item "Available",
  both requests "Requested" with Accept.

## D-055 — Accepting a request that is already accepted / arranging / completed is a no-op (behaviour change; user-approved)
- **Before:** `acceptRequest` had no state check. A stale or repeated call (second browser tab, delayed double tap)
  wrote `status: "accepted"` again — which would push a request already at `arranging_collection` or `completed`
  back to `accepted` — and posted a second "Request accepted" system message into the chat.
- **Now:** after the D-053 reserved-by-another check, `acceptRequest` returns the request unchanged, with no writes, if
  its status is `accepted`, `arranging_collection` or `completed`. Only a `requested` request (including one that
  was undone back to `requested`, D-054) is actually accepted.
- **Why silent, not an error:** the caller's intent ("this organisation should be the accepted one") is already true,
  so nothing is wrong and there is nothing to show. A *different* request holding the item is still an error
  (`itemAlreadyReserved`), because there the intent cannot be satisfied.
- **Verified live:** accepting the accepted request a second time returned status `accepted` and the thread still had
  exactly one `request_accepted` system message. The UI already locks buttons during an action (D-052), so this is
  the service-level backstop.

## D-056 — Board pills are category-only; seed scaled to 8 organisations / 20 donors
- **Pills.** The compact pills on the Organisations board show the category name (plus the priority star) and nothing
  else, reversing D-052's quantity suffix at the user's request. Quantities remain on the organisation's own profile
  page and in Needs Management. The category itself comes from the live table: `needs.category_id` → live
  `categories.name` (`getCategorySlugFromDbId`) → bilingual label from `data/categories.js` (the live table holds only
  the English `name`, so labels can't come from it). The board-only helper `summariseNeedQuantities` was deleted.
- **Quantities set** (user-supplied): Clothes needs 80/60/50/100/70 pieces (Food Share, Hanoi Pantry, Books for
  Children, Warm Homes, Care Bridge); Hanoi `textbooks_stationery` 90 sets; Care Bridge `blankets_mats` 45 pieces. The last
  two rows existed only in the live table (added by hand during testing), so they were adopted into `needs.js` with
  their live ids (`need016`, `need017`) and original timestamps; a re-seed updates them instead of duplicating.
- **Scale-up.** 3 new fictional organisations (Hai Phong Harbour Relief, Nha Trang Seaside Aid, Mekong Delta
  Neighbours; areas haiphong / nhatrang / mekong, so all 8 areas are now represented; the Mekong one is unverified, giving
  6 verified of 8), 3 matching organisation logins (`OTHER_ORG_USERS`, needed for chat, see D-051), 9 new needs (2
  themed + Clothes each, with quantities), and **15** new donors. The request said 14 new donors for "20 donors", but
  the live table had 5 donors (not 6), so 15 were added to reach 20; trimming one is a one-line delete.
  Generated quantities on the new organisations' needs are plausible placeholders, like the rest of the fictional data.
- **Live update** was a targeted upsert of the three affected tables from the seed files (same column mapping as
  `scripts/seed-supabase.mjs`), leaving items/requests/conversations in their current state.

## D-057 — The map client now uses all five map-site API endpoints (with a labelled snapshot fallback)
- **Audit (before this change):** `mapApiClient.js`'s header said it called the root site's API, but its base path was
  `/data` and it fetched four static JSON copies from `3goods/public/data/`. Zero API calls; `/api/meta` unused. The
  data in those copies was verified byte-identical to what the live API serves (provinces incl. geometry, facilities
  89, metro hubs 5, item-needs), so behaviour was right but the architecture rule in CLAUDE.md was not being followed.
- **Reachability:** the root map site is deployed as the `002-data-4-life` Vercel project at
  `https://002-data-4-life.vercel.app` (not `3goods-map.vercel.app`, which 404s). All five endpoints return 200 JSON
  with `Access-Control-Allow-Origin: *`, so browser calls from `3goods.vercel.app` work with no proxy.
- **Client:** `VITE_MAP_API_BASE_URL` (default the URL above) + `/api/provinces|facilities|metro-hubs|item-needs|meta`,
  8s timeout each, all in parallel. On failure a dataset falls back to the bundled snapshot in `public/data/` and the
  result records `sources[name] = "api" | "snapshot" | "unavailable"`. Only the province scores are fatal (ErrorState);
  nothing is ever invented (missing → empty, reported).
- **UI connections.** provinces → the 3 heatmap layers (unchanged, now via the API). facilities → "Show OSM Pins" +
  a legend line with the live count. item-needs → Suggested Relief Item Categories (unchanged). **metro-hubs**: the
  vendored MapView already drew them as always-on blue rings with no explanation, so added a "Show big cities" toggle
  (wrapper CSS class hides the vendor circles; vendor code untouched) and a legend line naming the cities from the
  API. **meta** had no UI, but it has a natural one: an "About this data" disclosure showing the API's own score
  definitions, caveats and sources (shown in English as provided, with a translated note saying so), which also gives
  the OpenStreetMap attribution. Notice banner: "saved copy" when any dataset came from the snapshot, "unavailable"
  when one is missing entirely; a missing `meta` only hides the About panel (it does not raise the banner).
- **Snapshot upkeep:** `public/data/` must be re-copied from `3goods-map/data/` if the map site's data changes (it is
  only a fallback, so drift shows up as a mismatch only when the API is down).

## D-058 — A conversation is created when a request is made, not when it is accepted (product change; user-requested)
- **Before:** `ensureConversationForRequest` ran only inside `acceptRequest`, so donor and organisation could not message
  until the donor had already accepted.
- **Now:** `createRequest` creates the conversation (in parallel with the two notifications). `acceptRequest` still calls
  the same find-or-create, which now just returns the existing one (and covers requests made before this change), then
  posts the "request accepted" system message exactly as before. `postSystemMessage` and the D-016 code+params format are
  untouched. Verified live: one conversation per request across request → chat → accept, the system message lands in the
  same thread, after the two users' messages.
- **Reachability:** organisation: a Chat link beside its request status on the item page and on each row of My
  Organisation (previously shown only once accepted, and pointing at the list). Donor: the existing Chat link on the
  request row appears as soon as the conversation exists. Empty threads show "No messages yet. Say hello!".
- **Kept general on purpose:** `conversations.request_id` / `item_id` are nullable, and `ensureConversationForRequest`
  documents that a conversation with no request (donor posts an item → messages a recommended organisation directly) can
  reuse this shape later. That feature is not built.
- **Unavailable siblings** (D-053) keep their conversation, so an organisation whose request was superseded can still
  message the donor. Undo/Re-open (D-054) do not touch conversations.
- **Data:** seed conversations added for `request002`/`request003` (`conversation003` adopts the existing live id);
  the 2 live requests that had none were backfilled (one belonged to a hand-made request, not in the seed).

## D-059 — Need and item "tags" are removed; pills show category (+ priority star) only
- **Decision (user):** the per-category tags (rice, adult_clothes, childrens_books, …) added confusion, not value. A need is
  now category + quantity + unit + priority; an item is category (+ optional second category) with no tag selector.
- **App layer only.** `needsService` no longer reads/writes `tag` and no longer throws `needTagRequired`;
  `itemsService` no longer reads/writes `need_tags` or filters by tag; `DonationForm`/`NeedsManagement` lost the tag
  controls; `ItemDetail`'s "may match one of your needs" note is category-only (`need.category` equals the item's
  category or second category); `NEED_TAGS_BY_CATEGORY`, `getTagsForCategory`, `getAllNeedTagsByCategory`, the
  `fields.needTags` / `validation.needTagRequired` strings, and the tag fields in `needs.js`/`items.js`/the seed script were
  deleted. **The `needs.tag` and `items.need_tags` columns are left in the database** (no migration); existing values
  are simply ignored, and new rows get null/empty.
- **Pills (reverses D-052's profile quantity):** board and organisation-profile pills are the category name + the priority
  star, one pill per category (an organisation may have several needs in a category), no tag text, no quantity.
  `NeedChip`'s quantity prop and the earlier board-only summing helper are gone. **Quantity is still stored and shown in
  the one place an organisation edits its needs** (Needs Management shows "× 40 pieces" as plain text next to the pill).
  That is a judgement call: the request was about pills, and an editor that hid the numbers it collects would be unusable.
- **Consequence:** two needs in the same category are indistinguishable except by quantity (Books for Children has
  "100 books" and "80 sets"); the board/profile show a single "Books" pill, Needs Management shows both rows.

## D-060 — Hero CTA, facilities label, and donate-from-map area prefill
- **Hero:** every state (guest, donor, organisation) now sees the same primary CTA, "Browse Items Donated" → `/discover`
  (VI "Xem đồ quyên góp"); `hero.ctaDonate` was deleted. The user described the logged-out button as already saying "Browse
  Items Donated" — it said "Browse Items", so the shared label was renamed for everyone. A donor still posts via the
  "Donate" item (with the "+" emphasis) in both the mobile bottom nav and the desktop top nav (verified).
  (The hero lives in `Home.jsx`; `DiscoverNeeds.jsx` is now just the Organisations page.)
- **"OSM Pins":** the request to remove the toggle was withdrawn ("keep them on but perhaps rename OSM"). The toggle
  now reads "Show community facilities" / "Hiện cơ sở cộng đồng"; the legend and disclaimer still name OpenStreetMap
  for attribution.
- **Donate from a map location:** the entry point already existed (the "+ Post a Donation for {province}" link on the
  Relief Map) but carried no area. It now links to `/donate/new?area=<areaId>` and `DonationForm` pre-selects that area
  (only if it is one of the 8 known areas; anything else is ignored). One `PROVINCE_TO_AREA` table replaces the old
  area→province one: 7 named provinces (Hà Nội, Hồ Chí Minh, Đà Nẵng, Thừa Thiên Huế, Cần Thơ, Hải Phòng, Khánh Hòa —
  the last stands in for Nha Trang) plus the 12 other Mekong Delta provinces → `mekong`. **A province outside these has no
  matching area** (e.g. Hà Tĩnh, the map's default), so its link opens the form blank; that was the limit of the 8-area
  list, not a bug (superseded by D-062: all 63 provinces now map to an area, and the panel is now a count, D-065). The same table now drives "Verified 3goods Organisations Nearby", which additionally lists only
  *verified* organisations (the panel heading says so; an unverified one used to get a "Verified Org" badge).

## D-061 — Map base map, zoom behaviour, and the root-first vendor change
- **Process:** fixes to rendering were made in the root site's `3goods-map/web/mapView.js` and `geo.js` first, then copied
  verbatim into `3goods/src/features/map/vendor/` (`cmp` shows them identical). Before this, the vendored copies were
  prettier-reformatted versions of the root files; a whitespace/comment-insensitive comparison showed mapView.js and geo.js
  were semantically identical to root, so re-copying lost nothing. The root site's `main.js`, `dataService.js` and
  `index.html` were updated so the root map benefits too. **The root site has not been redeployed.**
- **"Vietnam looks like an island":** the province data only contains Vietnam, so everything west of it was drawn as the same
  pale blue as the sea. Now the map draws the land of Vietnam's neighbours (15 countries from Natural Earth 1:50m, public
  domain, clipped to lon 90–122 / lat 0–32, simplified to 0.02°, 39 KB) in a neutral land colour under the provinces, and the
  sea is a real blue. Built by `3goods-map/src/build_neighbour_land.mjs`. In 3goods the file is a bundled base-map layer
  (`public/data/neighbour_land.json`), not an API endpoint and not disaster data, so it never triggers the "saved copy"
  notice. Vietnam itself is left out of that layer (the detailed GADM provinces are the real thing); a thick same-colour
  stroke on the neighbours closes hairline gaps along the border.
- **Black bars:** the SVG used to keep Vietnam's tall aspect ratio inside a wide container, leaving dark bars at both sides at
  every zoom. The default view is now the smallest rectangle with the container's own aspect ratio that contains all of
  Vietnam, centred on it (`fullView`, recomputed with a ResizeObserver); provinces focus to the same aspect.
- **Zoom (investigated and decided):** plain wheel scrolling over the map scrolls the page; **Ctrl or Cmd + wheel zooms**
  (a trackpad pinch already reports Ctrl, so pinch still works). A plain wheel shows a brief hint, "Hold ⌘/Ctrl and scroll to
  zoom", set by the wrapper from a locale string so it is translated. The +/− buttons and Reset are unchanged. Every view
  change is confined to `fullView`: zoom-out stops exactly on the default view (verified: 60 notches out from a corner lands
  on it), and panning can never reveal more than that view (an earlier version clamped to the whole drawn world and let
  you drag to featureless land). `.map-container`'s fallback background is now the sea blue.
- **Not changed, worth deciding (resolved by D-066):** on touch devices a finger on the map pans it and cannot scroll the page, and pinch zoom
  does not exist. That is the same "accidental interaction" problem for phones; it was out of the wheel-zoom scope.

## D-062 — Areas come from a real `provinces` table (63 provinces), not a hard-coded list of 8 (user-requested; supersedes the area list in D-060)
- **Why:** `src/data/areas.js` had 8 hand-picked areas (Hanoi, HCMC, ..., "Mekong Delta"), so a map click on any other province
  (e.g. Hà Tĩnh, the map's default) had no area and the donation form opened blank. The map data already carries the canonical
  63 provinces.
- **Table:** `provinces(id uuid, slug unique, map_key unique, name, name_vi, region, created_at)`, same permissive RLS as the other
  tables. `slug` is the **area id**: it is what `organisations.city` and `items.area` store (both stay plain text, so no column
  changes) and what `?area=` carries. `map_key` is the map data's own spelling ("HàTĩnh"), so the map joins by an exact
  match instead of a translation table. `region` is the map data's poverty region.
- **Names:** the map data only has Vietnamese names, with spaces stripped. `name_vi` = that name with spaces restored (one fix by
  hand: GADM's "Hoà Bình" → "Hòa Bình"); `name` = the same without diacritics ("Ha Tinh"), except **Hanoi** and **Ho Chi
  Minh City**, which have common English names. The English form of the other 61 is unaccented Vietnamese, matching how the old
  list wrote "Da Nang"/"Can Tho". These are generated, not sourced from an authority; edit the rows if a nicer English name is
  wanted. Consequence: the map's "Selected Region" title and the "Post a Donation for …" button now use the locale name, so EN
  shows "Ha Tinh" where it used to show "Hà Tĩnh" in both languages.
- **App:** `referenceDataService.getAreas()/getAreaById()` read the table (cached per page load, retried after a failure);
  new `getAreaByMapKey()`. Shape unchanged (`{id, en, vi}` plus `mapKey`, `region`), so screens changed only where they had to.
  `MapScreenShell`'s `PROVINCE_TO_AREA` is gone: the clicked province's area is looked up by `mapKey`, so the donate link
  (`?area=<slug>`) and the donation form's pre-selection work for **all 63**. The area `<select>` lists all 63, sorted by the
  current language.
- **Remap of existing data** (`supabase/migration-provinces.sql`, also `LEGACY_AREA_TO_PROVINCE` in `src/data/provinces.js`):
  hanoi→hanoi (same slug), hcmc→ho-chi-minh-city, danang→da-nang, hue→thua-thien-hue (the old "Hue" was the city; the province
  is Thừa Thiên Huế), cantho→can-tho, haiphong→hai-phong, **nhatrang→khanh-hoa** (Nha Trang is a city inside Khánh Hòa),
  **mekong→an-giang** (a region cannot be one province; An Giang is a Mekong Delta province, chosen because Mekong Delta
  Neighbours and the one Mekong item just need *a* Mekong province; change it if another suits the demo better). The seed data
  (`organisations.js`, `users.js`, `items.js`) uses the new slugs.
- **No foreign key** from `organisations.city`/`items.area` to `provinces.slug`: the columns are plain text written by the seed
  and the donation form, and a stray legacy value in live data would make the migration fail as a whole. The service layer only
  ever offers real slugs.
- **Who runs the SQL.** The anon key cannot run DDL (D-047), so the SQL is run by the user in the
  Supabase SQL Editor; `npm run db:seed` also upserts the 63 rows (keyed on `slug`) once the table exists.

## D-063 — A need's quantity is optional, and a blank quantity means "ongoing", not "missing" (user-requested design point)
- **Reconsidered:** D-052/D-053 pushed quantities onto needs. An organisation may want an open-ended need ("always happy to
  receive rice"), and forcing a target number would create upkeep (keeping a fixed number current) for no benefit.
- **Meaning:** a need **with** a quantity says "this specific amount"; a need **with no** quantity says "ongoing / open-ended".
  These are two deliberate states, so `null` is stored as null, never defaulted to 0 or 1, and it is **displayed**, not left
  blank: Needs Management shows the label "Ongoing" (VI "Thường xuyên") where a quantity would be.
- **What changed in code:** the field was already technically optional (blank saved as null); what was missing was the meaning.
  The label is now "Quantity (optional)" with a hint that blank = ongoing, the unit selector is gone (D-064), and the ongoing
  label exists. `createNeed` still rejects a non-whole or non-positive number (`quantityInvalid`); 0 is not "ongoing", blank is.
- **Not changed:** pills stay category + priority star with no quantity (D-059). Mekong Delta Neighbours' single live need
  (Non-Perishable Food, no quantity) is exactly this case and is left as it is (it was the user's own testing).

## D-064 — Needs use one generic unit ("items") and at most one need per organisation per category
- **Units:** the per-need unit choice (kg/pieces/boxes/sets/cans/books/...) is removed for **needs**. A need with a quantity is
  always counted in "items" (`NEED_UNIT`, `units.items` / `units.items_one`; VI "món"); `needsService` writes `unit = 'items'`
  when there is a quantity and `null` when there is not, and ignores any unit passed in. `Need` no longer has a `unit` field in
  the app. **Item listings (donations) keep their unit choice**: a donor describing "12 boxes" is describing a thing, not
  setting a target, so the confusion the change removes does not apply. If that should also be generic, it is a small change in
  `DonationForm`/`lib/quantity.js` (the item form and card still use `UNITS`).
- **One need per (organisation, category):** with tags gone (D-059) two needs in a category are indistinguishable, so
  `createNeed` throws `needCategoryExists` when the organisation already has one, `NeedsManagement` disables categories already
  on the list ("Books (already listed)"), and the SQL adds a unique index `needs_one_per_org_category (org_id, category_id)`.
  To change an existing need, remove it and add it again (there is still no in-place edit).
- **Merge:** Books for Children Vietnam's two Books needs (100 books, 80 sets) become one: **180 items**, priority kept (the
  100 need was the priority one). Adding the two is a judgement call, since the old units differed ("sets" of books are not one
  item each); the total is easy to edit. The merge and the "all existing quantified needs → items" update are in the migration
  SQL (the app could not be allowed to write them itself). Seed: `need006` removed, `need005` = 180, all `unit` values removed.
- **Live check before writing the SQL:** the only duplicate (organisation, category) pair in live data was the Books one.

## D-065 — "Organisations nearby" is a live count, not a list
- **Before:** a list of named organisations for the clicked province, restricted to verified ones (D-060) so an unverified
  organisation never wore a "Verified" badge.
- **Now:** the panel is headed "Organisations nearby" and shows one line, e.g. "**1 verified, 1 unverified**" (VI "1 đã xác
  minh, 1 chưa xác minh"), counted from the live `organisations` table for the clicked province (`org.areaId === province slug`).
  No names, no badges, so the verified/unverified mix-up cannot recur. A province with none shows the existing "No 3goods
  organisation is registered in {province} yet" text instead of "0 verified, 0 unverified".
- **"Nearby" means the same province.** With areas now real provinces (D-062) that is exact; an organisation in a neighbouring
  province is not counted (no distance model exists).

## D-066 — Touch: one finger scrolls the page, two fingers move and pinch-zoom the map
- **Problem (D-061):** on a phone a one-finger drag panned the map and could not scroll the page past it (the map sits in a scrolling
  page), and there was no pinch zoom.
- **Decision (Google Maps' "cooperative" pattern):** one finger is left to the browser, so the page scrolls past the map; a brief
  translated hint, "Use two fingers to move the map" (VI "Dùng hai ngón tay để di chuyển bản đồ"), appears at the bottom of the
  map when a finger drags on it. Two fingers pan and pinch-zoom the map (the point between the fingers follows them; zoom is
  clamped to the same limits as the buttons and wheel). It matches the desktop rule ("Ctrl/Cmd + scroll to zoom") and needs no
  extra button. A tap still selects a province.
- **Implementation (root first, D-061 process):** `MapView` gains an opt-in `cooperativeTouch` option in
  `3goods-map/web/mapView.js`, copied verbatim into `src/features/map/vendor/mapView.js` (`cmp` identical). With it the
  container gets `touch-action: pan-y`; without it (the default, so the root map site's full-screen map behaves as before) the
  container is `touch-action: none` and one finger still pans. **Two-finger pinch/pan works in both modes.** 3goods passes
  `cooperativeTouch: true` and the translated hint. The old `touch-action: none` rule in `map.css` was removed (MapView sets it).
  The hint element moved to the bottom of the map so it never covers the +/−/Reset buttons. The root site itself has **not**
  been redeployed (as in D-061); its behaviour is unchanged apart from gaining pinch zoom.
- **Not tested on a physical device:** verified with Chrome DevTools synthetic touches (real input pipeline, real
  `touch-action` handling), not a phone. Worth a quick check on a real iPhone/Android, mainly for iOS Safari's own gestures.

## D-067 — Accepted items stay in Discover Items, sorted last, with a status banner matching the real state (user-requested)
- **Before:** `getItems()`'s default filter returned only `status === "available"`, so an item vanished from Discover Items the
  moment its request was accepted.
- **Now:** no default status filter (an explicit `status`, or `donorId` for the donor's own list, still narrows as before). Every item carries
  a derived `displayStatus` (set by `getItems`/`getItemById`, never stored):
  `available` (stored available); `reserved` (stored reserved, accepted request still `accepted` / `arranging_collection`);
  **`donated`** (stored reserved and the accepted request has reached `completed`, i.e. actually collected);
  `unavailable` (the donor withdrew it). "Reserved" and "Donated" are deliberately different: the item's own `status` never
  moves past `reserved`, so `completed` is read from the accepted request (one extra `requests` read per list load).
- **Order:** available (newest first), then reserved, then donated, then withdrawn, each newest first. The donor's own list
  ("Me") keeps plain newest-first.
- **Card:** the photo is muted (60% opacity, part greyscale) with a full-width banner along its bottom edge: "Reserved" (blue),
  "Donated" (green), "No longer available" (dark grey), translated (`itemStatus.*`, new key `donated`). Available cards look
  as before. The item page's badge uses the same `displayStatus`. Cards still link to the item page; requesting stays gated on
  `status === "available"` as before.
- Live at the time of writing: 19 available + 3 reserved, none completed, so "Donated" and withdrawn were verified with a
  scenario layer (see KANBAN 3G-055); "Reserved" was verified on the real rows.

## D-068 — Discover Items is paginated (12 per page, client-side, page in the URL)
- **Why 12:** divisible by 2, 3 and 4, so every grid row is full at each breakpoint (the grid is 1/2/3/4 columns).
- **How:** the service still returns the whole list (the app filters/searches client-side everywhere else); `DiscoverItems` slices
  it. New shared `components/controls/Pagination.jsx` (Previous, numbered pages with "…" gaps, Next, "Showing 13–22 of 22",
  `aria-current="page"`, translated `pagination.*`), hidden when there is one page. The page is `?page=N`, so Back from an item
  returns to the same page and a reload keeps it; an out-of-range or junk value is clamped. Typing in the search box or changing the
  category returns to page 1. A page change scrolls the list to the top.
- **Server-side paging is not built:** with a few dozen items a full read is cheap. If the table grows to hundreds, move the
  slice into `getItems` (range queries) — the screen's page logic would not change.

## D-069 — One shared unread-chat indicator for donors and organisations
- **Finding:** neither role's navigation had any unread-chat affordance (the request assumed donors did): no badge, no
  read state anywhere in chat. So one shared mechanism was built, not an organisation-specific one.
- **What "unread" means:** a conversation is unread for the viewer when it holds a **chat message from the other party** (system
  messages such as "Request accepted" never count; your own messages never count) newer than the newest message the viewer has
  looked at in that conversation.
- **Where it is stored:** `messages` has no read column, so "seen" is kept per browser and per demo identity in localStorage
  (`3goods.chatSeen.<identity id>` → `{conversationId: iso}` via `lib/chatSeen.js`, through the safe localStorage wrapper). A
  schema change (`read_at`) would sync across devices but needs SQL; not done. **Consequence:** in a browser that has never opened a
  conversation, every existing message from the other party is unread; clearing site data brings them back.
- **UI:** `UnreadChatsContext` (inside `SessionProvider`) computes the unread set (`chatService.getUnreadConversationIds`: one
  conversations read + one messages read) and exposes `count`, `unreadIds`, `markSeen`, `refresh`. `UnreadBadge` is a red count
  bubble on the Chat item of **both** navs (over the icon on the mobile bar, beside the label on desktop), with a translated
  screen-reader label ("1 unread conversations"); `navConfig` marks the item (`badge: "chat"`), so donor and organisation nav can
  not drift apart. The Chat list marks unread rows (bold preview + "New"). Opening a conversation marks what is on screen as
  seen (`ChatDetail`), clearing the row and the badge.
- **Freshness:** no push channel exists, so it is re-checked on every route change, when the tab regains focus, and every 15 s.
  `markSeen` also invalidates any check already in flight (it was computed from the old "seen" state and could put the
  conversation's badge back). One production run showed the badge not clearing within a fixed 1.8 s wait; the cause was probably
  just the slower production chat page, the race could not be reproduced, but the guard is correct either way.
- **Not done:** the Updates (bell) item has no unread indicator either. Updates have a read flag but are keyed by a different id
  for organisations, so it needs its own look; it can reuse `UnreadBadge`.

## D-070 — Organisation coverage follows where the map's real community facilities are
- **Request:** seed a proportional number of organisations "following the real-world pattern" of the 89 OSM facilities, not an
  arbitrary count.
- **Method:** each facility pin (`donation_facilities_osm.json`, the same 89 the map draws) was assigned to a province by
  point-in-polygon against `vn_provinces.geojson`. The `addr_province` field is empty for most pins, so it was not used. 88 fall
  inside a province; one (a fisheries logistics centre on Đá Tây A island in the Spratlys) falls outside every polygon and is
  counted for Khánh Hòa, which administers Trường Sa. Result: Hanoi 25, Ho Chi Minh City 11, Bà Rịa-Vũng Tàu 9, Cần Thơ 5, Hải
  Phòng 4, Bắc Ninh / Đà Nẵng / Đồng Nai 3, Nghệ An / Phú Thọ / Thái Bình / Thanh Hóa / Khánh Hòa 2, and 1 each in 15 more
  provinces (29 provinces have at least one). **Region totals:** Red River Delta 35, South East 24, North Central and Central
  Coast 12, Mekong Delta 9, Northern Midlands and Mountains 6, Central Highlands 2.
- **Allocation:** about **1 organisation per 3 facilities** (target 30 in total), largest-remainder rounding, so shares add up
  exactly. The 8 existing organisations count toward their province's share and only the shortfall was added; provinces where an
  existing organisation exceeds its share (Thừa Thiên Huế has no facility pin, An Giang has 1) keep it. Result: **31 organisations
  in 16 provinces (23 new)**: Hà Nội 9, Hồ Chí Minh 4, Bà Rịa-Vũng Tàu 3, Cần Thơ 2, Hải Phòng 2, one each in Thừa Thiên Huế,
  Đà Nẵng, Khánh Hòa, An Giang, Bắc Ninh, Bình Định, Đồng Nai, Nghệ An, Phú Thọ, Thái Bình, Thanh Hóa. Provinces with a single
  pin mostly get none: that is the "fewer where they don't cluster" the request asked for, not an oversight.
- **Caveat about the map's own numbers:** the province properties carry a `facility_count` too, but its total is 1,374, a
  different, larger extract used for the coverage-gap score. The request named the 89 pins the map wires up, so those were used;
  the two datasets do not agree on the ranking beyond the top few (e.g. it puts Bắc Ninh and Bà Rịa-Vũng Tàu very high).
- **Content:** fictional, generated once into `src/data/coverage.js` (fixed uuids; never regenerate): 12 name/mission themes in EN and VI,
  2 or 3 needs each (one per category, some with no quantity = ongoing, D-063), a login user each, and about one in four
  unverified (5 of the 23 new; 7 of 31 overall) so the verified/unverified count has both to show. `organisations.js`, `users.js`
  and `needs.js` append these; `npm run db:seed` would push them.
- **How it reaches the database:** as SQL for the user to run, `supabase/seed-coverage.sql`, generated by
  `node scripts/build-coverage-sql.mjs` (upserts on the fixed ids, categories by name, one transaction). Side effects once
  it is run: hero "Verified organisations" and "Provinces covered" change (31 organisations, 24 verified, 16 provinces), the login
  picker lists 31 organisations, and the Organisations board has 31 cards.

## D-071 — Browser tab title is "3goods, a Data4Life Hackathon Website"
- `index.html` `<title>` is exactly that text (supersedes D-051's plain "3goods"). The in-app brand text (`app.name`) stays "3goods".

## D-072 — The root map site was redeployed; the deploy folder and one data-file incident are now recorded
- **Where it deploys from:** the Vercel project `002-data-4-life` (`https://002-data-4-life.vercel.app`, Root Directory ".") serves
  `index.html`, `web/`, `data/`, `api/` at its root. In this repo those live in **`3goods-map/`**, so the deploy is run **from inside
  `3goods-map/`** after `vercel link --yes --project 002-data-4-life` (the link is `3goods-map/.vercel`, git-ignored). Deploying from
  the repo root would publish both projects' folders with no `index.html` and break the site. `vercel link` also writes a
  `.env.local` and a `.gitignore` there; both were deleted (not needed).
- **What went live:** everything pending since D-061 (neighbouring-land base map, view fitted to the container, Ctrl/Cmd+wheel
  zoom, bounded pan) plus D-066's two-finger pinch/pan. The root map keeps its full-screen behaviour: one finger still pans
  (`cooperativeTouch` is off there). Smoke-tested on the live site with synthetic touches: pinch zooms, one-finger pans, no
  console errors.
- **Incident (fixed within minutes):** the first redeploy made `/api/provinces` return 500 ("Expected property name or '}'"). Cause:
  `3goods-map/data/vn_map_data.js`, committed in this repo, had been reformatted into a JavaScript object literal with unquoted keys,
  while `api/provinces.js` strips the `window.VN_MAP_DATA =` wrapper and calls `JSON.parse`. The previous deployment evidently
  had the strict-JSON file. The file was verified deep-equal to the 3goods snapshot of what the API had been serving, rewritten as
  `window.VN_MAP_DATA = <strict JSON>;` (still a plain script for the browser), and redeployed. All five endpoints return 200 with
  CORS `*` (provinces 63 features). 3goods falls back to its bundled snapshot when the API fails, so the 3goods map stayed usable
  (with its "saved copy" notice) in the gap. **Lesson:** do not run a formatter over `3goods-map/data/*.js`; smoke-test all five
  `/api/*` endpoints after any deploy of that folder.

## D-073 — OSM facility pins are clickable and linked to registered organisations (matched / unmatched popups)
- **Problem:** the 89 OpenStreetMap facility pins did nothing when clicked. Rather than remove them, they now connect to the app's
  own organisation directory.
- **Is matching feasible? Yes, by position, and only by position.** The organisations are fictional: no shared names, ids or
  addresses with the real facilities, so name matching is meaningless. A province alone is far too coarse (Hà Nội has 25 pins and 9
  organisations). So organisations get an optional exact `location` (`organisations.lat` / `lng`, both nullable) and a pin matches an
  organisation when they are **within 150 m**. Organisations with no `location` never match, so missing data cannot produce a false
  match. **One-to-one:** candidate pairs are claimed nearest-first, so an organisation links only its nearest pin and a pin only its nearest
  organisation (the closest two distinct pins are 120 m apart; two OSM entries for one building sit at 0 m). Logic:
  `features/map/facilityMatching.js` (`matchFacilitiesToOrganisations`, haversine). The removal fallback in the request was
  therefore not needed. **Honest limit:** the matches exist because the demo data was seeded that way (below); real organisations would need
  to supply coordinates. Today 10 of 31 organisations have one, so 10 of 89 pins are matched and 79 are not.
- **Seeding (requested: a guaranteed handful of matches):** 10 of the 23 coverage organisations (D-070) sit on real pin coordinates,
  exactly on the pin or about 30 m from it (`location` in `src/data/coverage.js`): Hà Nội 3, Hồ Chí Minh 2, and one each in Bà Rịa-Vũng
  Tàu, Cần Thơ, Đồng Nai, Bắc Ninh, Thanh Hóa (RRD, South East, Mekong, Central Coast). Others keep no coordinates, distributed by
  province as D-070 planned. Pins were chosen for generic names and a loosely fitting theme (an elders group at a nursing home, a kitchen
  partner at a social-protection centre); **children's villages, drug-rehabilitation and mental-health centres were avoided on purpose**, because
  pairing a fictional organisation with a real, sensitive institution would be wrong. The matched popup says so explicitly ("this fictional
  organisation is placed here for the demo. It is not the facility itself").
- **Data separation rule kept (CLAUDE.md):** the OSM record and the 3goods organisation stay separate records. The only bridge is the
  computed match, shown as a link. The popup labels the OSM facility as such ("OpenStreetMap facility") and the organisation as
  "Registered on 3goods". The map disclaimer and legend were reworded: grey pin = an OSM facility not on 3goods yet, blue pin = a registered
  3goods organisation at that location.
- **Popup (`FacilityPopup`):** an overlay card inside the map frame (bottom, full-width on phones), not anchored to the pin (pins move
  with pan and zoom). It opens on a click, tap or Enter/Space on the pin, toggles on the same pin, closes with ✕ or Escape, and closes when
  the facilities layer is turned off. **Matched:** facility name and type, "Registered on 3goods" tag, organisation name, verified /
  "not yet verified", a two-line mission, a "View organisation profile" link to `/organisation/<id>`, and the demonstration note.
  **Unmatched:** "This facility hasn't joined 3goods yet" and a call to action.
- **Call to action, chosen: a short interest form, not a `mailto:`.** A `mailto:` needs a real inbox address this project does not have
  (and would put a fictional prototype's contact details on public pages); the form needs only what already exists (Supabase). Name + email-or-phone
  (both required, translated validation, no other fields) writes one row to the new **`facility_interests`** table: osm type/id, facility
  name and coordinates, contact name, contact, the visitor's language, timestamp. **It is not registration and creates no account.** Nothing
  in the app reads it. **Privacy:** the table's only policy is insert-only for the public key, so contact details can be written but not read back
  with it (read them in the Supabase dashboard); a short line under the form says what they are used for. `services/facilityInterestService.js`,
  `db.insertBlind` (an insert that does not read the row back, which an insert-only policy would refuse).
- **Pins (wrapper only, vendor untouched):** the vendored `mapView.js` draws pins as plain SVG with no click handling and is read-only (D-061), so
  `features/map/pinLayer.js` decorates them after each MapView render (matched / selected classes, `role="button"`, `tabindex`, an
  accessible name, a larger transparent hit disc so a fingertip can hit a ~13 px pin) and attaches one delegated listener that survives
  the re-renders. It checks the pin count and each pin's name against the facility list before touching anything, and a drag that starts on a
  pin (panning) is not a click. No root-site change or redeploy was needed.
- **Schema (SQL for the user, folded into the pending coverage SQL):** `organisations.lat/lng`, the `facility_interests` table with its
  insert-only policy. `supabase/seed-coverage.sql` (generated) carries them together with the 23 organisations; `supabase/schema.sql`
  documents them. The app tolerates the columns not existing yet (no location = no matches; the form shows a translated error if the table is missing).
- **Not done:** matches are not shown anywhere except the map (no "location" on the organisation profile); one-to-one means a second
  organisation placed within 150 m of the same pin would show no pin of its own.

---

## Deferred questions (not blocking Phase 1)

- Exact wording for the "demo/fictional data" disclosure banner — will draft in 3G-006 and show for
  confirmation rather than asking now.
- Whether demo login should offer a choice of *which* seeded organisation to log in as, or always
  the same one — defaulting to always the same one (simpler, consistent test data) unless told
  otherwise.
- Filter/Sort full behaviour (3G-035) — stubbed in Phase 1, detailed decisions deferred to that task.
