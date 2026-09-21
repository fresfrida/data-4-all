import { withCors } from "./_lib/cors.js";
import { readPublicJson } from "./_lib/data.js";

// GET /api/metro-hubs -> Vietnam's 5 largest cities (name, lat, lon,
// population) -- likely donation-origin points, sized by population.
export default withCors((req, res) => {
  res.status(200).json(readPublicJson("metro_hubs.json"));
});
