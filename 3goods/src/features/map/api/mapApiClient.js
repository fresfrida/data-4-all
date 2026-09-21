/**
 * The only module in 3goods that talks to the root map site's serverless API
 * (`3goods-map/api/*`, deployed as the `002-data-4-life` Vercel project). See
 * CLAUDE.md's map data-separation rule and DECISIONS.md D-056.
 *
 * Endpoints (all read-only GET, CORS `*`):
 *   /api/provinces   GeoJSON, 63 provinces + disaster/poverty/coverage scores
 *   /api/facilities  OpenStreetMap donation-capable locations (community pins)
 *   /api/metro-hubs  the 5 largest cities (likely donation-origin points)
 *   /api/item-needs  what to donate, by disaster type
 *   /api/meta        self-describing index: score definitions, sources, caveats
 *
 * Every dataset is fetched from the API first. If the API can't be reached
 * (offline, map site down, timeout) the bundled snapshot in `public/data/` —
 * a byte-for-byte copy of what the API serves — is used instead and the result
 * says so (`sources[name] === "snapshot"`), so the UI can tell the user rather
 * than silently showing possibly older data. No score is ever invented: a
 * dataset with neither source is `null`/`[]` and reported as "unavailable".
 */

// Override per environment with VITE_MAP_API_BASE_URL (no trailing slash needed).
const API_BASE = (import.meta.env.VITE_MAP_API_BASE_URL || "https://002-data-4-life.vercel.app").replace(/\/+$/, "");
const TIMEOUT_MS = 8000;

const DATASETS = {
  provinces: { api: "/api/provinces", snapshot: "/data/vn_provinces.geojson" },
  facilities: { api: "/api/facilities", snapshot: "/data/donation_facilities_osm.json" },
  metroHubs: { api: "/api/metro-hubs", snapshot: "/data/metro_hubs.json" },
  itemNeeds: { api: "/api/item-needs", snapshot: "/data/donation_items_by_disaster.json" },
  meta: { api: "/api/meta", snapshot: null },
  // Base-map land around Vietnam (Laos, Cambodia, ...), built by 3goods-map/src/build_neighbour_land.mjs from
  // Natural Earth. Not disaster data and not an API endpoint: always the bundled file ("bundled", never a fallback).
  neighbourLand: { api: null, snapshot: "/data/neighbour_land.json" },
};

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** @returns {Promise<{data: any, source: "api"|"snapshot"|"unavailable"}>} */
async function loadDataset(name) {
  const { api, snapshot } = DATASETS[name];
  if (!api) {
    try {
      return { data: await fetchJson(snapshot), source: "bundled" };
    } catch (err) {
      console.warn(`[3goods] bundled map layer ${snapshot} failed:`, err.message);
      return { data: null, source: "unavailable" };
    }
  }
  try {
    return { data: await fetchJson(`${API_BASE}${api}`), source: "api" };
  } catch (apiErr) {
    console.warn(`[3goods] map API ${api} unreachable (${apiErr.message})${snapshot ? ", using bundled snapshot" : ""}`);
  }
  if (snapshot) {
    try {
      return { data: await fetchJson(snapshot), source: "snapshot" };
    } catch (snapErr) {
      console.warn(`[3goods] map snapshot ${snapshot} failed:`, snapErr.message);
    }
  }
  return { data: null, source: "unavailable" };
}

/**
 * Loads every map dataset in parallel. Throws only if the province scores
 * (the map itself) are unavailable from both the API and the snapshot.
 *
 * @returns {Promise<{
 *   features: object[], metroHubs: object[], facilities: object[],
 *   itemNeeds: object|null, meta: object|null, land: object|null,
 *   sources: Record<"provinces"|"facilities"|"metroHubs"|"itemNeeds"|"meta"|"neighbourLand", "api"|"snapshot"|"bundled"|"unavailable">
 * }>}
 */
export async function loadFullMapData() {
  const names = Object.keys(DATASETS);
  const results = await Promise.all(names.map(loadDataset));
  const byName = Object.fromEntries(names.map((name, i) => [name, results[i]]));

  const features = byName.provinces.data?.features ?? [];
  if (byName.provinces.source === "unavailable" || features.length === 0) {
    throw new Error("Map province data is unavailable from both the map API and the bundled snapshot");
  }

  return {
    features,
    metroHubs: byName.metroHubs.data ?? [],
    facilities: byName.facilities.data ?? [],
    itemNeeds: byName.itemNeeds.data ?? null,
    meta: byName.meta.data ?? null,
    land: byName.neighbourLand.data ?? null,
    sources: Object.fromEntries(names.map((name) => [name, byName[name].source])),
  };
}
