import { readFileSync } from "node:fs";

// The API serves the same files the browser bundles as its offline snapshot
// (public/data/), so there is one copy of the data, not two. The path is
// resolved from this module's own location rather than process.cwd(), and
// vercel.json's `functions.includeFiles` ships public/data/** with every
// function so the files exist in Vercel's runtime, not only locally.
export function readPublicJson(fileName) {
  const url = new URL(`../../public/data/${fileName}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}
