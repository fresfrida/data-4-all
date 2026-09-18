import { NavLink } from "react-router-dom";
import { useSession } from "../../context/SessionContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";
import { getNavItems } from "./navConfig.js";
import { LanguageSwitcher } from "../controls/LanguageSwitcher.jsx";
import { RoleSwitcher } from "../controls/RoleSwitcher.jsx";
import { DemoLoginButton } from "../controls/DemoLoginButton.jsx";
import { HeartHandshakeIcon } from "../icons.jsx";
import { ROUTES } from "../../lib/constants.js";

export function DesktopTopNav() {
  const session = useSession();
  const { role } = session;
  const t = useTranslate();
  const items = getNavItems(session, t);
  const homeRoute = role === "organisation" ? ROUTES.discoverItems : ROUTES.discoverNeeds;

  return (
    <header className="sticky top-0 z-30 hidden border-b border-ink-600/10 bg-white/95 backdrop-blur sm:block shadow-xs">
      <div className="mx-auto grid max-w-7xl grid-cols-[220px_1fr_220px] items-center px-6 py-3">
        {/* Brand Logo - Fixed Left Column */}
        <NavLink to="/" className="flex items-center gap-2.5 font-extrabold text-ink-900 tracking-tight text-lg justify-self-start">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white shadow-xs">
            <HeartHandshakeIcon className="h-5 w-5" />
          </div>
          <span className="shrink-0">{t("app.name")}</span>
        </NavLink>

        {/* Navigation Items - Fixed Centered Middle Column */}
        <nav aria-label={t("a11y.primaryNav")} className="flex items-center justify-center gap-2 justify-self-center">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex w-[128px] shrink-0 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold transition-all ${
                  isActive ? "bg-accent-100 text-accent-700 shadow-2xs" : "text-ink-600 hover:text-ink-900 hover:bg-cream-100"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Fixed Right Control Cluster - Fixed Right Column */}
        <div className="flex shrink-0 items-center gap-2.5 justify-self-end">
          <RoleSwitcher />
          <LanguageSwitcher />
          <DemoLoginButton />
        </div>
      </div>
    </header>
  );
}
