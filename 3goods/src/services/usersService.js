/**
 * Minimal user-facing reads. Components call these, never src/lib/db.js
 * directly — see itemsService.js's header comment for why.
 */

import { getAll, getById } from "../lib/db.js";
import { getOrganisations } from "./organisationsService.js";

/** @returns {Promise<import('../data/types.js').User|null>} a `users` row (name, role) by id. */
export async function getUserById(id) {
  const row = await getById("users", id);
  return row ? { id: row.id, name: row.name, role: row.role, organisationId: row.org_id ?? undefined } : null;
}

/** @returns {Promise<number>} count of registered donor identities (for the hero stats strip). */
export async function getDonorCount() {
  const users = await getAll("users");
  return users.filter((u) => u.role === "donor").length;
}

/**
 * Everyone the demo-login picker can log in as, straight from the live
 * tables (no hardcoded pair — see DECISIONS.md D-051). Each identity has
 * the shape SessionContext stores: `{ id, name, role, organisationId? }`,
 * where `id` is always a `users` row id (chat messages FK to it) and
 * `organisationId` is the organisations row id.
 *
 * @returns {Promise<{donors: import('../data/types.js').User[], organisations: (import('../data/types.js').User & {orgName: {en: string, vi: string}})[]}>}
 */
export async function getLoginIdentities() {
  const [users, organisations] = await Promise.all([getAll("users"), getOrganisations()]);

  const donors = users
    .filter((u) => u.role === "donor")
    .map((u) => ({ id: u.id, name: u.name, role: "donor" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const orgUsersByOrgId = new Map(users.filter((u) => u.role === "organisation" && u.org_id).map((u) => [u.org_id, u]));
  const orgIdentities = organisations
    .filter((org) => orgUsersByOrgId.has(org.id))
    .map((org) => ({
      id: orgUsersByOrgId.get(org.id).id,
      name: org.name.en,
      orgName: org.name,
      role: "organisation",
      areaId: org.areaId,
      organisationId: org.id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { donors, organisations: orgIdentities };
}
