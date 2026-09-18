/**
 * Donation photo uploads. Components call this, never the Supabase client
 * directly (same rule as db.js — see CLAUDE.md).
 *
 * Supersedes DECISIONS.md D-008 ("local preview only, never persisted") now
 * that there's a real backend to upload to — see the D-008 update for why
 * that constraint existed and why it's gone. Uploads go to the public
 * `item-photos` bucket (see supabase/schema.sql); the returned public URL is
 * what gets stored in an Item's `photoPaths`.
 */
import { supabase } from "../lib/supabaseClient.js";

const BUCKET = "item-photos";

/**
 * @param {File[]} files
 * @returns {Promise<string[]>} public URLs, same order as `files`
 */
export async function uploadItemPhotos(files) {
  const urls = [];
  for (const file of files) {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}
