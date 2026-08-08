import { asset } from '../lib/asset'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'framer-motion'
import Reveal from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight } from '../components/ui/icons'

const stats = [
  { value: 2015, label: 'Established', prefix: 'Est.' },
  { value: 9, label: 'Boutiques nationwide', suffix: '' },
  { value: 4, label: 'Fragrance collections', suffix: '' },
  { value: 100, label: 'Halal certified', suffix: '%' },
]

function Counter({ value, prefix, suffix }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  // No negative margin: on short viewports it could stop the observer from
  // ever firing, which left the Halal figure stuck on 0%.
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const dur = 1400
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setN(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value])
  return (
    <span ref={ref}>
      {prefix ? prefix + ' ' : ''}{n}{suffix ?? ''}
    </span>
  )
}

export default function Heritage() {
  return (
    <section className="bg-ivory py-24 md:py-32">
      <div className="u-container grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Client note: image sized to fill the column height beside the copy */}
        <Reveal className="relative order-1">
          <div className="overflow-hidden rounded-sm">
            <img
              src={asset('/assets/client/heritage-nyonya.webp')}
              alt="The Nyonya collection in a Peranakan heritage home"
              className="aspect-[5/6] w-full object-cover lg:aspect-[4/5]"
            />
          </div>
          <div className="absolute inset-0 rounded-sm ring-1 ring-inset ring-gold/15" />
        </Reveal>

        <div className="order-2">
          <Kicker>Our Story</Kicker>
          <Reveal>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,4.5vw,3.8rem)] leading-[1.03]">
              A house rooted in<br />Malaysian soul
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-lg text-lg text-ink-soft">
              Established in 2015 and known for our signature Orchid, Legendary draws on Malaysia’s rich
              heritage and breathtaking landscapes. Each fragrance is an olfactory journey — crafted in
              authenticity, worn with pride.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <dl className="mt-10 grid grid-cols-2 gap-8 border-t border-line pt-8 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl text-ink md:text-4xl">
                    <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
                  </dt>
                  <dd className="mt-1 text-[0.72rem] uppercase tracking-[0.12em] text-smoke">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/about" className="btn-ghost group">
                Read our story
                <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <Link to="/stores" className="btn-ghost">Find a boutique</Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
