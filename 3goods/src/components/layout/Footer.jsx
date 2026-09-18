import { Link } from "react-router-dom";
import { useTranslate } from "../../i18n/useTranslate.js";
import { HeartHandshakeIcon } from "../icons.jsx";
import { ROUTES } from "../../lib/constants.js";

export function Footer() {
  const t = useTranslate();

  return (
    <footer className="mt-8 border-t border-ink-600/10 bg-white text-ink-700">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Brand & Copyright */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-500 text-white shadow-2xs">
            <HeartHandshakeIcon className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-ink-900 text-sm tracking-tight">{t("app.name")}</span>
          <span className="hidden sm:inline text-ink-300">•</span>
          <p className="hidden sm:block text-ink-600 font-medium">{t("footer.copyright")}</p>
        </div>

        {/* Navigation & Links */}
        <div className="flex flex-wrap items-center gap-4 font-medium text-ink-600 text-xs">
          <Link to={ROUTES.discoverNeeds} className="hover:text-accent-600 transition-colors">{t("nav.discoverNeeds")}</Link>
          <Link to={ROUTES.discoverItems} className="hover:text-accent-600 transition-colors">{t("nav.discover")}</Link>
          <Link to={ROUTES.map} className="hover:text-accent-600 transition-colors">🗺️ {t("nav.map")}</Link>
          <span className="text-ink-300">•</span>
          <span className="hover:underline cursor-pointer">{t("footer.privacy")}</span>
          <span className="hover:underline cursor-pointer">{t("footer.aboutUs")}</span>
          <span className="hover:underline cursor-pointer">{t("footer.contactUs")}</span>
        </div>
      </div>
    </footer>
  );
}
