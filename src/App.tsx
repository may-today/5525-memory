import { Navigate, Route, Routes } from "react-router-dom"

import { FormPage } from "@/pages/FormPage"
import { LoadingPage } from "@/pages/LoadingPage"
import { SharePage } from "@/pages/SharePage"
import { SummaryContainer } from "@/pages/summary/SummaryContainer"
import { CoverPage } from "./pages/CoverPage"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<CoverPage />} />
      <Route path="/form" element={<FormPage />} />
      <Route path="/loading" element={<LoadingPage />} />
      <Route path="/summary" element={<SummaryContainer />} />
      <Route path="/share" element={<SharePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
