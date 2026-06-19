import type { ReactNode } from "react"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"

import { ThemeProvider } from "@/components/theme-provider"
import { TextureOverlay } from "@/components/ui/texture-overlay"
import indexCss from "@/index.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "5525 Memory" },
    ],
    links: [{ rel: "stylesheet", href: indexCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <ThemeProvider defaultTheme="dark">
        <div className="bg-background min-h-svh">
          <TextureOverlay texture="dots" opacity={0.2} className="invert" />
          <div className="bg-background relative mx-auto min-h-svh max-w-3xl border-x">
            <Outlet />
          </div>
        </div>
      </ThemeProvider>
    </RootDocument>
  )
}

interface RootDocumentProps {
  children: ReactNode
}

function RootDocument({ children }: RootDocumentProps) {
  return (
    <html lang="zh-CN" className="dark">
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
