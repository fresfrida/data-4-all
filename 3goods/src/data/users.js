/**
 * @typedef {import('./types.js').User} User
 *
 * Demo-login identities (DECISIONS.md D-004) plus the "flavour" donors that
 * appear on seed items (data/items.js) — those can't log in (no session
 * attaches to them), but they still need a real row in the live `users`
 * table now that `items.donor_id` is a foreign key rather than a free-text
 * `donorName` (see DECISIONS.md D-042). Logging in as Donor always uses
 * DEMO_DONOR_USER; logging in as Organisation always attaches to
 * DEMO_ORG_USER (Hanoi Community Pantry), so "My Organisation" has real seed
 * needs/items to show.
 */

import { USER_IDS, ORG_IDS } from "./ids.js";

/** @type {User} */
export const DEMO_DONOR_USER = {
  id: USER_IDS.donorDemo,
  name: "Mai Nguyen",
  role: "donor",
  areaId: "hanoi",
};

/** @type {User} */
export const DEMO_ORG_USER = {
  id: USER_IDS.orgDemo,
  name: "Hanoi Community Pantry",
  role: "organisation",
  areaId: "hanoi",
  organisationId: ORG_IDS.hanoiPantry,
};

/**
 * Flavour donors referenced by data/items.js's `donorId`/`donorName` — not
 * demo-loginable, just persisted so the donor_id foreign key + name join
 * resolves to something real.
 * @type {User[]}
 */
export const FLAVOUR_DONOR_USERS = [
  { id: USER_IDS.donor002, name: "Linh Tran", role: "donor", areaId: "hue" },
  { id: USER_IDS.donor003, name: "Duc Pham", role: "donor", areaId: "cantho" },
  { id: USER_IDS.donor004, name: "Thu Le", role: "donor", areaId: "hcmc" },
  { id: USER_IDS.donor005, name: "Hoa Vu", role: "donor", areaId: "danang" },
];
