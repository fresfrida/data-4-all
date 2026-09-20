/**
 * @typedef {import('./types.js').Need} Need
 * Seed "we currently need" lists (category + optional quantity + priority, at most one need per organisation per category;
 * a need with no `quantity` is an ongoing need, D-063; quantities are counted in generic "items", D-064; the old per-need `tag` was removed, D-059). Organisations can add/remove their own via
 * NeedsManagement (3G-010) — that goes through needsService, which persists
 * on top of this seed via src/lib/db.js, never edits this file at runtime.
 *
 * IDs are fixed UUIDs from data/ids.js — see DECISIONS.md D-042.
 */

import { NEED_IDS, ORG_IDS } from "./ids.js";

/** @type {Need[]} */
export const NEEDS = [
  { id: NEED_IDS.need001, organisationId: ORG_IDS.foodShare, category: "Rice", priority: true, quantity: 200, createdAt: "2026-08-01T02:00:00.000Z" },
  { id: NEED_IDS.need002, organisationId: ORG_IDS.foodShare, category: "Non-Perishable Food", priority: false, quantity: 100, createdAt: "2026-08-01T02:00:00.000Z" },

  { id: NEED_IDS.need003, organisationId: ORG_IDS.hanoiPantry, category: "Rice", priority: true, quantity: 300, createdAt: "2026-08-03T02:00:00.000Z" },
  { id: NEED_IDS.need004, organisationId: ORG_IDS.hanoiPantry, category: "Household Items", priority: false, quantity: 50, createdAt: "2026-08-03T02:00:00.000Z" },

  // Was two Books needs (100 books + 80 sets); merged into one (one need per organisation per category, D-064).
  { id: NEED_IDS.need005, organisationId: ORG_IDS.booksChildren, category: "Books", priority: true, quantity: 180, createdAt: "2026-08-05T02:00:00.000Z" },

  { id: NEED_IDS.need007, organisationId: ORG_IDS.warmHomes, category: "Household Items", priority: true, quantity: 40, createdAt: "2026-08-07T02:00:00.000Z" },
  { id: NEED_IDS.need008, organisationId: ORG_IDS.warmHomes, category: "Miscellaneous", priority: false, quantity: 60, createdAt: "2026-08-07T02:00:00.000Z" },

  { id: NEED_IDS.need009, organisationId: ORG_IDS.careBridge, category: "Children Items", priority: true, quantity: 100, createdAt: "2026-08-09T02:00:00.000Z" },
  { id: NEED_IDS.need010, organisationId: ORG_IDS.careBridge, category: "Hygiene Products", priority: true, quantity: 120, createdAt: "2026-08-09T02:00:00.000Z" },

  // Every organisation also needs Clothes — added so donors always have a Clothes-category match.
  { id: NEED_IDS.need011, organisationId: ORG_IDS.foodShare, category: "Clothes", priority: false, quantity: 80, createdAt: "2026-08-11T02:00:00.000Z" },
  { id: NEED_IDS.need012, organisationId: ORG_IDS.hanoiPantry, category: "Clothes", priority: false, quantity: 60, createdAt: "2026-08-11T02:00:00.000Z" },
  { id: NEED_IDS.need013, organisationId: ORG_IDS.booksChildren, category: "Clothes", priority: false, quantity: 50, createdAt: "2026-08-11T02:00:00.000Z" },
  { id: NEED_IDS.need014, organisationId: ORG_IDS.warmHomes, category: "Clothes", priority: true, quantity: 100, createdAt: "2026-08-11T02:00:00.000Z" },
  { id: NEED_IDS.need015, organisationId: ORG_IDS.careBridge, category: "Clothes", priority: false, quantity: 70, createdAt: "2026-08-11T02:00:00.000Z" },

  // Two needs that were added by hand to the live table during testing; now part of the seed (same ids).
  { id: NEED_IDS.need016, organisationId: ORG_IDS.hanoiPantry, category: "Books", priority: true, quantity: 90, createdAt: "2026-09-19T00:26:53.739Z" },
  { id: NEED_IDS.need017, organisationId: ORG_IDS.careBridge, category: "Household Items", priority: false, quantity: 45, createdAt: "2026-09-19T02:08:14.241Z" },

  // Hai Phong Harbour Relief, Nha Trang Seaside Aid, Mekong Delta Neighbours (each also needs Clothes, as every organisation does).
  { id: NEED_IDS.need018, organisationId: ORG_IDS.haiphongRelief, category: "Rice", priority: true, quantity: 150, createdAt: "2026-09-20T02:00:00.000Z" },
  { id: NEED_IDS.need019, organisationId: ORG_IDS.haiphongRelief, category: "Non-Perishable Food", priority: false, quantity: 80, createdAt: "2026-09-20T02:00:00.000Z" },
  { id: NEED_IDS.need020, organisationId: ORG_IDS.haiphongRelief, category: "Clothes", priority: false, quantity: 60, createdAt: "2026-09-20T02:00:00.000Z" },
  { id: NEED_IDS.need021, organisationId: ORG_IDS.nhatrangAid, category: "Hygiene Products", priority: true, quantity: 200, createdAt: "2026-09-20T02:05:00.000Z" },
  { id: NEED_IDS.need022, organisationId: ORG_IDS.nhatrangAid, category: "Books", priority: false, quantity: 70, createdAt: "2026-09-20T02:05:00.000Z" },
  { id: NEED_IDS.need023, organisationId: ORG_IDS.nhatrangAid, category: "Clothes", priority: false, quantity: 90, createdAt: "2026-09-20T02:05:00.000Z" },
  { id: NEED_IDS.need024, organisationId: ORG_IDS.mekongNeighbours, category: "Household Items", priority: true, quantity: 120, createdAt: "2026-09-20T02:10:00.000Z" },
  { id: NEED_IDS.need025, organisationId: ORG_IDS.mekongNeighbours, category: "Hygiene Products", priority: false, quantity: 300, createdAt: "2026-09-20T02:10:00.000Z" },
  { id: NEED_IDS.need026, organisationId: ORG_IDS.mekongNeighbours, category: "Clothes", priority: false, quantity: 50, createdAt: "2026-09-20T02:10:00.000Z" },
];
