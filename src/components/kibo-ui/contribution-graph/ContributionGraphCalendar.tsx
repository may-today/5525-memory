"use client";

import {
  Fragment,
  type HTMLAttributes,
  type ReactNode,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import { getMonthLabels, useContributionGraph, type Activity } from "./context";

export type ContributionGraphCalendarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  hideMonthLabels?: boolean;
  className?: string;
  /** Returns the SVG paint order for an activity; larger values render later. */
  getActivityOrder?: (activity: Activity) => number;
  children: (props: {
    activity: Activity;
    dayIndex: number;
    weekIndex: number;
  }) => ReactNode;
};

export const ContributionGraphCalendar = ({
  hideMonthLabels = false,
  className,
  getActivityOrder,
  children,
  ...props
}: ContributionGraphCalendarProps) => {
  const { weeks, width, height, blockSize, blockMargin, labels } =
    useContributionGraph();

  const monthLabels = useMemo(
    () => getMonthLabels(weeks, labels.months),
    [weeks, labels.months]
  );

  return (
    <div
      className={cn("max-w-full overflow-x-auto overflow-y-hidden", className)}
      {...props}
    >
      <svg
        className="block overflow-visible"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      >
        <title>Contribution Graph</title>
        {!hideMonthLabels && (
          <g className="fill-current">
            {monthLabels.map(({ label, weekIndex }) => (
              <text
                dominantBaseline="hanging"
                key={weekIndex}
                x={(blockSize + blockMargin) * weekIndex}
              >
                {label}
              </text>
            ))}
          </g>
        )}
        {weeks
          .flatMap((week, weekIndex) =>
            week.map((activity, dayIndex) => ({ activity, dayIndex, weekIndex }))
          )
          .filter(
            (entry): entry is { activity: Activity; dayIndex: number; weekIndex: number } =>
              entry.activity !== undefined
          )
          .sort(
            (a, b) =>
              (getActivityOrder?.(a.activity) ?? 0) -
              (getActivityOrder?.(b.activity) ?? 0)
          )
          .map(({ activity, dayIndex, weekIndex }) => {
            if (!activity) {
              return null;
            }

            return (
              <Fragment key={activity.date}>
                {children({ activity, dayIndex, weekIndex })}
              </Fragment>
            );
          })}
      </svg>
    </div>
  );
};
