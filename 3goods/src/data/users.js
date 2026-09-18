/**
 * @typedef {import('./types.js').User} User
 *
 * Demo-login identities only (DECISIONS.md D-004) — not real accounts, no
 * passwords. Logging in as Donor always uses DEMO_DONOR_USER; logging in as
 * Organisation always attaches to DEMO_ORG_USER (Hanoi Community Pantry),
 * so "My Organisation" has real seed needs/items to show. Other donor names
 * that appear on items (see data/items.js) are flavour text, not full user
 * records — they can't log in, matching "no upload/account required to
 * browse."
 */

/** @type {User} */
export const DEMO_DONOR_USER = {
  id: "user-donor-demo",
  name: "Mai Nguyen",
  role: "donor",
  areaId: "hanoi",
};

/** @type {User} */
export const DEMO_ORG_USER = {
  id: "user-org-demo",
  name: "Hanoi Community Pantry",
  role: "organisation",
  areaId: "hanoi",
  organisationId: "org-hanoi-pantry",
};
