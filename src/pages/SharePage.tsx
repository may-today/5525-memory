import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function SharePage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col p-6">
      <h2 className="mb-6 text-xl font-semibold">你的年度总结</h2>

      <div className="border-border bg-muted flex flex-1 flex-col items-center justify-center rounded-2xl border">
        <p className="text-muted-foreground text-sm">总结卡片预览区域</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" disabled className="w-full">
          保存图片
        </Button>
        <Button size="lg" variant="outline" disabled className="w-full">
          分享
        </Button>
        <button
          className="text-muted-foreground mt-2 text-center text-sm underline underline-offset-4"
          onClick={() => navigate("/summary")}
        >
          返回总结
        </button>
      </div>
    </div>
  )
}
