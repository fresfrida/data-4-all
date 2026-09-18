import { useMemo, useState } from "react";
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

async function loadDiscoverItems() {
  const [items, areas, categories] = await Promise.all([getItems(), getAreas(), getCategories()]);
  return { items, areas, categories };
}

/** Organisation home ("/discover") — browse currently available items. */
export function DiscoverItems() {
  const { status, data, error, reload } = useAsync(loadDiscoverItems, []);
  const { locale } = useLocale();
  const t = useTranslate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter && item.secondaryCategory !== categoryFilter) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, search, categoryFilter]);

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
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("screens.searchItems")}
        className="rounded-full border border-ink-600/20 bg-white px-4 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter(null)}
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
            onClick={() => setCategoryFilter(category.id)}
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
          {filtered.map((item) => (
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
    </div>
  );
}
