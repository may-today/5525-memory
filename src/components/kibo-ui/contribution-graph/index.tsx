"use client";

// Public API — re-export everything callers need from the compound component.
export type { Activity, Labels } from "./context";
export { ContributionGraph, type ContributionGraphProps } from "./ContributionGraph";
export { ContributionGraphBlock, type ContributionGraphBlockProps } from "./ContributionGraphBlock";
export { ContributionGraphCalendar, type ContributionGraphCalendarProps } from "./ContributionGraphCalendar";
