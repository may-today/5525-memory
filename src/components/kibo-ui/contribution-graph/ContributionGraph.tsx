"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import {
  ContributionGraphContext,
  DEFAULT_LABELS,
  getActivityYear,
  groupByWeeks,
  type Labels,
  type Activity,
} from "./context";

const EMPTY_STYLE: CSSProperties = {};

export type ContributionGraphProps = HTMLAttributes<HTMLDivElement> & {
  data: Activity[];
  blockMargin?: number;
  blockRadius?: number;
  blockSize?: number;
  fontSize?: number;
  labels?: Labels;
  maxLevel?: number;
  style?: CSSProperties;
  totalCount?: number;
  weekStart?: import("date-fns").Day;
  children: ReactNode;
  className?: string;
};

export const ContributionGraph = ({
  data,
  blockMargin = 4,
  blockRadius = 2,
  blockSize = 12,
  fontSize = 14,
  labels: labelsProp = undefined,
  maxLevel: maxLevelProp = 4,
  style = EMPTY_STYLE,
  totalCount: totalCountProp = undefined,
  weekStart = 0,
  className,
  ...props
}: ContributionGraphProps) => {
  const maxLevel = Math.max(1, maxLevelProp);
  const weeks = useMemo(() => groupByWeeks(data, weekStart), [data, weekStart]);
  const LABEL_MARGIN = 8;

  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelsProp }), [labelsProp]);
  const labelHeight = fontSize + LABEL_MARGIN;

  const year = getActivityYear(data);

  const totalCount =
    typeof totalCountProp === "number"
      ? totalCountProp
      : data.reduce((sum, activity) => sum + activity.count, 0);

  const width = weeks.length * (blockSize + blockMargin) - blockMargin;
  const height = labelHeight + (blockSize + blockMargin) * 7 - blockMargin;

  const contextValue = useMemo(
    () => ({
      data,
      weeks,
      blockMargin,
      blockRadius,
      blockSize,
      fontSize,
      labels,
      labelHeight,
      maxLevel,
      totalCount,
      weekStart,
      year,
      width,
      height,
    }),
    [data, weeks, blockMargin, blockRadius, blockSize, fontSize, labels, labelHeight, maxLevel, totalCount, weekStart, year, width, height]
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <ContributionGraphContext.Provider value={contextValue}>
      <div
        className={cn("flex w-max max-w-full flex-col gap-2", className)}
        style={{ fontSize, ...style }}
        {...props}
      />
    </ContributionGraphContext.Provider>
  );
};
