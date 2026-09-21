/**
 * Quantity + unit for item listings (a donor describing what they are giving): they pick one of UNITS; `unit` is stored as a
 * language-independent code (labels live under `units.*` in the locale files, with a `_one` variant for a quantity of
 * exactly 1); anything else already in the DB is shown as typed. Needs have no quantity any more (D-075).
 */
export const UNITS = ["kg", "pieces", "boxes", "bags", "sets", "packs", "cans", "books"];

/** Parses a form field into a positive whole number, or null when blank. Throws nothing; callers validate with isValidQuantity. */
export function parseQuantity(raw) {
  if (raw === "" || raw === null || raw === undefined) return null;
  return Number(raw);
}

export function isValidQuantity(quantity) {
  return quantity === null || (Number.isInteger(quantity) && quantity >= 1);
}

/** "10 kg", "1 box", "3 boxes", or "5" when there's no unit. Empty string when there's no quantity. */
export function formatQuantity(quantity, unit, t) {
  if (quantity === null || quantity === undefined) return "";
  if (!unit) return String(quantity);
  const label = UNITS.includes(unit) ? t(quantity === 1 ? `units.${unit}_one` : `units.${unit}`) : unit;
  return `${quantity} ${label}`;
}
