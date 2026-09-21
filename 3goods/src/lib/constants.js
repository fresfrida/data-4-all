/**
 * Route paths in one place so nav components and <Link>/navigate() calls
 * never hardcode strings that can drift out of sync with routes.jsx.
 */
export const ROUTES = {
  home: "/",
  discoverNeeds: "/organisations",
  donateNew: "/donate/new",
  me: "/me",
  discoverItems: "/discover",
  myOrganisation: "/my-organisation",
  needsManagement: "/my-organisation/needs",
  map: "/map",
  item: (id) => `/item/${id}`,
  organisation: (id) => `/organisation/${id}`,
  chatList: "/chat",
  chatDetail: (id) => `/chat/${id}`,
  /** Compose view for a thread with no conversation row yet (D-075): one thread = one item + one organisation + that item's donor. */
  chatCompose: (itemId, organisationId, donorId) => `/chat/new/${itemId}/${organisationId}/${donorId}`,
  updates: "/updates",
};

/**
 * The item's own status, stored in `items.status` and nowhere else (D-075). The lifecycle is
 * available -> reserved -> collected; `unavailable` is the donor withdrawing their listing (a separate exit, not a step).
 * The only transitions are the ones in `itemsService.updateItemStatus`.
 */
export const ITEM_STATUS = {
  available: "available",
  reserved: "reserved",
  collected: "collected",
  unavailable: "unavailable",
};

/**
 * A request only records the organisation's side of the decision: waiting, chosen, or not chosen (D-075).
 * Handing the goods over is tracked on the item, not here.
 */
export const REQUEST_STATUS = {
  pending: "pending",
  accepted: "accepted",
  declined: "declined",
};
