import { NavLink } from "react-router-dom";
import { useTranslate } from "../../i18n/useTranslate.js";
import { LanguageSwitcher } from "../controls/LanguageSwitcher.jsx";
import { DemoLoginButton } from "../controls/DemoLoginButton.jsx";
import { HeartHandshakeIcon } from "../icons.jsx";

export function MobileHeader() {
  const t = useTranslate();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-600/10 bg-cream-50/95 px-4 py-2.5 backdrop-blur sm:hidden">
      <div className="flex items-center justify-between gap-2">
        <NavLink to="/" className="flex items-center gap-1.5 font-semibold text-ink-800">
          <HeartHandshakeIcon className="h-5 w-5 text-accent-600" />
          <span>{t("app.name")}</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <DemoLoginButton />
        </div>
      </div>
    </header>
  );
}
