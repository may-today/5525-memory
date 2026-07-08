import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { ThemeProvider } from '@/components/theme-provider'
import { TextureOverlay } from '@/components/ui/texture-overlay'
import { ToastProvider } from '@/components/ui/toast'
import indexCss from '@/index.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, user-scalable=no',
      },
      { title: '5525 Memory' },
    ],
    links: [{ rel: 'stylesheet', href: indexCss }],
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
        <Scripts />
      </body>
    </html>
  )
}
