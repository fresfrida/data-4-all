/**
 * Minimal user-facing reads. Components call these, never src/lib/db.js
 * directly — see itemsService.js's header comment for why.
 */

import { getAll } from "../lib/db.js";

/** @returns {Promise<number>} count of registered donor identities (for the hero stats strip). */
export async function getDonorCount() {
  const users = await getAll("users");
  return users.filter((u) => u.role === "donor").length;
}
