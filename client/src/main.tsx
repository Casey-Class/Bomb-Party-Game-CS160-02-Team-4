import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router";

import "./index.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import App from "./app.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#27272a",
                color: "#fafafa",
                border: "1px solid rgba(255,255,255,0.08)",
              },
            }}
          />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
