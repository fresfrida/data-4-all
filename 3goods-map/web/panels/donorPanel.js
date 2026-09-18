import { DONOR_MODES, MODES } from "../modes.js";
import { fieldRange, normalize, levelFromNormalized, levelFromPovertyPct, levelClass } from "../scoring.js";

// Everything a member of the public sees: plain-language risk/poverty/
// priority badges, what to donate, a Top 10 list. Knows nothing about the
// organization panel or the coverage-gap mode -- adding a persona never
// means editing this file.
export class DonorPanel {
  constructor({ features, itemNeeds, mapView, onModeChange, onProvinceSelect }) {
    this.features = features;
    this.itemNeeds = itemNeeds;
    this.mapView = mapView;
    this.onModeChange = onModeChange;
    this.onProvinceSelect = onProvinceSelect;
    this.byName = Object.fromEntries(features.map(f => [f.properties.province, f.properties]));
  }

  mount(container) {
    this.container = container;
    container.innerHTML = `
      <div id="modeToggle">
        ${DONOR_MODES.map((m, i) => `<button class="mode-btn${i === 0 ? " active" : ""}" data-mode="${m}">${MODES[m].button}</button>`).join("")}
      </div>
      <div id="modeNote" class="placeholder"></div>
      <div id="detail"><div class="placeholder">Click any province on the map to see its risk level and what to donate.</div></div>
      <div id="legend">
        <div class="ramp-wrap"><div id="scoreMarker" hidden></div><div class="ramp"></div></div>
        <div class="labels"><span id="legendLowLabel"></span><span id="legendHighLabel"></span></div>
      </div>
      <div id="metroLegend"><span class="dot"></span>Big city (likely where donations come from) &mdash; bigger dot = more people</div>
      <div id="facilityLegend">
        <input type="checkbox" id="facilityToggle" checked>
        <label for="facilityToggle"><span class="dot"></span> Places that can receive donations &mdash; shelters, nursing homes, charities</label>
      </div>
      <div id="top"><b id="topTitle"></b><ol id="topList"></ol></div>
      <div id="footerNote">Sources: EM-DAT disaster records (1900&ndash;2024), OpenStreetMap contributors (ODbL), UNDP/MOLISA poverty estimates, GADM boundaries.</div>
    `;

    container.querySelectorAll(".mode-btn").forEach(btn => {
      btn.addEventListener("click", () => this.onModeChange(btn.dataset.mode));
    });
    container.querySelector("#facilityToggle").addEventListener("change", (e) => {
      this.mapView.setShowFacilities(e.target.checked);
    });
    this.marker = container.querySelector("#scoreMarker");
  }

  update(state) {
    this._renderModeChrome(state.mode);
    this._renderDetail(state.selectedProvince, state.mode);
    this._renderTop(state.mode);
    this.container.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === state.mode));
  }

  _renderModeChrome(mode) {
    const cfg = MODES[mode];
    this.container.querySelector("#legendLowLabel").textContent = cfg.legendLow;
    this.container.querySelector("#legendHighLabel").textContent = cfg.legendHigh;
    this.container.querySelector("#modeNote").textContent = cfg.note;
    this.container.querySelector("#topTitle").textContent = cfg.topTitle;
  }

  _renderDetail(name, mode) {
    const detail = this.container.querySelector("#detail");
    if (!name) {
      detail.innerHTML = `<div class="placeholder">Click any province on the map to see its risk level and what to donate.</div>`;
      this.marker.hidden = true;
      return;
    }
    const p = this.byName[name];
    if (!p) {
      detail.innerHTML = `<h2>${name}</h2><div class="placeholder">No data for this province.</div>`;
      this.marker.hidden = true;
      return;
    }

    const hazardRange = fieldRange(this.features, "disaster_score");
    const priorityRange = fieldRange(this.features, "priority_score");
    const hasDisasterData = p.disaster_score !== null;
    const riskLevel = hasDisasterData ? levelFromNormalized(normalize(p.disaster_score, hazardRange)) : null;
    const priorityLevel = p.priority_score !== null ? levelFromNormalized(normalize(p.priority_score, priorityRange)) : null;
    const povertyLevel = p.poverty_rate !== null ? levelFromPovertyPct(p.poverty_rate) : null;

    const summaryHtml = `
      <div class="row"><span>Disaster risk</span>
        ${hasDisasterData ? `<span class="level-badge ${levelClass(riskLevel)}">${riskLevel}</span>` : `<span class="level-badge level-none">No major disasters recorded</span>`}
      </div>
      ${povertyLevel ? `<div class="row"><span>Poverty level</span><span class="level-badge ${levelClass(povertyLevel)}">${povertyLevel}${p.poverty_data_level === "region" ? '<span class="badge" title="No province-level poverty data exists yet -- this is the whole region\'s estimate, applied to every province in it, as a stand-in.">Estimated</span>' : ""}</span></div>` : ""}
      ${priorityLevel ? `<div class="row"><span>Priority for help</span><span class="level-badge ${levelClass(priorityLevel)}">${priorityLevel}</span></div>` : ""}
    `;

    const dtypes = (p.disaster_types || "").split("; ").filter(Boolean);
    const itemsHtml = (!this.itemNeeds || !dtypes.length) ? "" : `<div id="items"><div class="label">What to donate here</div>
      ${dtypes.map(t => {
        const byCategory = this.itemNeeds.by_disaster_type[t];
        if (!byCategory) return "";
        const categoryBlocks = this.itemNeeds.categories.map(cat => {
          const spec = byCategory[cat];
          if (!spec || !spec.items.length) return "";
          return `<div style="margin:4px 0 8px;">
            <span class="phase-label" style="margin:0;"><b style="color:#e2e8f0;">${cat}</b>
              <span class="priority-${spec.priority}">${spec.priority}</span> &middot; ${spec.phase === "immediate" ? "Right away" : "Within a few weeks"}</span>
            <div class="chips" style="margin-top:3px;">${spec.items.map(i => `<span class="item-chip">${i}</span>`).join("")}</div>
          </div>`;
        }).join("");
        return `<div class="dtype"><div class="dtype-name">For ${t.toLowerCase()}s</div>${categoryBlocks}</div>`;
      }).join("")}
    </div>`;

    const yearsHtml = hasDisasterData && Object.keys(p.year_counts || {}).length
      ? (() => {
          const years = Object.entries(p.year_counts).sort((a, b) => a[0] - b[0]);
          return `<div id="years"><div class="label">Years disasters have struck (${years.length} years)</div>
            <div class="chips">${years.map(([y, c]) => `<span class="year-chip">${y}${c > 1 ? ` &times;${c}` : ""}</span>`).join("")}</div></div>`;
        })()
      : "";

    const moreHtml = `
      <details class="more">
        <summary>More details</summary>
        ${hasDisasterData ? `
          <div class="row"><span>Disasters recorded</span><b>${p.event_count}</b></div>
          <div class="row"><span>Since 2000</span><b>${p.events_since_2000}</b></div>
          <div class="row"><span>Most recent</span><b>${p.last_event_year ?? "-"}</b></div>
          <div class="row"><span>Lives lost (recorded)</span><b>${p.total_deaths.toLocaleString()}</b></div>
          <div class="row"><span>Estimated damage</span><b>$${Math.round(p.total_damage_000usd / 1000).toLocaleString()}M</b></div>
          <div class="row" style="display:block;"><span>Type of disasters: </span><b style="font-weight:500;">${p.disaster_types}</b></div>
        ` : ""}
        ${yearsHtml}
        ${p.poverty_rate !== null ? `
          <div class="row"><span>Region</span><b>${p.poverty_region}</b></div>
          <div class="row"><span>Poverty rate</span><b>${p.poverty_rate}%</b></div>
          ${p.poverty_data_level === "region" ? '<div class="placeholder">Estimated from the whole region — the same figure is applied to every province in it, since no province-specific data exists yet.</div>' : ""}
        ` : ""}
      </details>
    `;

    detail.innerHTML = `<h2>${p.province}</h2>${summaryHtml}${itemsHtml}${moreHtml}`;

    const field = MODES[mode].field;
    const v = p[field];
    const range = fieldRange(this.features, field);
    if (v === null || v === undefined) {
      this.marker.hidden = true;
    } else {
      this.marker.style.left = `${normalize(v, range) * 100}%`;
      this.marker.hidden = false;
    }
  }

  _renderTop(mode) {
    const field = MODES[mode].field;
    const range = fieldRange(this.features, field);
    const top10 = this.features
      .map(f => f.properties)
      .filter(p => p[field] !== null && p[field] !== undefined)
      .sort((a, b) => b[field] - a[field])
      .slice(0, 10);
    const list = this.container.querySelector("#topList");
    list.innerHTML = top10.map(p => {
      const lvl = levelFromNormalized(normalize(p[field], range));
      return `<li data-province="${p.province}" title="Click to find it on the map"><b>${p.province}</b> <span class="level-badge ${levelClass(lvl)}">${lvl}</span></li>`;
    }).join("");
    list.querySelectorAll("li").forEach(el => {
      el.addEventListener("click", () => this.onProvinceSelect(el.dataset.province, { focus: true }));
    });
  }
}
