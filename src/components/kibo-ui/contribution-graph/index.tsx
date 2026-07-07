'use client'

// Public API — re-export everything callers need from the compound component.
export type { Activity, Labels } from './context'
// biome-ignore lint/performance/noBarrelFile: intentional public API surface for this compound component
export { ContributionGraph, type ContributionGraphProps } from './ContributionGraph'
export { ContributionGraphBlock, type ContributionGraphBlockProps } from './ContributionGraphBlock'
export { ContributionGraphCalendar, type ContributionGraphCalendarProps } from './ContributionGraphCalendar'
