import { useTranslate } from "../../i18n/useTranslate.js";

/**
 * @param {{label: string, priority?: boolean, onRemove?: () => void}} props
 */
export function NeedChip({ label, priority = false, onRemove }) {
  const t = useTranslate();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
        priority ? "bg-accent-100 text-accent-700" : "bg-cream-200 text-ink-700"
      }`}
    >
      {priority && <span aria-hidden="true">★</span>}
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("a11y.removeChip", { label })}
          className="ml-0.5 text-ink-600 hover:text-red-700"
        >
          ×
        </button>
      )}
    </span>
  );
}
