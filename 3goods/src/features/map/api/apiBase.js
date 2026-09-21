/**
 * Where the map API lives, kept free of `import.meta` so it can be unit-tested
 * with plain Node (tests/apiBase.test.js).
 *
 * Default is same-origin: the empty base makes every request a relative
 * `/api/...` URL served by this deployment's own serverless functions
 * (`3goods/api/`). `VITE_MAP_API_BASE_URL` is an optional absolute override for
 * local development or a rollback to a remote API.
 */

/** Trims whitespace and trailing slashes; anything unset/blank means same-origin (""). */
export function resolveApiBase(override) {
  return typeof override === "string" ? override.trim().replace(/\/+$/, "") : "";
}

/** Joins a base from `resolveApiBase` with an endpoint path, with exactly one slash between. */
export function buildApiUrl(base, path) {
  return `${base}/${path.replace(/^\/+/, "")}`;
}
