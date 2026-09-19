/**
 * @typedef {import('./types.js').User} User
 *
 * Every seeded person/organisation account. Since D-051 all of them are
 * selectable in the demo-login picker (SessionContext / DemoLoginPrompt,
 * fed live by usersService.getLoginIdentities), not just one fixed donor and
 * one fixed organisation. Each organisation needs its own `users` row
 * (role "organisation", `org_id` set) because `messages.sender_id` is a
 * foreign key to `users` — see DECISIONS.md D-042 for the FK background.
 * Donors also need real rows since `items.donor_id` is a foreign key.
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
 * Other seeded donors (referenced by data/items.js's `donorId`).
 * @type {User[]}
 */
export const FLAVOUR_DONOR_USERS = [
  { id: USER_IDS.donor002, name: "Linh Tran", role: "donor", areaId: "hue" },
  { id: USER_IDS.donor003, name: "Duc Pham", role: "donor", areaId: "cantho" },
  { id: USER_IDS.donor004, name: "Thu Le", role: "donor", areaId: "hcmc" },
  { id: USER_IDS.donor005, name: "Hoa Vu", role: "donor", areaId: "danang" },
];

/**
 * Login accounts for the four organisations besides Hanoi Community Pantry
 * (DEMO_ORG_USER above).
 * @type {User[]}
 */
export const OTHER_ORG_USERS = [
  { id: USER_IDS.orgFoodShare, name: "Vietnam Food Share", role: "organisation", areaId: "hcmc", organisationId: ORG_IDS.foodShare },
  { id: USER_IDS.orgBooksChildren, name: "Books for Children Vietnam", role: "organisation", areaId: "hue", organisationId: ORG_IDS.booksChildren },
  { id: USER_IDS.orgWarmHomes, name: "Warm Homes Collective", role: "organisation", areaId: "cantho", organisationId: ORG_IDS.warmHomes },
  { id: USER_IDS.orgCareBridge, name: "Care Bridge Da Nang", role: "organisation", areaId: "danang", organisationId: ORG_IDS.careBridge },
];
