import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export function LoadingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/summary")
    }, 2000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6">
      <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      <p className="text-muted-foreground text-sm">正在整理你的记忆…</p>
    </div>
  )
}
