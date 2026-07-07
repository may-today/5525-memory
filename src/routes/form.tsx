import { createFileRoute } from '@tanstack/react-router'

import { FormPage } from '@/pages/FormPage'
import { getAllShows } from '@/server/shows'

export const Route = createFileRoute('/form')({
  loader: () => getAllShows(),
  component: FormPage,
})
