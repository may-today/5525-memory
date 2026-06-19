import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export function LoadingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: '/summary' })
    }, 2000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-muted-foreground text-sm">正在整理你的记忆…</p>
    </div>
  )
}
