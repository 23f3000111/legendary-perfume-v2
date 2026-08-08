import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { moodList, moodCopy, moodIcon, productsByMood, type Mood } from '../data/products'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight } from '../components/ui/icons'

export default function Finder() {
  const [mood, setMood] = useState<Mood>('Serene')
  const matches = productsByMood(mood).slice(0, 3)

  return (
    <section className="bg-sand/60 py-24 md:py-32">
      <div className="u-container">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <Kicker>The Olfactory Finder</Kicker>
            <Reveal>
              <h2 className="mt-5 font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.03]">
                What mood are<br />you wearing today?
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-md text-ink-soft">
                Fragrance is emotion. Choose a feeling and we’ll show you the scents that speak it.
              </p>
            </Reveal>
          </div>

          {/* Mood selector */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {moodList.map((m) => {
              const active = m === mood
              return (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`group relative overflow-hidden rounded-sm border px-4 py-5 text-left transition-all duration-500 ${
                    active ? 'border-gold bg-ink text-ivory' : 'border-line bg-porcelain text-ink hover:border-gold/60'
                  }`}
                >
                  <img
                    src={moodIcon[m]}
                    alt=""
                    className={`h-8 w-8 object-contain transition duration-500 ${
                      active ? 'opacity-100 invert' : 'opacity-55'
                    }`}
                  />
                  <p className="mt-3 font-display text-xl">{m}</p>
                  {/* Client change: the mood headline replaces the ingredient hint */}
                  <p className={`mt-1 text-[0.72rem] leading-snug ${active ? 'text-ivory/70' : 'text-smoke'}`}>
                    {moodCopy[m].line}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Results */}
        <div className="mt-14">
          <div className="mb-6 flex items-center justify-end">
            <Link to="/shop" className="hidden items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-gold-deep sm:flex">
              Shop all <ArrowRight width={14} />
            </Link>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={mood}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-3"
            >
              {matches.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
