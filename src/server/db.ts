import { createServerOnlyFn } from '@tanstack/react-start'

/**
 * Access to the D1 binding, wrapped in createServerOnlyFn so an accidental
 * client-side import throws immediately instead of silently failing.
 */
export const getDb = createServerOnlyFn(async () => {
  const { env } = await import('cloudflare:workers')
  return env.DB
})
