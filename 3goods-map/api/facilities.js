const fs = require("fs");
const path = require("path");
const { withCors } = require("./_lib/cors");

// GET /api/facilities -> array of donation-capable locations (shelters,
// charities, community centers) with name, category, subtype, lat, lon.
// Sourced from OpenStreetMap -- directional, not exhaustive coverage.
module.exports = withCors((req, res) => {
  const filePath = path.join(process.cwd(), "data", "donation_facilities_osm.json");
  const raw = fs.readFileSync(filePath, "utf8");
  res.status(200).json(JSON.parse(raw));
});
