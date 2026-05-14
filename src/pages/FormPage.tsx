import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import type { ConcertFormData } from "@/types"

export function FormPage() {
  const navigate = useNavigate()
  const [shows, setShows] = useState("")

  /** Handle form submission and advance to loading page */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data: ConcertFormData = {
      shows: shows
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    }
    // TODO: persist data via context or state management
    console.log("form data:", data)
    navigate("/loading")
  }

  return (
    <div className="flex min-h-svh flex-col p-6">
      <h2 className="mb-6 text-xl font-semibold">填写你的场次信息</h2>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">你去过哪些场次？</label>
          <textarea
            className="border-border bg-background min-h-32 w-full rounded-md border p-3 text-sm resize-none focus:outline-none"
            placeholder={"例如：\n2024-09-14 台北小巨蛋\n2024-09-15 台北小巨蛋"}
            value={shows}
            onChange={(e) => setShows(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">每行填写一场，格式：日期 + 场地</p>
        </div>
        <div className="mt-auto">
          <Button type="submit" className="w-full" size="lg">
            下一步
          </Button>
        </div>
      </form>
    </div>
  )
}
