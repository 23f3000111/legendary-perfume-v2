import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { getProduct } from '../data/products'
import Reveal from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, ShieldCheck } from '../components/ui/icons'

export default function Signature() {
  const orchid = getProduct('orchid')!
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 18 })
  const gx = useTransform(mx, [-0.5, 0.5], ['20%', '80%'])
  const gy = useTransform(my, [-0.5, 0.5], ['20%', '80%'])
  const glow = useTransform(
    [gx, gy],
    ([x, y]: string[]) => `radial-gradient(circle at ${x} ${y}, rgba(255,246,214,0.35), transparent 42%)`,
  )

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const reset = () => { mx.set(0); my.set(0) }

  return (
    <section className="relative overflow-hidden bg-ivory py-24 md:py-32">
      <div className="u-container grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Text */}
        <div className="order-2 lg:order-1">
          <Kicker>The Signature</Kicker>
          <Reveal>
            <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.02]">
              Orchid — the scent<br />that began it all
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-lg text-lg text-ink-soft">{orchid.story}</p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-9 grid max-w-lg grid-cols-3 gap-6 border-y border-line py-6">
              {(['top', 'heart', 'base'] as const).map((tier) => (
                <div key={tier}>
                  <p className="eyebrow eyebrow-gold capitalize">{tier}</p>
                  <p className="mt-2 text-sm text-ink-soft">{orchid.notes[tier].slice(0, 2).join(', ')}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link to="/product/orchid" className="btn-solid gap-2 group">
                Discover Orchid <ArrowRight width={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="flex items-center gap-2 text-sm text-smoke">
                <ShieldCheck width={18} className="text-gold" /> Halal Certified · 30ml EDP
              </span>
            </div>
          </Reveal>
        </div>

        {/* Image with tilt */}
        <div className="order-1 lg:order-2" style={{ perspective: 1200 }}>
          <motion.div
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={reset}
            style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
            className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-sm"
          >
            <img src={orchid.image} alt="Orchid eau de parfum" className="h-full w-full object-cover" />
            {/* moving glint */}
            <motion.div className="pointer-events-none absolute inset-0" style={{ background: glow }} />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/20" />
          </motion.div>

          <div className="mx-auto mt-5 flex max-w-md items-center justify-between">
            <span className="eyebrow">Eau de Parfum</span>
            <span className="font-display text-lg italic text-ink-soft">“Exotic Orchid for an Extraordinary Soul”</span>
          </div>
        </div>
      </div>
    </section>
  )
}
