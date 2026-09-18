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

## D-004 — `role` and `session` (demo login) are separate state
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

---

## Deferred questions (not blocking Phase 1)

- Exact wording for the "demo/fictional data" disclosure banner — will draft in 3G-006 and show for
  confirmation rather than asking now.
- Whether demo login should offer a choice of *which* seeded organisation to log in as, or always
  the same one — defaulting to always the same one (simpler, consistent test data) unless told
  otherwise.
- Filter/Sort full behaviour (3G-035) — stubbed in Phase 1, detailed decisions deferred to that task.
