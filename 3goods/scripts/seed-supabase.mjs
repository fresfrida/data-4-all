#!/usr/bin/env node
/**
 * One-time (idempotent) push of src/data/*.js seed records into Supabase.
 * Run after supabase/schema.sql has been applied and .env.local has
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set.
 *
 * Idempotent via upsert-on-id: safe to re-run after editing a seed file.
 * Only touches the 7 tables db.js knows about — never `users` (those two
 * demo identities in data/users.js aren't stored anywhere, see db.js).
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

const TABLES = {
  organisations: ORGANISATIONS,
  items: ITEMS,
  needs: NEEDS,
  requests: REQUESTS,
  conversations: CONVERSATIONS,
  messages: MESSAGES,
  updates: UPDATES,
};

for (const [table, rows] of Object.entries(TABLES)) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(`[${table}] failed:`, error.message);
    process.exit(1);
  }
  console.log(`[${table}] seeded ${rows.length} rows.`);
}

console.log("Done.");
