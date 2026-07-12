const PASSCODE_PREFIX = '5525-'
const SPARSE_MODE = 's'
const BITSET_MODE = 'b'
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]*$/
const BASE64_PADDING_PATTERN = /=+$/u
const MAX_VARINT_BYTES = 5

/** Encode chronological show indexes with the shortest supported compression mode. */
export function encodeShowPasscode(showIndexes: number[]): string {
  const indexes = [...new Set(showIndexes)].sort((a, b) => a - b)
  for (const showIndex of indexes) {
    if (!Number.isSafeInteger(showIndex) || showIndex < 0) {
      throw new Error('Show indexes must be non-negative safe integers.')
    }
  }

  const sparsePayload = encodeBase64Url(encodeSparseIndexes(indexes))
  const bitsetPayload = encodeBase64Url(encodeBitsetIndexes(indexes))
  const mode = bitsetPayload.length < sparsePayload.length ? BITSET_MODE : SPARSE_MODE
  const payload = mode === BITSET_MODE ? bitsetPayload : sparsePayload

  return `${PASSCODE_PREFIX}${mode}${payload}`
}

/** Decode a compressed passcode into chronological show indexes. */
export function decodeShowPasscode(passcode: string): number[] | null {
  if (!passcode.startsWith(PASSCODE_PREFIX)) {
    return null
  }

  const encoded = passcode.slice(PASSCODE_PREFIX.length)
  const mode = encoded[0]
  const payload = encoded.slice(1)
  if ((mode !== SPARSE_MODE && mode !== BITSET_MODE) || !BASE64_URL_PATTERN.test(payload)) {
    return null
  }

  const bytes = decodeBase64Url(payload)
  if (bytes === null) {
    return null
  }

  return mode === SPARSE_MODE ? decodeSparseIndexes(bytes) : decodeBitsetIndexes(bytes)
}

function encodeSparseIndexes(indexes: number[]): number[] {
  const bytes: number[] = []
  let previousIndex = -1

  for (const index of indexes) {
    encodeUnsignedVarint(index - previousIndex, bytes)
    previousIndex = index
  }

  return bytes
}

function encodeBitsetIndexes(indexes: number[]): number[] {
  const highestIndex = indexes.at(-1)
  if (highestIndex === undefined) {
    return []
  }

  const bytes = Array.from({ length: Math.floor(highestIndex / 8) + 1 }, () => 0)
  for (const index of indexes) {
    const byteIndex = Math.floor(index / 8)
    const bit = index % 8
    bytes[byteIndex] += 2 ** bit
  }
  return bytes
}

function decodeSparseIndexes(bytes: number[]): number[] | null {
  const indexes: number[] = []
  let cursor = 0
  let previousIndex = -1

  while (cursor < bytes.length) {
    const decoded = decodeUnsignedVarint(bytes, cursor)
    if (decoded === null || decoded.value < 1) {
      return null
    }

    const index = previousIndex + decoded.value
    if (!Number.isSafeInteger(index)) {
      return null
    }

    indexes.push(index)
    previousIndex = index
    cursor = decoded.nextCursor
  }

  return indexes
}

function decodeBitsetIndexes(bytes: number[]): number[] {
  const indexes: number[] = []
  for (let byteIndex = 0; byteIndex < bytes.length; byteIndex += 1) {
    const byte = bytes[byteIndex]
    if (byte === undefined) continue
    for (let bit = 0; bit < 8; bit += 1) {
      if (Math.floor(byte / 2 ** bit) % 2 === 1) {
        indexes.push(byteIndex * 8 + bit)
      }
    }
  }
  return indexes
}

function encodeUnsignedVarint(value: number, bytes: number[]): void {
  let remaining = value
  while (remaining >= 0x80) {
    bytes.push((remaining % 0x80) + 0x80)
    remaining = Math.floor(remaining / 0x80)
  }
  bytes.push(remaining)
}

function decodeUnsignedVarint(bytes: number[], startCursor: number): { nextCursor: number; value: number } | null {
  let value = 0
  let multiplier = 1

  for (let byteCount = 0; byteCount < MAX_VARINT_BYTES; byteCount += 1) {
    const cursor = startCursor + byteCount
    const byte = bytes[cursor]
    if (byte === undefined) {
      return null
    }

    value += (byte % 0x80) * multiplier
    if (byte < 0x80) {
      const isCanonical = byteCount === 0 || value >= multiplier
      return Number.isSafeInteger(value) && isCanonical ? { nextCursor: cursor + 1, value } : null
    }
    multiplier *= 0x80
  }

  return null
}

function encodeBase64Url(bytes: number[]): string {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(BASE64_PADDING_PATTERN, '')
}

function decodeBase64Url(value: string): number[] | null {
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4)
    const binary = atob(padded)
    return Array.from(binary, (character) => character.charCodeAt(0))
  } catch {
    return null
  }
}
