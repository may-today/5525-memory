/**
 * Guest avatar resolution for the Guest Planets card.
 *
 * Convention: real photos live on the CDN as `guest/{id}.webp`, mapped from
 * the exact guest name as it appears in `guestShows[].guests`. Guests missing
 * from the map fall back to the shared inline-SVG placeholder.
 */

/** Shared placeholder: URL-encoded inline SVG (dark disc + faint four-pointed star) that reads naturally on zinc-950. */
export const GUEST_AVATAR_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='48' fill='%2327272a'/%3E%3Cpath d='M48 28l4.6 15.4L68 48l-15.4 4.6L48 68l-4.6-15.4L28 48l15.4-4.6z' fill='%2352525b'/%3E%3C/svg%3E"

const guestImgIdMap = {
  刘芯妤: 'rose',
  孙燕姿: 'syz',
  周杰伦: 'zjl',
  白敬亭: 'bjt',
  任贤齐: 'rxq',
  赵传: 'zc',
  Energy: 'energy',
  告五人: 'gwr',
  萧煌奇: 'xhq',
  韦礼安: 'wla',
  周思齐: 'zsq',
  F4: 'f4',
  张国玺: 'zgx',
  陈粒: 'cl',
  宋雨琦: 'syq',
  汪苏泷: 'wsl',
  丁当: 'dd',
  陈绮贞: 'cqz',
  陈嘉桦: 'ella',
  萧敬腾: 'xjt',
  林俊杰: 'ljj',
  光良: 'gl',
  刘若英: 'lry',
  刘雨昕: 'lyx',
  周深: 'zs',
  萧秉治: 'xbz',
  小蔷薇: 'xqw',
  家家: 'jj',
} as Record<string, string>

/**
 * Resolves the avatar data URI for a guest, falling back to the shared placeholder.
 */
export function getGuestAvatar(name: string): string {
  if (name in guestImgIdMap) {
    return `//mayday-replay-cdn.ddiu.site/5525/guest/${guestImgIdMap[name]}.webp`
  }
  return GUEST_AVATAR_PLACEHOLDER
}
