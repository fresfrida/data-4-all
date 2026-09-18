import { useTranslate } from "../../i18n/useTranslate.js";

/**
 * One shared badge for both item status and request status. Colour is
 * derived from a small fixed map here — adding a new status value later
 * means editing this one object, not hunting through screens (OCP).
 */
const STYLE_BY_STATUS = {
  available: "bg-good-100 text-good-600",
  requested: "bg-accent-100 text-accent-700",
  accepted: "bg-accent-100 text-accent-700",
  arranging_collection: "bg-accent-100 text-accent-700",
  reserved: "bg-accent-100 text-accent-700",
  completed: "bg-good-100 text-good-600",
  declined: "bg-ink-600/10 text-ink-600",
  unavailable: "bg-ink-600/10 text-ink-600",
};

export function StatusBadge({ status, kind = "request" }) {
  const t = useTranslate();
  const dictKey = kind === "item" ? "itemStatus" : "requestStatus";
  const label = t(`${dictKey}.${status}`);
  const style = STYLE_BY_STATUS[status] ?? "bg-ink-600/10 text-ink-600";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
