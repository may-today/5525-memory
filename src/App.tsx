import type { ReactNode } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { TextureOverlay } from "@/components/ui/texture-overlay"
import { FormPage } from "@/pages/FormPage"
import { LoadingPage } from "@/pages/LoadingPage"
import { SharePage } from "@/pages/SharePage"
import { SummaryContainer } from "@/pages/summary/SummaryContainer"
import { CoverPage } from "./pages/CoverPage"

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background min-h-svh">
      <TextureOverlay texture="dots" opacity={0.2} className="invert" />
      <div className="relative mx-auto min-h-svh max-w-3xl bg-background border-x">
        {children}
      </div>
    </div>
  )
}

export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<CoverPage />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/summary" element={<SummaryContainer />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default App
