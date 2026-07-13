export const coverIdMap: Record<string, string> = {
  第一张创作专辑: '1',
  爱情万岁: '2',
  人生海海: '3',
  时光机: '4',
  神的孩子都在跳舞: '5',
  为爱而生: '6',
  后青春期的诗: '7',
  第二人生: '8-1',
  自传: '9',
}

export function getCoverImg(name: string): string {
  return `//mayday-replay-cdn.ddiu.site/cover/album/thumb/${coverIdMap[name]}.webp`
}
