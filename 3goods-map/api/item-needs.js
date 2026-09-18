const fs = require("fs");
const path = require("path");
const { withCors } = require("./_lib/cors");

// GET /api/item-needs -> disaster type -> donation category (Food/Household
// Items/Clothes/Books) -> { items, priority, phase }.
module.exports = withCors((req, res) => {
  const filePath = path.join(process.cwd(), "data", "donation_items_by_disaster.json");
  const raw = fs.readFileSync(filePath, "utf8");
  res.status(200).json(JSON.parse(raw));
});
