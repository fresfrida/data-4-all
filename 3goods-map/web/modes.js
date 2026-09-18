// The three lenses the map can be colored by. Donor persona only offers
// "hazard" and "priority"; the organization persona adds "gap" (coverage
// gap -- see build_map_data.py). Keeping every mode's field name, labels,
// and explanatory copy in one place means adding a 4th lens later is a
// one-file change, not a hunt through both panels and MapView.
export const MODES = {
  hazard: {
    field: "disaster_score",
    button: "Disaster Risk",
    legendLow: "Lower risk",
    legendHigh: "Higher risk",
    topTitle: "Top 10 Highest-Risk Provinces",
    note: "How often disasters have struck each area, and how severe they've been, based on records since 1900.",
  },
  priority: {
    field: "priority_score",
    button: "Where Help Is Needed Most",
    legendLow: "Lower priority",
    legendHigh: "Higher priority",
    topTitle: "Top 10 Areas Needing Help Most",
    note: "Combines disaster risk with poverty levels, so poorer areas show up here even without a severe disaster history. For example, the Central Highlands ranks near the top here mainly because of high poverty, not disasters.",
  },
  gap: {
    field: "coverage_gap_score",
    button: "Coverage Gap",
    legendLow: "Better covered",
    legendHigh: "Least covered",
    topTitle: "Top 10 Coverage Gaps (act here first)",
    note: "Combines priority with how many donation-capable locations (shelters, charities, community centers) already exist nearby. High gap = high need with little existing infrastructure -- the strongest signal for where to open a new drop-off point or route a mobile team.",
  },
};

export const DONOR_MODES = ["hazard", "priority"];
export const ORG_MODES = ["hazard", "priority", "gap"];
