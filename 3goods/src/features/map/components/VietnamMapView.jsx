import { useEffect, useRef } from "react";
import { decoratePins, attachPinClicks } from "../pinLayer.js";
import { MapView } from "../vendor/mapView.js";
import { applyGreyBaseHeat } from "../heatColors.js";
import "../../../styles/map.css";

/**
 * `facilityMatches` (pin index -> matched organisation), `selectedFacilityIndex`, `onSelectFacility(index)` and
 * `facilityLabel(facility, match)` drive the clickable facility pins (D-073); `overlay` is drawn inside the map frame (the popup).
 */
export function VietnamMapView({
  data,
  field = "disaster_score",
  showFacilities = true,
  showMetroHubs = true,
  zoomHint,
  touchHint,
  selectedProvince,
  onSelectProvince,
  facilityMatches,
  selectedFacilityIndex = null,
  onSelectFacility,
  facilityLabel,
  overlay = null,
}) {
  const containerRef = useRef(null);
  const mapViewRef = useRef(null);
  // The latest pin props, so the re-render hooks below never act on stale ones.
  const pinPropsRef = useRef({});
  pinPropsRef.current = { facilities: data?.facilities ?? [], facilityMatches: facilityMatches ?? new Map(), selectedFacilityIndex, facilityLabel: facilityLabel ?? ((f) => f.name) };
  const refreshPins = () => {
    const { facilities, facilityMatches: matches, selectedFacilityIndex: selected, facilityLabel: labelFor } = pinPropsRef.current;
    if (containerRef.current) decoratePins(containerRef.current, facilities, matches, selected, labelFor);
  };
  const onSelectFacilityRef = useRef(onSelectFacility);
  onSelectFacilityRef.current = onSelectFacility;

  useEffect(() => {
    if (!containerRef.current || !data?.features?.length) return;

    // Clear previous instance
    containerRef.current.innerHTML = "";

    const mapInstance = new MapView(containerRef.current, {
      features: data.features,
      metroHubs: data.metroHubs || [],
      facilities: data.facilities || [],
      land: data.land || null,
      // The map sits inside a scrolling page: one finger scrolls the page, two fingers move/zoom the map (D-066).
      cooperativeTouch: true,
    });
    if (zoomHint) mapInstance.zoomHintText = zoomHint; // translated "Hold Ctrl and scroll to zoom"
    if (touchHint) mapInstance.touchHintText = touchHint; // translated "Use two fingers to move the map"

    mapInstance.setField(field);
    mapInstance.setShowFacilities(showFacilities);
    applyGreyBaseHeat(containerRef.current, data.features, field);
    refreshPins();
    if (selectedProvince) mapInstance.setSelected(selectedProvince);

    mapInstance.onSelect = (name) => {
      if (onSelectProvince) onSelectProvince(name);
    };

    mapViewRef.current = mapInstance;

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [data]);

  useEffect(() => {
    if (mapViewRef.current) {
      mapViewRef.current.setField(field);
      applyGreyBaseHeat(containerRef.current, data.features, field);
      refreshPins();
    }
  }, [field]);

  // One click listener for every facility pin (survives the MapView re-renders above).
  useEffect(() => {
    if (!containerRef.current) return undefined;
    return attachPinClicks(containerRef.current, (index) => onSelectFacilityRef.current?.(index));
  }, []);

  // Matches and the selected pin can change without the map re-rendering.
  useEffect(() => {
    refreshPins();
  }, [facilityMatches, selectedFacilityIndex, data]);

  useEffect(() => {
    containerRef.current?.classList.toggle("hide-metro-hubs", !showMetroHubs);
  }, [showMetroHubs]);

  useEffect(() => {
    if (mapViewRef.current) {
      mapViewRef.current.setShowFacilities(showFacilities);
      applyGreyBaseHeat(containerRef.current, data.features, field);
      refreshPins();
    }
  }, [showFacilities]);

  useEffect(() => {
    if (mapViewRef.current && selectedProvince) {
      mapViewRef.current.setSelected(selectedProvince);
      mapViewRef.current.focusOnProvince(selectedProvince);
    }
  }, [selectedProvince]);

  const handleZoomIn = () => mapViewRef.current?.zoomBy(0.8);
  const handleZoomOut = () => mapViewRef.current?.zoomBy(1.2);
  const handleReset = () => mapViewRef.current?.resetView();

  return (
    <div className="relative w-full">
      <div ref={containerRef} className="map-container shadow-inner border border-ink-800/20" />

      {overlay}

      {/* Map Floating Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-white backdrop-blur-md hover:bg-slate-800 border border-white/20 shadow-md font-bold text-lg active:scale-95"
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-white backdrop-blur-md hover:bg-slate-800 border border-white/20 shadow-md font-bold text-lg active:scale-95"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-white backdrop-blur-md hover:bg-slate-800 border border-white/20 shadow-md text-[10px] font-bold active:scale-95"
          title="Reset view"
        >
          RESET
        </button>
      </div>
    </div>
  );
}
