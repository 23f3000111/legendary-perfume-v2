import { useEffect, useRef, useState } from 'react'

interface Stat {
  value: number
  label: string
  prefix?: string
  suffix?: string
  /** Renders 30000000 as "30,000,000" */
  group?: boolean
}

// The Halal figure is struck through in the client's mockup, leaving these
// three. Bottles sold is deliberately absent — it already headlines the
// Signature section and would read as a duplicate here.
const stats: Stat[] = [
  { value: 2015, label: 'Established', prefix: 'Est.' },
  { value: 9, label: 'Boutiques nationwide' },
  { value: 4, label: 'Fragrance collections' },
]

/**
 * Animated stat bar directly under the hero.
 *
 * Client request: the numbers should count up as soon as someone lands on the
 * site, so this runs on mount rather than waiting for a scroll trigger.
 */
function Counter({ stat, delay }: { stat: Stat; delay: number }) {
  const [n, setN] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(stat.value)
      return
    }
    let start = 0
    const dur = 1800
    const tick = (t: number) => {
      if (!start) start = t
      const p = Math.min(1, (t - start - delay) / dur)
      if (p > 0) {
        const eased = 1 - Math.pow(1 - p, 3)
        setN(Math.round(stat.value * eased))
      }
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setN(stat.value)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [stat.value, delay])

  const shown = stat.group ? n.toLocaleString('en-US') : String(n)

  return (
    <div className="text-center">
      <p className="font-display text-[clamp(1.9rem,3.4vw,2.9rem)] font-bold leading-none text-ink">
        {stat.prefix ? `${stat.prefix} ` : ''}
        {shown}
        {stat.suffix ?? ''}
      </p>
      <p className="mt-2 text-[0.68rem] uppercase tracking-[0.18em] text-smoke">{stat.label}</p>
    </div>
  )
}

export default function CounterBar() {
  return (
    <section className="border-b border-line bg-porcelain py-10 md:py-12">
      <div className="u-container grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Counter key={s.label} stat={s} delay={i * 140} />
        ))}
      </div>
    </section>
  )
}
