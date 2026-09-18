import { NavLink } from "react-router-dom";
import { useSession } from "../../context/SessionContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";
import { getNavItems } from "./navConfig.js";

/** Exactly the five role-specific items, End(exact) match on donor `/` so Discover Needs doesn't fight the tab bar for "active" state incorrectly. */
export function MobileBottomNav() {
  const session = useSession();
  const t = useTranslate();
  const items = getNavItems(session, t);

  return (
    <nav
      aria-label={t("a11y.primaryNav")}
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-600/10 bg-cream-50/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map(({ to, label, Icon, emphasise }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              isActive ? "text-accent-600" : "text-ink-600"
            }`
          }
        >
          {emphasise ? (
            <span className="-mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 text-white shadow-md">
              <Icon className="h-5 w-5" />
            </span>
          ) : (
            <Icon className="h-5 w-5" />
          )}
          <span className={emphasise ? "sr-only" : ""}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
