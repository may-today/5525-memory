const cityImgIdMap = {
  台中: 'taizhong',
  高雄: 'gaoxiong',
  香港: 'hongkong',
  北京: 'beijing',
  深圳: 'shenzhen',
  太原: 'taiyuan',
  武汉: 'wuhan',
  成都: 'chengdu',
  上海: 'shanghai',
  桃园: 'taoyuan',
  新加坡: 'singapore',
  悉尼: 'sydney',
  拉斯维加斯: 'lasvegas',
  天津: 'tianjin',
  杭州: 'hangzhou',
  哈尔滨: 'haerbin',
  台北: 'taipei',
  贵阳: 'guiyang',
  长沙: 'changsha',
  郑州: 'zhengzhou',
  厦门: 'xiamen',
  广州: 'guangzhou',
  吉隆坡: 'jilongpo',
} as Record<string, string>

/**
 * Resolves the avatar data URI for a city.
 */
export function getCityIcon(name: string): string {
  return `//mayday-replay-cdn.ddiu.site/5525/city/${cityImgIdMap[name]}.webp`
}

/**
 * Whether the city has a landmark icon. Call sites that can degrade to a
 * text-only presentation should check this first, so an unmapped city name
 * never requests `undefined.webp`.
 */
export function hasCityIcon(name: string): boolean {
  return Boolean(cityImgIdMap[name])
}
