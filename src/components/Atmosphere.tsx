import { useEffect, useRef } from 'react'

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Trailing gold cursor ring.
 *
 * The ambient dust used to live here as one fixed, full-page canvas drawn over
 * every section. The client found it distracting in the foreground, so it now
 * renders per-section behind the content — see components/ui/Particles.
 */
export default function Atmosphere() {
  const ringRef = useRef<HTMLDivElement>(null)

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
    <div
      ref={ringRef}
      aria-hidden
      className="pointer-events-none fixed z-[70] hidden h-7 w-7 rounded-full border transition-[transform,border-color] duration-200 md:block"
      style={{ left: 0, top: 0, transform: 'translate(-50%,-50%)', borderColor: 'rgba(176,141,62,0.5)' }}
    />
  )
}
