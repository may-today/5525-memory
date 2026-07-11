/**
 * Props shared by every /summary card. Kept in its own module so
 * SummaryContainer and the cards can both import it without a cycle.
 */
export interface SummaryCardProps {
  /**
   * True during the ~1s page-transition window. Cards that run their own
   * requestAnimationFrame loop (City's WebGL globe, Duration's particle
   * canvas) freeze rendering while set so the slide stays smooth.
   */
  isPaused?: boolean
}
