/**
 * "This facility hasn't joined 3goods yet" (D-073). There is no organisation sign-up flow in this prototype (organisations are
 * seed-only), so the call to action is a minimal interest form: a name and a way to reach the person, stored with the facility it is
 * about in `facility_interests` for someone to follow up by hand. It is not an account, and nothing reads it in the app: the
 * table is insert-only for the public key, so contact details cannot be read back through it.
 */
import { insertBlind } from "../lib/db.js";
import { AppError } from "../lib/errors.js";

/**
 * @param {{facility: {osm_type?: string, osm_id?: string|number, name: string, lat?: number, lon?: number}, contactName: string, contact: string, locale?: string}} payload
 */
export async function submitFacilityInterest(payload) {
  const contactName = payload.contactName?.trim();
  const contact = payload.contact?.trim();
  if (!contactName) throw new AppError("contactNameRequired");
  if (!contact) throw new AppError("contactRequired");
  await insertBlind("facility_interests", {
    osm_type: payload.facility.osm_type ?? null,
    osm_id: payload.facility.osm_id != null ? String(payload.facility.osm_id) : null,
    facility_name: payload.facility.name,
    facility_lat: payload.facility.lat ?? null,
    facility_lon: payload.facility.lon ?? null,
    contact_name: contactName,
    contact,
    locale: payload.locale ?? null,
  });
}
