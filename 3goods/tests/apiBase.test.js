import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApiUrl, resolveApiBase } from "../src/features/map/api/apiBase.js";

test("unset, empty or blank override means same-origin", () => {
  for (const v of [undefined, null, "", "   "]) assert.equal(resolveApiBase(v), "");
});

test("absolute override is kept, minus whitespace and trailing slashes", () => {
  assert.equal(resolveApiBase("https://example.vercel.app"), "https://example.vercel.app");
  assert.equal(resolveApiBase(" https://example.vercel.app/// "), "https://example.vercel.app");
});

test("same-origin base yields relative /api URLs", () => {
  assert.equal(buildApiUrl("", "/api/provinces"), "/api/provinces");
  assert.equal(buildApiUrl("", "api/meta"), "/api/meta");
});

test("absolute base yields exactly one slash before the path", () => {
  assert.equal(buildApiUrl("https://x.test", "/api/provinces"), "https://x.test/api/provinces");
  assert.equal(buildApiUrl(resolveApiBase("https://x.test/"), "/api/meta"), "https://x.test/api/meta");
});
