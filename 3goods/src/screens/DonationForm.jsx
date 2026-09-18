import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsync } from "../lib/useAsync.js";
import { getAreas, getCategories, getTagsForCategory } from "../services/referenceDataService.js";
import { createDonation } from "../services/itemsService.js";
import { uploadItemPhotos } from "../services/storageService.js";
import { translateError } from "../lib/errors.js";
import { useSession } from "../context/SessionContext.jsx";
import { useLocale } from "../i18n/LocaleContext.jsx";
import { useTranslate } from "../i18n/useTranslate.js";
import { LoadingState } from "../components/feedback/LoadingState.jsx";
import { NeedChip } from "../components/needs/NeedChip.jsx";
import { ROUTES } from "../lib/constants.js";

async function loadFormReferenceData() {
  const [areas, categories] = await Promise.all([getAreas(), getCategories()]);
  return { areas, categories };
}

/** Donor posts a donation. Gated to donor role + demo login (D-004/D-005). */
export function DonationForm() {
  const { status, data } = useAsync(loadFormReferenceData, []);
  const { role, identity, requireLogin } = useSession();
  const { locale } = useLocale();
  const t = useTranslate();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [condition, setCondition] = useState("");
  const [areaId, setAreaId] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryOption, setDeliveryOption] = useState("pickup_only");
  const [windowInput, setWindowInput] = useState("");
  const [collectionWindows, setCollectionWindows] = useState([]);
  const [notes, setNotes] = useState("");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  // Stores the raw error (or null), never a pre-translated string — so a
  // language switch while this error is showing re-renders it correctly
  // instead of freezing it in whatever language was active when it was
  // thrown (found during 3G-017 verification; see DECISIONS.md D-017).
  const [submitError, setSubmitError] = useState(null);
  const [tagOptions, setTagOptions] = useState([]);

  if (status === "loading" || !data) return <LoadingState />;

  if (role !== "donor") {
    return (
      <div className="rounded-card border border-dashed border-ink-600/20 bg-white/60 p-6 text-center text-sm text-ink-600">
        {t("screens.donationFormRoleGate")}
      </div>
    );
  }

  const onCategoryChange = async (nextCategory) => {
    setCategory(nextCategory);
    setTags([]);
    setTagOptions(await getTagsForCategory(nextCategory));
  };

  const toggleTag = (tagId) => {
    setTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const addWindow = () => {
    if (!windowInput.trim()) return;
    setCollectionWindows((prev) => [...prev, windowInput.trim()]);
    setWindowInput("");
  };

  const onPhotosSelected = (e) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoFiles(files);
    setPhotoPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const doSubmit = async () => {
    setSubmitError(null);
    try {
      setUploadingPhotos(photoFiles.length > 0);
      const photoPaths = photoFiles.length > 0 ? await uploadItemPhotos(photoFiles) : [];
      setUploadingPhotos(false);

      const item = await createDonation({
        donorId: identity.id,
        donorName: identity.name,
        title,
        category,
        needTags: tags,
        condition,
        areaId,
        description,
        deliveryOption,
        collectionWindows,
        notes,
        photoPaths,
      });
      navigate(ROUTES.item(item.id));
    } catch (err) {
      setUploadingPhotos(false);
      setSubmitError(err);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    requireLogin(doSubmit);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink-800">{t("actions.postDonation")}</h1>
        <p className="text-sm text-ink-600">{t("screens.donationFormIntro")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-ink-700">{t("fields.photos")}</label>
        <input type="file" accept="image/*" multiple onChange={onPhotosSelected} className="text-xs" />
        <p className="text-[11px] text-ink-600">{t("photoNotice")}</p>
        {photoPreviews.length > 0 && (
          <div className="mt-1 flex gap-2">
            {photoPreviews.map((src, i) => (
              <img key={i} src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ))}
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink-700">{t("fields.title")}</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
          placeholder={t("fields.titlePlaceholder")}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink-700">{t("fields.category")}</span>
        <select
          required
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            {t("fields.selectCategory")}
          </option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c[locale] ?? c.en}
            </option>
          ))}
        </select>
      </label>

      {tagOptions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-ink-700">{t("fields.needTags")}</span>
          <div className="flex flex-wrap gap-1.5">
            {tagOptions.map((tag) => (
              <button
                type="button"
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  tags.includes(tag.id)
                    ? "border-accent-500 bg-accent-100 text-accent-700"
                    : "border-ink-600/20 bg-white text-ink-600"
                }`}
              >
                {tag[locale] ?? tag.en}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink-700">{t("fields.condition")}</span>
        <input
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
          placeholder={t("fields.conditionPlaceholder")}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink-700">{t("fields.description")}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink-700">{t("fields.area")}</span>
        <select
          required
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            {t("fields.selectArea")}
          </option>
          {data.areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a[locale] ?? a.en}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink-700">{t("fields.deliveryOption")}</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="delivery"
              checked={deliveryOption === "can_deliver"}
              onChange={() => setDeliveryOption("can_deliver")}
            />
            {t("fields.canDeliver")}
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="delivery"
              checked={deliveryOption === "pickup_only"}
              onChange={() => setDeliveryOption("pickup_only")}
            />
            {t("fields.pickupOnly")}
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink-700">{t("fields.collectionWindows")}</span>
        <div className="flex gap-2">
          <input
            value={windowInput}
            onChange={(e) => setWindowInput(e.target.value)}
            className="flex-1 rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
            placeholder={t("fields.collectionWindowPlaceholder")}
          />
          <button type="button" onClick={addWindow} className="rounded-lg border border-ink-600/20 px-3 text-sm font-semibold">
            {t("actions.addNeed")}
          </button>
        </div>
        {collectionWindows.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {collectionWindows.map((w, i) => (
              <NeedChip key={i} label={w} onRemove={() => setCollectionWindows((prev) => prev.filter((_, idx) => idx !== i))} />
            ))}
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-ink-700">{t("fields.notes")}</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
        />
      </label>

      {submitError && <p className="text-sm text-red-700">{translateError(submitError, t)}</p>}

      <button
        type="submit"
        disabled={uploadingPhotos}
        className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-60"
      >
        {uploadingPhotos ? t("actions.uploadingPhotos") : t("actions.postDonation")}
      </button>
    </form>
    </div>
  );
}
