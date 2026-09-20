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
          <p className="hidden sm:block text-ink-600 font-medium">
            {t("footer.copyrightLine1")}
            <br />
            {t("footer.copyrightLine2")}
          </p>
        </div>

        {/* Navigation & Links: site links on the top line, legal links on the bottom line */}
        <div className="flex flex-col items-center md:items-end gap-2 font-medium text-ink-600 text-xs">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to={ROUTES.discoverNeeds} className="hover:text-accent-600 transition-colors">{t("nav.organisations")}</Link>
            <Link to={ROUTES.discoverItems} className="hover:text-accent-600 transition-colors">{t("nav.itemsDonated")}</Link>
            <Link to={ROUTES.map} className="hover:text-accent-600 transition-colors">🗺️ {t("nav.map")}</Link>
            {/* Plain <a>, not <Link>: /video is a Vercel redirect (vercel.json), not a client-side route. */}
            <a href="/video" target="_blank" rel="noopener noreferrer" className="hover:text-accent-600 transition-colors">▶ {t("footer.watchVideo")}</a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <span className="hover:underline cursor-pointer">{t("footer.privacy")}</span>
            <span className="hover:underline cursor-pointer">{t("footer.aboutUs")}</span>
            <span className="hover:underline cursor-pointer">{t("footer.contactUs")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
