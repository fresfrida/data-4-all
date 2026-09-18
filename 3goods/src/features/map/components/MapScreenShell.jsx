import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../../../lib/useAsync.js";
import { loadFullMapData } from "../api/mapApiClient.js";
import { getOrganisations } from "../../../services/organisationsService.js";
import { getNeeds } from "../../../services/needsService.js";
import { VietnamMapView } from "./VietnamMapView.jsx";
import { levelFromNormalized, fieldRange, normalize } from "../vendor/scoring.js";
import { LoadingState } from "../../../components/feedback/LoadingState.jsx";
import { ErrorState } from "../../../components/feedback/ErrorState.jsx";
import { NeedChip } from "../../../components/needs/NeedChip.jsx";
import { useTranslate } from "../../../i18n/useTranslate.js";
import { useLocale } from "../../../i18n/LocaleContext.jsx";
import { ROUTES } from "../../../lib/constants.js";
import { getCategoryById } from "../../../data/categories.js";

const DISASTER_TYPE_MAP = {
  "Flood": { en: "Flood", vi: "Lũ lụt" },
  "Typhoon": { en: "Typhoon", vi: "Bão nhiệt đới" },
  "Landslide": { en: "Landslide", vi: "Sạt lở đất" },
  "Drought": { en: "Hạn hán", vi: "Hạn hán" },
};

async function loadMapShellData() {
  const [mapData, organisations, needs] = await Promise.all([loadFullMapData(), getOrganisations(), getNeeds()]);
  return { mapData, organisations, needs };
}

export function MapScreenShell() {
  const t = useTranslate();
  const { locale } = useLocale();
  const { status, data, error, reload } = useAsync(loadMapShellData, []);

  const [activeLayer, setActiveLayer] = useState("disaster_score");
  const [showFacilities, setShowFacilities] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState("Ha Tinh");

  const selectedFeature = useMemo(() => {
    if (!data?.mapData?.features) return null;
    return data.mapData.features.find((f) => f.properties.province === selectedProvince) || data.mapData.features[0];
  }, [data, selectedProvince]);

  const nearbyOrgs = useMemo(() => {
    if (!data?.organisations || !selectedProvince) return [];
    // Match orgs whose area name or id contains or matches selected province
    const query = selectedProvince.toLowerCase();
    return data.organisations.filter(
      (org) => org.name.en.toLowerCase().includes(query) || org.name.vi.toLowerCase().includes(query) || org.areaId.includes(query)
    );
  }, [data, selectedProvince]);

  const recommendedCategories = useMemo(() => {
    if (!data?.mapData?.itemNeeds || !selectedFeature) return [];
    const disasterType = selectedFeature.properties.disaster_type || "Flood";
    const needsForType = data.mapData.itemNeeds.by_disaster_type?.[disasterType] || {};
    return Object.entries(needsForType).map(([catName, info]) => ({
      name: catName,
      priority: info.priority,
      items: info.items || [],
    }));
  }, [data, selectedFeature]);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  const pProps = selectedFeature?.properties || {};
  const disasterScore = pProps.disaster_score ?? (pProps.poverty_pct ? parseFloat((pProps.poverty_pct * 0.35 + 4.2).toFixed(1)) : 8.2);
  const povertyPct = pProps.poverty_pct ?? 16.8;
  const currentScoreDisplay = activeLayer === "poverty_pct" ? `${povertyPct}%` : (activeLayer === "coverage_gap" ? `${pProps.coverage_gap ?? 65}%` : disasterScore);
  const disasterTypeDisplay = DISASTER_TYPE_MAP[pProps.disaster_type]?.[locale] ?? pProps.disaster_type ?? (locale === "vi" ? "Lũ lụt / Bão" : "Flood / Typhoon");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-5">
      {/* Streamlined Mobile-First Header & Layer Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-card border border-ink-600/10 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-ink-800">{t("map.title")}</h1>
          <p className="text-xs text-ink-600 font-medium">
            {t("map.subtitle")}
          </p>
        </div>

        {/* Mobile-Friendly Responsive Layer & Control Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-stretch lg:self-auto w-full lg:w-auto">
          {/* Layer Selector Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-ink-600/10 text-xs font-semibold gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveLayer("disaster_score")}
              className={`flex flex-1 sm:flex-initial items-center justify-center gap-1 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all text-xs whitespace-nowrap ${
                activeLayer === "disaster_score"
                  ? "bg-white text-accent-700 shadow-2xs font-bold border border-ink-600/10"
                  : "text-ink-600 hover:text-ink-900 font-medium"
              }`}
            >
              <span>🌊</span>
              <span>{t("map.hazardLayer")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer("poverty_pct")}
              className={`flex flex-1 sm:flex-initial items-center justify-center gap-1 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all text-xs whitespace-nowrap ${
                activeLayer === "poverty_pct"
                  ? "bg-white text-accent-700 shadow-2xs font-bold border border-ink-600/10"
                  : "text-ink-600 hover:text-ink-900 font-medium"
              }`}
            >
              <span>📊</span>
              <span>{t("map.povertyLayer")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer("coverage_gap")}
              className={`flex flex-1 sm:flex-initial items-center justify-center gap-1 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all text-xs whitespace-nowrap ${
                activeLayer === "coverage_gap"
                  ? "bg-white text-accent-700 shadow-2xs font-bold border border-ink-600/10"
                  : "text-ink-600 hover:text-ink-900 font-medium"
              }`}
            >
              <span>⚠️</span>
              <span>{t("map.gapLayer")}</span>
            </button>
          </div>

          {/* OSM Pins Toggle Pill */}
          <button
            type="button"
            onClick={() => setShowFacilities(!showFacilities)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
              showFacilities
                ? "bg-accent-50 text-accent-700 border-accent-300 shadow-2xs"
                : "bg-white text-ink-600 border-ink-600/15 hover:border-ink-600/30"
            }`}
          >
            <span>📍</span>
            <span>{t("map.showOsmPins")}</span>
          </button>
        </div>
      </div>

      {/* Subtle Data Source Note */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-sky-50/80 border border-sky-200/80 text-[11px] text-sky-950 font-medium">
        <span className="text-sm shrink-0">ℹ️</span>
        <p className="flex-1 leading-tight">
          <strong className="font-bold text-accent-700">{t("map.disclaimerTitle")}:</strong> {t("map.disclaimerText")}
        </p>
      </div>

      {/* Main Map + Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map Column */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <VietnamMapView
            data={data.mapData}
            field={activeLayer}
            showFacilities={showFacilities}
            selectedProvince={selectedProvince}
            onSelectProvince={(name) => setSelectedProvince(name)}
          />
          <div className="text-[11px] text-ink-600 flex justify-between items-center px-1">
            <span>{t("map.clickHint")}</span>
            <span className="font-semibold">{selectedProvince || t("map.allVietnam")}</span>
          </div>
        </div>

        {/* Region Detail & Recommended Items Panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-ink-600/10 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-ink-600/10 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent-600 tracking-wider">{t("map.selectedRegion")}</span>
                <h2 className="text-lg font-bold text-ink-800">{pProps.province || "Vietnam"}</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cream-200 text-ink-800">
                {pProps.region || "Central"}
              </span>
            </div>

            <div className="space-y-2 text-xs text-ink-700">
              <div className="flex justify-between items-center">
                <span>{t("map.disasterRiskType")}</span>
                <b className="font-bold text-accent-700">{disasterTypeDisplay}</b>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("map.disasterSeverityScore")}</span>
                <b className="font-bold text-ink-900">{currentScoreDisplay}</b>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("map.povertyRateProxy")}</span>
                <b className="font-bold text-ink-900">{povertyPct}%</b>
              </div>
            </div>

            {/* Recommended Relief Categories */}
            <div className="pt-2 border-t border-ink-600/10 space-y-2">
              <h3 className="text-xs font-bold text-ink-800">{t("map.suggestedCategories")}</h3>
              <div className="flex flex-wrap gap-1.5">
                {recommendedCategories.length > 0 ? (
                  recommendedCategories.map((cat) => {
                    const catLabel = getCategoryById(cat.name)?.[locale] ?? cat.name;
                    const priorityKey = cat.priority === "high" ? "map.priorityHigh" : cat.priority === "medium" ? "map.priorityMedium" : "map.priorityLow";
                    const priorityLabel = t(priorityKey);

                    return (
                      <span
                        key={cat.name}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                          cat.priority === "high"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {catLabel} ({priorityLabel})
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-ink-600 italic">{t("map.noRecommendations")}</span>
                )}
              </div>
            </div>
          </div>

          {/* Nearby Registered 3goods Organisations */}
          <div className="rounded-card border border-ink-600/10 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-800 border-b border-ink-600/10 pb-2">
              {t("map.nearbyOrgsTitle")}
            </h3>
            {nearbyOrgs.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {nearbyOrgs.map((org) => (
                  <div key={org.id} className="flex flex-col gap-1 p-2.5 rounded-xl bg-cream-50 border border-ink-600/10">
                    <div className="flex justify-between items-center">
                      <Link to={ROUTES.organisation(org.id)} className="text-xs font-bold text-ink-800 hover:text-accent-600">
                        {org.name[locale] ?? org.name.en}
                      </Link>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">
                        {t("map.verifiedOrg")}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-600 line-clamp-2">{org.mission[locale] ?? org.mission.en}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-ink-600 py-2">
                {t("map.noOrgsNearby", { province: selectedProvince })}
              </div>
            )}

            <Link
              to={ROUTES.donateNew}
              className="mt-1 w-full text-center py-2.5 px-4 rounded-full bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold shadow-sm transition-all"
            >
              {t("map.postDonationFor", { province: selectedProvince })}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
