import { useSession } from "../../context/SessionContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";

/**
 * Visible, explicitly-labelled login/logout control (not just the implicit
 * gate on posting/requesting) — per "add clearly labelled demo login and
 * logout."
 */
export function DemoLoginButton() {
  const { isLoggedIn, logout, requireLogin } = useSession();
  const t = useTranslate();

  if (isLoggedIn) {
    return (
      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-ink-600/20 px-3.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-800/5 transition-colors whitespace-nowrap"
      >
        {t("demo.logout")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => requireLogin(() => {})}
      className="rounded-full bg-accent-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-600 transition-colors whitespace-nowrap"
    >
      {t("demo.loginPrompt")}
    </button>
  );
}
