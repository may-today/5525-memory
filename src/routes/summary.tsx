import { createFileRoute } from "@tanstack/react-router"

import { SummaryContainer } from "@/pages/summary/SummaryContainer"

export const Route = createFileRoute("/summary")({
  component: SummaryContainer,
})
