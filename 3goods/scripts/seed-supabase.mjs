#!/usr/bin/env node
/**
 * One-time (idempotent) push of src/data/*.js seed records into Supabase.
 * Run after supabase/schema.sql has been applied and .env.local has
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set.
 *
 * Idempotent via upsert-on-id: safe to re-run after editing a seed file.
 * Ids are the fixed uuids in src/data/ids.js, not Postgres's
 * gen_random_uuid() default — see DECISIONS.md D-042 — so re-running this
 * updates the same rows instead of inserting duplicates.
 *
 * `categories` is the one table this script doesn't upsert into: those 8
 * rows were seeded once by hand with DB-generated ids, so this script
 * queries them by name instead to build a name -> id map for
 * items.category_id / needs.category_id.
 *
 * Seed order matters: items are inserted before requests (so requests can
 * reference item_id), then a final pass sets items.accepted_request_id —
 * items and requests reference each other, so that one link can't be set
 * until both rows exist. Conversations similarly wait until requests exist.
 *
 * Usage: node scripts/seed-supabase.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

import { ITEMS } from "../src/data/items.js";
import { NEEDS } from "../src/data/needs.js";
import { ORGANISATIONS } from "../src/data/organisations.js";
import { REQUESTS } from "../src/data/requests.js";
import { CONVERSATIONS } from "../src/data/conversations.js";
import { MESSAGES } from "../src/data/messages.js";
import { UPDATES } from "../src/data/updates.js";
import { DEMO_DONOR_USER, DEMO_ORG_USER, FLAVOUR_DONOR_USERS } from "../src/data/users.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Tiny .env.local reader — no dotenv dependency needed for one script. */
function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  let raw;
  try {
    raw = readFileSync(envPath, "utf-8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — set them in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, anonKey);
const WINDOW_SEP = " | ";

async function upsert(table, rows) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(`[${table}] failed:`, error.message);
    process.exit(1);
  }
  console.log(`[${table}] seeded ${rows.length} rows.`);
}

async function loadCategoryIdByName() {
  const { data, error } = await supabase.from("categories").select("id, name");
  if (error) {
    console.error("[categories] failed to read:", error.message);
    process.exit(1);
  }
  if (!data.length) {
    console.error(
      "[categories] table is empty — seed the 8 categories in Supabase before running this script.",
    );
    process.exit(1);
  }
  const byName = new Map();
  for (const row of data) byName.set(row.name.trim().toLowerCase(), row.id);
  console.log(
    "[categories] live rows:",
    data.map((row) => `${JSON.stringify(row.name)} -> ${row.id}`).join(", "),
  );
  return (slug) => {
    const id = byName.get(slug.trim().toLowerCase());
    if (!id) {
      throw new Error(
        `No live category named "${slug}" — available: ${[...byName.keys()].map((n) => JSON.stringify(n)).join(", ")}`,
      );
    }
    return id;
  };
}

async function main() {
  const categoryId = await loadCategoryIdByName();
  const itemCategoryIds = ITEMS.map((item) => [item.title, item.category, categoryId(item.category), item.secondaryCategory]);
  console.log(
    "[items] resolved category ids:",
    itemCategoryIds
      .map(([title, slug, id, secondarySlug]) => `${title} (${slug}${secondarySlug ? ` + ${secondarySlug}` : ""}) -> ${id}`)
      .join("\n  "),
  );

  await upsert(
    "organisations",
    ORGANISATIONS.map((org) => ({
      id: org.id,
      name: org.name.en,
      name_vi: org.name.vi,
      description: org.mission.en,
      description_vi: org.mission.vi,
      city: org.areaId,
      verified: org.verified,
      is_demo: org.isDemo,
      past_received_item_ids: org.pastReceivedItemIds,
    })),
  );

  await upsert(
    "users",
    [DEMO_DONOR_USER, DEMO_ORG_USER, ...FLAVOUR_DONOR_USERS].map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      org_id: user.organisationId ?? null,
    })),
  );

  await upsert(
    "items",
    ITEMS.map((item) => ({
      id: item.id,
      title: item.title,
      title_vi: item.titleVi ?? null,
      category_id: categoryId(item.category),
      secondary_category_id: item.secondaryCategory ? categoryId(item.secondaryCategory) : null,
      need_tags: item.needTags ?? [],
      condition: item.condition ?? "",
      area: item.areaId,
      description: item.description ?? "",
      delivery_option: item.deliveryOption,
      collection_windows: (item.collectionWindows ?? []).join(WINDOW_SEP),
      notes: item.notes ?? "",
      image_base64: item.photoPaths?.[0] ?? null,
      status: item.status,
      donor_id: item.donorId,
      created_at: item.createdAt,
      // accepted_request_id intentionally omitted — set in the follow-up
      // pass below, once the referenced request row is guaranteed to exist.
    })),
  );

  await upsert(
    "needs",
    NEEDS.map((need) => ({
      id: need.id,
      org_id: need.organisationId,
      category_id: categoryId(need.category),
      tag: need.tag,
      priority: need.priority ? "high" : "medium",
      status: "open",
      created_at: need.createdAt,
    })),
  );

  await upsert(
    "requests",
    REQUESTS.map((request) => ({
      id: request.id,
      item_id: request.itemId,
      org_id: request.organisationId,
      status: request.status,
      created_at: request.createdAt,
    })),
  );

  const itemsWithAcceptedRequest = ITEMS.filter((item) => item.acceptedRequestId);
  for (const item of itemsWithAcceptedRequest) {
    const { error } = await supabase
      .from("items")
      .update({ accepted_request_id: item.acceptedRequestId })
      .eq("id", item.id);
    if (error) {
      console.error(`[items] failed to set accepted_request_id for ${item.id}:`, error.message);
      process.exit(1);
    }
  }
  if (itemsWithAcceptedRequest.length) {
    console.log(`[items] linked accepted_request_id on ${itemsWithAcceptedRequest.length} row(s).`);
  }

  await upsert(
    "conversations",
    CONVERSATIONS.map((conversation) => {
      const request = REQUESTS.find((r) => r.id === conversation.requestId);
      return {
        id: conversation.id,
        item_id: request?.itemId ?? null,
        org_id: conversation.organisationId,
        donor_id: conversation.donorId,
        request_id: conversation.requestId ?? null,
      };
    }),
  );

  await upsert(
    "messages",
    MESSAGES.map((message) => ({
      id: message.id,
      conversation_id: message.conversationId,
      sender_id: message.senderId === "system" ? null : message.senderId,
      sender_role: message.senderRole,
      body: message.text ?? null,
      system_code: message.systemCode ?? null,
      params: message.params ?? {},
      created_at: message.createdAt,
    })),
  );

  await upsert(
    "updates",
    UPDATES.map((update) => ({
      id: update.id,
      user_id: update.userId,
      type: update.type,
      params: update.params ?? {},
      link_item_id: update.linkItemId ?? null,
      link_request_id: update.linkRequestId ?? null,
      read: update.read,
      created_at: update.createdAt,
    })),
  );

  console.log("Done.");
}

main();
