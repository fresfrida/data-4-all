const { withCors } = require("./_lib/cors");

// GET /api/meta -> self-describing index of this API, meant to be handed
// to a tool (or pasted into a Lovable/AI-builder prompt) so it can
// understand the shape of the other endpoints without reading this repo.
module.exports = withCors((req, res) => {
  res.status(200).json({
    name: "Vietnam Disaster Relief Map API",
    version: "1.0.0",
    description:
      "Read-only data service behind the Vietnam Disaster Relief Map. Serves per-province disaster-risk/poverty/coverage scores, donation-capable facility locations, big-city donor hubs, and what-to-donate guidance by disaster type.",
    endpoints: {
      "GET /api/provinces": "GeoJSON FeatureCollection, 63 provinces. Each feature's properties include: province, disaster_score, poverty_rate, poverty_region, poverty_data_level ('region'|'province'), priority_score, coverage_gap_score, facility_count, disaster_types, event_count, events_since_2000, last_event_year, total_deaths, total_damage_000usd, year_counts (JSON string of {year: count}). Add ?fields=properties for just this array, no geometry.",
      "GET /api/facilities": "Array of { name, category, subtype, lat, lon } donation-capable locations (shelters, charities, community centers).",
      "GET /api/metro-hubs": "Array of { name, lat, lon, population } for Vietnam's 5 largest cities -- likely donation-origin points.",
      "GET /api/item-needs": "{ categories: string[], by_disaster_type: { [disasterType]: { [category]: { items: string[], priority, phase } } } }.",
    },
    scores: {
      disaster_score: "0-1, min-max normalized blend of event frequency, deaths, and property damage since 1900.",
      priority_score: "0-1, = 0.5 * disaster_score + 0.5 * normalized poverty_rate. Higher = greater relief priority.",
      coverage_gap_score: "0-1, = priority_score * (1 - normalized facility_count). Higher = high priority AND few donation-capable facilities nearby.",
    },
    sources: "EM-DAT disaster records (1900-2024), OpenStreetMap contributors (ODbL), UNDP/MOLISA poverty estimates, GADM v4.1 administrative boundaries.",
    caveats: [
      "poverty_rate is a regional estimate applied uniformly to every province in that region wherever poverty_data_level is 'region' -- it is not province-specific until real province-level data is substituted.",
      "Facility coverage is sourced from OpenStreetMap and is directional, not exhaustive.",
    ],
  });
});
