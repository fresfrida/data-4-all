/**
 * API client for disaster heatmaps and OpenStreetMap community facilities.
 * Provides explicit error handling without inventing fake scores or pins.
 */

const BASE_DATA_PATH = "/data";

export async function getProvincesGeoJSON() {
  try {
    const res = await fetch(`${BASE_DATA_PATH}/vn_provinces.geojson`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.features || [];
  } catch (err) {
    console.warn("Failed to load provinces GeoJSON:", err);
    return [];
  }
}

export async function getMetroHubs() {
  try {
    const res = await fetch(`${BASE_DATA_PATH}/metro_hubs.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Failed to load metro hubs:", err);
    return [];
  }
}

export async function getFacilities() {
  try {
    const res = await fetch(`${BASE_DATA_PATH}/donation_facilities_osm.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Failed to load facilities:", err);
    return [];
  }
}

export async function getItemNeedsByDisaster() {
  try {
    const res = await fetch(`${BASE_DATA_PATH}/donation_items_by_disaster.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Failed to load disaster item needs:", err);
    return null;
  }
}

export async function loadFullMapData() {
  const [features, metroHubs, facilities, itemNeeds] = await Promise.all([
    getProvincesGeoJSON(),
    getMetroHubs(),
    getFacilities(),
    getItemNeedsByDisaster(),
  ]);

  return { features, metroHubs, facilities, itemNeeds };
}
