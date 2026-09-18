/**
 * @typedef {import('./types.js').Need} Need
 * Seed "we currently need" lists. Organisations can add/remove their own via
 * NeedsManagement (3G-010) — that goes through needsService, which persists
 * on top of this seed via src/lib/db.js, never edits this file at runtime.
 *
 * IDs are fixed UUIDs from data/ids.js — see DECISIONS.md D-042.
 */

import { NEED_IDS, ORG_IDS } from "./ids.js";

/** @type {Need[]} */
export const NEEDS = [
  { id: NEED_IDS.need001, organisationId: ORG_IDS.foodShare, category: "Rice", tag: "rice", priority: true, createdAt: "2026-08-01T02:00:00.000Z" },
  { id: NEED_IDS.need002, organisationId: ORG_IDS.foodShare, category: "Non-Perishable Food", tag: "non_perishable_food", priority: false, createdAt: "2026-08-01T02:00:00.000Z" },

  { id: NEED_IDS.need003, organisationId: ORG_IDS.hanoiPantry, category: "Rice", tag: "rice", priority: true, createdAt: "2026-08-03T02:00:00.000Z" },
  { id: NEED_IDS.need004, organisationId: ORG_IDS.hanoiPantry, category: "Household Items", tag: "household_general", priority: false, createdAt: "2026-08-03T02:00:00.000Z" },

  { id: NEED_IDS.need005, organisationId: ORG_IDS.booksChildren, category: "Books", tag: "childrens_books", priority: true, createdAt: "2026-08-05T02:00:00.000Z" },
  { id: NEED_IDS.need006, organisationId: ORG_IDS.booksChildren, category: "Books", tag: "textbooks_stationery", priority: false, createdAt: "2026-08-05T02:00:00.000Z" },

  { id: NEED_IDS.need007, organisationId: ORG_IDS.warmHomes, category: "Household Items", tag: "household_general", priority: true, createdAt: "2026-08-07T02:00:00.000Z" },
  { id: NEED_IDS.need008, organisationId: ORG_IDS.warmHomes, category: "Miscellaneous", tag: "misc_essentials", priority: false, createdAt: "2026-08-07T02:00:00.000Z" },

  { id: NEED_IDS.need009, organisationId: ORG_IDS.careBridge, category: "Children Items", tag: "baby_items", priority: true, createdAt: "2026-08-09T02:00:00.000Z" },
  { id: NEED_IDS.need010, organisationId: ORG_IDS.careBridge, category: "Hygiene Products", tag: "hygiene_products", priority: true, createdAt: "2026-08-09T02:00:00.000Z" },

  // Every organisation also needs Clothes — added so donors always have a Clothes-category match.
  { id: NEED_IDS.need011, organisationId: ORG_IDS.foodShare, category: "Clothes", tag: "adult_clothes", priority: false, createdAt: "2026-08-11T02:00:00.000Z" },
  { id: NEED_IDS.need012, organisationId: ORG_IDS.hanoiPantry, category: "Clothes", tag: "adult_clothes", priority: false, createdAt: "2026-08-11T02:00:00.000Z" },
  { id: NEED_IDS.need013, organisationId: ORG_IDS.booksChildren, category: "Clothes", tag: "childrens_clothes", priority: false, createdAt: "2026-08-11T02:00:00.000Z" },
  { id: NEED_IDS.need014, organisationId: ORG_IDS.warmHomes, category: "Clothes", tag: "adult_clothes", priority: true, createdAt: "2026-08-11T02:00:00.000Z" },
  { id: NEED_IDS.need015, organisationId: ORG_IDS.careBridge, category: "Clothes", tag: "childrens_clothes", priority: false, createdAt: "2026-08-11T02:00:00.000Z" },
];
