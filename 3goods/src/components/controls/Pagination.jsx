import { useTranslate } from "../../i18n/useTranslate.js";

/** Page numbers to show: always first and last, the current page and its neighbours, with "…" for the gaps. */
function pageWindow(page, pageCount) {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

/**
 * Previous / numbered pages / Next, plus a "Showing 13–24 of 41" line. Renders nothing when everything fits on one page.
 * @param {{page: number, pageCount: number, total: number, pageSize: number, onPageChange: (page: number) => void}} props
 */
export function Pagination({ page, pageCount, total, pageSize, onPageChange }) {
  const t = useTranslate();
  if (pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const buttonBase = "flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition";

  return (
    <nav aria-label={t("pagination.label")} className="flex flex-col items-center gap-2 pt-2">
      <p className="text-xs text-ink-600" aria-live="polite">
        {t("pagination.showing", { from, to, total })}
      </p>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={`${buttonBase} border border-ink-600/20 bg-white text-ink-700 hover:border-accent-400 disabled:opacity-40 disabled:hover:border-ink-600/20`}
          >
            ‹ {t("pagination.previous")}
          </button>
        </li>
        {pageWindow(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-600">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={t("pagination.page", { page: p })}
                className={`${buttonBase} ${
                  p === page ? "bg-ink-800 text-white" : "border border-ink-600/20 bg-white text-ink-700 hover:border-accent-400"
                }`}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            className={`${buttonBase} border border-ink-600/20 bg-white text-ink-700 hover:border-accent-400 disabled:opacity-40 disabled:hover:border-ink-600/20`}
          >
            {t("pagination.next")} ›
          </button>
        </li>
      </ul>
    </nav>
  );
}
