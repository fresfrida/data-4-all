import { useLocale } from "../../i18n/LocaleContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";

export function LanguageSwitcher() {
  const { locale, setLocale, supportedLocales } = useLocale();
  const t = useTranslate();

  return (
    <div
      role="group"
      aria-label={t("a11y.languageSwitcher")}
      className="flex w-[80px] shrink-0 items-center justify-between rounded-full border border-ink-600/20 bg-white p-0.5 text-xs font-semibold shadow-2xs"
    >
      {supportedLocales.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
          className={`flex h-7 w-9 items-center justify-center rounded-full uppercase transition-colors ${
            locale === code ? "bg-accent-500 text-white shadow-xs font-bold" : "text-ink-600 hover:text-ink-800"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
