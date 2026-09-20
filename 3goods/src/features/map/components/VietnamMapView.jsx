import { useEffect, useRef } from "react";
import { MapView } from "../vendor/mapView.js";
import { applyGreyBaseHeat } from "../heatColors.js";
import "../../../styles/map.css";

export function VietnamMapView({ data, field = "disaster_score", showFacilities = true, showMetroHubs = true, selectedProvince, onSelectProvince }) {
  const containerRef = useRef(null);
  const mapViewRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data?.features?.length) return;

    // Clear previous instance
    containerRef.current.innerHTML = "";

    const mapInstance = new MapView(containerRef.current, {
      features: data.features,
      metroHubs: data.metroHubs || [],
      facilities: data.facilities || [],
    });

    mapInstance.setField(field);
    mapInstance.setShowFacilities(showFacilities);
    applyGreyBaseHeat(containerRef.current, data.features, field);
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
    }
  }, [field]);

  useEffect(() => {
    containerRef.current?.classList.toggle("hide-metro-hubs", !showMetroHubs);
  }, [showMetroHubs]);

  useEffect(() => {
    if (mapViewRef.current) {
      mapViewRef.current.setShowFacilities(showFacilities);
      applyGreyBaseHeat(containerRef.current, data.features, field);
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
