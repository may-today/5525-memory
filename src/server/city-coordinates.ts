/**
 * Hard-coded city lat/lng lookup used by getSummaryData to build globe
 * markers. Not a D1 table — this is small, static, and only ever read from
 * server function handlers, so it never reaches the client bundle.
 *
 * The first 17 entries are migrated verbatim from the coordinates that used
 * to live in SummaryCardCity.tsx's `showcaseDefaultMarkers`. The remaining 6
 * (marked below) cover cities present in the tour data but not previously
 * shown on the globe; their coordinates are approximate city centers.
 */
export const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  桃园: { latitude: 24.99, longitude: 121.3 },
  新加坡: { latitude: 1.21, longitude: 103.49 },
  悉尼: { latitude: -33.51, longitude: 151.12 },
  拉斯维加斯: { latitude: 36.17, longitude: -115.14 },
  天津: { latitude: 39.08, longitude: 117.2 },
  香港: { latitude: 22.32, longitude: 114.17 },
  杭州: { latitude: 30.16, longitude: 120.12 },
  哈尔滨: { latitude: 45.75, longitude: 126.64 },
  台北: { latitude: 25.02, longitude: 121.33 },
  北京: { latitude: 39.92, longitude: 116.36 },
  上海: { latitude: 31.22, longitude: 121.48 },
  贵阳: { latitude: 26.34, longitude: 106.42 },
  长沙: { latitude: 28.11, longitude: 112.58 },
  郑州: { latitude: 34.45, longitude: 113.38 },
  厦门: { latitude: 24.46, longitude: 118.1 },
  广州: { latitude: 23.16, longitude: 113.23 },
  台中: { latitude: 24.08, longitude: 120.4 },
  // Approximate — not previously covered by the hardcoded globe markers.
  吉隆坡: { latitude: 3.14, longitude: 101.69 },
  太原: { latitude: 37.87, longitude: 112.55 },
  成都: { latitude: 30.57, longitude: 104.07 },
  武汉: { latitude: 30.59, longitude: 114.31 },
  深圳: { latitude: 22.54, longitude: 114.06 },
  高雄: { latitude: 22.63, longitude: 120.3 },
}
