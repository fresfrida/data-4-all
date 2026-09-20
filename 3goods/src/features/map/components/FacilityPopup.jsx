import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { submitFacilityInterest } from "../../../services/facilityInterestService.js";
import { translateError } from "../../../lib/errors.js";
import { ROUTES } from "../../../lib/constants.js";
import { useLocale } from "../../../i18n/LocaleContext.jsx";
import { useTranslate } from "../../../i18n/useTranslate.js";

const KNOWN_TYPES = ["soup_kitchen", "day_care", "group_home", "shelter", "nursing_home", "assisted_living", "charity", "social_facility"];

/**
 * What a click on an OpenStreetMap facility pin shows (D-073). Two states, both clearly separate from the OSM record itself:
 * - matched: a registered 3goods organisation is at this location, with a link to its profile;
 * - unmatched: the facility has not joined, with a small interest form (name + contact) for manual follow-up.
 *
 * @param {{facility: object, match?: {organisation: object}, onClose: () => void}} props
 */
export function FacilityPopup({ facility, match, onClose }) {
  const { locale } = useLocale();
  const t = useTranslate();
  const [formOpen, setFormOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null); // the raw error, translated at render time (D-017)

  // A different pin starts from a clean popup.
  useEffect(() => {
    setFormOpen(false);
    setSent(false);
    setError(null);
  }, [facility.osm_type, facility.osm_id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const type = facility.subtype || facility.category;
  const typeLabel = KNOWN_TYPES.includes(type) ? t(`map.facilityType.${type}`) : type?.replace(/_/g, " ");
  const organisation = match?.organisation;
  const orgName = organisation ? (organisation.name[locale] ?? organisation.name.en) : "";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await submitFacilityInterest({ facility, contactName, contact, locale });
      setSent(true);
      setContactName("");
      setContact("");
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={facility.name}
      data-testid="facility-popup"
      data-state={organisation ? "matched" : "unmatched"}
      className="absolute inset-x-3 bottom-3 z-20 max-h-[92%] max-w-md overflow-y-auto rounded-2xl border border-ink-600/15 bg-white p-4 shadow-lg sm:right-auto"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("map.facilityClose")}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-ink-600 hover:bg-cream-100"
      >
        ✕
      </button>

      <p className="pr-8 text-[10px] font-bold uppercase tracking-wider text-ink-600">
        {t("map.facilitySource")} · {typeLabel}
      </p>
      <h3 className="pr-8 text-sm font-bold leading-snug text-ink-800">{facility.name}</h3>

      {organisation ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-accent-200 bg-accent-50 p-3">
          <span className="self-start rounded-full bg-accent-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {t("map.facilityMatchedTag")}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-ink-800">{orgName}</span>
            {organisation.verified ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{t("screens.verifiedBadge")}</span>
            ) : (
              <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-bold text-ink-600">{t("map.facilityUnverified")}</span>
            )}
          </div>
          <p className="line-clamp-2 text-xs text-ink-700">{organisation.mission[locale] ?? organisation.mission.en}</p>
          <Link
            to={ROUTES.organisation(organisation.id)}
            className="mt-1 w-full rounded-full bg-accent-500 px-4 py-2 text-center text-xs font-bold text-white hover:bg-accent-600"
          >
            {t("map.facilityViewProfile")}
          </Link>
          {organisation.isDemo && <p className="text-[11px] italic text-ink-600">{t("map.facilityDemoNote")}</p>}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-ink-600/10 bg-cream-50 p-3">
          <p className="text-sm font-semibold text-ink-800">{t("map.facilityNotJoined")}</p>
          {sent ? (
            <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              {t("map.facilityThanks")}
            </p>
          ) : formOpen ? (
            <form onSubmit={onSubmit} className="flex flex-col gap-2">
              <p className="text-xs text-ink-700">{t("map.facilityFormIntro")}</p>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-700">{t("map.facilityYourName")}</span>
                <input
                  required
                  autoComplete="name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink-700">{t("map.facilityContact")}</span>
                <input
                  required
                  autoComplete="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t("map.facilityContactPlaceholder")}
                  className="rounded-lg border border-ink-600/20 px-3 py-2 text-sm"
                />
              </label>
              <p className="text-[11px] text-ink-600">{t("map.facilityPrivacy")}</p>
              {error && <p className="text-xs text-red-700">{translateError(error, t)}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 rounded-full bg-accent-500 px-4 py-2 text-xs font-bold text-white hover:bg-accent-600 disabled:opacity-60"
                >
                  {sending ? t("map.facilitySending") : t("map.facilitySend")}
                </button>
                <button type="button" onClick={() => setFormOpen(false)} className="rounded-full px-4 py-2 text-xs font-semibold text-ink-600 hover:bg-cream-100">
                  {t("map.facilityCancel")}
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-xs text-ink-700">{t("map.facilityInviteHint")}</p>
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="w-full rounded-full bg-accent-500 px-4 py-2 text-xs font-bold text-white hover:bg-accent-600"
              >
                {t("map.facilityInviteCta")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
