import { useTranslate } from "../../i18n/useTranslate.js";

/**
 * One shared badge for both item status (available / reserved / collected / unavailable) and request status
 * (pending / accepted / declined). It only ever displays a stored status — nothing is derived here or anywhere else (D-075).
 * Colour comes from a small fixed map, so a new status means editing this one object.
 */
const STYLE_BY_STATUS = {
  available: "bg-good-100 text-good-600",
  reserved: "bg-accent-100 text-accent-700",
  collected: "bg-good-100 text-good-600",
  unavailable: "bg-ink-600/10 text-ink-600",
  pending: "bg-accent-100 text-accent-700",
  accepted: "bg-accent-100 text-accent-700",
  declined: "bg-ink-600/10 text-ink-600",
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
