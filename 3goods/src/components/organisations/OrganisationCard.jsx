import { Link } from "react-router-dom";
import { useLocale } from "../../i18n/LocaleContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";
import { ROUTES } from "../../lib/constants.js";
import { Avatar } from "../common/Avatar.jsx";

/**
 * @param {{organisation: import('../../data/types.js').Organisation, areaLabel: string}} props
 */
export function OrganisationCard({ organisation, areaLabel }) {
  const { locale } = useLocale();
  const t = useTranslate();
  const orgName = organisation.name[locale] ?? organisation.name.en;

  return (
    <Link
      to={ROUTES.organisation(organisation.id)}
      className="flex flex-col justify-between gap-2.5 rounded-card border border-ink-600/10 bg-white p-4.5 shadow-xs transition hover:border-accent-400 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <Avatar name={orgName} id={organisation.id} type="organisation" size="md" />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-ink-800 hover:text-accent-600 truncate">{orgName}</p>
            {organisation.verified && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">✓ {t("screens.verifiedBadge")}</span>
            )}
          </div>
          <p className="text-[11px] text-ink-600">📍 {areaLabel}</p>
        </div>
      </div>
      <p className="line-clamp-2 text-xs text-ink-600/90 leading-relaxed">{organisation.mission[locale] ?? organisation.mission.en}</p>
      {organisation.isDemo && (
        <span className="self-start rounded-full bg-cream-100 px-2.5 py-0.5 text-[10px] font-medium text-ink-600 border border-ink-600/10">
          {t("screens.demoOrgBadge")}
        </span>
      )}
    </Link>
  );
}
