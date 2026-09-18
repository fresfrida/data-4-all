import { Routes, Route } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Home } from "../screens/Home.jsx";
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
 * One route table, matching lib/constants.js's ROUTES 1:1. `/` is the
 * lightweight hero landing page (Home); Discover Needs (the needs board)
 * lives at its own "/organisations" — same pattern as Discover Items at
 * "/discover" — see DECISIONS.md D-049.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/organisations" element={<DiscoverNeeds />} />
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
