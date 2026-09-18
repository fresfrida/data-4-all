import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { useSession } from "../context/SessionContext.jsx";
import { getNeeds } from "../services/needsService.js";
import { getOrganisations } from "../services/organisationsService.js";
import { getCategories, getAreaById } from "../services/referenceDataService.js";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { NeedChip } from "../components/needs/NeedChip.jsx";
import { ROUTES } from "../lib/constants.js";
import { Avatar } from "../components/common/Avatar.jsx";

async function loadNeedsBoard() {
  const [needs, organisations, categories] = await Promise.all([getNeeds(), getOrganisations(), getCategories()]);
  const areaCache = {};
  for (const org of organisations) {
    if (!areaCache[org.areaId]) areaCache[org.areaId] = await getAreaById(org.areaId);
  }
  return { needs, organisations, categories, areaCache };
}

/**
 * Donor & Organisation home ("/"). Browsing published relief needs.
 */
export function DiscoverNeeds() {
  const { status, data, error, reload } = useAsync(loadNeedsBoard, []);
  const { role, identity } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const [categoryFilter, setCategoryFilter] = useState(null);

  const needsByOrg = useMemo(() => {
    if (!data) return [];
    const grouped = new Map();
    for (const need of data.needs) {
      if (categoryFilter && need.category !== categoryFilter) continue;
      if (!grouped.has(need.organisationId)) grouped.set(need.organisationId, []);
      grouped.get(need.organisationId).push(need);
    }
    return [...grouped.entries()]
      .map(([orgId, needs]) => ({ org: data.organisations.find((o) => o.id === orgId), needs }))
      .filter((row) => row.org);
  }, [data, categoryFilter]);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  const categoryLabel = (categoryId) =>
    data.categories.find((c) => c.id === categoryId)?.[locale] ?? data.categories.find((c) => c.id === categoryId)?.en ?? categoryId;

  const totalNeedsCount = data?.needs?.length ?? 0;
  const orgsCount = data?.organisations?.length ?? 0;
  const areaCount = Object.keys(data?.areaCache ?? {}).length || 5;

  return (
    <div className="flex flex-col gap-0 w-full">
      {/* 100% Full-Width Screen Hero Banner */}
      <section className="relative w-full overflow-hidden bg-sky-950 py-12 sm:py-20 px-4 sm:px-8 text-white shadow-md border-b border-ink-600/10">
        {/* Bright Natural Volunteer Relief Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85 scale-105 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url('/hero_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/80 via-blue-900/40 to-sky-950/70 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl flex flex-col justify-between gap-6 min-h-[300px]">
          <div className="flex flex-col gap-4">
            {/* Context pill: guest vs logged-in identity+role, never both/neither (D-045) */}
            <div className="flex flex-col items-start gap-2">
              {identity ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-medium backdrop-blur-md border border-white/25 text-white shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>👤 {t("demo.loggedInAs", { name: identity.name })} · {t(`role.${role}`)}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-medium backdrop-blur-md border border-white/25 text-white shadow-xs">
                  <span>{t("demo.browsingAsGuest")}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                {t("hero.title")}
              </h1>
              <p className="text-xs sm:text-base text-sky-100/95 leading-relaxed font-medium max-w-xl drop-shadow-xs">
                {t("hero.subtitle")}
              </p>
            </div>

            {/* Action Buttons — donor gets the Donate CTA; guest and organisation both browse items */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {role === "donor" ? (
                <Link
                  to={ROUTES.donateNew}
                  className="inline-flex items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-accent-600 transition-all active:scale-95 min-w-[160px]"
                >
                  + {t("hero.ctaDonate")}
                </Link>
              ) : (
                <Link
                  to={ROUTES.discoverItems}
                  className="inline-flex items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-accent-600 transition-all active:scale-95 min-w-[160px]"
                >
                  📦 {t("hero.ctaBrowse")}
                </Link>
              )}
              <Link
                to={ROUTES.map}
                className="inline-flex items-center justify-center rounded-full bg-white/95 px-6 py-3 text-sm font-bold text-ink-900 backdrop-blur-md border border-white hover:bg-white transition-all active:scale-95 min-w-[160px] shadow-md"
              >
                🗺️ {t("hero.ctaMap")}
              </Link>
            </div>
          </div>

          {/* Impact Stats Banner */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-5 border-t border-white/20">
            <div className="flex flex-col bg-sky-950/50 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md border border-white/20">
              <span className="text-xl sm:text-3xl font-black text-white">{totalNeedsCount}</span>
              <span className="text-[10px] sm:text-xs text-sky-100 font-semibold truncate">{t("hero.statNeeds")}</span>
            </div>
            <div className="flex flex-col bg-sky-950/50 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md border border-white/20">
              <span className="text-xl sm:text-3xl font-black text-white">{orgsCount}</span>
              <span className="text-[10px] sm:text-xs text-sky-100 font-semibold truncate">{t("hero.statOrgs")}</span>
            </div>
            <div className="flex flex-col bg-sky-950/50 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md border border-white/20">
              <span className="text-xl sm:text-3xl font-black text-white">{areaCount}</span>
              <span className="text-[10px] sm:text-xs text-sky-100 font-semibold truncate">{t("hero.statAreas")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area in Standard Container */}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 flex flex-col gap-6">

      {/* Main Header & Category Filter Bar */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-800">{t("screens.discoverNeedsByOrgTitle")}</h2>
          <span className="text-xs text-ink-600 font-medium">
            {t("screens.orgsCount", { count: needsByOrg.length })}
          </span>
        </div>

        {/* 8 Categories Filter Bar - Wrapped in Tidy Rows */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              categoryFilter === null
                ? "bg-accent-500 text-white shadow-sm"
                : "bg-white text-ink-700 border border-ink-600/15 hover:border-accent-400"
            }`}
          >
            {t("screens.allFilter")}
          </button>
          {data.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryFilter(category.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === category.id
                  ? "bg-accent-500 text-white shadow-sm"
                  : "bg-white text-ink-700 border border-ink-600/15 hover:border-accent-400"
              }`}
            >
              {category[locale] ?? category.en}
            </button>
          ))}
        </div>
      </div>

      {/* Needs Board with Uniform Card Padding */}
      {needsByOrg.length === 0 ? (
        <EmptyState title={t("emptyStates.noNeeds")} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {needsByOrg.map(({ org, needs }) => {
            const orgName = org.name[locale] ?? org.name.en;

            return (
              <div
                key={org.id}
                className="rounded-card border border-ink-600/10 bg-white p-5 sm:p-6 shadow-xs hover:border-accent-400/50 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="mb-3 flex items-start gap-3 border-b border-ink-600/5 pb-3">
                    <Avatar name={orgName} id={org.id} type="organisation" size="md" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <Link to={ROUTES.organisation(org.id)} className="text-sm font-bold text-ink-800 hover:text-accent-600 transition-colors truncate">
                          {orgName}
                        </Link>
                        {org.verified && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">✓</span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-600 font-medium">
                        📍 {data.areaCache[org.areaId]?.[locale] ?? data.areaCache[org.areaId]?.en}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[...new Map(needs.map((need) => [need.category, need])).values()].map((need) => (
                      <NeedChip
                        key={need.category}
                        label={categoryLabel(need.category)}
                        priority={needs.some((n) => n.category === need.category && n.priority)}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-ink-600 flex justify-between items-center border-t border-ink-600/5">
                  <span className="font-medium">{t("screens.itemsNeeded", { count: needs.length })}</span>
                  <Link to={ROUTES.organisation(org.id)} className="text-accent-600 font-bold hover:underline">
                    {t("actions.viewDetails")} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
