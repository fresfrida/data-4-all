/**
 * The one Supabase client instance for the app. `lib/db.js` (table reads/
 * writes) and `services/storageService.js` (photo uploads) are the only
 * files that import this — components and other services never do (same
 * rule as the old localStorage engine, see CLAUDE.md).
 *
 * Anon/public key only — there is no real auth in this prototype (D-004),
 * so every table and the `item-photos` bucket use permissive RLS policies
 * (see supabase/schema.sql). Don't put a service-role key in a VITE_ env var:
 * anything prefixed VITE_ ships in the client bundle.
 */
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in from your Supabase project's Settings → API page.",
  );
}

export const supabase = createClient(url, anonKey);
