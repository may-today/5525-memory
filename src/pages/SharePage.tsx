import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

export function SharePage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col p-6">
      <h2 className="mb-6 font-semibold text-xl">你的年度总结</h2>

      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-border bg-muted">
        <p className="text-muted-foreground text-sm">总结卡片预览区域</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button className="w-full" disabled size="lg">
          保存图片
        </Button>
        <Button className="w-full" disabled size="lg" variant="outline">
          分享
        </Button>
        <button
          className="mt-2 text-center text-muted-foreground text-sm underline underline-offset-4"
          onClick={() => navigate({ to: '/summary' })}
        >
          返回总结
        </button>
      </div>
    </div>
  )
}
