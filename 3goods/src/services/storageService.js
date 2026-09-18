/**
 * Donation photo handling. Components call this, never the Supabase client
 * directly (same rule as db.js — see CLAUDE.md).
 *
 * Supersedes the Storage-bucket approach D-041 introduced: the live
 * `items`/`messages` tables store a single `image_base64` text column
 * instead of a bucket path (see DECISIONS.md D-042), so this just reads the
 * first selected file as a base64 data URL in the browser — no network
 * call, no bucket to manage. Only one photo per item is supported now
 * (the live schema has room for exactly one).
 */
import { AppError } from "../lib/errors.js";

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * @param {File[]} files
 * @returns {Promise<string[]>} `[dataUrl]` for the first file, or `[]` if
 *   none were selected — kept as an array so DonationForm's existing
 *   `photoPaths` handling didn't need to change.
 */
export async function uploadItemPhotos(files) {
  const file = files[0];
  if (!file) return [];

  if (file.size > MAX_BYTES) {
    throw new AppError("photoTooLarge", { sizeKb: Math.round(file.size / 1024) });
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  return [dataUrl];
}
