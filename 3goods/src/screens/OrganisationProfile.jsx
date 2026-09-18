import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getOrganisationById } from "../services/organisationsService.js";
import { getNeeds } from "../services/needsService.js";
import { getAreaById, getTagsForCategory } from "../services/referenceDataService.js";
import { getItemById } from "../services/itemsService.js";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { NeedChip } from "../components/needs/NeedChip.jsx";
import { Avatar } from "../components/common/Avatar.jsx";
import { ROUTES } from "../lib/constants.js";

async function loadOrganisationProfile(orgId) {
  const organisation = await getOrganisationById(orgId);
  if (!organisation) return { organisation: null };
  const [area, needs] = await Promise.all([getAreaById(organisation.areaId), getNeeds({ organisationId: orgId })]);
  const tagLabelsByCategory = {};
  for (const need of needs) {
    if (!tagLabelsByCategory[need.category]) tagLabelsByCategory[need.category] = await getTagsForCategory(need.category);
  }
  const pastItems = [];
  for (const itemId of organisation.pastReceivedItemIds) {
    const item = await getItemById(itemId);
    if (item) pastItems.push(item);
  }
  return { organisation, area, needs, tagLabelsByCategory, pastItems };
}

/** Read-only public profile — any viewer, not gated by login. */
export function OrganisationProfile() {
  const { orgId } = useParams();
  const { locale } = useLocale();
  const t = useTranslate();
  const { status, data, error, reload } = useAsync(() => loadOrganisationProfile(orgId), [orgId]);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;
  if (!data.organisation) return <ErrorState message={t("screens.organisationNoLongerExists")} />;

  const { organisation, area, needs, tagLabelsByCategory, pastItems } = data;
  const tagLabel = (category, tagId) =>
    tagLabelsByCategory[category]?.find((tag) => tag.id === tagId)?.[locale] ??
    tagLabelsByCategory[category]?.find((tag) => tag.id === tagId)?.en ??
    tagId;

  const orgName = organisation.name[locale] ?? organisation.name.en;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-6">
      <div className="flex items-start gap-4 rounded-card border border-ink-600/10 bg-white p-5 shadow-xs">
        <Avatar name={orgName} id={organisation.id} type="organisation" size="lg" />
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-ink-800">{orgName}</h1>
            {organisation.verified && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{t("screens.verifiedBadge")}</span>
            )}
          </div>
          <p className="text-sm text-ink-600/90 leading-relaxed">{organisation.mission[locale] ?? organisation.mission.en}</p>
          <p className="text-xs text-ink-600 font-medium">📍 {area?.[locale] ?? area?.en}</p>
          {organisation.isDemo && (
            <span className="mt-1 self-start rounded-full bg-cream-100 px-2.5 py-0.5 text-[10px] font-medium text-ink-600 border border-ink-600/10">
              {t("screens.demoOrgBadgeLong")}
            </span>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-800">{t("screens.currentlyNeedsHeading")}</h2>
        {needs.length === 0 ? (
          <EmptyState title={t("emptyStates.noNeeds")} />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {needs.map((need) => (
              <NeedChip key={need.id} label={tagLabel(need.category, need.tag)} priority={need.priority} />
            ))}
          </div>
        )}
      </div>

      {pastItems.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink-800">{t("screens.pastReceivedHeading")}</h2>
          <div className="flex flex-col gap-1.5">
            {pastItems.map((item) => (
              <Link key={item.id} to={ROUTES.item(item.id)} className="text-sm text-ink-700 hover:underline">
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
