import { useEffect, useRef } from 'react'

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Ambient gold particles + a trailing gold-ring cursor. Purely decorative. */
export default function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  // Particle field
  useEffect(() => {
    if (prefersReduced()) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let w = 0
    let h = 0

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Client asked for a denser, more obvious drift of gold motes.
    const N = Math.min(160, Math.max(70, Math.floor((w * h) / 12000)))
    const parts = Array.from({ length: N }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -(Math.random() * 0.28 + 0.06),
      a: Math.random() * 0.55 + 0.25,
      tw: Math.random() * Math.PI * 2,
    }))

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy
        p.tw += 0.02
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
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
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Trailing cursor ring
  useEffect(() => {
    if (prefersReduced()) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    const ring = ringRef.current
    if (!ring) return
    let rx = window.innerWidth / 2
    let ry = window.innerHeight / 2
    let tx = rx
    let ty = ry
    let raf = 0

    const move = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      const interactive = t.closest('a,button,input,textarea,[role="button"],label,select')
      ring.style.transform = `translate(-50%,-50%) scale(${interactive ? 1.9 : 1})`
      ring.style.borderColor = interactive ? 'rgba(176,141,62,0.9)' : 'rgba(176,141,62,0.5)'
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', over)

    const loop = () => {
      rx += (tx - rx) * 0.16
      ry += (ty - ry) * 0.16
      ring.style.left = rx + 'px'
      ring.style.top = ry + 'px'
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[5] h-full w-full"
        aria-hidden
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed z-[70] hidden h-7 w-7 rounded-full border transition-[transform,border-color] duration-200 md:block"
        style={{ left: 0, top: 0, transform: 'translate(-50%,-50%)', borderColor: 'rgba(176,141,62,0.5)' }}
      />
    </>
  )
}
