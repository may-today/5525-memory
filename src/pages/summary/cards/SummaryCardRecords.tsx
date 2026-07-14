import { RecordsTimeline } from '@/pages/records/RecordsTimeline'
import { SummaryScrollFadeTop } from '../SummaryScrollFadeTop'
import type { SummaryCardProps } from '../summary-card-props'
import { useSummaryDataContext } from '../summary-data-context'

export function SummaryCardRecords({ onDetailOpenChange }: SummaryCardProps) {
  const { allShows } = useSummaryDataContext()

  return (
    <div className="flex h-svh flex-col bg-zinc-950 text-zinc-100">
      <div className="flex-1 overflow-y-auto px-6 pb-24" data-scroll-container>
        <SummaryScrollFadeTop />
        <div className="mx-auto w-full max-w-md">
          <RecordsTimeline allShows={allShows} onDetailOpenChange={onDetailOpenChange} />
        </div>
      </div>
    </div>
  )
}
