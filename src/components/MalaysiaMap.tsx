import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { scentPlaces } from '../data/places'
import { getProduct } from '../data/products'
import { formatRM } from '../lib/format'
import { ArrowRight } from './ui/icons'

// Stylised Malaysia — Peninsular, Langkawi, and Borneo (viewBox is 0..100, drawn
// with preserveAspectRatio="none" so coordinates equal container percentages,
// matching the pin positions in data/places.ts.
const PENINSULAR =
  'M37 15 C33 20 30 27 30 33 C30 39 32 45 33 52 C34 60 33 68 35 74 C36 79 38 82 39 82 C41 82 43 77 44 71 C45 62 44 54 44 46 C44 38 43 30 42 24 C41 19 40 15 37 15 Z'
const BORNEO =
  'M64 42 C60 45 57 49 59 53 C61 58 67 61 74 62 C82 63 90 60 92 55 C94 50 91 45 85 43 C79 41 70 39 64 42 Z'
const LANGKAWI = 'M13 24 C11 25 11 28 13 29 C16 30 18 27 17 25 C16 23 14 23 13 24 Z'

export default function MalaysiaMap() {
  const [activeId, setActiveId] = useState('kuala-lumpur')
  const active = scentPlaces.find((p) => p.id === activeId)!
  const product = getProduct(active.productId)!

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
      {/* Map */}
      <div className="relative w-full">
        <div className="relative aspect-[5/4] w-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#4a4238" />
                <stop offset="1" stopColor="#2a251f" />
              </linearGradient>
            </defs>
            {[PENINSULAR, BORNEO, LANGKAWI].map((d, i) => (
              <path key={i} d={d} fill="url(#land)" stroke="#B08D3E" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>

          {/* Pins */}
          {scentPlaces.map((place) => {
            const isActive = place.id === activeId
            return (
              <button
                key={place.id}
                onMouseEnter={() => setActiveId(place.id)}
                onClick={() => setActiveId(place.id)}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${place.x}%`, top: `${place.y}%` }}
                aria-label={`${place.place} — ${place.scent}`}
              >
                <span className="relative grid place-items-center">
                  {isActive && <span className="absolute h-8 w-8 animate-ping rounded-full bg-gold/40 [animation-duration:2s]" />}
                  <span className={`relative block rounded-full transition-all duration-300 ${isActive ? 'h-4 w-4 bg-gold-light ring-4 ring-gold/30' : 'h-2.5 w-2.5 bg-gold/70 group-hover:bg-gold-light'}`} />
                </span>
                <span className={`absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap text-[0.62rem] uppercase tracking-[0.14em] transition-opacity duration-300 ${isActive ? 'text-gold-light opacity-100' : 'text-ivory/50 opacity-0 group-hover:opacity-100'}`}>
                  {place.place}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <p className="eyebrow eyebrow-gold">{active.region}</p>
          <h3 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.02] text-ivory">
            {active.place}
          </h3>
          <p className="mt-4 max-w-md text-ivory/65">{active.note}</p>

          <Link to={`/product/${product.id}`} className="group mt-8 flex items-center gap-5 rounded-xl bg-ivory/5 p-4 ring-1 ring-ivory/10 transition hover:ring-gold/50">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-ivory/10">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="flex-1">
              <p className="eyebrow text-ivory/40">The scent</p>
              <p className="mt-1 font-display text-2xl text-ivory">{product.name}</p>
              <p className="text-sm text-ivory/50">{product.family} · {formatRM(product.price)}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-ink transition group-hover:translate-x-1">
              <ArrowRight width={18} />
            </span>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
