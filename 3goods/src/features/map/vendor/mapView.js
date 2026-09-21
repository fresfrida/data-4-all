import { buildShapes, projectToPixel, minmaxSqrt, buildLandPaths, worldPixelRect } from "./geo.js";
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
  // `land` (optional) is a GeoJSON FeatureCollection of neighbouring countries plus
  // a `world` {west,south,east,north} rectangle (data/neighbour_land.json). With it
  // the map draws Vietnam as part of a continent (land beside the sea, not an island)
  // and zooming/panning stop at the edge of that world instead of showing empty space.
  // `requireModifierToZoom`: the mouse wheel only zooms with Ctrl/Cmd held (trackpad
  // pinch already sends Ctrl), so scrolling the page over the map never zooms it by accident.
  // `cooperativeTouch`: for a map embedded in a scrolling page. One finger is left to the browser (the page scrolls
  // past the map, and a brief hint says how to move it); two fingers pan and pinch-zoom the map. Off (the default),
  // one finger pans, which suits a map that fills the screen. Two-finger pinch/pan works either way.
  constructor(container, { features, metroHubs, facilities, land = null, requireModifierToZoom = true, cooperativeTouch = false }) {
    this.container = container;
    this.features = features;
    this.metroHubs = metroHubs;
    this.facilities = facilities;
    this.field = "disaster_score";
    this.selectedProvince = null;
    this.showFacilities = true;
    this.onSelect = null; // (provinceName) => void
    this.requireModifierToZoom = requireModifierToZoom;
    this.cooperativeTouch = cooperativeTouch;
    // "pan-y" lets a one-finger vertical swipe scroll the page; "none" hands every touch to the map.
    this.container.style.touchAction = cooperativeTouch ? "pan-y" : "none";
    // Shown briefly on a one-finger drag in cooperative mode. Callers may replace it (e.g. translated).
    this.touchHintText = "Use two fingers to move the map";
    // Shown briefly when the wheel is used without the modifier. Callers may replace it (e.g. translated).
    this.zoomHintText = /Mac|iPhone|iPad/.test(navigator.platform) ? "Hold \u2318 and scroll to zoom" : "Hold Ctrl and scroll to zoom";

    this.extent = buildShapes(features, 520);
    this.bboxByName = Object.fromEntries(this.extent.shapes.map(sh => [sh.p.province, sh.bbox]));
    this.metroRadius = minmaxSqrt(metroHubs.map(h => h.population), 4, 11);

    this.landPaths = land ? buildLandPaths(land.features, this.extent) : [];
    // Everything the map draws lives inside `world` (the sea and land cover it entirely).
    this.world = land?.world
      ? worldPixelRect(land.world, this.extent)
      : { x0: -2 * this.extent.width, y0: -0.5 * this.extent.height, x1: 3 * this.extent.width, y1: 1.5 * this.extent.height };

    this.fullView = this._computeFullView();
    this.viewBox = { ...this.fullView };

    this.svgRoot = document.createElement("div");
    this.svgRoot.id = "svgRoot";
    this.facilityTip = document.createElement("div");
    this.facilityTip.id = "facilityTip";
    this.facilityTip.hidden = true;
    this.container.append(this.svgRoot, this.facilityTip);

    this._wirePanZoom();
    // Keep the view matched to the container's shape (no letterbox bars) when it is resized.
    if (typeof ResizeObserver !== "undefined") {
      this._resizeObserver = new ResizeObserver(() => this._onResize());
      this._resizeObserver.observe(this.container);
    }
  }

  // The smallest rectangle with the container's aspect ratio that contains all of
  // Vietnam, centred on it (and never larger than the drawn world). Showing this at
  // zoom 1 means the SVG fills the container, so there are no empty bars beside the map.
  _computeFullView() {
    const cw = this.container.clientWidth, ch = this.container.clientHeight;
    const aspect = cw > 0 && ch > 0 ? cw / ch : this.extent.width / this.extent.height;
    let w = this.extent.width, h = this.extent.height;
    if (w / h < aspect) w = h * aspect; else h = w / aspect;
    const shrink = Math.min(1, (this.world.x1 - this.world.x0) / w, (this.world.y1 - this.world.y0) / h);
    w *= shrink; h *= shrink;
    return { x: this.extent.width / 2 - w / 2, y: this.extent.height / 2 - h / 2, w, h };
  }

  _onResize() {
    const zoom = this.viewBox.w / this.fullView.w;
    const cx = this.viewBox.x + this.viewBox.w / 2, cy = this.viewBox.y + this.viewBox.h / 2;
    this.fullView = this._computeFullView();
    const w = this.fullView.w * zoom, h = this.fullView.h * zoom;
    this._setViewBox({ x: cx - w / 2, y: cy - h / 2, w, h });
  }

  _showZoomHint() { this._showHint(this.zoomHintText); }

  _showHint(text) {
    if (!this.zoomHint) {
      this.zoomHint = document.createElement("div");
      this.zoomHint.id = "zoomHint";
      this.container.append(this.zoomHint);
    }
    this.zoomHint.textContent = text;
    this.zoomHint.classList.add("visible");
    clearTimeout(this._zoomHintTimer);
    this._zoomHintTimer = setTimeout(() => this.zoomHint.classList.remove("visible"), 1400);
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
    let w = bw * (1 + padFactor), h = bh * (1 + padFactor);
    // Match the container's shape so the province view fills it (no empty bars).
    const aspect = this.fullView.w / this.fullView.h;
    if (w / h < aspect) w = h * aspect; else h = w / aspect;
    const cx = (bbox.x0 + bbox.x1) / 2, cy = (bbox.y0 + bbox.y1) / 2;
    this._setViewBox({ x: cx - w / 2, y: cy - h / 2, w, h });
  }

  resetView() { this._setViewBox({ ...this.fullView }); }

  render() {
    const range = fieldRange(this.features, this.field);
    const [lo, hi] = range;

    const defs = `<defs>
      <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a9d6f2"/>
        <stop offset="55%" stop-color="#82bfe9"/>
        <stop offset="100%" stop-color="#5ba6dc"/>
      </linearGradient>
      <filter id="landShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" flood-color="#0a1a2c" flood-opacity="0.3"/>
      </filter>
      <filter id="pinShadow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#0a0e1a" flood-opacity="0.5"/>
      </filter>
    </defs>`;

    // Sea fills the whole world rectangle; neighbouring countries sit on top of it in a
    // neutral land colour (thick same-colour stroke closes hairline gaps along the border).
    const { x0, y0, x1, y1 } = this.world;
    const ocean = `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${(x1 - x0).toFixed(1)}" height="${(y1 - y0).toFixed(1)}" fill="url(#oceanGrad)"/>` +
      (this.landPaths.length
        ? `<g class="neighbour-land">${this.landPaths.map(l => `<path d="${l.d}" fill="#e6e0d2" stroke="#e6e0d2" stroke-width="3" stroke-linejoin="round"><title>${l.name}</title></path>`).join("")}</g>`
        : "");

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

  // Every view change goes through here. The view is confined to `fullView` (the whole of Vietnam,
  // shaped like the container): zoom-out stops exactly on it, and panning can never reveal more
  // than that default view already shows, so there is never empty background beyond the map.
  _setViewBox(vb) {
    const k = Math.min(1, this.fullView.w / vb.w, this.fullView.h / vb.h);
    let { x, y, w, h } = vb;
    if (k < 1) { x += (w - w * k) / 2; y += (h - h * k) / 2; w *= k; h *= k; }
    const f = this.fullView;
    x = Math.min(Math.max(x, f.x), f.x + f.w - w);
    y = Math.min(Math.max(y, f.y), f.y + f.h - h);
    this.viewBox = { x, y, w, h };
    this._applyViewBox();
  }

  zoomBy(factor, cx, cy) {
    if (cx === undefined) cx = this.viewBox.x + this.viewBox.w / 2;
    if (cy === undefined) cy = this.viewBox.y + this.viewBox.h / 2;
    // Zoom-out stops at fullView (the map exactly fills the container); zoom-in stops at 6% of it.
    const newW = Math.min(this.fullView.w, Math.max(this.fullView.w * 0.06, this.viewBox.w * factor));
    const newH = this.viewBox.h * (newW / this.viewBox.w);
    const ratioX = (cx - this.viewBox.x) / this.viewBox.w, ratioY = (cy - this.viewBox.y) / this.viewBox.h;
    this._setViewBox({ x: cx - ratioX * newW, y: cy - ratioY * newH, w: newW, h: newH });
  }

  _wirePanZoom() {
    this._dragMoved = false;
    this.svgRoot.addEventListener("wheel", (e) => {
      // Plain wheel scrolls the page; Ctrl/Cmd + wheel (and trackpad pinch, which sends Ctrl) zooms.
      if (this.requireModifierToZoom && !(e.ctrlKey || e.metaKey)) { this._showZoomHint(); return; }
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

    // Touch. Two fingers pan and pinch-zoom (the point between them follows the fingers). One finger pans only when
    // not `cooperativeTouch`; otherwise it is left to the browser so the page can scroll, and a hint is shown.
    let pinch = null, hintOrigin = null;
    const fingers = (e) => {
      const a = e.touches[0], b = e.touches[1];
      return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2, d: Math.max(Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), 1) };
    };
    this.svgRoot.addEventListener("touchstart", (e) => {
      const svg = this.svgRoot.querySelector("svg");
      if (e.touches.length >= 2 && svg) {
        end(); hintOrigin = null; this._dragMoved = true; // a pinch is not a tap on a province
        pinch = { ...fingers(e), vb: { ...this.viewBox }, rect: svg.getBoundingClientRect() };
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        if (this.cooperativeTouch) { this._dragMoved = false; hintOrigin = { x: t.clientX, y: t.clientY }; }
        else start(t.clientX, t.clientY);
      }
    }, { passive: true });
    this.svgRoot.addEventListener("touchmove", (e) => {
      if (pinch && e.touches.length >= 2) {
        e.preventDefault();
        const c = fingers(e), { vb, rect } = pinch;
        const w = Math.min(this.fullView.w, Math.max(this.fullView.w * 0.06, vb.w * pinch.d / c.d));
        const h = vb.h * (w / vb.w);
        const wx = vb.x + ((pinch.x - rect.left) / rect.width) * vb.w, wy = vb.y + ((pinch.y - rect.top) / rect.height) * vb.h;
        this._setViewBox({ x: wx - ((c.x - rect.left) / rect.width) * w, y: wy - ((c.y - rect.top) / rect.height) * h, w, h });
      } else if (e.touches.length === 1) {
        if (!this.cooperativeTouch) { move(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }
        else if (hintOrigin && Math.hypot(e.touches[0].clientX - hintOrigin.x, e.touches[0].clientY - hintOrigin.y) > 10) {
          hintOrigin = null; this._showHint(this.touchHintText);
        }
      }
    }, { passive: false });
    const touchEnd = (e) => {
      if (e.touches.length < 2) pinch = null;
      if (e.touches.length === 0) { hintOrigin = null; end(); }
    };
    this.svgRoot.addEventListener("touchend", touchEnd);
    this.svgRoot.addEventListener("touchcancel", touchEnd);
  }
}
