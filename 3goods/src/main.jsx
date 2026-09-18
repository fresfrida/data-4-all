import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "./app/AppProviders.jsx";
import { AppRoutes } from "./app/routes.jsx";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </React.StrictMode>,
);
