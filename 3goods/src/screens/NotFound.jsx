import { Link } from "react-router-dom";
import { useTranslate } from "../i18n/useTranslate.js";
import { ROUTES } from "../lib/constants.js";

export function NotFound() {
  const t = useTranslate();
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-sm font-medium text-ink-700">{t("screens.notFoundTitle")}</p>
      <Link to={ROUTES.discoverNeeds} className="text-sm font-semibold text-accent-600 hover:underline">
        {t("actions.backToHome")}
      </Link>
    </div>
  );
}
