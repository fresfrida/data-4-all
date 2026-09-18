import { Outlet } from "react-router-dom";
import { MobileHeader } from "./MobileHeader.jsx";
import { DesktopTopNav } from "./DesktopTopNav.jsx";
import { MobileBottomNav } from "./MobileBottomNav.jsx";
import { Footer } from "./Footer.jsx";
import { DemoLoginPrompt } from "../controls/DemoLoginPrompt.jsx";
import { useSession } from "../../context/SessionContext.jsx";
import { useTranslate } from "../../i18n/useTranslate.js";

/**
 * The one place that composes header/nav/content for both breakpoints.
 * Screens never render their own nav — they only render what's inside the
 * content area, via <Outlet/>.
 */
export function AppShell() {
  const { isLoggedIn, role } = useSession();
  const t = useTranslate();
  const loginStateText = isLoggedIn ? t("demo.bannerLoggedInAs", { role: t(`role.${role}`) }) : t("demo.bannerPleaseLogIn");

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-cream-50">
      {/* Fixed Top Header & Banner */}
      <div className="shrink-0 z-30">
        <MobileHeader />
        <DesktopTopNav />
        <div className="border-b border-accent-200 bg-accent-50 px-4 py-1.5 text-center text-[11px] font-medium text-accent-700">
          {t("demo.banner")} {loginStateText}
        </div>
      </div>

      {/* Middle Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col justify-between">
        <div className="w-full flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>

      <MobileBottomNav />
      <DemoLoginPrompt />
    </div>
  );
}
