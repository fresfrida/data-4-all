// Single source of truth for "what is the app currently showing". MapView
// and the panels never talk to each other directly -- they both read from
// and write to this, and both react to its "change" event. That's what
// makes it possible to swap the donor panel for the org panel without
// MapView (or the other panel) needing to know or care.
export class AppState extends EventTarget {
  constructor() {
    super();
    this.persona = "donor";       // "donor" | "organization"
    this.mode = "hazard";         // key into MODES (web/modes.js)
    this.selectedProvince = null;
    this.showFacilities = true;
  }

  set(partial) {
    Object.assign(this, partial);
    this.dispatchEvent(new CustomEvent("change", { detail: partial }));
  }
}
