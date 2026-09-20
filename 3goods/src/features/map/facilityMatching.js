/**
 * Matching OpenStreetMap facility pins to registered 3goods organisations (D-073).
 *
 * What is feasible: the organisations are fictional and share no names, ids or addresses with the real OSM facilities, so name
 * matching is meaningless, and a province alone is far too coarse (Hà Nội has 25 pins and 9 organisations). The one signal that
 * works is position: an organisation may carry an exact `location`, and a pin matches it when the two are within MATCH_RADIUS_M.
 * Organisations without a `location` never match, so "no coordinates" cannot produce a false match.
 *
 * Threshold: 150 m. Seeded organisations sit exactly on a pin or about 30 m from it, so the radius is generous for them, while
 * still tighter than the distance between distinct facilities in a city (the closest pair of different pins is 120 m apart, and
 * matching is one-to-one, so an organisation links to only its nearest pin, and a pin to only its nearest organisation).
 */
export const MATCH_RADIUS_M = 150;

const EARTH_RADIUS_M = 6371000;
const rad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function distanceMeters(aLat, aLng, bLat, bLng) {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** A stable key for a pin: OSM type + id. */
export const facilityKey = (facility) => `${facility.osm_type}/${facility.osm_id}`;

/**
 * @param {Array<{lat: number, lon: number}>} facilities  map pins, in the order the map draws them
 * @param {Array<{id: string, location?: {lat: number, lng: number}|null}>} organisations
 * @param {number} [radiusM]
 * @returns {Map<number, {organisation: object, distanceM: number}>} pin index -> its matched organisation
 */
export function matchFacilitiesToOrganisations(facilities, organisations, radiusM = MATCH_RADIUS_M) {
  const pairs = [];
  facilities.forEach((facility, fi) => {
    if (typeof facility.lat !== "number" || typeof facility.lon !== "number") return;
    for (const organisation of organisations) {
      if (!organisation.location) continue;
      const d = distanceMeters(facility.lat, facility.lon, organisation.location.lat, organisation.location.lng);
      if (d <= radiusM) pairs.push({ fi, organisation, distanceM: d });
    }
  });
  // Closest pairs claim each other first, so one organisation never links two pins and vice versa.
  pairs.sort((a, b) => a.distanceM - b.distanceM);
  const matches = new Map();
  const usedOrganisations = new Set();
  for (const { fi, organisation, distanceM } of pairs) {
    if (matches.has(fi) || usedOrganisations.has(organisation.id)) continue;
    matches.set(fi, { organisation, distanceM });
    usedOrganisations.add(organisation.id);
  }
  return matches;
}
