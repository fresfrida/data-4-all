const fs = require("fs");
const path = require("path");
const { withCors } = require("./_lib/cors");

// vn_map_data.js is a plain <script> file (`window.VN_MAP_DATA = {...}`) so
// the browser app can load it with a <script src> tag, not a JSON file --
// strip that JS wrapper to get the same data back as parsed JSON.
function loadProvinceData() {
  const filePath = path.join(process.cwd(), "data", "vn_map_data.js");
  const raw = fs.readFileSync(filePath, "utf8");
  const jsonText = raw.replace(/^\s*window\.VN_MAP_DATA\s*=\s*/, "").replace(/;\s*$/, "");
  return JSON.parse(jsonText);
}

// GET /api/provinces           -> full GeoJSON FeatureCollection (geometry + scores)
// GET /api/provinces?fields=properties -> just the 63 property objects, no geometry
//   (disaster_score, poverty_rate, priority_score, coverage_gap_score, facility_count, ...)
module.exports = withCors((req, res) => {
  const data = loadProvinceData();
  if (req.query && req.query.fields === "properties") {
    res.status(200).json(data.features.map(f => f.properties));
    return;
  }
  res.status(200).json(data);
});
