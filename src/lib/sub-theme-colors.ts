/**
 * 巡演子主题配色，全站单一数据源：与 /form 场次选择页、时间轴星图、巡演记录页、
 * SharePoster 视觉上保持一致。
 */
export const SUB_THEME_COLORS = {
  '5525': '#f472b6',
  '5525+1': '#38bdf8',
  '5525+2': '#fb923c',
} as const

/** 子主题对应的强调色；未知子主题回退调用方传入的场次 themeColor。 */
export function getSubThemeColor(subTheme: string, fallbackThemeColor: string): string {
  return SUB_THEME_COLORS[subTheme as keyof typeof SUB_THEME_COLORS] ?? fallbackThemeColor
}
