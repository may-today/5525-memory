import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter } from "react-router-dom"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import App from "./App.tsx"
import "./index.css"

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Root element not found")

createRoot(rootElement).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HashRouter>
  </StrictMode>
)
