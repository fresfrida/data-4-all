import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getItems, reopenItemAvailability } from "../services/itemsService.js";
import { getRequests, acceptRequest, revertRequestToPending, deriveDisplayStatus } from "../services/requestsService.js";
import { getOrganisations } from "../services/organisationsService.js";
import { getConversations } from "../services/chatService.js";
import { useSession } from "../context/SessionContext.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { StatusBadge } from "../components/status/StatusBadge.jsx";
import { Avatar } from "../components/common/Avatar.jsx";
import { ROUTES } from "../lib/constants.js";

async function loadMyDonations(donorId) {
  const [items, organisations, conversations] = await Promise.all([
    getItems({ donorId }),
    getOrganisations(),
    getConversations({ donorId }),
  ]);
  const requestsByItem = {};
  for (const item of items) {
    requestsByItem[item.id] = await getRequests({ itemId: item.id });
  }
  return { items, organisations, requestsByItem, conversations };
}

/** Donor's own profile + donation/request tracking. */
export function Me() {
  const { role, isLoggedIn, identity, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const donorId = identity?.id;
  const { status, data, error, reload } = useAsync(() => loadMyDonations(donorId), [donorId]);

  if (!isLoggedIn) {
    return (
      <EmptyState
        title={t("screens.guestBrowsingTitle")}
        hint={t("demo.notSecure")}
        action={
          <button
            type="button"
            onClick={() => requireLogin(() => {})}
            className="rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
          >
            {t("demo.loginAsDonor")}
          </button>
        }
      />
    );
  }

  if (role !== "donor") {
    return (
      <div className="rounded-card border border-dashed border-ink-600/20 bg-white/60 p-6 text-center text-sm text-ink-600">
        {t("screens.meRoleGate")}
      </div>
    );
  }

  if (status === "loading" || !data) return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  const getOrg = (orgId) => data.organisations.find((o) => o.id === orgId);

  const onAccept = (requestId) => {
    requireLogin(async () => {
      await acceptRequest(requestId);
      reload();
    });
  };

  const onRevertRequest = (requestId) => {
    requireLogin(async () => {
      await revertRequestToPending(requestId);
      reload();
    });
  };

  const onReopen = (itemId) => {
    requireLogin(async () => {
      await reopenItemAvailability(itemId);
      reload();
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-6">
      <div className="flex items-center gap-3 bg-white p-5 rounded-card border border-ink-600/10 shadow-xs">
        <Avatar name={identity.name} type="donor" size="lg" />
        <div>
          <h1 className="text-xl font-extrabold text-ink-800">{identity.name}</h1>
          <p className="text-xs text-ink-600 font-medium">
            Donor Account •{" "}
            <Link to={ROUTES.discoverNeeds} className="font-semibold text-accent-600 hover:underline">
              {t("nav.organisations")}
            </Link>
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-ink-800">{t("screens.myDonationsHeading")}</h2>
          <span className="text-xs font-semibold text-ink-600">{data.items.length} items listed</span>
        </div>

        {data.items.length === 0 ? (
          <EmptyState title={t("emptyStates.noItems")} hint={t("screens.postFirstDonationHint")} />
        ) : (
          <div className="flex flex-col gap-4">
            {data.items.map((item) => {
              const requests = data.requestsByItem[item.id] || [];

              return (
                <div key={item.id} className="rounded-card border border-ink-600/10 bg-white p-5 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 border-b border-ink-600/5 pb-3">
                    <div>
                      <Link to={ROUTES.item(item.id)} className="text-sm font-bold text-ink-800 hover:text-accent-600 transition-colors">
                        {item.title}
                      </Link>
                      <p className="text-xs text-ink-600">Category: {item.category} • Area: {item.areaId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} kind="item" />
                    </div>
                  </div>

                  {requests.length > 0 ? (
                    <div className="flex flex-col gap-2.5 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600">Organisation Requests ({requests.length})</span>
                      {requests.map((request) => {
                        const org = getOrg(request.organisationId);
                        const orgName = org?.name[locale] ?? org?.name.en ?? request.organisationId;
                        const displayStatus = deriveDisplayStatus(request, item);
                        const matchedConversation = data.conversations.find((c) => c.requestId === request.id);

                        return (
                          <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-cream-50 border border-ink-600/10">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={orgName} id={request.organisationId} type="organisation" size="sm" />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-ink-800">{orgName}</span>
                                <span className="text-[10px] text-ink-600">Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                              {matchedConversation && (
                                <Link
                                  to={ROUTES.chatDetail(matchedConversation.id)}
                                  className="rounded-full border border-accent-500 bg-white px-3.5 py-1 text-xs font-bold text-accent-700 hover:bg-accent-50 transition-all"
                                >
                                  💬 {t("nav.chat")}
                                </Link>
                              )}

                              <StatusBadge status={displayStatus} />

                              {request.status === "requested" && (
                                <button
                                  type="button"
                                  onClick={() => onAccept(request.id)}
                                  className="rounded-full bg-accent-500 px-3.5 py-1 text-xs font-bold text-white hover:bg-accent-600 transition-all shadow-2xs"
                                >
                                  {t("actions.accept")}
                                </button>
                              )}

                              {request.status !== "requested" && (
                                <button
                                  type="button"
                                  onClick={() => onRevertRequest(request.id)}
                                  className="rounded-full border border-accent-300 bg-accent-50 px-3 py-1 text-[11px] font-bold text-accent-700 hover:bg-accent-100 transition-all shadow-2xs"
                                  title="Undo request status and set back to pending"
                                >
                                  {request.status === "completed" ? t("actions.reopen") : t("actions.undo")}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-600 italic">No organisation requests yet for this item.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
