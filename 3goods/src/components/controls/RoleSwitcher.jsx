import { useSession } from "../../context/SessionContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";

/**
 * Testing tool, kept visible per the product spec ("keep the role switcher
 * available for testing") — distinct from demo login (D-004). Flipping
 * this changes which nav/UI renders regardless of login state.
 */
export function RoleSwitcher() {
  const { role, setRole } = useSession();
  const t = useTranslate();

  return (
    <div
      role="group"
      aria-label={t("role.switchLabel")}
      className="flex shrink-0 items-center rounded-full border border-ink-600/20 bg-white p-0.5 text-xs font-semibold shadow-2xs"
    >
      {["donor", "organisation"].map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={role === r}
          onClick={() => setRole(r)}
          className={`flex h-7 w-24 sm:w-28 items-center justify-center rounded-full text-center truncate transition-colors ${
            role === r ? "bg-ink-900 text-white shadow-xs font-bold" : "text-ink-600 hover:text-ink-800"
          }`}
        >
          {t(`role.${r}`)}
        </button>
      ))}
    </div>
  );
}
