import { ORG_MODES, MODES } from "../modes.js";
import { fieldRange, normalize, levelFromNormalized, levelFromPovertyPct, levelClass } from "../scoring.js";

const TABLE_COLUMNS = [
  { key: "province", label: "Province", numeric: false },
  { key: "disaster_score", label: "Risk", numeric: true },
  { key: "poverty_rate", label: "Poverty %", numeric: true },
  { key: "priority_score", label: "Priority", numeric: true },
  { key: "facility_count", label: "Facilities", numeric: true },
  { key: "coverage_gap_score", label: "Coverage Gap", numeric: true },
];

// The operational counterpart to DonorPanel: raw numbers instead of just
// "High"/"Low" (a coordinator planning logistics needs precision), a
// sortable comparison table across all provinces, and a CSV export. Shares
// the same MapView and the same underlying data as the donor persona --
// it's a different lens on identical numbers, not a separate system.
export class OrgPanel {
  constructor({ features, mapView, onModeChange, onProvinceSelect }) {
    this.features = features;
    this.mapView = mapView;
    this.onModeChange = onModeChange;
    this.onProvinceSelect = onProvinceSelect;
    this.byName = Object.fromEntries(features.map(f => [f.properties.province, f.properties]));
    this.sortKey = "coverage_gap_score";
    this.sortDir = -1;
  }

  mount(container) {
    this.container = container;
    container.innerHTML = `
      <div id="modeToggle">
        ${ORG_MODES.map((m, i) => `<button class="mode-btn${i === 0 ? " active" : ""}" data-mode="${m}">${MODES[m].button}</button>`).join("")}
      </div>
      <div id="modeNote" class="placeholder"></div>
      <div id="detail"><div class="placeholder">Click any province on the map, or a row below, to see its full numbers.</div></div>
      <div id="legend">
        <div class="ramp-wrap"><div id="scoreMarker" hidden></div><div class="ramp"></div></div>
        <div class="labels"><span id="legendLowLabel"></span><span id="legendHighLabel"></span></div>
      </div>
      <div id="orgTableSection">
        <div class="org-table-head">
          <b>Compare all 63 provinces</b>
          <button id="exportCsv" class="export-btn">Export CSV</button>
        </div>
        <div class="table-scroll"><table id="orgTable"><thead></thead><tbody></tbody></table></div>
      </div>
      <div id="footerNote">Sources: EM-DAT disaster records (1900&ndash;2024), OpenStreetMap contributors (ODbL), UNDP/MOLISA poverty estimates, GADM boundaries. Coverage counts include both specialized orgs and community centers/ward offices found on OpenStreetMap -- treat as directional, not exhaustive.</div>
    `;

    container.querySelectorAll(".mode-btn").forEach(btn => {
      btn.addEventListener("click", () => this.onModeChange(btn.dataset.mode));
    });
    container.querySelector("#exportCsv").addEventListener("click", () => this._exportCsv());
    this.marker = container.querySelector("#scoreMarker");
    this._renderTableHead();
  }

  update(state) {
    const cfg = MODES[state.mode];
    this.container.querySelector("#legendLowLabel").textContent = cfg.legendLow;
    this.container.querySelector("#legendHighLabel").textContent = cfg.legendHigh;
    this.container.querySelector("#modeNote").textContent = cfg.note;
    this.container.querySelectorAll(".mode-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === state.mode));
    this._renderDetail(state.selectedProvince, state.mode);
    this._renderTableBody(state.mode);
  }

  _renderDetail(name, mode) {
    const detail = this.container.querySelector("#detail");
    const p = name && this.byName[name];
    if (!p) {
      detail.innerHTML = `<div class="placeholder">Click any province on the map, or a row below, to see its full numbers.</div>`;
      this.marker.hidden = true;
      return;
    }
    detail.innerHTML = `
      <h2>${p.province}</h2>
      <div class="row"><span>Disaster risk score</span><b>${p.disaster_score !== null ? p.disaster_score.toFixed(3) : "—"}</b></div>
      <div class="row"><span>Poverty rate</span><b>${p.poverty_rate !== null ? p.poverty_rate + "%" : "—"}${p.poverty_data_level === "region" ? '<span class="badge">Estimated</span>' : ""}</b></div>
      <div class="row"><span>Priority score</span><b>${p.priority_score !== null ? p.priority_score.toFixed(3) : "—"}</b></div>
      <div class="row"><span>Facilities in province</span><b>${p.facility_count ?? "—"}</b></div>
      <div class="row"><span>Coverage gap score</span><b>${p.coverage_gap_score !== null && p.coverage_gap_score !== undefined ? p.coverage_gap_score.toFixed(3) : "—"}</b></div>
      <div class="row"><span>Region</span><b>${p.poverty_region ?? "—"}</b></div>
      ${p.disaster_types ? `<div class="row" style="display:block;"><span>Disaster types: </span><b style="font-weight:500;">${p.disaster_types}</b></div>` : ""}
    `;
    const field = MODES[mode].field;
    const v = p[field];
    if (v === null || v === undefined) {
      this.marker.hidden = true;
    } else {
      const range = fieldRange(this.features, field);
      this.marker.style.left = `${normalize(v, range) * 100}%`;
      this.marker.hidden = false;
    }
  }

  _renderTableHead() {
    const thead = this.container.querySelector("#orgTable thead");
    thead.innerHTML = `<tr>${TABLE_COLUMNS.map(c =>
      `<th data-key="${c.key}" class="${this.sortKey === c.key ? "sorted" : ""}">${c.label}${this.sortKey === c.key ? (this.sortDir === -1 ? " ↓" : " ↑") : ""}</th>`
    ).join("")}</tr>`;
    thead.querySelectorAll("th").forEach(th => {
      th.addEventListener("click", () => {
        const key = th.dataset.key;
        if (this.sortKey === key) this.sortDir *= -1;
        else { this.sortKey = key; this.sortDir = -1; }
        this._renderTableHead();
        this._renderTableBody(this._lastMode);
      });
    });
  }

  _sortedRows() {
    const rows = this.features.map(f => f.properties);
    const key = this.sortKey;
    return rows.slice().sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string") return this.sortDir * av.localeCompare(bv);
      return this.sortDir * (av - bv);
    });
  }

  _renderTableBody(mode) {
    this._lastMode = mode;
    const rows = this._sortedRows();
    const tbody = this.container.querySelector("#orgTable tbody");
    tbody.innerHTML = rows.map(p => `
      <tr data-province="${p.province}">
        <td>${p.province}</td>
        <td>${this._fmtBadge(p.disaster_score, "hazard")}</td>
        <td>${p.poverty_rate !== null ? p.poverty_rate + "%" : "—"}</td>
        <td>${this._fmtBadge(p.priority_score, "priority")}</td>
        <td>${p.facility_count ?? "—"}</td>
        <td>${p.coverage_gap_score !== null && p.coverage_gap_score !== undefined ? p.coverage_gap_score.toFixed(3) : "—"}</td>
      </tr>
    `).join("");
    tbody.querySelectorAll("tr").forEach(tr => {
      tr.addEventListener("click", () => this.onProvinceSelect(tr.dataset.province, { focus: true }));
    });
  }

  _fmtBadge(v, modeKey) {
    if (v === null || v === undefined) return "—";
    const range = fieldRange(this.features, MODES[modeKey].field);
    const lvl = levelFromNormalized(normalize(v, range));
    return `<span class="level-badge ${levelClass(lvl)}" style="font-size:9px;padding:1px 6px;">${v.toFixed(2)}</span>`;
  }

  _exportCsv() {
    const cols = ["province", "disaster_score", "poverty_rate", "priority_score", "facility_count", "coverage_gap_score", "poverty_region", "disaster_types"];
    const rows = this._sortedRows();
    const csv = [cols.join(",")].concat(
      rows.map(p => cols.map(c => {
        const v = p[c] ?? "";
        return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
      }).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vietnam_disaster_relief_provinces.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
}
