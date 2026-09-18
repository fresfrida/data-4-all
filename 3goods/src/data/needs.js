/**
 * @typedef {import('./types.js').Need} Need
 * Seed "we currently need" lists. Organisations can add/remove their own via
 * NeedsManagement (3G-010) — that goes through needsService, which persists
 * on top of this seed via src/lib/db.js, never edits this file at runtime.
 */

/** @type {Need[]} */
export const NEEDS = [
  { id: "need-001", organisationId: "org-food-share", category: "Rice", tag: "rice", priority: true, createdAt: "2026-08-01T02:00:00.000Z" },
  { id: "need-002", organisationId: "org-food-share", category: "Non-Perishable Food", tag: "non_perishable_food", priority: false, createdAt: "2026-08-01T02:00:00.000Z" },

  { id: "need-003", organisationId: "org-hanoi-pantry", category: "Rice", tag: "rice", priority: true, createdAt: "2026-08-03T02:00:00.000Z" },
  { id: "need-004", organisationId: "org-hanoi-pantry", category: "Household Items", tag: "household_general", priority: false, createdAt: "2026-08-03T02:00:00.000Z" },

  { id: "need-005", organisationId: "org-books-children", category: "Books", tag: "childrens_books", priority: true, createdAt: "2026-08-05T02:00:00.000Z" },
  { id: "need-006", organisationId: "org-books-children", category: "Books", tag: "textbooks_stationery", priority: false, createdAt: "2026-08-05T02:00:00.000Z" },

  { id: "need-007", organisationId: "org-warm-homes", category: "Household Items", tag: "household_general", priority: true, createdAt: "2026-08-07T02:00:00.000Z" },
  { id: "need-008", organisationId: "org-warm-homes", category: "Miscellaneous", tag: "misc_essentials", priority: false, createdAt: "2026-08-07T02:00:00.000Z" },

  { id: "need-009", organisationId: "org-care-bridge", category: "Children Items", tag: "baby_items", priority: true, createdAt: "2026-08-09T02:00:00.000Z" },
  { id: "need-010", organisationId: "org-care-bridge", category: "Hygiene Products", tag: "hygiene_products", priority: true, createdAt: "2026-08-09T02:00:00.000Z" },
];
