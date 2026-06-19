# 5525 Memory

A mobile-first replay webapp for the Mayday #5525 live tour, built with TanStack Start and deployed on Cloudflare Workers.

## Development

```bash
bun install
bun run dev
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
