/**
 * Services never throw pre-rendered English sentences — they throw an
 * `AppError` carrying a language-independent code (and optional
 * interpolation params), so the same failure reads correctly in whichever
 * language the *viewer* currently has selected. The code doubles as the
 * translation key under `validation.*` in `src/i18n/locales/{en,vi}.json`.
 */
export class AppError extends Error {
  constructor(code, params) {
    super(code);
    this.name = "AppError";
    this.code = code;
    this.params = params ?? null;
  }
}

/**
 * The one place a screen turns a caught error into display text. Use this
 * instead of reading `err.message` directly, so a wording change only ever
 * needs a translation-file edit, never a screen edit.
 */
export function translateError(err, t) {
  if (err instanceof AppError) return t(`validation.${err.code}`, err.params ?? undefined);
  return t("errors.generic");
}
