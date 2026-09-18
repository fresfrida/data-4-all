import { Link } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { useSession } from "../context/SessionContext.jsx";
import { getOrganisations } from "../services/organisationsService.js";
import { getAreaById } from "../services/referenceDataService.js";
import { getDonorCount } from "../services/usersService.js";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { ROUTES } from "../lib/constants.js";

async function loadHomeStats() {
  const [organisations, donorCount] = await Promise.all([getOrganisations(), getDonorCount()]);
  const areaCache = {};
  for (const org of organisations) {
    if (!areaCache[org.areaId]) areaCache[org.areaId] = await getAreaById(org.areaId);
  }
  return { orgsCount: organisations.length, donorCount, areaCount: Object.keys(areaCache).length };
}

/**
 * Landing page ("/") — hero only. Browsing (needs board / items board) lives
 * on its own dedicated page now, same pattern as Discover Items — see
 * DECISIONS.md D-049.
 */
export function Home() {
  const { status, data, error, reload } = useAsync(loadHomeStats, []);
  const { role, identity } = useSession();
  const t = useTranslate();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  return (
    <section className="relative w-full overflow-hidden bg-sky-950 py-12 sm:py-20 px-4 sm:px-8 text-white shadow-md border-b border-ink-600/10">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-85 scale-105 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url('/hero_bg.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-sky-950/80 via-blue-900/40 to-sky-950/70 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl flex flex-col justify-between gap-6 min-h-[300px]">
        <div className="flex flex-col gap-4">
          {/* Context pill: guest vs logged-in identity+role, never both/neither (D-045) */}
          <div className="flex flex-col items-start gap-2">
            {identity ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-medium backdrop-blur-md border border-white/25 text-white shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>👤 {t("demo.loggedInAs", { name: identity.name })} · {t(`role.${role}`)}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-medium backdrop-blur-md border border-white/25 text-white shadow-xs">
                <span>{t("demo.browsingAsGuest")}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
              {t("hero.title")}
            </h1>
            <p className="text-xs sm:text-base text-sky-100/95 leading-relaxed font-medium max-w-xl drop-shadow-xs">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* Action Buttons — donor gets the Donate CTA; guest and organisation both browse items */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {role === "donor" ? (
              <Link
                to={ROUTES.donateNew}
                className="inline-flex items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-accent-600 transition-all active:scale-95 min-w-[160px]"
              >
                + {t("hero.ctaDonate")}
              </Link>
            ) : (
              <Link
                to={ROUTES.discoverItems}
                className="inline-flex items-center justify-center rounded-full bg-accent-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-accent-600 transition-all active:scale-95 min-w-[160px]"
              >
                📦 {t("hero.ctaBrowse")}
              </Link>
            )}
            <Link
              to={ROUTES.map}
              className="inline-flex items-center justify-center rounded-full bg-white/95 px-6 py-3 text-sm font-bold text-ink-900 backdrop-blur-md border border-white hover:bg-white transition-all active:scale-95 min-w-[160px] shadow-md"
            >
              🗺️ {t("hero.ctaMap")}
            </Link>
          </div>
        </div>

        {/* Impact Stats Banner — real counts from the DB, not hardcoded */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-5 border-t border-white/20">
          <div className="flex flex-col bg-sky-950/50 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md border border-white/20">
            <span className="text-xl sm:text-3xl font-black text-white">{data.donorCount}</span>
            <span className="text-[10px] sm:text-xs text-sky-100 font-semibold truncate">{t("hero.statDonors")}</span>
          </div>
          <div className="flex flex-col bg-sky-950/50 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md border border-white/20">
            <span className="text-xl sm:text-3xl font-black text-white">{data.orgsCount}</span>
            <span className="text-[10px] sm:text-xs text-sky-100 font-semibold truncate">{t("hero.statOrgs")}</span>
          </div>
          <div className="flex flex-col bg-sky-950/50 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md border border-white/20">
            <span className="text-xl sm:text-3xl font-black text-white">{data.areaCount}</span>
            <span className="text-[10px] sm:text-xs text-sky-100 font-semibold truncate">{t("hero.statAreas")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
