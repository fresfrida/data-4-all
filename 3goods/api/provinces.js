import { withCors } from "./_lib/cors.js";
import { readPublicJson } from "./_lib/data.js";

// GET /api/provinces           -> full GeoJSON FeatureCollection (geometry + scores)
// GET /api/provinces?fields=properties -> just the 63 property objects, no geometry
//   (disaster_score, poverty_rate, priority_score, coverage_gap_score, facility_count, ...)
export default withCors((req, res) => {
  const data = readPublicJson("vn_provinces.geojson");
  if (req.query && req.query.fields === "properties") {
    res.status(200).json(data.features.map((f) => f.properties));
    return;
  }
  res.status(200).json(data);
});
