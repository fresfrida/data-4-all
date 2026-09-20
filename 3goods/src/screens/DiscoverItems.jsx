import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getItems } from "../services/itemsService.js";
import { getAreas, getCategories } from "../services/referenceDataService.js";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { ItemCard } from "../components/items/ItemCard.jsx";
import { ItemGrid } from "../components/items/ItemGrid.jsx";
import { Pagination } from "../components/controls/Pagination.jsx";

/** Items per page: divisible by 2, 3 and 4, so the grid rows fill evenly at every breakpoint. */
const PAGE_SIZE = 12;

async function loadDiscoverItems() {
  const [items, areas, categories] = await Promise.all([getItems(), getAreas(), getCategories()]);
  return { items, areas, categories };
}

/** "/discover" — every listed item, available ones first, with the accepted/donated ones below carrying a status banner (D-067). Paginated (D-068). */
export function DiscoverItems() {
  const { status, data, error, reload } = useAsync(loadDiscoverItems, []);
  const { locale } = useLocale();
  const t = useTranslate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  // The page lives in the URL (?page=2) so Back from an item lands on the same page.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter && item.secondaryCategory !== categoryFilter) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, search, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Number.isInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), pageCount) : 1;
  const goToPage = (next) => {
    setSearchParams(next <= 1 ? {} : { page: String(next) }, { replace: false });
    document.querySelector("main")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  };
  // Changing the search or category always starts again from page 1.
  const resetPage = () => {
    if (searchParams.has("page")) setSearchParams({}, { replace: true });
  };

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  const areaLabel = (areaId) => {
    const area = data.areas.find((a) => a.id === areaId);
    return area?.[locale] ?? area?.en ?? areaId;
  };
  const categoryLabel = (categoryId) => {
    const category = data.categories.find((c) => c.id === categoryId);
    return category?.[locale] ?? category?.en ?? categoryId;
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink-800">{t("screens.discoverAvailableGoodsTitle")}</h1>
        <p className="text-sm text-ink-600">{t("screens.discoverItemsIntro")}</p>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          resetPage();
        }}
        placeholder={t("screens.searchItems")}
        className="rounded-full border border-ink-600/20 bg-white px-4 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setCategoryFilter(null);
            resetPage();
          }}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            categoryFilter === null ? "bg-ink-800 text-white" : "bg-white text-ink-600 border border-ink-600/20"
          }`}
        >
          {t("screens.allFilter")}
        </button>
        {data.categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {
              setCategoryFilter(category.id);
              resetPage();
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              categoryFilter === category.id ? "bg-ink-800 text-white" : "bg-white text-ink-600 border border-ink-600/20"
            }`}
          >
            {category[locale] ?? category.en}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t("emptyStates.noItems")} />
      ) : (
        <ItemGrid>
          {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              categoryLabel={categoryLabel(item.category)}
              secondaryCategoryLabel={item.secondaryCategory ? categoryLabel(item.secondaryCategory) : undefined}
              areaLabel={areaLabel(item.areaId)}
            />
          ))}
        </ItemGrid>
      )}

      <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={goToPage} />
    </div>
  );
}
