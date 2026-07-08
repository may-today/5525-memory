import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ToastItem {
  description?: string
  id: number
  title: string
  variant?: 'default' | 'destructive'
}

interface ToastInput {
  description?: string
  title: string
  variant?: 'default' | 'destructive'
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)
const TOAST_DURATION = 3500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((input: ToastInput) => {
    const id = Date.now()
    setToasts((current) => [...current, { ...input, id }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, TOAST_DURATION)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((item) => (
          <div
            className={cn(
              'pointer-events-auto border bg-background px-4 py-3 text-foreground shadow-lg',
              item.variant === 'destructive' ? 'border-destructive/70' : 'border-border'
            )}
            key={item.id}
          >
            <p className="font-medium text-sm">{item.title}</p>
            {item.description && <p className="mt-1 text-muted-foreground text-xs">{item.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** Access the app-level toast dispatcher. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
