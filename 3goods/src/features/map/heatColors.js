import { fieldRange, normalize } from "./vendor/scoring.js";

/**
 * Wrapper-side recolouring of the vendored MapView's province fills.
 *
 * The vendored `scoreRamp` (vendor/mapView.js — read-only) starts at a warm
 * "stone" grey and paints a province with no data in a blue-tinted slate, so
 * the base of the heatmap never reads as real greyscale. After each MapView
 * render we re-fill the province paths with the same gold → terracotta →
 * maroon ramp, but anchored at a neutral grey, and use a neutral grey for
 * "no data". Rendering logic itself is untouched — see DECISIONS.md D-050.
 */
const NEUTRAL_STOPS = [
  [136, 136, 136], // lowest: true grey (r = g = b)
  [203, 165, 69],  // muted gold
  [193, 101, 92],  // muted terracotta
  [110, 45, 40],   // muted maroon: highest
];
export const NO_DATA_FILL = "rgb(160,160,160)";

export function heatColor(t) {
  const seg = 1 / (NEUTRAL_STOPS.length - 1);
  const i = Math.min(NEUTRAL_STOPS.length - 2, Math.floor(t / seg));
  const lt = (t - i * seg) / seg;
  const [r1, g1, b1] = NEUTRAL_STOPS[i];
  const [r2, g2, b2] = NEUTRAL_STOPS[i + 1];
  return `rgb(${Math.round(r1 + (r2 - r1) * lt)},${Math.round(g1 + (g2 - g1) * lt)},${Math.round(b1 + (b2 - b1) * lt)})`;
}

/** Re-fills every `.province` path inside `container` for the given score field. */
export function applyGreyBaseHeat(container, features, field) {
  const scored = features.filter((f) => f.properties[field] !== null && f.properties[field] !== undefined);
  if (!scored.length) return;
  const range = fieldRange(features, field);
  const valueByProvince = new Map(features.map((f) => [f.properties.province, f.properties[field]]));
  container.querySelectorAll(".province").forEach((el) => {
    const v = valueByProvince.get(el.dataset.province);
    el.setAttribute("fill", v === null || v === undefined ? NO_DATA_FILL : heatColor(Math.min(1, Math.max(0, normalize(v, range)))));
  });
}
