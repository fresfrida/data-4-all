import { useSession } from "../../context/SessionContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";

/**
 * Rendered once, near the root (AppShell), gated on
 * session.loginPromptOpen. Any action anywhere in the app can trigger it
 * via `requireLogin(action)` from SessionContext — see CLAUDE.md.
 */
export function DemoLoginPrompt() {
  const { loginPromptOpen, resolveLoginPrompt, dismissLoginPrompt } = useSession();
  const t = useTranslate();

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
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => resolveLoginPrompt("donor")}
            className="rounded-full bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-600"
          >
            {t("demo.loginAsDonor")}
          </button>
          <button
            type="button"
            onClick={() => resolveLoginPrompt("organisation")}
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
      </div>
    </div>
  );
}
