import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getItemById } from "../services/itemsService.js";
import { getRequests, createRequest } from "../services/requestsService.js";
import { getNeeds } from "../services/needsService.js";
import { getAreaById, getCategoryById, getTagsForCategory } from "../services/referenceDataService.js";
import { translateError } from "../lib/errors.js";
import { useSession } from "../context/SessionContext.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { CategoryIcon } from "../components/items/CategoryIcon.jsx";
import { StatusBadge } from "../components/status/StatusBadge.jsx";
import { Avatar } from "../components/common/Avatar.jsx";
import { ROUTES } from "../lib/constants.js";

async function loadItemDetail(itemId, orgIdIfLoggedIn) {
  const item = await getItemById(itemId);
  if (!item) return { item: null };
  const [area, category, tags, requests] = await Promise.all([
    getAreaById(item.areaId),
    getCategoryById(item.category),
    getTagsForCategory(item.category),
    getRequests({ itemId }),
  ]);
  let orgNeeds = [];
  if (orgIdIfLoggedIn) orgNeeds = await getNeeds({ organisationId: orgIdIfLoggedIn });
  return { item, area, category, tags, requests, orgNeeds };
}

export function ItemDetail() {
  const { itemId } = useParams();
  const { role, identity, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const orgId = role === "organisation" ? identity?.organisationId : null;
  const { status, data, error, reload } = useAsync(() => loadItemDetail(itemId, orgId), [itemId, orgId]);
  // Raw error object, not a pre-translated string — see D-017.
  const [requestError, setRequestError] = useState(null);
  const [justRequested, setJustRequested] = useState(false);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;
  if (!data.item) return <ErrorState message={t("screens.itemNoLongerExists")} />;

  const { item, area, category, tags, requests, orgNeeds } = data;
  const photo = item.photoPaths?.[0];
  const tagLabel = (tagId) => tags.find((tag) => tag.id === tagId)?.[locale] ?? tags.find((tag) => tag.id === tagId)?.en ?? tagId;

  const isOwnListing = identity && item.donorId === identity.id;
  const myRequest = orgId ? requests.find((r) => r.organisationId === orgId) : null;
  const matchesNeed = orgNeeds.some((need) => need.category === item.category && item.needTags.includes(need.tag));

  const onRequest = () => {
    requireLogin(async () => {
      setRequestError(null);
      try {
        await createRequest({ itemId: item.id, organisationId: identity.organisationId });
        setJustRequested(true);
        reload();
      } catch (err) {
        setRequestError(err);
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-5 lg:flex-row lg:gap-8">
      <div className="aspect-square w-full overflow-hidden rounded-card bg-cream-100 lg:w-96">
        {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <CategoryIcon category={item.category} />}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold text-ink-800">{locale === "vi" ? (item.titleVi ?? item.title) : item.title}</h1>
          <StatusBadge status={item.status} kind="item" />
        </div>
        <p className="text-sm text-ink-600">
          {category?.[locale] ?? category?.en} · {area?.[locale] ?? area?.en}
        </p>

        {item.needTags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.needTags.map((tagId) => (
              <span key={tagId} className="rounded-full bg-cream-200 px-2.5 py-1 text-xs font-medium text-ink-700">
                {tagLabel(tagId)}
              </span>
            ))}
          </div>
        )}

        {matchesNeed && (
          <p className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-700">{t("screens.matchesNeedNote")}</p>
        )}

        {item.condition && (
          <p className="text-sm text-ink-700">
            <span className="font-semibold">{t("fields.condition")}: </span>
            {item.condition}
          </p>
        )}
        {item.description && <p className="text-sm text-ink-700">{item.description}</p>}

        <p className="text-sm text-ink-700">
          <span className="font-semibold">{t("fields.deliveryOption")}: </span>
          {item.deliveryOption === "can_deliver" ? t("fields.canDeliver") : t("fields.pickupOnly")}
        </p>
        {item.collectionWindows?.length > 0 && (
          <p className="text-sm text-ink-700">
            <span className="font-semibold">{t("fields.collectionWindows")}: </span>
            {item.collectionWindows.join(", ")}
          </p>
        )}

        <div className="flex items-center gap-2.5 pt-2 border-t border-ink-600/10">
          <Avatar name={item.donorName || "Donor"} type="donor" size="sm" />
          <p className="text-xs font-semibold text-ink-700">{t("screens.donatedByLabel", { name: item.donorName })}</p>
        </div>

        {requestError && <p className="text-sm text-red-700">{translateError(requestError, t)}</p>}

        {role === "organisation" && !isOwnListing && item.status === "available" && (
          <>
            {myRequest || justRequested ? (
              <p className="w-fit rounded-full bg-good-100 px-4 py-2 text-sm font-semibold text-good-600">
                {t(`requestStatus.${myRequest?.status ?? "requested"}`)}
              </p>
            ) : (
              <button
                type="button"
                onClick={onRequest}
                className="w-fit rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600"
              >
                {t("actions.request")}
              </button>
            )}
          </>
        )}

        {item.status !== "available" && role === "organisation" && !myRequest && (
          <p className="text-sm text-ink-600">{t("itemStatus.unavailable")}</p>
        )}
      </div>
    </div>
  );
}
