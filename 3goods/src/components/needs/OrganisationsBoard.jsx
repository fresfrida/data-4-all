import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../../lib/useAsync.js";
import { getNeeds } from "../../services/needsService.js";
import { getOrganisations } from "../../services/organisationsService.js";
import { getCategories, getAreaById } from "../../services/referenceDataService.js";
import { useLocale } from "../../i18n/LocaleContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";
import { LoadingState } from "../feedback/LoadingState.jsx";
import { ErrorState } from "../feedback/ErrorState.jsx";
import { EmptyState } from "../feedback/EmptyState.jsx";
import { NeedChip } from "./NeedChip.jsx";
import { ROUTES } from "../../lib/constants.js";
import { summariseNeedQuantities } from "../../lib/quantity.js";
import { Avatar } from "../common/Avatar.jsx";

async function loadNeedsBoard() {
  const [needs, organisations, categories] = await Promise.all([getNeeds(), getOrganisations(), getCategories()]);
  const areaCache = {};
  for (const org of organisations) {
    if (!areaCache[org.areaId]) areaCache[org.areaId] = await getAreaById(org.areaId);
  }
  return { needs, organisations, categories, areaCache };
}

/**
 * The Organisations board: search + category filters + one card per
 * organisation with its published needs. Rendered by both the home page
 * ("/", under the hero) and the dedicated Organisations page
 * ("/organisations") — see DECISIONS.md D-050.
 *
 * @param {Object} props
 * @param {"h1"|"h2"} [props.headingLevel] "h2" when a page-level h1 (the hero) already exists.
 */
export function OrganisationsBoard({ headingLevel = "h1" }) {
  const Heading = headingLevel;
  const { status, data, error, reload } = useAsync(loadNeedsBoard, []);
  const { locale } = useLocale();
  const t = useTranslate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);

  const needsByOrg = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    const matchesSearch = (org) => {
      if (!query) return true;
      const area = data.areaCache[org.areaId];
      return [org.name.en, org.name.vi, area?.[locale] ?? area?.en].some((text) => text?.toLowerCase().includes(query));
    };
    const grouped = new Map();
    for (const need of data.needs) {
      if (categoryFilter && need.category !== categoryFilter) continue;
      if (!grouped.has(need.organisationId)) grouped.set(need.organisationId, []);
      grouped.get(need.organisationId).push(need);
    }
    return [...grouped.entries()]
      .map(([orgId, needs]) => ({ org: data.organisations.find((o) => o.id === orgId), needs }))
      .filter((row) => row.org && matchesSearch(row.org));
  }, [data, categoryFilter, search, locale]);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  const categoryLabel = (categoryId) =>
    data.categories.find((c) => c.id === categoryId)?.[locale] ?? data.categories.find((c) => c.id === categoryId)?.en ?? categoryId;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <Heading className="text-xl font-bold text-ink-800">{t("screens.discoverNeedsByOrgTitle")}</Heading>
          <span className="shrink-0 whitespace-nowrap text-xs text-ink-600 font-medium">
            {t("screens.orgsCount", { count: needsByOrg.length })}
          </span>
        </div>
        <p className="text-sm text-ink-600">{t("screens.discoverNeedsIntro")}</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("screens.searchOrganisations")}
        aria-label={t("screens.searchOrganisations")}
        className="rounded-full border border-ink-600/20 bg-white px-4 py-2 text-sm"
      />

      {/* Category Filter Bar */}
      <div className="flex flex-col gap-3">

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
        <EmptyState title={t(search.trim() || categoryFilter ? "emptyStates.noOrganisationsMatch" : "emptyStates.noNeeds")} />
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
                    {[...new Map(needs.map((need) => [need.category, need])).values()].map((need) => {
                      const categoryNeeds = needs.filter((n) => n.category === need.category);
                      return (
                        <NeedChip
                          key={need.category}
                          label={categoryLabel(need.category)}
                          quantityLabel={summariseNeedQuantities(categoryNeeds, t)}
                          priority={categoryNeeds.some((n) => n.priority)}
                        />
                      );
                    })}
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
  );
}
