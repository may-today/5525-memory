# 5525 Memory

A mobile-first replay webapp for the Mayday #5525 live tour, built with TanStack Start and deployed on Cloudflare Workers.

## Development

```bash
bun install
bunx wrangler d1 migrations apply 5525-memory-db --local
bun run dev
```

The `d1 migrations apply --local` step seeds a local D1 database under `.wrangler/state/v3/d1` (gitignored, one per machine). It's fully emulated by Miniflare — no Cloudflare account or credentials needed for local development.

## Database (Cloudflare D1)

Tour/show/setlist data lives in Cloudflare D1, not in a static JSON file — see `src/server/` for the data-access layer and `journey/plans/2026-07-08-d1-data-migration.md` for the full design.

**Schema and seed changes are append-only.** Never edit an already-applied migration file. To change the schema or seed data, create a new one:

```bash
bunx wrangler d1 migrations create 5525-memory-db <name>
```

Then apply it locally the same way as above. Anyone who pulls new commits touching `migrations/` just re-runs `wrangler d1 migrations apply 5525-memory-db --local` — it only applies what's new.

**Deploying schema changes to production** is manual for now: someone with Cloudflare account access runs

```bash
bunx wrangler d1 migrations apply 5525-memory-db --remote
bun run deploy
```

## Checks

```bash
bun run lint
bun run typecheck
bun run build
```

## Cloudflare Workers

Generate Worker binding types after changing `wrangler.jsonc`:

```bash
bun run cf-typegen
```

Preview the production Worker locally or deploy it:

```bash
bun run preview
bun run deploy
```

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `src/components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```
