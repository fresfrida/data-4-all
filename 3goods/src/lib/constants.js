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
  updates: "/updates",
};

export const REQUEST_STATUSES = [
  "requested",
  "accepted",
  "arranging_collection",
  "completed",
  "declined",
];
