import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function CoverPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight">5525 Memory</h1>
        <p className="text-muted-foreground text-sm">你的 Mayday 年度回忆</p>
      </div>
      <Button size="lg" onClick={() => navigate("/form")}>
        开始回忆
      </Button>
    </div>
  )
}
