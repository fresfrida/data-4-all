import { useState } from "react";
import { useAsync } from "../lib/useAsync.js";
import { getNeeds, createNeed, setNeedPriority, removeNeed } from "../services/needsService.js";
import { getCategories, getTagsForCategory } from "../services/referenceDataService.js";
import { translateError } from "../lib/errors.js";
import { useSession } from "../context/SessionContext.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { ErrorState } from "../components/feedback/ErrorState.jsx";
import { EmptyState } from "../components/feedback/EmptyState.jsx";
import { NeedChip } from "../components/needs/NeedChip.jsx";

async function loadNeedsManagement(organisationId) {
  const [needs, categories] = await Promise.all([getNeeds({ organisationId }), getCategories()]);
  const tagLabelsByCategory = {};
  for (const c of categories) tagLabelsByCategory[c.id] = await getTagsForCategory(c.id);
  return { needs, categories, tagLabelsByCategory };
}

/** Organisation publishes/edits its own "we currently need" list. */
export function NeedsManagement() {
  const { role, identity, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const organisationId = identity?.organisationId;
  const { status, data, error, reload } = useAsync(() => loadNeedsManagement(organisationId), [organisationId]);

  const [category, setCategory] = useState("");
  const [tagOptions, setTagOptions] = useState([]);
  const [tag, setTag] = useState("");
  const [priority, setPriority] = useState(false);
  // Raw error object, not a pre-translated string — see D-017.
  const [formError, setFormError] = useState(null);

  if (role !== "organisation") {
    return (
      <div className="rounded-card border border-dashed border-ink-600/20 bg-white/60 p-6 text-center text-sm text-ink-600">
        {t("screens.needsManagementRoleGate")}
      </div>
    );
  }

  if (status === "loading" || !data) return <LoadingState />;
  if (status === "error") return <ErrorState message={t("errors.generic")} onRetry={reload} />;

  const onCategoryChange = async (nextCategory) => {
    setCategory(nextCategory);
    setTag("");
    setTagOptions(await getTagsForCategory(nextCategory));
  };

  const onAdd = (e) => {
    e.preventDefault();
    setFormError(null);
    requireLogin(async () => {
      try {
        await createNeed({ organisationId: identity.organisationId, category, tag, priority });
        setCategory("");
        setTag("");
        setPriority(false);
        setTagOptions([]);
        reload();
      } catch (err) {
        setFormError(err);
      }
    });
  };

  const onRemove = (needId) => {
    requireLogin(async () => {
      await removeNeed(needId);
      reload();
    });
  };

  const onTogglePriority = (need) => {
    requireLogin(async () => {
      await setNeedPriority(need.id, !need.priority);
      reload();
    });
  };

  const categoryLabel = (id) => data.categories.find((c) => c.id === id)?.[locale] ?? id;
  const tagLabel = (categoryId, tagId) =>
    data.tagLabelsByCategory[categoryId]?.find((o) => o.id === tagId)?.[locale] ?? tagId;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-ink-800">{t("screens.needsHeading")}</h1>
        <p className="text-sm text-ink-600">{t("screens.needsIntro")}</p>
      </div>

      {data.needs.length === 0 ? (
        <EmptyState title={t("emptyStates.noNeeds")} />
      ) : (
        <div className="flex flex-col gap-2">
          {data.needs.map((need) => (
            <div key={need.id} className="flex items-center justify-between gap-2 rounded-card border border-ink-600/10 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink-600">{categoryLabel(need.category)}</span>
                <NeedChip label={tagLabel(need.category, need.tag)} priority={need.priority} onRemove={() => onRemove(need.id)} />
              </div>
              <button type="button" onClick={() => onTogglePriority(need)} className="text-xs font-medium text-accent-600 hover:underline">
                {need.priority ? t("actions.unmarkPriority") : t("actions.markPriority")}
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={onAdd} className="flex flex-col gap-3 rounded-card border border-ink-600/10 bg-white p-4">
        <p className="text-sm font-semibold text-ink-800">{t("actions.addNeed")}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            required
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="flex-1 rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              {t("fields.category")}
            </option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c[locale] ?? c.en}
              </option>
            ))}
          </select>
          <select
            required
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            disabled={!category}
            className="flex-1 rounded-lg border border-ink-600/20 px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="" disabled>
              {t("fields.needTags")}
            </option>
            {tagOptions.map((tagOption) => (
              <option key={tagOption.id} value={tagOption.id}>
                {tagOption[locale] ?? tagOption.en}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
          {t("fields.markAsPriority")}
        </label>
        {formError && <p className="text-sm text-red-700">{translateError(formError, t)}</p>}
        <button type="submit" className="w-fit rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600">
          {t("actions.addNeed")}
        </button>
      </form>
    </div>
  );
}
