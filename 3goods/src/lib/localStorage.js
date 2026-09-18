/**
 * The only file in 3goods allowed to touch `window.localStorage` directly
 * (db.js and SessionContext both go through here). Wrapped in try/catch
 * because localStorage can throw (private browsing, quota exceeded,
 * disabled) — callers always get `null`/`false` back instead of a crash.
 * This is "safe failure behaviour": a storage failure degrades to
 * in-memory-only for that session, it never blanks the screen.
 */

export function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    console.warn(`[3goods] localStorage read failed for "${key}":`, err);
    return null;
  }
}

export function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[3goods] localStorage write failed for "${key}":`, err);
    return false;
  }
}

export function safeRemoveItem(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[3goods] localStorage remove failed for "${key}":`, err);
    return false;
  }
}
