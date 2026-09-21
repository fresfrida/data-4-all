import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { useRequestActions } from "../lib/useRequestActions.js";
import { getItemById } from "../services/itemsService.js";
import { getRequests, createRequest } from "../services/requestsService.js";
import { getNeeds } from "../services/needsService.js";
import { getOrganisations } from "../services/organisationsService.js";
import { getAreaById, getCategoryById } from "../services/referenceDataService.js";
import { translateError } from "../lib/errors.js";
import { useSession } from "../context/SessionContext.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { CategoryIcon } from "../components/items/CategoryIcon.jsx";
import { StatusBadge } from "../components/status/StatusBadge.jsx";
import { Avatar } from "../components/common/Avatar.jsx";
import { RequestRow } from "../components/requests/RequestRow.jsx";
import { Spinner } from "../components/feedback/Spinner.jsx";
import { ROUTES, ITEM_STATUS } from "../lib/constants.js";
import { formatQuantity } from "../lib/quantity.js";
import { ownNeedMatch, otherVerifiedMatches } from "../lib/needMatching.js";

async function loadItemDetail(itemId, orgIdIfLoggedIn, donorIdIfLoggedIn) {
  const item = await getItemById(itemId);
  if (!item) return { item: null };
  const [area, category, secondaryCategory, requests] = await Promise.all([
    getAreaById(item.areaId),
    getCategoryById(item.category),
    item.secondaryCategory ? getCategoryById(item.secondaryCategory) : null,
    getRequests({ itemId }),
  ]);
  // A logged-in organisation needs every organisation's stated needs to see who else matches this item.
  const needs = orgIdIfLoggedIn ? await getNeeds() : [];
  // The listing's own donor also sees who has requested it (and can accept), so
  // load the organisations those request rows name. An organisation loads them for the "other matches" list.
  const organisations = orgIdIfLoggedIn || (donorIdIfLoggedIn && item.donorId === donorIdIfLoggedIn) ? await getOrganisations() : [];
  return { itemId, item, area, category, secondaryCategory, requests, needs, organisations };
}

export function ItemDetail() {
  const { itemId } = useParams();
  const { role, identity, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const orgId = role === "organisation" ? identity?.organisationId : null;
  const donorId = role === "donor" ? identity?.id : null;
  const { status, data, error, reload, refresh } = useAsync(() => loadItemDetail(itemId, orgId, donorId), [itemId, orgId, donorId]);
  const { busy, error: actionError, accept, revert } = useRequestActions(refresh);
  // Raw error object, not a pre-translated string — see D-017.
  const [requestError, setRequestError] = useState(null);
  const [justRequested, setJustRequested] = useState(false);

  // A refetch of the same item keeps the page on screen (inline indicator); the
  // full-page spinner is for the first load or navigating to a different item.
  const isRefreshing = status === "loading" && data?.itemId === itemId;
  if ((status === "loading" && !isRefreshing) || !data) return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;
  if (!data.item) return <ErrorState message={t("screens.itemNoLongerExists")} />;

  const { item, area, category, secondaryCategory, requests, needs, organisations } = data;
  const photo = item.photoPaths?.[0];

  const isOwnListing = identity && item.donorId === identity.id;
  const isOwnerDonor = role === "donor" && isOwnListing;
  const myRequest = orgId ? requests.find((r) => r.organisationId === orgId) : null;
  // Category-based suggestions only (D-006, lib/needMatching.js). Own match first, then the other verified organisations.
  const ownMatch = orgId ? ownNeedMatch(needs, orgId, item) : null;
  const otherMatches = orgId ? otherVerifiedMatches(needs, organisations, item, orgId) : [];

  const onRequest = () => {
    requireLogin(async (loggedInIdentity) => {
      setRequestError(null);
      try {
        await createRequest({ itemId: item.id, organisationId: loggedInIdentity.organisationId });
        setJustRequested(true);
        refresh();
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
          {category?.[locale] ?? category?.en}
          {secondaryCategory && ` · ${secondaryCategory[locale] ?? secondaryCategory.en}`} · {area?.[locale] ?? area?.en}
        </p>

        {(ownMatch || otherMatches.length > 0) && (
          <div data-testid="item-match-summary" className="flex flex-col gap-1.5 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-700">
            {ownMatch && (
              <div data-testid="item-own-match" className="flex flex-col gap-0.5">
                <p className="font-bold">{t(ownMatch.urgent ? "itemMatch.matchesYouUrgent" : "itemMatch.matchesYou")}</p>
                <p>{t("screens.matchesNeedNote")}</p>
              </div>
            )}
            {otherMatches.length > 0 && (
              <div data-testid="item-other-matches" className="flex flex-col gap-0.5">
                <p className="font-semibold text-ink-700">{t("itemMatch.otherOrgsHeading")}</p>
                <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {otherMatches.map((org) => (
                    <li key={org.id}>
                      <Link to={ROUTES.organisation(org.id)} className="font-bold text-accent-600 hover:underline">
                        {t(org.urgent ? "itemMatch.otherOrgUrgentNeed" : "itemMatch.otherOrgNeed", { org: org.name[locale] ?? org.name.en })}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {item.quantity !== null && item.quantity !== undefined && (
          <p className="text-sm text-ink-700">
            <span className="font-semibold">{t("fields.quantity")}: </span>
            {formatQuantity(item.quantity, item.unit, t)}
          </p>
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

        {isOwnerDonor && (
          <div className="flex flex-col gap-2.5 border-t border-ink-600/10 pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600">
                {t("screens.orgRequestsHeading", { count: requests.length })}
              </span>
              {isRefreshing && (
                <span role="status" className="flex items-center gap-1.5 text-xs font-medium text-accent-700">
                  <Spinner /> {t("actions.updating")}
                </span>
              )}
            </div>
            {actionError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{translateError(actionError, t)}</p>}
            {requests.length === 0 ? (
              <p className="text-xs italic text-ink-600">{t("screens.noOrgRequests")}</p>
            ) : (
              requests.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  item={item}
                  organisation={organisations.find((o) => o.id === request.organisationId)}
                  busy={busy}
                  onAccept={accept}
                  onRevert={revert}
                />
              ))
            )}
          </div>
        )}

        {role === "organisation" && !isOwnListing && (item.status === ITEM_STATUS.available || myRequest) && (
          <>
            {myRequest || justRequested ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="w-fit rounded-full bg-good-100 px-4 py-2 text-sm font-semibold text-good-600">
                  {t(`requestStatus.${myRequest ? myRequest.status : "pending"}`)}
                </p>
                {/* Opens the thread for this item; the conversation itself is only created once a message is sent (D-075). */}
                <Link
                  to={ROUTES.chatCompose(item.id, orgId, item.donorId)}
                  className="rounded-full border border-accent-500 bg-white px-4 py-2 text-sm font-bold text-accent-700 hover:bg-accent-50"
                >
                  💬 {t("nav.chat")}
                </Link>
              </div>
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

        {item.status !== ITEM_STATUS.available && role === "organisation" && !myRequest && (
          <p className="text-sm text-ink-600">{t(`itemStatus.${item.status}`)}</p>
        )}
      </div>
    </div>
  );
}
