import { useEffect, useRef } from 'react'

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Drifting gold motes, painted as a section background.
 *
 * Client note: the dust used to be one fixed, full-page canvas layered over
 * everything, which read as noise across the copy and artwork. It now sits
 * inside a section at z-0, so it always stays behind that section's content.
 * Give the parent `relative` and put its content above with `relative z-10`.
 */
export default function Particles({
  density = 12000,
  max = 90,
  className = '',
}: {
  /** Lower number = more motes (one per N square pixels). */
  density?: number
  max?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (prefersReduced()) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    let parts: {
      x: number; y: number; r: number; vx: number; vy: number; a: number; tw: number
    }[] = []

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const seed = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, w * dpr)
      canvas.height = Math.max(1, h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.min(max, Math.max(18, Math.floor((w * h) / density)))
      parts = Array.from({ length: n }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.9 + 0.5,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -(Math.random() * 0.22 + 0.05),
        a: Math.random() * 0.5 + 0.2,
        tw: Math.random() * Math.PI * 2,
      }))
    }

    seed()
    const ro = new ResizeObserver(seed)
    ro.observe(canvas)

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy
        p.tw += 0.02
        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w }
        if (p.x < -12) p.x = w + 12
        if (p.x > w + 12) p.x = -12
        const flick = 0.65 + Math.sin(p.tw) * 0.35
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
        glow.addColorStop(0, `rgba(226, 194, 118, ${p.a * flick})`)
        glow.addColorStop(1, 'rgba(190, 156, 78, 0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [density, max])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
    />
  )
}
