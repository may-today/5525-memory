import { useNavigate } from '@tanstack/react-router'
import clsx from 'clsx'
import { ArrowRight } from 'lucide-react'
import MaydayIcon from '@/assets/mayday.svg'
import { Marquee } from '@/components/marquee'
import { TextureOverlay } from '@/components/ui/texture-overlay'

const Logos = () => (
  <div className="flex flex-row items-center gap-2">
    <div className="bg-accent px-3 py-2 text-muted-foreground text-xs">Diu Logo</div>
    <div className="bg-accent px-3 py-2 text-muted-foreground text-xs">相遇五月天</div>
    <div className="bg-accent px-3 py-2 text-muted-foreground text-xs">LeseTruck</div>
  </div>
)

const NextButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => (
  <button
    className={clsx([
      'flex size-24 items-center justify-center rounded-full bg-white font-semibold text-black transition-all hover:scale-105 hover:bg-white/80 active:scale-95',
      className,
    ])}
    onClick={onClick}
    type="button"
  >
    <ArrowRight className="size-10" strokeWidth={2} />
  </button>
)

export function CoverPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col items-stretch justify-stretch">
      <div className="relative flex-1">
        <TextureOverlay className="invert" opacity={0.2} texture="grid" />
      </div>
      <div className="border-t py-1 font-geist">
        <Marquee>
          <div className="mx-1 flex flex-row items-baseline gap-2">
            <div>MAYDAY 5525</div>
            <img alt="Mayday Icon" className="size-3.5" height={14} src={MaydayIcon} width={14} />
            <div>MAYDAY 5525+1</div>
            <img alt="Mayday Icon" className="size-3.5" height={14} src={MaydayIcon} width={14} />
            <div>MAYDAY 5525+2</div>
            <img alt="Mayday Icon" className="size-3.5" height={14} src={MaydayIcon} width={14} />
          </div>
        </Marquee>
      </div>
      <div className="relative flex flex-col items-start gap-2 border-t px-5 py-6">
        <p className="text-muted-foreground text-sm">五月天「5525 回到那一天」</p>
        <h1 className="mb-6 font-extrabold font-wjh text-5xl">
          你的
          <br />
          时空旅行报告
        </h1>
        <Logos />
        <p className="mt-3 text-muted-foreground text-xs">隐私声明 · 感谢名单</p>
        <NextButton className="absolute right-6 bottom-8" onClick={() => navigate({ to: '/form' })} />
        {/* <Button size="lg" onClick={() => navigate("/form")}>
					开始回忆
				</Button> */}
      </div>
    </div>
  )
}
