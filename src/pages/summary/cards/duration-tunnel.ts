/**
 * Canvas-2D particle engine for the Duration card's "time tunnel".
 *
 * Every particle sits on the wall of an endless cylinder around a vanishing
 * point: a fixed ring angle, a radius jitter and a looping depth offset.
 * Scroll progress (smoothed every frame) drives the story — an idle tunnel
 * drifting slowly forward, then a warp flight through 2.4 loops of the
 * tunnel, and finally each star peels off its flight path and lands on its
 * pixel of the user's total-minutes digits. Particle positions are pure
 * functions of the smoothed progress and time, so scrubbing backwards
 * replays the whole journey in reverse with no accumulated state.
 *
 * Rendering follows the City card's WebGL precedents: device pixel ratio is
 * capped at 1.5, the RAF loop freezes while the page transition runs
 * (setPaused) and stops entirely on destroy. Glow is drawn by stamping a
 * pre-rendered radial-gradient sprite — never per-particle shadowBlur.
 */

export interface DurationTunnelOptions {
  canvas: HTMLCanvasElement
  /**
   * DOM element showing the real total-minutes text. The digit point cloud is
   * fitted to its bounding box so the particle→DOM crossfade lines up.
   */
  numberEl: HTMLElement | null
  /** Called when smoothed progress crosses the DOM-number handoff threshold. */
  onHandoffChange?: (isHandoff: boolean) => void
  /** Called when the intro copy should fade out (scroll departed) or back in. */
  onIntroChange?: (isIntroVisible: boolean) => void
  /** Final number the particles converge into (rendered without separators). */
  totalMinutes: number
}

export interface DurationTunnelInstance {
  /** Stops the RAF loop, disconnects observers and releases the canvas. */
  destroy(): void
  /** Draws a single static idle-tunnel frame (reduced-motion mode). */
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

/**
 * Fraction of the remaining distance to the scroll target covered per 60fps
 * frame; converted to a time-based factor each frame so the scrub feel is
 * identical across 60Hz/120Hz displays and throttled tabs.
 */
const PROGRESS_EASING_PER_FRAME = 0.08
const REFERENCE_FRAME_MS = 16.7

/* Phase boundaries on the smoothed progress axis. */
const FLIGHT_START = 0.05
const FLIGHT_END = 0.8
/** Tunnel loops the camera travels across the whole flight phase. */
const TUNNEL_LOOPS = 2.4
/** Depth loops per second while idle; hands over to the flight as it eases in. */
const IDLE_DRIFT_PER_SECOND = 0.012

/* Convergence of stars into the digit point cloud. */
const CONVERGE_START = 0.5
const CONVERGE_END = 0.88
/**
 * Per-star journey length as a fraction of the converge phase; the remaining
 * (1 − window) is the stagger spread, so the last star lands at CONVERGE_END.
 */
const CONVERGE_WINDOW = 0.34

/** Particles fade out over this window while the DOM number fades in. */
const FADE_OUT_START = 0.92
const FADE_OUT_END = 0.98
/** Handoff hysteresis so the DOM number doesn't flicker at the boundary. */
const HANDOFF_ON = 0.93
const HANDOFF_OFF = 0.88
/** Intro-copy hysteresis: fade out once the flight departs, back in on return. */
const INTRO_HIDE = 0.12
const INTRO_SHOW = 0.08

/* Perspective projection of the tunnel cylinder. */
const Z_NEAR = 0.12
const Z_FAR = 1
const FOCAL = 0.3
/** Cylinder radius as a fraction of min(width, height). */
const TUNNEL_RADIUS_RATIO = 0.5

interface Particle {
  /** Fixed ring angle on the tunnel wall. */
  angle: number
  /** Stagger offset in [0, 1) so stars leave the tunnel one after another. */
  convergeOffset: number
  /** Looping depth position along the tunnel in [0, 1). */
  depthOffset: number
  /** Cylinder-radius jitter so the wall reads as a nebula, not a wireframe. */
  radiusScale: number
  /** Draw scale relative to the sprite's base size. */
  sizeScale: number
  /** Index into the sprite atlas (0 = dim small, 1 = bright large). */
  spriteIndex: number
  targetX: number
  targetY: number
  twinklePhase: number
  twinkleSpeed: number
}

interface TunnelView {
  centerX: number
  centerY: number
  height: number
  /** Cylinder radius in CSS px. */
  radiusBase: number
  width: number
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function fract(value: number): number {
  return value - Math.floor(value)
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/** Derivative of easeInOutCubic normalized to peak at 1 (t = 0.5). */
function easeInOutCubicSpeed(t: number): number {
  return (t < 0.5 ? 12 * t * t : 12 * (1 - t) ** 2) / 3
}

function buildView(width: number, height: number): TunnelView {
  return {
    centerX: width / 2,
    // Vanishing point sits above the copy block so the digits land in clear space.
    centerY: height * 0.42,
    height,
    radiusBase: Math.min(width, height) * TUNNEL_RADIUS_RATIO,
    width,
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

interface TunnelPoint {
  /** Depth-graded brightness (far dim, near bright, fades before the wrap). */
  alpha: number
  /** Perspective size multiplier (near stars draw larger). */
  sizeMul: number
  x: number
  y: number
}

/**
 * Projects a particle's cylinder position for a given camera travel. Pure in
 * (particle, travel), so ghosts are just the same projection at an earlier
 * travel value.
 */
function projectTunnelPoint(
  particle: Particle,
  view: TunnelView,
  travel: number,
  bendX: number,
  bendY: number
): TunnelPoint {
  const w = fract(particle.depthOffset + travel)
  const z = lerp(Z_FAR, Z_NEAR, w)
  const scale = FOCAL / z
  const ringRadius = view.radiusBase * particle.radiusScale * scale
  // Bend weighted by (1 − z): the far end of the tunnel swings, the near end holds.
  const x = view.centerX + bendX * (1 - z) + Math.cos(particle.angle) * ringRadius
  const y = view.centerY + bendY * (1 - z) + Math.sin(particle.angle) * ringRadius * 0.85

  const farFade = clamp01((Z_FAR - z) * 3)
  const nearFade = clamp01((z - Z_NEAR) / 0.08)
  return {
    alpha: farFade * nearFade,
    sizeMul: Math.min(2.2, 0.55 + scale * 0.9),
    x,
    y,
  }
}

interface ParticleFrame {
  alpha: number
  sizeMul: number
  /** Ghost-copy opacity factor for the warp streak; 0 outside the flight. */
  trailAlpha: number
  trailX: number
  trailY: number
  x: number
  y: number
}

/**
 * Pure position of a star this frame: tunnel projection during idle/flight,
 * blended onto its digit pixel through its staggered converge window.
 * Deterministic in (progress, time), so scrubbing backwards replays the
 * journey in reverse.
 */
function getParticleFrame(particle: Particle, view: TunnelView, progress: number, time: number): ParticleFrame {
  const flightT = clamp01((progress - FLIGHT_START) / (FLIGHT_END - FLIGHT_START))
  const flightEase = easeInOutCubic(flightT)
  const flightSpeed = easeInOutCubicSpeed(flightT)
  const travel = time * IDLE_DRIFT_PER_SECOND * (1 - flightEase) + TUNNEL_LOOPS * flightEase

  const bendX = Math.sin(travel * 1.7 + 0.8) * view.width * 0.06
  const bendY = Math.cos(travel * 1.3) * view.height * 0.03
  const point = projectTunnelPoint(particle, view, travel, bendX, bendY)

  const convergeLocal = clamp01((progress - CONVERGE_START) / (CONVERGE_END - CONVERGE_START))
  const convergeT = clamp01((convergeLocal - particle.convergeOffset * (1 - CONVERGE_WINDOW)) / CONVERGE_WINDOW)
  const eased = easeInOutCubic(convergeT)

  let trailAlpha = 0
  let trailX = 0
  let trailY = 0
  if (flightSpeed > 0.05 && eased < 1) {
    const ghost = projectTunnelPoint(particle, view, travel - 0.028 * flightSpeed, bendX, bendY)
    trailX = ghost.x
    trailY = ghost.y
    trailAlpha = 0.4 * flightSpeed * (1 - eased)
  }

  const idleDrift = (1 - flightEase) * (1 - eased)
  const wobbleX = Math.sin(time * particle.twinkleSpeed + particle.twinklePhase) * 1.6 * idleDrift
  const wobbleY = Math.cos(time * particle.twinkleSpeed * 0.8 + particle.twinklePhase * 1.7) * 1.2 * idleDrift

  return {
    alpha: lerp(point.alpha, 0.9, eased),
    sizeMul: lerp(point.sizeMul, 1, eased),
    trailAlpha,
    trailX,
    trailY,
    x: lerp(point.x + wobbleX, particle.targetX, eased),
    y: lerp(point.y + wobbleY, particle.targetY, eased),
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

/** Fallback landing when font sampling failed: a soft horizontal band mid-screen. */
function scatterBandTargets(particles: Particle[], view: TunnelView): void {
  for (const particle of particles) {
    particle.targetX = view.centerX + (Math.random() * 2 - 1) * view.radiusBase * 0.9
    particle.targetY = view.height * 0.58 + (Math.random() * 2 - 1) * 10
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

/** Re-staggers stars by target x so the text materializes roughly left to right. */
function staggerStarsLeftToRight(particles: Particle[]): void {
  const stars = [...particles].sort((a, b) => a.targetX - b.targetX)
  for (let rank = 0; rank < stars.length; rank++) {
    const star = stars[rank]
    if (!star) continue
    star.convergeOffset = (rank / stars.length) * 0.85 + Math.random() * 0.15
  }
}

/**
 * Creates the tunnel engine on the given canvas. The caller owns the RAF
 * policy only indirectly: the loop starts immediately and must be released
 * with destroy() on unmount.
 */
export function createDurationTunnel(options: DurationTunnelOptions): DurationTunnelInstance {
  const { canvas, numberEl, onHandoffChange, onIntroChange, totalMinutes } = options
  const context = canvas.getContext('2d')

  let particles: Particle[] = []
  let view: TunnelView | null = null
  let digitCloud: DigitCloud | null = null
  let width = 0
  let height = 0

  let progress = 0
  let targetProgress = 0
  let elapsed = 0
  let lastTime = performance.now()
  let isPaused = false
  let isHandoff = false
  let isIntroHidden = false
  let isDestroyed = false
  let animationFrame = 0

  const sprites = [makeGlowSprite(5, 0.55), makeGlowSprite(8, 0.9)]

  /**
   * Fits the digit point cloud to the DOM number's box (or a mid-screen band
   * as fallback), then re-staggers stars by target x so the text materializes
   * roughly left to right as they land.
   */
  function assignDigitTargets(): void {
    if (!view) return

    if (!digitCloud || digitCloud.points.length === 0) {
      scatterBandTargets(particles, view)
      return
    }

    const box = measureNumberBox(numberEl, canvas) ?? {
      x: view.centerX - view.radiusBase * 0.8,
      y: view.height * 0.56,
      width: view.radiusBase * 1.6,
      height: 48,
    }
    applyDigitTargets(particles, digitCloud, box)
    staggerStarsLeftToRight(particles)
  }

  function rebuild(): void {
    width = canvas.clientWidth
    height = canvas.clientHeight
    if (width === 0 || height === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    context?.setTransform(dpr, 0, 0, dpr, 0, 0)

    view = buildView(width, height)
    const count = Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, Math.floor((width * height) / AREA_PER_PARTICLE)))

    particles = Array.from(
      { length: count },
      (): Particle => ({
        angle: Math.random() * Math.PI * 2,
        convergeOffset: Math.random(),
        depthOffset: Math.random(),
        radiusScale: 0.7 + Math.random() * 0.6,
        sizeScale: 0.55 + Math.random() * 0.75,
        spriteIndex: Math.random() < 0.82 ? 0 : 1,
        targetX: 0,
        targetY: 0,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.8 + Math.random() * 1.6,
      })
    )

    assignDigitTargets()
  }

  function draw(): void {
    if (!(context && view) || width === 0) return
    context.clearRect(0, 0, width, height)

    const globalFade = 1 - clamp01((progress - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START))
    if (globalFade <= 0) return

    const time = elapsed * 0.001
    context.globalCompositeOperation = 'lighter'

    for (const particle of particles) {
      const frame = getParticleFrame(particle, view, progress, time)
      if (frame.x < -80 || frame.x > width + 80 || frame.y < -80 || frame.y > height + 80) continue

      const twinkle = 0.65 + 0.35 * Math.sin(time * particle.twinkleSpeed * 2 + particle.twinklePhase)
      const alpha = twinkle * frame.alpha * globalFade
      const sprite = sprites[particle.spriteIndex]
      if (!sprite || alpha <= 0.01) continue

      const size = sprite.width * particle.sizeScale * frame.sizeMul
      context.globalAlpha = alpha
      context.drawImage(sprite, frame.x - size / 2, frame.y - size / 2, size, size)

      // Warp-streak ghost trailing the star during the fast flight leg.
      if (frame.trailAlpha > 0) {
        context.globalAlpha = alpha * frame.trailAlpha
        context.drawImage(sprite, frame.trailX - size / 2, frame.trailY - size / 2, size, size)
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

      const shouldHideIntro = isIntroHidden ? progress > INTRO_SHOW : progress > INTRO_HIDE
      if (shouldHideIntro !== isIntroHidden) {
        isIntroHidden = shouldHideIntro
        onIntroChange?.(!isIntroHidden)
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

  sampleDigitPoints(String(totalMinutes)).then((cloud) => {
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
