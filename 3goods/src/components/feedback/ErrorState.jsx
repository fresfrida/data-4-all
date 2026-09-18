import { useTranslate } from "../../i18n/useTranslate.js";

export function ErrorState({ message, onRetry }) {
  const t = useTranslate();
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-red-50 px-6 py-8 text-center">
      <p className="text-sm font-medium text-red-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
        >
          {t("actions.tryAgain")}
        </button>
      )}
    </div>
  );
}
