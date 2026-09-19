import { useTranslate } from "../../i18n/useTranslate.js";

/**
 * @param {{label: string, quantityLabel?: string, priority?: boolean, onRemove?: () => void}} props
 * `quantityLabel` is pre-formatted (e.g. "50 kg") via lib/quantity.js.
 */
export function NeedChip({ label, quantityLabel, priority = false, onRemove }) {
  const t = useTranslate();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
        priority ? "bg-accent-100 text-accent-700" : "bg-cream-200 text-ink-700"
      }`}
    >
      {priority && <span aria-hidden="true">★</span>}
      {label}
      {quantityLabel && <span className="font-semibold opacity-80">· {quantityLabel}</span>}
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
