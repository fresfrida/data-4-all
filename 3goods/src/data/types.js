/**
 * Centralised data shapes for 3goods. Plain JS + JSDoc instead of TypeScript
 * (see DECISIONS.md D-002) — this file is the one place these shapes are
 * documented; keep it in sync when a shape changes instead of re-describing
 * it in comments elsewhere.
 *
 * IDs are stable strings (e.g. "item-001") assigned in seed data and by
 * src/lib/db.js for anything created at runtime. Foreign-key-style fields
 * (donorId, orgId, itemId, requestId, conversationId) are how records
 * relate — there is no ORM, just these plain references.
 */

/**
 * @typedef {"donor"|"organisation"} Role
 */

/**
 * @typedef {"Food"|"Household Items"|"Clothes"|"Books"} Category
 * The map's four shared categories — the only valid `category` values
 * anywhere in 3goods. See DECISIONS.md D-005 for why there is no second
 * "matching need category" field.
 */

/**
 * @typedef {Object} Area
 * @property {string} id
 * @property {string} en
 * @property {string} vi
 */

/**
 * @typedef {Object} User
 * Demo identity only — not a real account. See DECISIONS.md D-004.
 * @property {string} id
 * @property {string} name
 * @property {Role} role
 * @property {string} areaId
 * @property {string} [organisationId] present when role === "organisation"
 */

/**
 * @typedef {Object} Organisation
 * @property {string} id
 * @property {{en: string, vi: string}} name
 * @property {{en: string, vi: string}} mission
 * @property {string} areaId
 * @property {boolean} verified  demo trust indicator, not a real verification
 * @property {boolean} isDemo   always true in this prototype — surfaced in UI
 * @property {string[]} pastReceivedItemIds
 */

/**
 * @typedef {Object} Need
 * @property {string} id
 * @property {string} organisationId
 * @property {Category} category
 * @property {boolean} priority        true = priority need
 * @property {number|null} [quantity]  optional whole number, with `unit`
 * @property {string|null} [unit]      a code from lib/quantity.js UNITS
 * @property {string} createdAt        ISO string
 */

/**
 * @typedef {"can_deliver"|"pickup_only"} DeliveryOption
 * Donor-arranged drop-off vs pick-up only. Never shipping, never a courier.
 */

/**
 * @typedef {"available"|"reserved"|"unavailable"} ItemStatus
 * `reserved` = an organisation's request has been accepted (see D-009).
 * `unavailable` = donor withdrew the listing.
 */

/**
 * @typedef {Object} Item
 * @property {string} id
 * @property {string} donorId
 * @property {string} donorName
 * @property {string} title
 * @property {Category} category
 * @property {Category} [secondaryCategory]  optional 2nd category (e.g. a children's
 *   book lists under both Books and Children Items) — see DECISIONS.md D-047.
 *   Deliberately capped at one extra, never unbounded many.
 * @property {string} condition         e.g. "Like new", "Well used, still functional"
 * @property {string} areaId
 * @property {string} description
 * @property {DeliveryOption} deliveryOption
 * @property {string[]} collectionWindows  free-text windows, e.g. "Weekday evenings"
 * @property {string} [notes]
 * @property {string[]} photoPaths      paths under /demo-items/, or [] for icon fallback
 * @property {ItemStatus} status
 * @property {string} [acceptedRequestId]
 * @property {string} createdAt
 */

/**
 * @typedef {"requested"|"accepted"|"arranging_collection"|"completed"|"declined"} RequestStatus
 * Display-only "no longer available" is derived (item.status !== 'available'
 * and this isn't the accepted request), not a stored status — see D-009.
 */

/**
 * @typedef {Object} DonationRequest
 * @property {string} id
 * @property {string} itemId
 * @property {string} organisationId
 * @property {RequestStatus} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {string} [requestId]
 * @property {string} donorId
 * @property {string} organisationId
 */

/**
 * @typedef {Object} Message
 * A regular (donor/organisation-authored) message has `text` and no
 * `systemCode` — that text is kept exactly as typed and never translated
 * (see DECISIONS.md D-016). A system-generated message (senderId "system")
 * has `systemCode` + `params` instead of `text`, so it renders in whichever
 * language each viewer currently has selected — see `i18n/locales/*.json`'s
 * `systemMessages` namespace and ChatDetail's render logic.
 * @property {string} id
 * @property {string} conversationId
 * @property {string} senderId        a user/organisation id, or "system"
 * @property {Role} senderRole
 * @property {string} [text]          present for user-authored messages
 * @property {string} [systemCode]    present for system-authored messages
 * @property {Object} [params]        interpolation values for `systemCode`
 * @property {string} createdAt
 */

/**
 * @typedef {Object} UpdateNotification
 * Stored as a language-independent `type` (the translation key under
 * `notifications.*`) + `params`, never pre-rendered text — see D-016. The
 * Updates screen renders `t(\`notifications.${type}\`, params)` so the same
 * stored record reads correctly for whichever language its recipient has
 * selected, even if that differs from the language active when the event
 * happened.
 * @property {string} id
 * @property {string} userId          who it's for (donorId or organisationId)
 * @property {string} type            e.g. "request_accepted", "item_requested"
 * @property {Object} params          interpolation values for `type`
 * @property {string} [linkItemId]
 * @property {string} [linkRequestId]
 * @property {boolean} read
 * @property {string} createdAt
 */

export {};
