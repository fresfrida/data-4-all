/**
 * Quantity + unit. Item listings (a donor describing what they are giving) pick one of UNITS; `unit` is stored as a
 * language-independent code (labels live under `units.*` in the locale files, with a `_one` variant for a quantity of
 * exactly 1); anything else already in the DB is shown as typed.
 *
 * Needs never choose a unit: a need with a quantity is always counted in the one generic NEED_UNIT ("items"), so there is
 * no "which unit means what" question (D-064). A need with *no* quantity is an ongoing, open-ended need (D-063).
 */
export const UNITS = ["kg", "pieces", "boxes", "bags", "sets", "packs", "cans", "books"];
export const NEED_UNIT = "items";

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
  const label = UNITS.includes(unit) || unit === NEED_UNIT ? t(quantity === 1 ? `units.${unit}_one` : `units.${unit}`) : unit;
  return `${quantity} ${label}`;
}

/** "40 items", "1 item", or "" for an ongoing need (no quantity). */
export function formatNeedQuantity(quantity, t) {
  return formatQuantity(quantity, quantity === null || quantity === undefined ? null : NEED_UNIT, t);
}
