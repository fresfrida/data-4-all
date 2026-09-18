import { useTranslate } from "../../i18n/useTranslate.js";

export function LoadingState({ label }) {
  const t = useTranslate();
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-10 text-sm text-ink-600">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-accent-400 border-t-transparent"
        aria-hidden="true"
      />
      {label ?? t("a11y.loading")}
    </div>
  );
}
