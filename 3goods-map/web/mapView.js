import { buildShapes, projectToPixel, minmaxSqrt } from "./geo.js";
import { fieldRange, normalize } from "./scoring.js";

const PIN_PATH = "M12 2C7.58 2 4 5.58 4 10c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z";
const PIN_SCALE = 0.55;

function scoreRamp(t) {
  const stops = [
    [120, 113, 108], // low: stone
    [203, 165, 69],  // muted gold
    [193, 101, 92],  // muted terracotta
    [110, 45, 40],   // muted maroon: highest
  ];
  const seg = 1 / (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(t / seg));
  const lt = (t - i * seg) / seg;
  const [r1, g1, b1] = stops[i], [r2, g2, b2] = stops[i + 1];
  return `rgb(${Math.round(r1 + (r2 - r1) * lt)},${Math.round(g1 + (g2 - g1) * lt)},${Math.round(b1 + (b2 - b1) * lt)})`;
}

// Renders the province choropleth, metro-hub target markers, and facility
// pins into a container; owns pan/zoom. Doesn't know about personas, modes'
// labels, or panel content -- callers just tell it which property to color
// by (setField) and listen for clicks (onSelect). That's what lets the
// exact same MapView serve both the donor and organization panels.
export class MapView {
  constructor(container, { features, metroHubs, facilities }) {
    this.container = container;
    this.features = features;
    this.metroHubs = metroHubs;
    this.facilities = facilities;
    this.field = "disaster_score";
    this.selectedProvince = null;
    this.showFacilities = true;
    this.onSelect = null; // (provinceName) => void

    this.extent = buildShapes(features, 520);
    this.bboxByName = Object.fromEntries(this.extent.shapes.map(sh => [sh.p.province, sh.bbox]));
    this.metroRadius = minmaxSqrt(metroHubs.map(h => h.population), 4, 11);

    this.viewBox = { x: 0, y: 0, w: this.extent.width, h: this.extent.height };
    this.fullView = { ...this.viewBox };

    this.svgRoot = document.createElement("div");
    this.svgRoot.id = "svgRoot";
    this.facilityTip = document.createElement("div");
    this.facilityTip.id = "facilityTip";
    this.facilityTip.hidden = true;
    this.container.append(this.svgRoot, this.facilityTip);

    this._wirePanZoom();
  }

  setField(field) { this.field = field; this.render(); }
  setShowFacilities(v) { this.showFacilities = v; this.render(); }

  setSelected(name) {
    this.selectedProvince = name;
    this.container.querySelectorAll(".province").forEach(el => {
      el.classList.toggle("selected", el.dataset.province === name);
    });
  }

  focusOnProvince(name) {
    const bbox = this.bboxByName[name];
    if (!bbox) return;
    const bw = Math.max(bbox.x1 - bbox.x0, 8), bh = Math.max(bbox.y1 - bbox.y0, 8);
    const padFactor = 0.7;
    const w = bw * (1 + padFactor), h = bh * (1 + padFactor);
    const cx = (bbox.x0 + bbox.x1) / 2, cy = (bbox.y0 + bbox.y1) / 2;
    this._setViewBox({ x: cx - w / 2, y: cy - h / 2, w, h });
  }

  resetView() { this._setViewBox({ ...this.fullView }); }

  render() {
    const range = fieldRange(this.features, this.field);
    const [lo, hi] = range;

    const defs = `<defs>
      <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e9f5fb"/>
        <stop offset="55%" stop-color="#cbe7f6"/>
        <stop offset="100%" stop-color="#a4d2ea"/>
      </linearGradient>
      <filter id="landShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" flood-color="#0a1a2c" flood-opacity="0.3"/>
      </filter>
      <filter id="pinShadow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#0a0e1a" flood-opacity="0.5"/>
      </filter>
    </defs>`;

    const ocean = `<rect x="0" y="0" width="${this.extent.width}" height="${this.extent.height}" fill="url(#oceanGrad)"/>`;

    const provinces = this.extent.shapes.map(sh => {
      const v = sh.p[this.field];
      const fill = v === null || v === undefined ? "#94a3b8" : scoreRamp(hi === lo ? 0 : normalize(v, range));
      const selected = sh.p.province === this.selectedProvince ? " selected" : "";
      return `<path class="province${selected}" d="${sh.d}" fill="${fill}" data-province="${sh.p.province}"/>`;
    }).join("");

    const metro = this.metroHubs.map((h, i) => {
      const { x: cx, y: cy } = projectToPixel(h.lon, h.lat, this.extent);
      const r = this.metroRadius[i];
      const title = `<title>${h.name} — big city, likely where donations come from</title>`;
      return `<circle class="metro-hub-pulse" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"/>` +
             `<circle class="metro-hub-ring-dark" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 2.1).toFixed(1)}">${title}</circle>` +
             `<circle class="metro-hub-ring" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 1.7).toFixed(1)}">${title}</circle>` +
             `<circle class="metro-hub" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}">${title}</circle>`;
    }).join("");

    const pins = (!this.showFacilities || !this.facilities.length) ? "" : this.facilities.map(f => {
      const { x: cx, y: cy } = projectToPixel(f.lon, f.lat, this.extent);
      const px = cx - 12 * PIN_SCALE, py = cy - 24 * PIN_SCALE;
      return `<g class="facility-pin-group" filter="url(#pinShadow)" transform="translate(${px.toFixed(1)},${py.toFixed(1)}) scale(${PIN_SCALE})"
                data-name="${f.name}" data-category="${f.category}" data-subtype="${f.subtype}">
        <path class="facility-pin" d="${PIN_PATH}"/>
        <circle class="facility-pin-dot" cx="12" cy="10" r="3.2"/>
      </g>`;
    }).join("");

    this.svgRoot.innerHTML =
      `<svg viewBox="0 0 ${this.extent.width} ${this.extent.height}">${defs}${ocean}<g filter="url(#landShadow)">${provinces}</g>${metro}${pins}</svg>`;

    this.svgRoot.querySelectorAll(".province").forEach(el => {
      el.addEventListener("click", () => { if (!this._dragMoved) this.onSelect?.(el.dataset.province); });
    });
    this.svgRoot.querySelectorAll(".facility-pin-group").forEach(el => {
      el.addEventListener("mouseenter", (e) => {
        const { name, category, subtype } = e.currentTarget.dataset;
        this.facilityTip.innerHTML = `<b>${name}</b><br>${subtype ? this._humanize(subtype) : this._humanize(category)}`;
        this.facilityTip.hidden = false;
      });
      el.addEventListener("mousemove", (e) => {
        const rect = this.container.getBoundingClientRect();
        this.facilityTip.style.left = `${e.clientX - rect.left + 12}px`;
        this.facilityTip.style.top = `${e.clientY - rect.top + 12}px`;
      });
      el.addEventListener("mouseleave", () => { this.facilityTip.hidden = true; });
    });

    this._applyViewBox();
  }

  _humanize(s) { return (s || "").replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()); }

  _applyViewBox() {
    const svg = this.svgRoot.querySelector("svg");
    if (svg) svg.setAttribute("viewBox", `${this.viewBox.x.toFixed(2)} ${this.viewBox.y.toFixed(2)} ${this.viewBox.w.toFixed(2)} ${this.viewBox.h.toFixed(2)}`);
  }

  _setViewBox(vb) { this.viewBox = vb; this._applyViewBox(); }

  zoomBy(factor, cx, cy) {
    if (cx === undefined) cx = this.viewBox.x + this.viewBox.w / 2;
    if (cy === undefined) cy = this.viewBox.y + this.viewBox.h / 2;
    let newW = this.viewBox.w * factor, newH = this.viewBox.h * factor;
    const minW = this.fullView.w * 0.06, minH = this.fullView.h * 0.06;
    newW = Math.min(this.fullView.w, Math.max(minW, newW));
    newH = Math.min(this.fullView.h, Math.max(minH, newH));
    const ratioX = (cx - this.viewBox.x) / this.viewBox.w, ratioY = (cy - this.viewBox.y) / this.viewBox.h;
    this._setViewBox({ x: cx - ratioX * newW, y: cy - ratioY * newH, w: newW, h: newH });
  }

  _wirePanZoom() {
    this._dragMoved = false;
    this.svgRoot.addEventListener("wheel", (e) => {
      e.preventDefault();
      const svg = this.svgRoot.querySelector("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width, relY = (e.clientY - rect.top) / rect.height;
      const cx = this.viewBox.x + relX * this.viewBox.w, cy = this.viewBox.y + relY * this.viewBox.h;
      this.zoomBy(e.deltaY > 0 ? 1.15 : 0.87, cx, cy);
    }, { passive: false });

    let isPanning = false, panStart = { x: 0, y: 0 }, viewBoxStart = null;
    const start = (clientX, clientY) => {
      isPanning = true; this._dragMoved = false;
      panStart = { x: clientX, y: clientY };
      viewBoxStart = { ...this.viewBox };
      this.svgRoot.querySelector("svg")?.classList.add("panning");
    };
    const move = (clientX, clientY) => {
      if (!isPanning) return;
      const svg = this.svgRoot.querySelector("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = (clientX - panStart.x) * (viewBoxStart.w / rect.width);
      const dy = (clientY - panStart.y) * (viewBoxStart.h / rect.height);
      if (Math.abs(dx) + Math.abs(dy) > 1) this._dragMoved = true;
      this._setViewBox({ x: viewBoxStart.x - dx, y: viewBoxStart.y - dy, w: viewBoxStart.w, h: viewBoxStart.h });
    };
    const end = () => { isPanning = false; this.svgRoot.querySelector("svg")?.classList.remove("panning"); };

    this.svgRoot.addEventListener("mousedown", (e) => start(e.clientX, e.clientY));
    window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
    window.addEventListener("mouseup", end);

    // Touch support so pan/zoom works the same on the mobile-first layout.
    this.svgRoot.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) start(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    this.svgRoot.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) { move(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }
    }, { passive: false });
    this.svgRoot.addEventListener("touchend", end);
  }
}
