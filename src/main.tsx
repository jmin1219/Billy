import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PGliteProvider } from "@electric-sql/pglite-react";
import { initDB } from "./db/init";

(async () => {
  const db = await initDB();
  
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <PGliteProvider db={db}>
        <App />
      </PGliteProvider>
    </React.StrictMode>,
  );
})();