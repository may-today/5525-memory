import { useEffect, useRef, useState } from 'react'

/**
 * Sticky gradient mask pinned to the top of a scrolling summary card, softening
 * the boundary between the fixed title and the scroll body. It stays hidden
 * while the body is at the top (so it never dims the first content) and fades in
 * only once content has scrolled underneath. Must be rendered as the first child
 * of the `[data-scroll-container]` element — it reads its own parent as the
 * scroller.
 */
export function SummaryScrollFadeTop() {
  const ref = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const scroller = ref.current?.parentElement
    if (!scroller) return
    const handleScroll = () => setIsScrolled(scroller.scrollTop > 2)
    handleScroll()
    scroller.addEventListener('scroll', handleScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', handleScroll)
  }, [])

  return <div aria-hidden className="summary-scroll-fade-top" data-visible={isScrolled || undefined} ref={ref} />
}
