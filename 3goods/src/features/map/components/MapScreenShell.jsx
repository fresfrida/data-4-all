import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../../../lib/useAsync.js";
import { loadFullMapData } from "../api/mapApiClient.js";
import { getOrganisations } from "../../../services/organisationsService.js";
import { getNeeds } from "../../../services/needsService.js";
import { getAreas } from "../../../services/referenceDataService.js";
import { VietnamMapView } from "./VietnamMapView.jsx";
import { FacilityPopup } from "./FacilityPopup.jsx";
import { matchFacilitiesToOrganisations } from "../facilityMatching.js";
import { LoadingState } from "../../../components/feedback/LoadingState.jsx";
import { ErrorState } from "../../../components/feedback/ErrorState.jsx";
import { NeedChip } from "../../../components/needs/NeedChip.jsx";
import { useTranslate } from "../../../i18n/useTranslate.js";
import { useLocale } from "../../../i18n/LocaleContext.jsx";
import { ROUTES } from "../../../lib/constants.js";
import { getCategoryById } from "../../../data/categories.js";

// Keys are the disaster types the province data / item-needs file actually use.
const DISASTER_TYPE_MAP = {
  Flood: { en: "Flood", vi: "Lũ lụt" },
  Storm: { en: "Storm", vi: "Bão" },
  Drought: { en: "Drought", vi: "Hạn hán" },
  Wildfire: { en: "Wildfire", vi: "Cháy rừng" },
};

/** A small pin in the same shape and colours as the map's facility pins, for the legend. */
function PinSwatch({ color }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-px h-4 w-4 shrink-0">
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z" fill={color} stroke="#f8fafc" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="3.2" fill="#f8fafc" />
    </svg>
  );
}

const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

// The GADM province names have their spaces stripped ("HàTĩnh") — put them back for display.
const formatProvince = (name) => (name ? name.replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2") : "");

const PRIORITY_STYLES = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-300",
};

async function loadMapShellData() {
  const [mapData, organisations, needs, areas] = await Promise.all([loadFullMapData(), getOrganisations(), getNeeds(), getAreas()]);
  return { mapData, organisations, needs, areas };
}

export function MapScreenShell() {
  const t = useTranslate();
  const { locale } = useLocale();
  const { status, data, error, reload } = useAsync(loadMapShellData, []);

  const [activeLayer, setActiveLayer] = useState("disaster_score");
  const [showFacilities, setShowFacilities] = useState(true);
  const [showMetroHubs, setShowMetroHubs] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState("HàTĩnh");
  const [selectedFacilityIndex, setSelectedFacilityIndex] = useState(null);

  const selectedFeature = useMemo(() => {
    if (!data?.mapData?.features) return null;
    return data.mapData.features.find((f) => f.properties.province === selectedProvince) || data.mapData.features[0];
  }, [data, selectedProvince]);

  const disasterTypes = useMemo(
    () => (selectedFeature?.properties.disaster_types ?? "").split("; ").filter(Boolean),
    [selectedFeature]
  );

  // Every province the map can show is a row of the provinces table (D-062), matched by the map's own province name.
  const selectedArea = useMemo(() => data?.areas.find((area) => area.mapKey === selectedProvince) ?? null, [data, selectedProvince]);

  // A live count of the organisations based in the selected province, split by verified/unverified (no named list).
  const orgCounts = useMemo(() => {
    const inProvince = selectedArea ? (data?.organisations ?? []).filter((org) => org.areaId === selectedArea.id) : [];
    const verified = inProvince.filter((org) => org.verified).length;
    return { verified, unverified: inProvince.length - verified };
  }, [data, selectedArea]);

  // Which OSM pins have a registered 3goods organisation at (or right next to) them: pin index -> {organisation, distanceM} (D-073).
  const facilityMatches = useMemo(
    () => matchFacilitiesToOrganisations(data?.mapData?.facilities ?? [], data?.organisations ?? []),
    [data],
  );
  const closeFacility = useCallback(() => setSelectedFacilityIndex(null), []);
  const toggleFacility = useCallback((index) => setSelectedFacilityIndex((current) => (current === index ? null : index)), []);

  const recommendedCategories = useMemo(() => {
    const { itemNeeds } = data?.mapData ?? {};
    if (!itemNeeds || !selectedFeature) return [];
    // A province can carry several disaster types; a category takes its highest priority across them.
    const byCategory = new Map();
    for (const type of disasterTypes) {
      const needsForType = itemNeeds.by_disaster_type?.[type] ?? {};
      for (const [name, info] of Object.entries(needsForType)) {
        if (!info.items?.length) continue;
        const seen = byCategory.get(name);
        if (!seen || (PRIORITY_RANK[info.priority] ?? 0) > (PRIORITY_RANK[seen.priority] ?? 0)) {
          byCategory.set(name, { name, priority: info.priority });
        }
      }
    }
    return [...byCategory.values()].sort((a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0));
  }, [data, selectedFeature, disasterTypes]);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  // Show the real value or a dash — never a made-up fallback score.
  const { sources, meta } = data.mapData;
  // `meta` only feeds the optional "About this data" panel, so a missing one just hides the panel — it never triggers the warning.
  const { meta: _metaSource, neighbourLand: _landSource, ...mapDataSources } = sources;
  const mapNotice = Object.values(mapDataSources).includes("unavailable")
    ? t("map.dataUnavailableNotice")
    : Object.values(mapDataSources).includes("snapshot")
      ? t("map.dataFallbackNotice")
      : null;
  const aboutData = meta
    ? { scores: Object.entries(meta.scores ?? {}), caveats: meta.caveats ?? [], sources: meta.sources ?? "" }
    : null;

  const pProps = selectedFeature?.properties || {};
  // Carry the clicked province into the donation form as its area (works for all 63 provinces).
  const donateHref = selectedArea ? `${ROUTES.donateNew}?area=${selectedArea.id}` : ROUTES.donateNew;
  const provinceName = selectedArea ? (selectedArea[locale] ?? selectedArea.en) : formatProvince(pProps.province);
  const disasterScoreDisplay = typeof pProps.disaster_score === "number" ? pProps.disaster_score.toFixed(2) : "—";
  const povertyDisplay = typeof pProps.poverty_rate === "number" ? `${pProps.poverty_rate}%` : "—";
  const disasterTypeDisplay = disasterTypes.length
    ? disasterTypes.map((type) => DISASTER_TYPE_MAP[type]?.[locale] ?? type).join(", ")
    : "—";

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
              onClick={() => setActiveLayer("poverty_rate")}
              className={`flex flex-1 sm:flex-initial items-center justify-center gap-1 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all text-xs whitespace-nowrap ${
                activeLayer === "poverty_rate"
                  ? "bg-white text-accent-700 shadow-2xs font-bold border border-ink-600/10"
                  : "text-ink-600 hover:text-ink-900 font-medium"
              }`}
            >
              <span>📊</span>
              <span>{t("map.povertyLayer")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer("coverage_gap_score")}
              className={`flex flex-1 sm:flex-initial items-center justify-center gap-1 rounded-lg px-2.5 sm:px-3 py-1.5 transition-all text-xs whitespace-nowrap ${
                activeLayer === "coverage_gap_score"
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
            onClick={() => {
              setShowFacilities(!showFacilities);
              closeFacility();
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
              showFacilities
                ? "bg-accent-50 text-accent-700 border-accent-300 shadow-2xs"
                : "bg-white text-ink-600 border-ink-600/15 hover:border-ink-600/30"
            }`}
          >
            <span>📍</span>
            <span>{t("map.showFacilities")}</span>
          </button>

          {/* Big-city (metro hub) circles Toggle Pill */}
          <button
            type="button"
            onClick={() => setShowMetroHubs(!showMetroHubs)}
            aria-pressed={showMetroHubs}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
              showMetroHubs
                ? "bg-accent-50 text-accent-700 border-accent-300 shadow-2xs"
                : "bg-white text-ink-600 border-ink-600/15 hover:border-ink-600/30"
            }`}
          >
            <span>🏙️</span>
            <span>{t("map.showMetroHubs")}</span>
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

      {mapNotice && (
        <div role="status" className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
          <span className="text-sm shrink-0">⚠️</span>
          <p className="flex-1 leading-tight">{mapNotice}</p>
        </div>
      )}

      {/* About this data: sources, caveats and score definitions straight from /api/meta */}
      {aboutData && (
        <details className="rounded-xl bg-white border border-ink-600/10 px-3.5 py-2.5 text-[11px] text-ink-700">
          <summary className="cursor-pointer font-bold text-ink-800">{t("map.aboutDataTitle")}</summary>
          <div className="mt-2 flex flex-col gap-2 leading-snug">
            <p className="italic text-ink-600">{t("map.aboutDataNote")}</p>
            {aboutData.scores.length > 0 && (
              <div>
                <p className="font-bold text-ink-800">{t("map.aboutScores")}</p>
                <ul className="list-disc pl-4">
                  {aboutData.scores.map(([key, text]) => (
                    <li key={key}>
                      <b>{key}</b>: {text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aboutData.caveats.length > 0 && (
              <div>
                <p className="font-bold text-ink-800">{t("map.aboutCaveats")}</p>
                <ul className="list-disc pl-4">
                  {aboutData.caveats.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </div>
            )}
            {aboutData.sources && (
              <p>
                <b className="text-ink-800">{t("map.aboutSources")}:</b> {aboutData.sources}
              </p>
            )}
          </div>
        </details>
      )}

      {/* Main Map + Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map Column */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <VietnamMapView
            data={data.mapData}
            field={activeLayer}
            showFacilities={showFacilities}
            showMetroHubs={showMetroHubs}
            zoomHint={t("map.zoomHint", { key: /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl" })}
            touchHint={t("map.touchHint")}
            selectedProvince={selectedProvince}
            onSelectProvince={(name) => setSelectedProvince(name)}
            facilityMatches={facilityMatches}
            selectedFacilityIndex={showFacilities ? selectedFacilityIndex : null}
            onSelectFacility={toggleFacility}
            facilityLabel={(facility, match) =>
              match ? t("map.facilityPinMatched", { name: facility.name, organisation: match.organisation.name[locale] ?? match.organisation.name.en }) : t("map.facilityPin", { name: facility.name })
            }
            overlay={
              showFacilities && selectedFacilityIndex !== null && data.mapData.facilities[selectedFacilityIndex] ? (
                <FacilityPopup
                  facility={data.mapData.facilities[selectedFacilityIndex]}
                  match={facilityMatches.get(selectedFacilityIndex)}
                  onClose={closeFacility}
                />
              ) : null
            }
          />
          <div className="text-[11px] text-ink-600 flex justify-between items-start gap-3 px-1">
            <span>{t("map.clickHint")}</span>
            <span className="shrink-0 whitespace-nowrap font-semibold">{provinceName || t("map.allVietnam")}</span>
          </div>
          {/* Legend for the two overlay layers (the score layers are explained under "About this data") */}
          {((showMetroHubs && data.mapData.metroHubs.length > 0) || (showFacilities && data.mapData.facilities.length > 0)) && (
            <ul className="flex flex-col gap-1 rounded-xl bg-white border border-ink-600/10 px-3 py-2 text-[11px] text-ink-700">
              {showMetroHubs && data.mapData.metroHubs.length > 0 && (
                <li className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-blue-500 ring-2 ring-blue-300" />
                  <span>{t("map.legendMetro", { cities: data.mapData.metroHubs.map((hub) => hub.name).join(", ") })}</span>
                </li>
              )}
              {showFacilities && data.mapData.facilities.length > 0 && (
                <>
                  <li className="flex items-start gap-2">
                    <PinSwatch color="#94a3b8" />
                    <span>{t("map.legendFacility", { count: data.mapData.facilities.length - facilityMatches.size })}</span>
                  </li>
                  {facilityMatches.size > 0 && (
                    <li className="flex items-start gap-2">
                      <PinSwatch color="#2563eb" />
                      <span>{t("map.legendFacilityMatched", { count: facilityMatches.size })}</span>
                    </li>
                  )}
                </>
              )}
            </ul>
          )}
        </div>

        {/* Region Detail & Recommended Items Panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-ink-600/10 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-600/10 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent-600 tracking-wider">{t("map.selectedRegion")}</span>
                <h2 className="text-lg font-bold text-ink-800">{provinceName || t("map.allVietnam")}</h2>
              </div>
              {pProps.poverty_region && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cream-200 text-ink-800">
                  {pProps.poverty_region}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs text-ink-700">
              <div className="flex justify-between items-center">
                <span>{t("map.disasterRiskType")}</span>
                <b className="font-bold text-accent-700">{disasterTypeDisplay}</b>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("map.disasterSeverityScore")}</span>
                <b className="font-bold text-ink-900">{disasterScoreDisplay}</b>
              </div>
              <div className="flex justify-between items-center">
                <span>{t("map.povertyRateProxy")}</span>
                <b className="font-bold text-ink-900">{povertyDisplay}</b>
              </div>
            </div>

            {/* Recommended Relief Categories */}
            <div className="pt-2 border-t border-ink-600/10 space-y-2">
              <h3 className="text-xs font-bold text-ink-800">{t("map.suggestedCategories")}</h3>
              {recommendedCategories.length > 0 && (
                <div role="group" aria-label={t("map.priorityKeyTitle")} className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-600">{t("map.priorityKeyTitle")}</span>
                  <div className="flex overflow-hidden rounded-full text-[10px] font-bold text-center">
                    <span className="flex-1 bg-rose-500 py-1 text-white">{t("map.priorityHigh")}</span>
                    <span className="flex-1 bg-amber-400 py-1 text-amber-950">{t("map.priorityMedium")}</span>
                    <span className="flex-1 bg-slate-300 py-1 text-slate-800">{t("map.priorityLow")}</span>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {recommendedCategories.length > 0 ? (
                  recommendedCategories.map((cat) => {
                    const catLabel = getCategoryById(cat.name)?.[locale] ?? cat.name;
                    const priorityKey = cat.priority === "high" ? "map.priorityHigh" : cat.priority === "medium" ? "map.priorityMedium" : "map.priorityLow";
                    const priorityLabel = t(priorityKey);

                    return (
                      <span
                        key={cat.name}
                        title={`${catLabel} — ${priorityLabel}`}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${PRIORITY_STYLES[cat.priority] ?? PRIORITY_STYLES.low}`}
                      >
                        {catLabel}
                        <span className="sr-only"> ({priorityLabel})</span>
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
            {orgCounts.verified + orgCounts.unverified > 0 ? (
              <p className="text-sm font-semibold text-ink-800" aria-live="polite">
                {t("map.orgCount", { verified: orgCounts.verified, unverified: orgCounts.unverified })}
              </p>
            ) : (
              <div className="text-xs text-ink-600 py-2">
                {t("map.noOrgsNearby", { province: provinceName })}
              </div>
            )}

            <Link
              to={donateHref}
              className="mt-1 w-full text-center py-2.5 px-4 rounded-full bg-accent-500 hover:bg-accent-600 text-white text-xs font-bold shadow-sm transition-all"
            >
              {t("map.postDonationFor", { province: provinceName })}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
