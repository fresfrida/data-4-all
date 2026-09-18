const fs = require("fs");
const path = require("path");
const { withCors } = require("./_lib/cors");

// GET /api/metro-hubs -> Vietnam's 5 largest cities (name, lat, lon,
// population) -- likely donation-origin points, sized by population.
module.exports = withCors((req, res) => {
  const filePath = path.join(process.cwd(), "data", "metro_hubs.json");
  const raw = fs.readFileSync(filePath, "utf8");
  res.status(200).json(JSON.parse(raw));
});
