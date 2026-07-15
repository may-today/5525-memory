/**
 * Props shared by every /summary card. Kept in its own module so
 * SummaryContainer and the cards can both import it without a cycle.
 */
export interface SummaryCardProps {
  /**
   * True during the ~1s page-transition window. Cards that run their own
   * requestAnimationFrame loop or CSS animation (Duration's particle canvas,
   * City's stamp ring spin) freeze rendering while set so the slide stays
   * smooth.
   */
  isPaused?: boolean

  /**
   * Reports whether a card-owned full-screen detail overlay is open. The
   * container uses this to suppress its global navigation affordances.
   */
  onDetailOpenChange?: (isOpen: boolean) => void
}
