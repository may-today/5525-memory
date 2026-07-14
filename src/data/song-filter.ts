// 计算随机曲目时，需要从场次歌单中排除掉的歌，它们实际为主题固定歌，但是被放在了 encore 中
export const randomSongBlackList: Record<string, string[]> = {
  '5525': ['知足', '温柔', '笑忘歌', '倔强', '伤心的人别听慢歌', '第一天', '爱情万岁'],
  '5525+1': ['你不是真正的快乐', '我不愿让你一个人', '笑忘歌', '倔强', '伤心的人别听慢歌', '第一天', '爱情万岁'],
  '5525+2': ['最好的一天', '盛夏光年', '第一天', '伤心的人别听慢歌', '倔强', '笑忘歌', '任意门', 'Alive'],
}

// 计算随机曲目时，需要从场次歌单（section=request）中排除掉的歌，它们实际为主题固定歌，但是被放在了点歌中
export const randomSongRequestBlackList: string[] = ['任意门', '干杯', '相信', '转眼']

// 计算随机曲目时，需要按子主题与城市组合排除的特殊固定曲
export const randomSongSpecialBlackList: Record<string, Record<string, string[]>> = {
  '5525': {
    台中: ['如果我们不曾相遇'],
  },
}

/** Whether a song is fixed for the supplied show's theme and city. */
export function isRandomSongBlacklisted(subTheme: string, city: string, title: string): boolean {
  const isThemeBlacklisted = randomSongBlackList[subTheme]?.includes(title) ?? false
  const isSpecialBlacklisted = randomSongSpecialBlackList[subTheme]?.[city]?.includes(title) ?? false
  return isThemeBlacklisted || isSpecialBlacklisted
}
