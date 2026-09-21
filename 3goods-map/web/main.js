import { loadAppData } from "./dataService.js";
import { MapView } from "./mapView.js";
import { AppState } from "./state.js";
import { DonorPanel } from "./panels/donorPanel.js";
import { OrgPanel } from "./panels/orgPanel.js";
import { MODES } from "./modes.js";

// Composition root: the only file that knows both personas exist, that a
// map and a panel need to be wired together, and where DOM ids live. Every
// other module is usable without knowing this file exists.
async function main() {
  const { features, itemNeeds, facilities, metroHubs, land } = await loadAppData();

  const mapView = new MapView(document.getElementById("mapCol"), {
    features, metroHubs, facilities, land,
  });

  const state = new AppState();

  const panels = {
    donor: new DonorPanel({ features, itemNeeds, mapView, onModeChange: setMode, onProvinceSelect: selectProvince }),
    organization: new OrgPanel({ features, mapView, onModeChange: setMode, onProvinceSelect: selectProvince }),
  };

  const panelBody = document.getElementById("panelBody");

  function mountPersona(persona) {
    panelBody.innerHTML = "";
    panels[persona].mount(panelBody);
    panels[persona].update(state);
  }

  function setMode(mode) {
    state.set({ mode });
    mapView.setField(MODES[mode].field);
    panels[state.persona].update(state);
  }

  function selectProvince(name, { focus = false } = {}) {
    state.set({ selectedProvince: name });
    mapView.setSelected(name);
    if (focus) mapView.focusOnProvince(name);
    panels[state.persona].update(state);
  }

  mapView.onSelect = (name) => selectProvince(name);

  function switchPersona(persona) {
    state.set({ persona, mode: "hazard", selectedProvince: null });
    mapView.setField(MODES.hazard.field);
    mapView.setSelected(null);
    document.querySelectorAll(".persona-btn").forEach(b => b.classList.toggle("active", b.dataset.persona === persona));
    mountPersona(persona);
  }

  document.querySelectorAll(".persona-btn").forEach(btn => {
    btn.addEventListener("click", () => switchPersona(btn.dataset.persona));
  });

  document.getElementById("zoomIn").addEventListener("click", () => mapView.zoomBy(0.75));
  document.getElementById("zoomOut").addEventListener("click", () => mapView.zoomBy(1 / 0.75));
  document.getElementById("zoomReset").addEventListener("click", () => mapView.resetView());

  // Mobile bottom-sheet: tap the handle to expand/collapse. No-op on the
  // desktop layout (the handle is hidden there via CSS media query).
  document.getElementById("panelHandle").addEventListener("click", () => {
    document.getElementById("panel").classList.toggle("expanded");
  });

  mapView.render();
  mountPersona(state.persona);
}

main();
