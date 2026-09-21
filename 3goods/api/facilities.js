import { withCors } from "./_lib/cors.js";
import { readPublicJson } from "./_lib/data.js";

// GET /api/facilities -> array of donation-capable locations (shelters,
// charities, community centers) with name, category, subtype, lat, lon.
// Sourced from OpenStreetMap -- directional, not exhaustive coverage.
export default withCors((req, res) => {
  res.status(200).json(readPublicJson("donation_facilities_osm.json"));
});
