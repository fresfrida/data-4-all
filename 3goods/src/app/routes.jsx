import { Routes, Route } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import { DiscoverNeeds } from "../screens/DiscoverNeeds.jsx";
import { DonationForm } from "../screens/DonationForm.jsx";
import { Me } from "../screens/Me.jsx";
import { DiscoverItems } from "../screens/DiscoverItems.jsx";
import { MyOrganisation } from "../screens/MyOrganisation.jsx";
import { NeedsManagement } from "../screens/NeedsManagement.jsx";
import { MapScreen } from "../screens/MapScreen.jsx";
import { ItemDetail } from "../screens/ItemDetail.jsx";
import { OrganisationProfile } from "../screens/OrganisationProfile.jsx";
import { ChatList } from "../screens/ChatList.jsx";
import { ChatDetail } from "../screens/ChatDetail.jsx";
import { Updates } from "../screens/Updates.jsx";
import { NotFound } from "../screens/NotFound.jsx";

/**
 * One route table, matching lib/constants.js's ROUTES 1:1. Donor `/` is
 * Discover Needs; every other destination is reachable from nav or from a
 * link inside a screen (see DiscoverNeeds/Me for the donor "Discover
 * needs" link required even off the home route).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DiscoverNeeds />} />
        <Route path="/donate/new" element={<DonationForm />} />
        <Route path="/me" element={<Me />} />
        <Route path="/discover" element={<DiscoverItems />} />
        <Route path="/my-organisation" element={<MyOrganisation />} />
        <Route path="/my-organisation/needs" element={<NeedsManagement />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/item/:itemId" element={<ItemDetail />} />
        <Route path="/organisation/:orgId" element={<OrganisationProfile />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:chatId" element={<ChatDetail />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
