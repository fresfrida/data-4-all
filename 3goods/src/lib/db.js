/**
 * The one storage engine for 3goods domain records (items, needs,
 * organisations, requests, conversations, messages, updates).
 *
 * Backed by Supabase/Postgres (see supabase/schema.sql for the tables and
 * RLS policies, scripts/seed-supabase.mjs for one-time seeding). Services
 * (src/services/*.js) are the only callers of this file — components never
 * import src/data/*.js or the Supabase client directly (see CLAUDE.md).
 *
 * This used to be a localStorage-backed engine (see git history / prior
 * DECISIONS.md entries) — every function here was already async even when
 * it was synchronous under the hood, specifically so this swap wouldn't
 * touch any service or component code. `query()` is the one exception: it
 * takes a JS predicate, which can't translate to SQL, so it just filters
 * the full table client-side. Nothing in the app actually calls it (every
 * service does its own `.filter()` on `getAll()`'s result), it's kept only
 * because a couple of screens/services still reference it in comments.
 *
 * IDs: seed records use stable ids like "item-001"; anything created at
 * runtime gets `${prefix}-${timestamp}-${random}` via `makeId`.
 */

import { supabase } from "./supabaseClient.js";

export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getAll(table) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw error;
  return data ?? [];
}

export async function getById(table, id) {
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function query(table, predicate) {
  return (await getAll(table)).filter(predicate);
}

/** @returns the inserted record (with id filled in if not provided). */
export async function insert(table, record, idPrefix) {
  const withId = record.id ? record : { ...record, id: makeId(idPrefix ?? table) };
  const { data, error } = await supabase.from(table).insert(withId).select().single();
  if (error) throw error;
  return data;
}

/** @returns the updated record, or null if no row matched `id`. */
export async function update(table, id, patch) {
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select().maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** @returns true if a row was removed, false if `id` didn't exist. */
export async function remove(table, id) {
  const { data, error } = await supabase.from(table).delete().eq("id", id).select();
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
