import { Link } from "react-router-dom";
import { CategoryIcon } from "./CategoryIcon.jsx";
import { StatusBadge } from "../status/StatusBadge.jsx";
import { Avatar } from "../common/Avatar.jsx";
import { useLocale } from "../../i18n/LocaleContext.jsx";
import { ROUTES } from "../../lib/constants.js";

/**
 * @param {{item: import('../../data/types.js').Item, categoryLabel: string, areaLabel: string, showStatus?: boolean}} props
 */
export function ItemCard({ item, categoryLabel, areaLabel, showStatus = false }) {
  const { locale } = useLocale();
  const photo = item.photoPaths?.[0];
  const displayTitle = locale === "vi" ? (item.titleVi ?? item.title) : item.title;

  return (
    <Link
      to={ROUTES.item(item.id)}
      className="group flex flex-col overflow-hidden rounded-card border border-ink-600/10 bg-white shadow-xs transition hover:border-accent-400 hover:shadow-sm"
    >
      <div className="aspect-square w-full overflow-hidden bg-cream-100">
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <CategoryIcon category={item.category} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-bold text-ink-800 group-hover:text-accent-600 transition-colors">{displayTitle}</p>
          {showStatus && <StatusBadge status={item.status} kind="item" />}
        </div>
        <div className="flex flex-col items-start gap-1 text-xs text-ink-600 font-medium">
          <span className="text-xs font-semibold text-ink-700">📍 {areaLabel}</span>
          <span className="inline-block rounded-full bg-cream-100 px-2.5 py-0.5 text-[10px] text-ink-600 border border-ink-600/10 font-medium">
            {categoryLabel}
          </span>
        </div>
        <div className="mt-auto pt-2 border-t border-ink-600/5 flex items-center gap-2">
          <Avatar name={item.donorName || "Donor"} type="donor" size="xs" />
          <span className="text-[11px] text-ink-600 font-medium truncate">{item.donorName || "Donor"}</span>
        </div>
      </div>
    </Link>
  );
}
