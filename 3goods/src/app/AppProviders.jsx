import { BrowserRouter } from "react-router-dom";
import { LocaleProvider } from "../i18n/LocaleContext.jsx";
import { SessionProvider } from "../context/SessionContext.jsx";
import { UnreadChatsProvider } from "../context/UnreadChatsContext.jsx";

/** The one place app-wide context providers are composed, outside-in. */
export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <LocaleProvider>
        <SessionProvider>
          <UnreadChatsProvider>{children}</UnreadChatsProvider>
        </SessionProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}
