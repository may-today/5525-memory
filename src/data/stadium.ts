export const stadiumIdMap: Record<string, string> = {
  台中洲际棒球场: 'tz',
  世运主场馆: 'gx',
  中环海滨活动空间: 'hk1',
  鸟巢国家体育场: 'bj',
  大运中心体育场: 'sz',
  山西体育中心体育场: 'ty',
  武汉体育中心主体育场: 'wh',
  东安湖体育公园主体育场: 'cd',
  上海体育场: 'sh',
  乐天桃园棒球场: 'ty',
  新加坡国家体育场: 'xjp',
  'Accor Stadium': 'xn',
  'Allegiant Stadium': 'lswjs',
  天津奥体中心体育场: 'tj',
  启德主场馆: 'hk2',
  杭州奥体中心体育场: 'hz',
  哈尔滨国际会展体育中心体育场: 'heb',
  台北大巨蛋: 'tb',
  贵阳奥林匹克体育中心体育场: 'gy',
  贺龙体育中心体育场: 'cs',
  郑州奥林匹克体育中心体育场: 'zz',
  厦门奥林匹克体育中心白鹭体育场: 'xm',
  大湾区文化体育中心体育场: 'gz',
  武吉加里尔国家体育场: 'jlp',
}

export function getCoverImg(name: string): string {
  return `//mayday-replay-cdn.ddiu.site/stadium/${stadiumIdMap[name]}.webp`
}
