// Builds data/neighbour_land.json: the land of Vietnam's neighbours (Laos, Cambodia,
// Thailand, China, ...) clipped to the map's world rectangle and simplified, so the
// map can draw Vietnam as part of a continent instead of an island floating in blue.
// Vietnam itself is left out (the GADM province polygons are the detailed version).
//
// Source: Natural Earth 1:50m "Admin 0 - Countries" (public domain).
//   curl -o ne50.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
//   node src/build_neighbour_land.mjs ne50.geojson data/neighbour_land.json
//
// Output: GeoJSON FeatureCollection, one feature per country, coordinates rounded to
// 0.01 degree (~1 km, invisible at this map's scale).
import fs from "node:fs";

export const WORLD = { west: 90, south: 0, east: 122, north: 32 }; // lon/lat rectangle the map may show
const TOLERANCE = 0.02; // degrees, Douglas-Peucker

// Sutherland-Hodgman clip of one ring against the axis-aligned WORLD rectangle.
function clipRing(ring) {
  const edges = [
    { inside: (p) => p[0] >= WORLD.west, cut: (a, b) => cutX(a, b, WORLD.west) },
    { inside: (p) => p[0] <= WORLD.east, cut: (a, b) => cutX(a, b, WORLD.east) },
    { inside: (p) => p[1] >= WORLD.south, cut: (a, b) => cutY(a, b, WORLD.south) },
    { inside: (p) => p[1] <= WORLD.north, cut: (a, b) => cutY(a, b, WORLD.north) },
  ];
  let out = ring.slice(0, -1);
  for (const { inside, cut } of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i], prev = input[(i + input.length - 1) % input.length];
      if (inside(cur)) { if (!inside(prev)) out.push(cut(prev, cur)); out.push(cur); }
      else if (inside(prev)) out.push(cut(prev, cur));
    }
    if (!out.length) return null;
  }
  return [...out, out[0]];
}
const cutX = (a, b, x) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
const cutY = (a, b, y) => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y];

function simplify(points, tol) {
  if (points.length < 3) return points;
  const sqDist = (p, a, b) => {
    let [x, y] = a; let dx = b[0] - x, dy = b[1] - y;
    if (dx || dy) { const t = Math.max(0, Math.min(1, ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy))); x += dx * t; y += dy * t; }
    dx = p[0] - x; dy = p[1] - y; return dx * dx + dy * dy;
  };
  const keep = new Uint8Array(points.length); keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop(); let max = 0, idx = -1;
    for (let i = first + 1; i < last; i++) { const d = sqDist(points[i], points[first], points[last]); if (d > max) { max = d; idx = i; } }
    if (max > tol * tol) { keep[idx] = 1; stack.push([first, idx], [idx, last]); }
  }
  return points.filter((_, i) => keep[i]);
}

const round = (p) => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100];
const area = (ring) => Math.abs(ring.reduce((s, p, i) => { const q = ring[(i + 1) % ring.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);

if (process.argv[1] && process.argv[1].endsWith("build_neighbour_land.mjs")) {
  const [input, output] = process.argv.slice(2);
  const countries = JSON.parse(fs.readFileSync(input, "utf8")).features;
  const features = [];
  for (const country of countries) {
    if (country.properties.ADM0_A3 === "VNM") continue;
    const polys = country.geometry.type === "Polygon" ? [country.geometry.coordinates] : country.geometry.coordinates;
    const kept = [];
    for (const rings of polys) {
      const outer = clipRing(rings[0]);
      if (!outer) continue;
      const simple = simplify(outer, TOLERANCE).map(round);
      if (simple.length >= 4 && area(simple) > 0.02) kept.push([simple]); // drop specks; holes are ignored (lakes stay land)
    }
    if (kept.length) features.push({ type: "Feature", properties: { name: country.properties.NAME, iso: country.properties.ADM0_A3 }, geometry: { type: "MultiPolygon", coordinates: kept } });
  }
  fs.writeFileSync(output, JSON.stringify({ type: "FeatureCollection", world: WORLD, features }));
  console.log(`${features.length} countries -> ${output} (${(fs.statSync(output).size / 1024).toFixed(0)} KB):`, features.map((f) => f.properties.iso).join(" "));
}
