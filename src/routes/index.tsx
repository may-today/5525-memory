import { createFileRoute } from "@tanstack/react-router"

import { CoverPage } from "@/pages/CoverPage"

export const Route = createFileRoute("/")({
  component: CoverPage,
})
