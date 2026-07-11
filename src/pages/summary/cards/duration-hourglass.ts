/**
 * Canvas-2D particle engine for the Duration card's "dome of time".
 *
 * The hourglass is abstracted to its upper bulb only: a semicircular dome of
 * glowing blue particles (arc up, chord down) floating in the top third of
 * the canvas. Scroll progress (smoothed every frame) drives the story — idle
 * shimmer, then each grain funnels to the chord's midpoint (the implied
 * neck), falls along a bezier and lands directly on its pixel of the user's
 * total-minutes digits. The text materializes grain by grain, roughly left
 * to right. Particle positions are pure functions of the smoothed progress,
 * so scrubbing backwards replays the animation in reverse with no
 * accumulated state.
 *
 * Rendering follows the City card's WebGL precedents: device pixel ratio is
 * capped at 1.5, the RAF loop freezes while the page transition runs
 * (setPaused) and stops entirely on destroy. Glow is drawn by stamping a
 * pre-rendered radial-gradient sprite — never per-particle shadowBlur.
 */

export interface DurationHourglassOptions {
  canvas: HTMLCanvasElement
  /**
   * DOM element showing the real total-minutes text. The digit point cloud is
   * fitted to its bounding box so the particle→DOM crossfade lines up.
   */
  numberEl: HTMLElement | null
  /** Called when smoothed progress crosses the DOM-number handoff threshold. */
  onHandoffChange?: (isHandoff: boolean) => void
  /** Final number the particles converge into. */
  totalMinutes: number
}

export interface DurationHourglassInstance {
  /** Stops the RAF loop, disconnects observers and releases the canvas. */
  destroy(): void
  /** Draws a single static idle-dome frame (reduced-motion mode). */
  renderStaticFrame(): void
  /** Freezes/unfreezes the RAF loop during page transitions. */
  setPaused(isPaused: boolean): void
  /** Sets the scroll-driven target progress in [0, 1]; the loop eases toward it. */
  setTargetProgress(progress: number): void
}

/** 荧光蓝 #38bdf8 —— 与城市卡星轨同色，本卡粒子唯一用色。 */
const PARTICLE_COLOR = { r: 56, g: 189, b: 248 }

const MAX_DEVICE_PIXEL_RATIO = 1.5
const MIN_PARTICLES = 500
const MAX_PARTICLES = 1800
/** One particle per this many CSS pixels of canvas area. */
const AREA_PER_PARTICLE = 320

/** Fraction of particles tracing the dome outline instead of acting as sand. */
const RIM_RATIO = 0.2

/**
 * Fraction of the remaining distance to the scroll target covered per 60fps
 * frame; converted to a time-based factor each frame so the scrub feel is
 * identical across 60Hz/120Hz displays and throttled tabs.
 */
const PROGRESS_EASING_PER_FRAME = 0.08
const REFERENCE_FRAME_MS = 16.7

/* Phase boundaries on the smoothed progress axis. */
const FLOW_START = 0.14
const FLOW_END = 0.86
/**
 * Per-grain journey length as a fraction of the flow phase; the remaining
 * (1 − window) is the stagger spread, so the last grain lands at FLOW_END.
 */
const GRAIN_WINDOW = 0.35
/** Fraction of a grain's journey spent funneling to the spout (rest is the fall). */
const FUNNEL_END = 0.28
/** Particles fade out over this window while the DOM number fades in. */
const FADE_OUT_START = 0.92
const FADE_OUT_END = 0.98
/** Handoff hysteresis so the DOM number doesn't flicker at the boundary. */
const HANDOFF_ON = 0.93
const HANDOFF_OFF = 0.88

interface Particle {
  /** Control-point x offset (px) so parallel falls braid instead of stacking. */
  fallDrift: number
  /** Stagger offset in [0, 1) so grains leave the dome one after another. */
  flowOffset: number
  homeX: number
  homeY: number
  /** True for dome-outline particles that never flow, only shimmer. */
  isRim: boolean
  /** Draw scale relative to the sprite's base size. */
  sizeScale: number
  /** Horizontal x jitter (px) at the spout so the stream has width. */
  spoutJitter: number
  /** Index into the sprite atlas (0 = dim small, 1 = bright large). */
  spriteIndex: number
  /** Peak horizontal sway (px) while falling; damps out on landing. */
  swayAmount: number
  targetX: number
  targetY: number
  twinklePhase: number
  twinkleSpeed: number
}

interface DomeGeometry {
  centerX: number
  /** y of the dome's flat bottom edge — the implied hourglass neck line. */
  chordY: number
  radius: number
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function buildGeometry(width: number, height: number): DomeGeometry {
  return {
    centerX: width / 2,
    chordY: height * 0.34,
    radius: Math.min(width * 0.42, height * 0.22),
  }
}

/** Pre-renders one soft radial glow dot so the main loop only stamps images. */
function makeGlowSprite(radius: number, coreAlpha: number): HTMLCanvasElement {
  const sprite = document.createElement('canvas')
  sprite.width = radius * 2
  sprite.height = radius * 2
  const ctx = sprite.getContext('2d')
  if (!ctx) return sprite

  const { r, g, b } = PARTICLE_COLOR
  const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius)
  gradient.addColorStop(0, `rgba(235, 250, 255, ${coreAlpha})`)
  gradient.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${coreAlpha * 0.85})`)
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, radius * 2, radius * 2)
  return sprite
}

/** Samples a sand-particle rest position uniformly inside the半圆 dome. */
function sampleDome(geometry: DomeGeometry): [number, number] {
  const angle = Math.random() * Math.PI
  const distance = geometry.radius * 0.96 * Math.sqrt(Math.random())
  return [geometry.centerX + Math.cos(angle) * distance, geometry.chordY - Math.sin(angle) * distance - 2]
}

/** Samples a point on the dome outline — mostly the arc, sparsely the chord. */
function sampleRim(geometry: DomeGeometry): [number, number] {
  if (Math.random() < 0.25) {
    return [
      geometry.centerX + (Math.random() * 2 - 1) * geometry.radius,
      geometry.chordY + (Math.random() * 2 - 1) * 1.2,
    ]
  }

  const angle = Math.random() * Math.PI
  const distance = geometry.radius + (Math.random() * 2 - 1) * 1.5
  return [geometry.centerX + Math.cos(angle) * distance, geometry.chordY - Math.sin(angle) * distance]
}

interface DigitCloud {
  height: number
  points: [number, number][]
  width: number
}

const EMPTY_DIGIT_CLOUD: DigitCloud = { points: [], width: 0, height: 0 }

/** Grid step (px) between sampled pixels when scanning the rasterized digits. */
const DIGIT_SAMPLE_STEP = 3

/** Scans lit pixels of the rasterized text into a bbox-normalized point cloud. */
function scanLitPixels(image: ImageData): DigitCloud {
  const points: [number, number][] = []
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (let y = 0; y < image.height; y += DIGIT_SAMPLE_STEP) {
    for (let x = 0; x < image.width; x += DIGIT_SAMPLE_STEP) {
      const alpha = image.data[(y * image.width + x) * 4 + 3]
      if (alpha === undefined || alpha < 128) continue
      points.push([x, y])
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (points.length === 0) return EMPTY_DIGIT_CLOUD
  return {
    points: points.map(([x, y]): [number, number] => [x - minX, y - minY]),
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Rasterizes the total-minutes text with the Doto face on an offscreen canvas
 * and samples lit pixels into a point cloud (glyph space). Waits for the font
 * so the particles form actual dot-matrix digits, but samples whatever
 * rendered if loading fails — fallback digits still read fine as particles.
 */
async function sampleDigitPoints(text: string): Promise<DigitCloud> {
  const fontSpec = '700 100px "Doto", monospace'
  try {
    await document.fonts.load(fontSpec, text)
  } catch {
    // Sampling proceeds with the fallback face below.
  }

  const offscreen = document.createElement('canvas')
  const measureCtx = offscreen.getContext('2d', { willReadFrequently: true })
  if (!measureCtx) return EMPTY_DIGIT_CLOUD

  measureCtx.font = fontSpec
  const metrics = measureCtx.measureText(text)
  offscreen.width = Math.ceil(metrics.width) + 8
  offscreen.height = 140

  const ctx = offscreen.getContext('2d', { willReadFrequently: true })
  if (!ctx) return EMPTY_DIGIT_CLOUD
  ctx.font = fontSpec
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 4, 70)

  return scanLitPixels(ctx.getImageData(0, 0, offscreen.width, offscreen.height))
}

interface GrainPosition {
  /** Ghost-copy opacity factor for the star-trail; 0 outside the falling leg. */
  trailAlpha: number
  trailX: number
  trailY: number
  x: number
  y: number
}

/** Quadratic bezier through the spout → control → digit-target fall path. */
function bezier(
  spoutX: number,
  spoutY: number,
  controlX: number,
  controlY: number,
  targetX: number,
  targetY: number,
  t: number
): [number, number] {
  const inverse = 1 - t
  return [
    inverse * inverse * spoutX + 2 * inverse * t * controlX + t * t * targetX,
    inverse * inverse * spoutY + 2 * inverse * t * controlY + t * t * targetY,
  ]
}

/**
 * Pure position of a sand grain: home shimmer, funnel to the spout, then a
 * bezier fall that lands directly on its digit pixel (with a trailing ghost).
 * Deterministic in (flowPhase, time), so scrubbing backwards replays it in
 * reverse.
 */
function getGrainPosition(particle: Particle, geometry: DomeGeometry, flowPhase: number, time: number): GrainPosition {
  const flowT = clamp01((flowPhase - particle.flowOffset * (1 - GRAIN_WINDOW)) / GRAIN_WINDOW)
  const spoutX = geometry.centerX + particle.spoutJitter

  let x = particle.homeX
  let y = particle.homeY
  let trailX = 0
  let trailY = 0
  let trailAlpha = 0

  if (flowT > 0 && flowT < FUNNEL_END) {
    const funnelT = flowT / FUNNEL_END
    x = lerp(particle.homeX, spoutX, funnelT ** 1.6)
    y = lerp(particle.homeY, geometry.chordY, funnelT * funnelT)
  } else if (flowT >= FUNNEL_END) {
    const fallT = (flowT - FUNNEL_END) / (1 - FUNNEL_END)
    const controlX = geometry.centerX + particle.fallDrift
    const controlY = geometry.chordY + (particle.targetY - geometry.chordY) * 0.6
    const eased = easeInOutCubic(fallT)
    ;[x, y] = bezier(spoutX, geometry.chordY, controlX, controlY, particle.targetX, particle.targetY, eased)
    x += Math.sin(time * 2 + particle.twinklePhase) * particle.swayAmount * (1 - eased)

    if (fallT > 0.02 && fallT < 0.96) {
      const ghostEased = easeInOutCubic(Math.max(0, fallT - 0.08))
      ;[trailX, trailY] = bezier(
        spoutX,
        geometry.chordY,
        controlX,
        controlY,
        particle.targetX,
        particle.targetY,
        ghostEased
      )
      trailAlpha = 0.3
    }
  }

  const drift = 1 - clamp01(flowT * 4)
  if (drift > 0) {
    x += Math.sin(time * particle.twinkleSpeed + particle.twinklePhase) * 1.6 * drift
    y += Math.cos(time * particle.twinkleSpeed * 0.8 + particle.twinklePhase * 1.7) * 1.2 * drift
  }

  return { x, y, trailX, trailY, trailAlpha }
}

/** Position of any particle this frame: rim points only shimmer in place, grains travel. */
function getParticlePosition(
  particle: Particle,
  geometry: DomeGeometry,
  flowPhase: number,
  time: number
): GrainPosition {
  if (!particle.isRim) return getGrainPosition(particle, geometry, flowPhase, time)
  return {
    x: particle.homeX + Math.sin(time * particle.twinkleSpeed + particle.twinklePhase) * 1.4,
    y: particle.homeY + Math.cos(time * particle.twinkleSpeed * 0.8 + particle.twinklePhase * 1.7) * 1.1,
    trailX: 0,
    trailY: 0,
    trailAlpha: 0,
  }
}

interface TargetBox {
  height: number
  width: number
  x: number
  y: number
}

/** Measures the DOM number's box in canvas coordinates, or null before layout. */
function measureNumberBox(numberEl: HTMLElement | null, canvas: HTMLCanvasElement): TargetBox | null {
  if (!numberEl) return null
  const numberRect = numberEl.getBoundingClientRect()
  if (numberRect.width === 0) return null
  const canvasRect = canvas.getBoundingClientRect()
  return {
    x: numberRect.left - canvasRect.left,
    y: numberRect.top - canvasRect.top,
    width: numberRect.width,
    height: numberRect.height,
  }
}

/** Fallback landing when font sampling failed: a soft horizontal band below the dome. */
function scatterBandTargets(particles: Particle[], geometry: DomeGeometry): void {
  for (const particle of particles) {
    particle.targetX = geometry.centerX + (Math.random() * 2 - 1) * geometry.radius * 1.1
    particle.targetY = geometry.chordY + geometry.radius * 1.4 + (Math.random() * 2 - 1) * 10
  }
}

/** Fits the digit cloud into the box and writes each particle's landing pixel. */
function applyDigitTargets(particles: Particle[], cloud: DigitCloud, box: TargetBox): void {
  const scale = Math.min(box.width / cloud.width, box.height / cloud.height)
  const offsetX = box.x + (box.width - cloud.width * scale) / 2
  const offsetY = box.y + (box.height - cloud.height * scale) / 2

  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i]
    const point = cloud.points[i % cloud.points.length]
    if (!(particle && point)) continue
    particle.targetX = offsetX + point[0] * scale + (Math.random() * 2 - 1) * 1.2
    particle.targetY = offsetY + point[1] * scale + (Math.random() * 2 - 1) * 1.2
  }
}

/** Re-staggers grains by target x so the text materializes roughly left to right. */
function staggerGrainsLeftToRight(particles: Particle[]): void {
  const sand = particles.filter((particle) => !particle.isRim).sort((a, b) => a.targetX - b.targetX)
  for (let rank = 0; rank < sand.length; rank++) {
    const grain = sand[rank]
    if (!grain) continue
    grain.flowOffset = (rank / sand.length) * 0.85 + Math.random() * 0.15
  }
}

/**
 * Creates the dome engine on the given canvas. The caller owns the RAF
 * policy only indirectly: the loop starts immediately and must be released
 * with destroy() on unmount.
 */
export function createDurationHourglass(options: DurationHourglassOptions): DurationHourglassInstance {
  const { canvas, numberEl, onHandoffChange, totalMinutes } = options
  const context = canvas.getContext('2d')

  let particles: Particle[] = []
  let geometry: DomeGeometry | null = null
  let digitCloud: DigitCloud | null = null
  let width = 0
  let height = 0

  let progress = 0
  let targetProgress = 0
  let elapsed = 0
  let lastTime = performance.now()
  let isPaused = false
  let isHandoff = false
  let isDestroyed = false
  let animationFrame = 0

  const sprites = [makeGlowSprite(5, 0.55), makeGlowSprite(8, 0.9)]

  /**
   * Fits the digit point cloud to the DOM number's box (or below the dome as
   * fallback), then re-staggers grains by target x so the text materializes
   * roughly left to right as the sand arrives.
   */
  function assignDigitTargets(): void {
    if (!geometry) return

    if (!digitCloud || digitCloud.points.length === 0) {
      scatterBandTargets(particles, geometry)
      return
    }

    const box = measureNumberBox(numberEl, canvas) ?? {
      x: geometry.centerX - geometry.radius,
      y: geometry.chordY + geometry.radius * 1.25,
      width: geometry.radius * 2,
      height: 48,
    }
    applyDigitTargets(particles, digitCloud, box)
    staggerGrainsLeftToRight(particles)
  }

  function rebuild(): void {
    width = canvas.clientWidth
    height = canvas.clientHeight
    if (width === 0 || height === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    context?.setTransform(dpr, 0, 0, dpr, 0, 0)

    const dome = buildGeometry(width, height)
    geometry = dome
    const count = Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, Math.floor((width * height) / AREA_PER_PARTICLE)))

    particles = Array.from({ length: count }, (_, i): Particle => {
      const isRim = i < count * RIM_RATIO
      const [homeX, homeY] = isRim ? sampleRim(dome) : sampleDome(dome)
      return {
        fallDrift: (Math.random() * 2 - 1) * dome.radius * 0.35,
        flowOffset: Math.random(),
        homeX,
        homeY,
        isRim,
        sizeScale: 0.55 + Math.random() * 0.75,
        spoutJitter: (Math.random() * 2 - 1) * 3,
        spriteIndex: Math.random() < 0.82 ? 0 : 1,
        swayAmount: 2 + Math.random() * 5,
        targetX: homeX,
        targetY: homeY,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.8 + Math.random() * 1.6,
      }
    })

    assignDigitTargets()
  }

  function draw(): void {
    if (!(context && geometry) || width === 0) return
    context.clearRect(0, 0, width, height)

    const flowPhase = clamp01((progress - FLOW_START) / (FLOW_END - FLOW_START))
    const globalFade = 1 - clamp01((progress - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START))
    if (globalFade <= 0) return

    const time = elapsed * 0.001
    context.globalCompositeOperation = 'lighter'

    for (const particle of particles) {
      const { trailAlpha, trailX, trailY, x, y } = getParticlePosition(particle, geometry, flowPhase, time)

      const twinkle = 0.65 + 0.35 * Math.sin(time * particle.twinkleSpeed * 2 + particle.twinklePhase)
      const roleAlpha = particle.isRim ? 0.55 : 0.9
      const alpha = twinkle * roleAlpha * globalFade
      const sprite = sprites[particle.spriteIndex]
      if (!sprite || alpha <= 0.01) continue

      const size = sprite.width * particle.sizeScale
      context.globalAlpha = alpha
      context.drawImage(sprite, x - size / 2, y - size / 2, size, size)

      // Short star-trail ghost while falling toward the digits.
      if (trailAlpha > 0) {
        context.globalAlpha = alpha * trailAlpha
        context.drawImage(sprite, trailX - size / 2, trailY - size / 2, size, size)
      }
    }

    context.globalAlpha = 1
    context.globalCompositeOperation = 'source-over'
  }

  function frame(now: number): void {
    const delta = now - lastTime
    lastTime = now

    if (!isPaused) {
      elapsed += delta
      const easing = 1 - (1 - PROGRESS_EASING_PER_FRAME) ** (delta / REFERENCE_FRAME_MS)
      progress += (targetProgress - progress) * easing

      const shouldHandoff = isHandoff ? progress > HANDOFF_OFF : progress > HANDOFF_ON
      if (shouldHandoff !== isHandoff) {
        isHandoff = shouldHandoff
        onHandoffChange?.(isHandoff)
      }

      draw()
    }
    animationFrame = requestAnimationFrame(frame)
  }

  const resizeObserver = new ResizeObserver(() => {
    if (isDestroyed) return
    rebuild()
  })
  resizeObserver.observe(canvas)
  rebuild()
  animationFrame = requestAnimationFrame(frame)

  sampleDigitPoints(totalMinutes.toLocaleString('en-US')).then((cloud) => {
    if (isDestroyed) return
    digitCloud = cloud
    assignDigitTargets()
  })

  return {
    destroy(): void {
      isDestroyed = true
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    },
    renderStaticFrame(): void {
      cancelAnimationFrame(animationFrame)
      progress = 0
      elapsed = 400
      draw()
    },
    setPaused(paused: boolean): void {
      isPaused = paused
    },
    setTargetProgress(nextTarget: number): void {
      targetProgress = clamp01(nextTarget)
    },
  }
}
