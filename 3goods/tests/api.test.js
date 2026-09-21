import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import provinces from "../api/provinces.js";
import facilities from "../api/facilities.js";
import metroHubs from "../api/metro-hubs.js";
import itemNeeds from "../api/item-needs.js";
import meta from "../api/meta.js";
import { withCors } from "../api/_lib/cors.js";

const publicJson = (name) => JSON.parse(readFileSync(new URL(`../public/data/${name}`, import.meta.url), "utf8"));

// Minimal stand-in for Vercel's Node request/response helpers.
async function call(handler, { method = "GET", query = {} } = {}) {
  const res = { statusCode: null, headers: {}, body: undefined, ended: false };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  res.end = () => { res.ended = true; return res; };
  await handler({ method, query }, res);
  return res;
}

const ENDPOINTS = {
  provinces: { handler: provinces, file: "vn_provinces.geojson" },
  facilities: { handler: facilities, file: "donation_facilities_osm.json" },
  "metro-hubs": { handler: metroHubs, file: "metro_hubs.json" },
  "item-needs": { handler: itemNeeds, file: "donation_items_by_disaster.json" },
};

for (const [name, { handler, file }] of Object.entries(ENDPOINTS)) {
  test(`/api/${name}: 200, CORS *, cached, body equals the bundled data`, async () => {
    const res = await call(handler);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["access-control-allow-origin"], "*");
    assert.equal(res.headers["access-control-allow-methods"], "GET, OPTIONS");
    assert.match(res.headers["cache-control"], /^public, max-age=3600/);
    assert.deepEqual(res.body, publicJson(file));
  });

  test(`/api/${name}: OPTIONS preflight is 204 with CORS headers and no body`, async () => {
    const res = await call(handler, { method: "OPTIONS" });
    assert.equal(res.statusCode, 204);
    assert.equal(res.ended, true);
    assert.equal(res.body, undefined);
    assert.equal(res.headers["access-control-allow-origin"], "*");
    assert.equal(res.headers["access-control-allow-headers"], "Content-Type");
  });
}

test("/api/provinces: FeatureCollection of 63 scored provinces", async () => {
  const { body } = await call(provinces);
  assert.equal(body.type, "FeatureCollection");
  assert.equal(body.features.length, 63);
  for (const key of ["province", "disaster_score", "poverty_rate", "priority_score", "coverage_gap_score", "facility_count"]) {
    assert.ok(key in body.features[0].properties, `missing property ${key}`);
  }
});

test("/api/provinces?fields=properties: only the 63 property objects, no geometry", async () => {
  const { statusCode, body } = await call(provinces, { query: { fields: "properties" } });
  assert.equal(statusCode, 200);
  assert.equal(body.length, 63);
  assert.equal(body[0].geometry, undefined);
  assert.deepEqual(body, publicJson("vn_provinces.geojson").features.map((f) => f.properties));
});

test("/api/provinces: any other ?fields value returns the full collection", async () => {
  const { body } = await call(provinces, { query: { fields: "nope" } });
  assert.equal(body.type, "FeatureCollection");
});

test("/api/metro-hubs: 5 hubs with name, lat, lon, population", async () => {
  const { body } = await call(metroHubs);
  assert.equal(body.length, 5);
  for (const hub of body) for (const key of ["name", "lat", "lon", "population"]) assert.ok(key in hub);
});

test("/api/facilities: array of { name, category, subtype, lat, lon }", async () => {
  const { body } = await call(facilities);
  assert.ok(Array.isArray(body) && body.length > 0);
  for (const key of ["name", "category", "subtype", "lat", "lon"]) assert.ok(key in body[0]);
});

test("/api/item-needs: categories + by_disaster_type", async () => {
  const { body } = await call(itemNeeds);
  assert.ok(Array.isArray(body.categories));
  assert.equal(typeof body.by_disaster_type, "object");
});

test("/api/meta: self-describing index that names the four data endpoints", async () => {
  const res = await call(meta);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.name, "Vietnam Disaster Relief Map API");
  for (const e of ["GET /api/provinces", "GET /api/facilities", "GET /api/metro-hubs", "GET /api/item-needs"]) {
    assert.ok(e in res.body.endpoints, `meta.endpoints missing ${e}`);
  }
  assert.ok(res.body.scores && res.body.sources && Array.isArray(res.body.caveats));
});

test("withCors: a throwing handler becomes 500 { error: internal_error, message }", async () => {
  const res = await call(withCors(() => { throw new Error("boom"); }));
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "internal_error", message: "boom" });
  assert.equal(res.headers["access-control-allow-origin"], "*");
});
