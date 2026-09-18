// Pure functions: no DOM, no fetch, no state. Anything that turns a raw
// number into a word or a CSS class lives here, so both the donor and
// organization panels translate the same score the same way.

export function normalize(v, [lo, hi]) {
  return hi === lo ? 0.5 : (v - lo) / (hi - lo);
}

export function fieldRange(features, field) {
  const vals = features.map(f => f.properties[field]).filter(v => v !== null && v !== undefined);
  return [Math.min(...vals), Math.max(...vals)];
}

// Turns a 0..1 normalized value into a word a non-technical donor can act
// on instead of a meaningless decimal like "0.507".
export function levelFromNormalized(t) {
  if (t >= 0.75) return "Very High";
  if (t >= 0.5) return "High";
  if (t >= 0.25) return "Moderate";
  return "Low";
}

// Poverty uses fixed % bands instead of min-max normalization, since a
// percentage is already meaningful on its own (unlike disaster_score).
export function levelFromPovertyPct(pct) {
  if (pct >= 20) return "Very High";
  if (pct >= 10) return "High";
  if (pct >= 5) return "Moderate";
  return "Low";
}

export function levelClass(label) {
  return { "Low": "level-low", "Moderate": "level-mod", "High": "level-high", "Very High": "level-vhigh" }[label] || "level-none";
}

export function humanize(s) {
  return (s || "").replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
}
