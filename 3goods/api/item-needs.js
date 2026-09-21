import { withCors } from "./_lib/cors.js";
import { readPublicJson } from "./_lib/data.js";

// GET /api/item-needs -> disaster type -> donation category (Food/Household
// Items/Clothes/Books) -> { items, priority, phase }.
export default withCors((req, res) => {
  res.status(200).json(readPublicJson("donation_items_by_disaster.json"));
});
