import { ROUTES } from "../../lib/constants.js";
import { BellIcon, MapPinIcon, PlusIcon, ChatIcon, UserIcon, SearchIcon, BuildingIcon } from "../icons.jsx";

/**
 * The exact navigation items per session state (logged-out vs donor vs organisation).
 * Both MobileBottomNav and DesktopTopNav read from here so they can never drift apart.
 * `badge: "chat"` marks the item that carries the unread-chat bubble (donor and organisation alike, D-069).
 */
export function getNavItems(session, t) {
  const role = typeof session === "string" ? session : session?.role;
  const isLoggedIn = typeof session === "object" ? session?.isLoggedIn : true;

  if (!isLoggedIn) {
    return [
      { to: ROUTES.discoverNeeds, label: t("nav.organisations"), Icon: BuildingIcon },
      { to: ROUTES.discoverItems, label: t("nav.itemsDonated"), Icon: SearchIcon },
      { to: ROUTES.map, label: t("nav.map"), Icon: MapPinIcon },
    ];
  }

  if (role === "organisation") {
    return [
      { to: ROUTES.updates, label: t("nav.updates"), Icon: BellIcon },
      { to: ROUTES.map, label: t("nav.map"), Icon: MapPinIcon },
      { to: ROUTES.discoverItems, label: t("nav.itemsDonated"), Icon: SearchIcon },
      { to: ROUTES.chatList, label: t("nav.chat"), Icon: ChatIcon, badge: "chat" },
      { to: ROUTES.myOrganisation, label: t("nav.myOrganisation"), Icon: BuildingIcon },
    ];
  }

  return [
    { to: ROUTES.updates, label: t("nav.updates"), Icon: BellIcon },
    { to: ROUTES.map, label: t("nav.map"), Icon: MapPinIcon },
    { to: ROUTES.donateNew, label: t("nav.donate"), Icon: PlusIcon, emphasise: true },
    { to: ROUTES.chatList, label: t("nav.chat"), Icon: ChatIcon, badge: "chat" },
    { to: ROUTES.me, label: t("nav.me"), Icon: UserIcon },
  ];
}
