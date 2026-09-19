/**
 * Quantity + unit for needs and items. `unit` is stored as one of these
 * language-independent codes (labels live under `units.*` in the locale
 * files, with a `_one` variant for a quantity of exactly 1); anything else
 * already in the DB is shown as typed.
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

/**
 * One label for a group of needs (e.g. all of an organisation's Rice needs):
 * the summed quantity when every quantified need shares a unit, otherwise
 * nothing rather than adding kg to boxes.
 */
export function summariseNeedQuantities(needs, t) {
  const quantified = needs.filter((need) => need.quantity !== null && need.quantity !== undefined);
  if (quantified.length === 0) return "";
  const units = new Set(quantified.map((need) => need.unit ?? ""));
  if (units.size !== 1) return "";
  const total = quantified.reduce((sum, need) => sum + need.quantity, 0);
  return formatQuantity(total, quantified[0].unit, t);
}
