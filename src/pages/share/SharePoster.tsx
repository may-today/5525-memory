import type { CSSProperties, Ref } from 'react'
import { useMemo } from 'react'

import type { Show } from '@/types'

/** 巡演子主题配色，与 `/form` 场次选择页、Overview 星图保持一致（未知子主题回退场次原 themeColor）。 */
const SUB_THEME_COLORS = {
  '5525': '#f472b6',
  '5525+1': '#38bdf8',
  '5525+2': '#fb923c',
} as const

/** 没有任何子主题信息时海报的兜底强调色（全站 sky-400）。 */
const FALLBACK_ACCENT = '#38bdf8'

/** 星座画布的 SVG viewBox 尺寸；所有布局坐标都以它为基准。 */
const CHART_WIDTH = 320
const CHART_HEIGHT = 236

/** 星轨节点标签最多标注的数量；超过时抽样（永远保留首尾）。 */
const MAX_LABELED_NODES = 8

/** 伪声波竖条数量。 */
const WAVE_BAR_COUNT = 56

interface TrailNode {
  city: string
  color: string
  dateSlash: string
  id: number
  /** 标签是否画在节点上方（上下交替避让）。 */
  isLabelAbove: boolean
  /** 是否在节点旁标注日期与城市（密集星座只抽样标注，避免文字互相压盖）。 */
  isLabeled: boolean
  x: number
  y: number
}

interface SharePosterProps {
  /** 昵称，为空时落款省略。 */
  nickname: string
  /** 海报根节点，供分享页导出成图片。 */
  ref?: Ref<HTMLDivElement>
  /** 用户去过的场次；空数组渲染零状态海报。 */
  shows: Show[]
  /** 图底声波对应的歌曲；null 时隐藏波形区。 */
  signatureSong: { isRandomPick: boolean; title: string } | null
}

/** 以整数种子生成 [0, 1) 的确定性伪随机数，保证同一批场次永远生成同一张星座。 */
function hash01(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43_758.5453
  return value - Math.floor(value)
}

function getShowColor(show: Show): string {
  return SUB_THEME_COLORS[show.subTheme as keyof typeof SUB_THEME_COLORS] ?? show.themeColor
}

/** 取用户去过最多的子主题色作为海报主导色，让每个人的海报有不同色温。 */
function getDominantColor(shows: Show[]): string {
  const counts = new Map<string, number>()
  let dominant = FALLBACK_ACCENT
  let dominantCount = 0

  for (const show of shows) {
    const color = getShowColor(show)
    const count = (counts.get(color) ?? 0) + 1
    counts.set(color, count)
    if (count > dominantCount) {
      dominant = color
      dominantCount = count
    }
  }

  return dominant
}

function pickLabeledIndexes(nodeCount: number): Set<number> {
  const indexes = new Set<number>()
  if (nodeCount <= MAX_LABELED_NODES) {
    for (let i = 0; i < nodeCount; i++) indexes.add(i)
    return indexes
  }

  for (let step = 0; step < MAX_LABELED_NODES; step++) {
    indexes.add(Math.round((step * (nodeCount - 1)) / (MAX_LABELED_NODES - 1)))
  }
  return indexes
}

/** 把场次按日期串成星座节点：x 按序号铺开 + 种子抖动，y 在中带内漂移。 */
function buildTrailNodes(shows: Show[]): TrailNode[] {
  const sorted = [...shows].sort((a, b) => a.showDate.localeCompare(b.showDate) || a.id - b.id)
  const labeledIndexes = pickLabeledIndexes(sorted.length)

  return sorted.map((show, index) => {
    const progress = sorted.length === 1 ? 0.5 : index / (sorted.length - 1)
    const x = 32 + progress * (CHART_WIDTH - 64) + (hash01(show.id) - 0.5) * 18
    const y = CHART_HEIGHT / 2 + (hash01(show.id * 7 + 13) - 0.5) * (CHART_HEIGHT * 0.52)

    return {
      city: show.city,
      color: getShowColor(show),
      dateSlash: show.dateSlash,
      id: show.id,
      isLabeled: labeledIndexes.has(index),
      isLabelAbove: index % 2 === 0,
      x: Math.min(CHART_WIDTH - 24, Math.max(24, x)),
      y: Math.min(CHART_HEIGHT - 30, Math.max(30, y)),
    }
  })
}

/** Catmull-Rom 转三次贝塞尔，把节点连成一条平滑星轨。 */
function buildTrailPath(nodes: TrailNode[]): string {
  if (nodes.length < 2) return ''

  const segments = [`M ${nodes[0].x.toFixed(1)} ${nodes[0].y.toFixed(1)}`]
  for (let i = 0; i < nodes.length - 1; i++) {
    const prev = nodes[i - 1] ?? nodes[i]
    const from = nodes[i]
    const to = nodes[i + 1]
    const next = nodes[i + 2] ?? to

    const cp1x = from.x + (to.x - prev.x) / 6
    const cp1y = from.y + (to.y - prev.y) / 6
    const cp2x = to.x - (next.x - from.x) / 6
    const cp2y = to.y - (next.y - from.y) / 6
    segments.push(
      `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`
    )
  }
  return segments.join(' ')
}

interface WaveBar {
  height: number
  opacity: number
  x: number
}

/** 由歌名字符生成确定性伪声波：中线镜像 + 正弦包络，同一首歌永远是同一段波形。 */
function buildWaveBars(title: string): WaveBar[] {
  let seed = 0
  for (let i = 0; i < title.length; i++) {
    seed = (seed * 31 + title.charCodeAt(i)) % 100_000
  }

  const barPitch = CHART_WIDTH / WAVE_BAR_COUNT
  return Array.from({ length: WAVE_BAR_COUNT }, (_, i) => {
    const envelope = 0.3 + 0.7 * Math.sin((Math.PI * i) / (WAVE_BAR_COUNT - 1))
    return {
      height: (2 + hash01(seed + i * 7) * 11) * envelope,
      opacity: 0.16 + hash01(i * 3 + 1) * 0.22,
      x: i * barPitch + (barPitch - 2.2) / 2,
    }
  })
}

function ConstellationChart({ nodes }: { nodes: TrailNode[] }) {
  const trailPath = buildTrailPath(nodes)

  return (
    <svg
      aria-label="由你去过的场次连成的星轨"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
    >
      {trailPath && (
        <path
          className="share-trail-path"
          d={trailPath}
          fill="none"
          pathLength={1}
          stroke="rgba(186, 200, 220, 0.55)"
          strokeLinecap="round"
          strokeWidth={0.8}
        />
      )}
      {nodes.map((node, index) => (
        <g className="share-node" key={node.id} style={{ '--i': index } as CSSProperties}>
          <circle cx={node.x} cy={node.y} fill={node.color} opacity={0.16} r={7} />
          <circle
            className="share-node-core"
            cx={node.x}
            cy={node.y}
            fill={node.color}
            r={2.6}
            style={{ filter: `drop-shadow(0 0 5px ${node.color})` }}
          />
          {node.isLabeled && (
            <text
              className="font-mono"
              fill="#a1a1aa"
              fontSize={8}
              textAnchor="middle"
              x={Math.min(CHART_WIDTH - 30, Math.max(30, node.x))}
              y={node.isLabelAbove ? node.y - 13 : node.y + 19}
            >
              {node.dateSlash} {node.city}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

/** 只去过一场时的「孤勇星球」：一颗大号星球向外扩散引力波圆环。 */
function LonePlanetChart({ node }: { node: TrailNode }) {
  const cx = CHART_WIDTH / 2
  const cy = CHART_HEIGHT / 2 - 10

  return (
    <svg
      aria-label="你的孤勇星球"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
    >
      {[0, 1, 2].map((ring) => (
        <circle
          className="share-gravity-ring"
          cx={cx}
          cy={cy}
          fill="none"
          key={ring}
          r={18}
          stroke={node.color}
          strokeWidth={0.8}
          style={{ '--i': ring } as CSSProperties}
        />
      ))}
      <circle cx={cx} cy={cy} fill={node.color} opacity={0.2} r={13} />
      <circle
        className="share-node-core"
        cx={cx}
        cy={cy}
        fill={node.color}
        r={7}
        style={{ filter: `drop-shadow(0 0 10px ${node.color})` }}
      />
      <text className="font-mono" fill="#d4d4d8" fontSize={9} textAnchor="middle" x={cx} y={cy + 34}>
        {node.dateSlash} {node.city}
      </text>
      <text fill="#71717a" fontSize={9} textAnchor="middle" x={cx} y={cy + 50}>
        一颗孤勇星球，自转出独特的引力波
      </text>
    </svg>
  )
}

function SignatureWave({
  dominantColor,
  song,
}: {
  dominantColor: string
  song: { isRandomPick: boolean; title: string }
}) {
  const bars = useMemo(() => buildWaveBars(song.title), [song.title])

  return (
    <div className="relative px-6 py-4">
      <svg
        aria-hidden="true"
        className="w-full"
        preserveAspectRatio="none"
        role="presentation"
        viewBox={`0 0 ${CHART_WIDTH} 32`}
      >
        {bars.map((bar) => (
          <rect
            fill={dominantColor}
            height={bar.height * 2}
            key={bar.x}
            opacity={bar.opacity}
            rx={1}
            width={2.2}
            x={bar.x}
            y={16 - bar.height}
          />
        ))}
      </svg>
      <p className="mt-1.5 text-center text-[10px] text-zinc-500">
        {song.isRandomPick ? '你的常驻曲' : '你听过最多的歌'} ·<span className="text-zinc-300">《{song.title}》</span>
      </p>
    </div>
  )
}

/** 星座画布分派：多场连星轨、单场孤勇星球、空场次渲染零状态引导。 */
function PosterChartArea({ nodes }: { nodes: TrailNode[] }) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <p className="text-sm text-zinc-300">你的星域还一片寂静</p>
        <p className="text-xs text-zinc-500">回到场次选择，点亮属于你的星轨</p>
      </div>
    )
  }

  if (nodes.length === 1) {
    return <LonePlanetChart node={nodes[0]} />
  }

  return <ConstellationChart nodes={nodes} />
}

/**
 * 「星轨共振」宇宙航线海报：用户去过的场次连成星座，图底是常驻曲伪声波，
 * 底部落款用场次口令作为限量编号。空场次渲染零状态海报。
 */
export function SharePoster({ nickname, ref, shows, signatureSong }: SharePosterProps) {
  const nodes = useMemo(() => buildTrailNodes(shows), [shows])
  const dominantColor = useMemo(() => getDominantColor(shows), [shows])
  const cityCount = useMemo(() => new Set(shows.map((show) => show.city)).size, [shows])
  const hasShows = shows.length > 0

  return (
    <div
      className="share-poster-in relative mx-auto flex aspect-5/7 w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100"
      ref={ref}
    >
      <div className="summary-space-bg" />
      <div className="summary-space-stars absolute" />
      <div className="summary-space-stars summary-space-stars-twinkle absolute" />

      <header className="relative z-10 flex items-baseline justify-between border-white/10 border-b px-5 pt-4 pb-3">
        <p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em]">#5525 时空旅行报告</p>
        <p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em]">{nickname}</p>
      </header>

      <div className="relative z-10 min-h-0 flex-1">
        <PosterChartArea nodes={nodes} />
      </div>

      {hasShows && signatureSong && <SignatureWave dominantColor={dominantColor} song={signatureSong} />}

      {/*<div className="relative z-10 px-6 pt-5 pb-4 text-center">
        <p
          className="whitespace-nowrap font-title text-[clamp(0.9rem,4.7vw,1.2rem)] text-zinc-100 leading-relaxed"
          style={{ textShadow: `0 0 22px ${dominantColor}59` }}
        >
          宇宙很大，
          <br />
          但谢谢我们在 5525 号星域相撞。
        </p>
      </div>*/}

      <footer className="relative z-10 flex items-baseline justify-between gap-3 border-white/10 border-t px-5 pt-3 pb-4">
        <p className="whitespace-nowrap text-[10px] text-zinc-500">
          {hasShows ? (
            <>
              <span className="font-geist text-zinc-300">{cityCount}</span> 城 ·{' '}
              <span className="font-geist text-zinc-300">{shows.length}</span> 场
            </>
          ) : (
            'MEMORY PRESS'
          )}
        </p>
        <p className="min-w-0 truncate font-mono text-[9px] text-zinc-600 uppercase tracking-wider">5525.MAYDAY.LAND</p>
      </footer>
    </div>
  )
}
