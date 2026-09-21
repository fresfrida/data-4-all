import { useEffect, useState } from "react";
import { useSession } from "../../context/SessionContext.jsx";
import { useAsync } from "../../lib/useAsync.js";
import { getLoginIdentities } from "../../services/usersService.js";
import { getAreas } from "../../services/referenceDataService.js";
import { useLocale } from "../../i18n/LocaleContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";
import { LoadingState } from "../feedback/LoadingState.jsx";
import { ErrorState } from "../feedback/ErrorState.jsx";

async function loadIdentities() {
  const [identities, areas] = await Promise.all([getLoginIdentities(), getAreas()]);
  return { identities, areas };
}

/** Second step: pick which seeded donor / organisation to log in as (D-051). */
function IdentityPicker({ role, onPick, onBack }) {
  const { status, data, reload } = useAsync(loadIdentities, []);
  const { locale } = useLocale();
  const t = useTranslate();

  const isOrg = role === "organisation";
  const list = data ? (isOrg ? data.identities.organisations : data.identities.donors) : [];
  const areaLabel = (areaId) => {
    const area = data.areas.find((a) => a.id === areaId);
    return area?.[locale] ?? area?.en;
  };

  return (
    <>
      <p className="mb-3 text-sm font-medium text-ink-800">{t(isOrg ? "demo.chooseOrganisation" : "demo.chooseDonor")}</p>
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState message={t("errors.generic")} onRetry={reload} />}
      {status === "success" && (
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {list.length === 0 && <p className="py-2 text-sm text-ink-600">{t("demo.noAccounts")}</p>}
          {list.map((identity) => (
            <button
              key={identity.id}
              type="button"
              onClick={() => onPick(identity)}
              className="flex flex-col items-start rounded-2xl border border-ink-600/15 bg-white px-4 py-2.5 text-left hover:border-accent-400"
            >
              <span className="text-sm font-semibold text-ink-800">{isOrg ? identity.orgName[locale] ?? identity.name : identity.name}</span>
              {isOrg && <span className="text-xs text-ink-600">📍 {areaLabel(identity.areaId)}</span>}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onBack}
        className="mt-3 px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-800"
      >
        ← {t("demo.back")}
      </button>
    </>
  );
}

/**
 * Rendered once, near the root (AppShell), gated on
 * session.loginPromptOpen. Any action anywhere in the app can trigger it
 * via `requireLogin(action)` from SessionContext — see CLAUDE.md.
 * Step 1 picks the role; step 2 picks a specific seeded account.
 */
export function DemoLoginPrompt() {
  const { loginPromptOpen, resolveLoginPrompt, dismissLoginPrompt } = useSession();
  const t = useTranslate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!loginPromptOpen) setRole(null);
  }, [loginPromptOpen]);

  if (!loginPromptOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("demo.loginPrompt")}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 sm:items-center"
      onClick={dismissLoginPrompt}
    >
      <div
        className="w-full max-w-sm rounded-t-card bg-cream-50 p-6 shadow-xl sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-base font-semibold text-ink-800">{t("demo.loginPrompt")}</p>
        <p className="mb-5 text-xs text-ink-600">{t("demo.notSecure")}</p>
        {role ? (
          <IdentityPicker role={role} onPick={resolveLoginPrompt} onBack={() => setRole(null)} />
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setRole("donor")}
              className="rounded-full bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600"
            >
              {t("demo.loginAsDonor")}
            </button>
            <button
              type="button"
              onClick={() => setRole("organisation")}
              className="rounded-full border border-accent-500 px-4 py-2.5 text-sm font-semibold text-accent-700 hover:bg-accent-50"
            >
              {t("demo.loginAsOrganisation")}
            </button>
            <button
              type="button"
              onClick={dismissLoginPrompt}
              className="mt-1 px-4 py-2 text-sm font-medium text-ink-600 hover:text-ink-800"
            >
              {t("actions.cancel")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
