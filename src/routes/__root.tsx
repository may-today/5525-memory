import { aiDevtoolsPlugin } from '@tanstack/react-ai-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { TextureOverlay } from '@/components/ui/texture-overlay'
import { ToastProvider } from '@/components/ui/toast'
import indexCss from '@/index.css?url'

/** Reads the public static-asset host from the current Cloudflare Worker. */
const getStaticFileHost = createServerFn({ method: 'GET' }).handler(async (): Promise<string> => {
  const { env } = await import('cloudflare:workers')
  return env.STATIC_FILE_HOST
})

export const Route = createRootRoute({
  loader: async () => ({
    staticFileHost: await getStaticFileHost(),
  }),
  head: ({ loaderData }) => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, user-scalable=no',
      },
      { title: '5525 Memory' },
    ],
    links: [
      { rel: 'stylesheet', href: indexCss },
      ...(loaderData
        ? [
            {
              rel: 'stylesheet' as const,
              href: `${loaderData.staticFileHost}/5525/font/ChillDINGothic_Std/result.css`,
              crossOrigin: 'anonymous' as const,
            },
          ]
        : []),
    ],
    scripts: [
      {
        src: '/scripts/ant.js',
        'data-site-id': '159f27cf0b75',
        defer: true,
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <ThemeProvider defaultTheme="dark">
        <ToastProvider>
          <div className="min-h-svh bg-background">
            <TextureOverlay className="invert" opacity={0.2} texture="dots" />
            <div className="relative mx-auto min-h-svh max-w-3xl border-x bg-background">
              <Outlet />
            </div>
          </div>
        </ToastProvider>
      </ThemeProvider>
    </RootDocument>
  )
}

interface RootDocumentProps {
  children: ReactNode
}

function RootDocument({ children }: RootDocumentProps) {
  return (
    <html className="dark" lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          eventBusConfig={{
            connectToServerBus: true,
          }}
          plugins={[aiDevtoolsPlugin()]}
        />
        <Scripts />
      </body>
    </html>
  )
}
