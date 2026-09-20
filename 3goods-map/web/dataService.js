// Single Responsibility: this is the only module that knows *where* the
// app's data lives (which files, window globals). Everything else receives
// plain JS objects and has no idea whether they came from a <script> tag,
// a fetch(), or a hardcoded constant -- swap the source here without
// touching MapView, panels, or main.js.

export async function loadAppData() {
  // vn_map_data.js assigns window.VN_MAP_DATA as a side effect of a plain
  // <script src> tag in index.html (loaded before this module runs) --
  // it's a large pre-built blob, served/cached like any static asset,
  // not worth fetching+parsing again here.
  const features = window.VN_MAP_DATA.features;

  // metro_hubs.json is also the source /api/metro-hubs serves -- one file,
  // read by both the browser app and any external integration.
  // neighbour_land.json is the base-map land around Vietnam (Laos, Cambodia, ...); the map still works without it.
  const [itemNeeds, facilities, metroHubs, land] = await Promise.all([
    fetch("data/donation_items_by_disaster.json").then(r => r.json()).catch(() => null),
    fetch("data/donation_facilities_osm.json").then(r => r.json()).catch(() => []),
    fetch("data/metro_hubs.json").then(r => r.json()).catch(() => []),
    fetch("data/neighbour_land.json").then(r => r.json()).catch(() => null),
  ]);

  return { features, itemNeeds, facilities, metroHubs, land };
}
