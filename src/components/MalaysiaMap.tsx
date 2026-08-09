import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { asset } from '../lib/asset'
import { scentPlaces, placeTarget, type ScentPlace } from '../data/places'
import { formatRM } from '../lib/format'
import { ArrowRight, Pin } from './ui/icons'

/* The supplied artwork's own aspect ratio — pins are percentages of it. */
const MAP_RATIO = '1680 / 945'
const MAP_SRC = '/assets/client/map-malaysia.png'

export default function MalaysiaMap() {
  const [activeId, setActiveId] = useState('kuala-lumpur')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const active = scentPlaces.find((p) => p.id === activeId)!
  const target = placeTarget(active)

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
      {/* Map */}
      <div className="relative w-full" style={{ aspectRatio: MAP_RATIO }}>
        {/* The silhouette is an alpha mask, so the land can carry the house
            gradient. The filter sits on the parent so the glow traces the
            masked coastline rather than the element's bounding box. */}
        <div
          className="absolute inset-0"
          style={{
            filter:
              'drop-shadow(0 0 1px rgba(203,170,93,0.9)) drop-shadow(0 0 22px rgba(203,170,93,0.35))',
          }}
          aria-hidden
        >
          <div
            className="h-full w-full"
            style={{
              background:
                'linear-gradient(155deg, #9c8352 0%, #6f5f42 40%, #4a4032 72%, #332c23 100%)',
              WebkitMaskImage: `url(${asset(MAP_SRC)})`,
              maskImage: `url(${asset(MAP_SRC)})`,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
            }}
          />
        </div>

        {/* Pins */}
        {scentPlaces.map((place) => (
          <MapPin
            key={place.id}
            place={place}
            isActive={place.id === activeId}
            isHovered={place.id === hoveredId}
            onActivate={() => setActiveId(place.id)}
            onHoverChange={(on) => {
              setHoveredId(on ? place.id : null)
              // Hovering also drives the detail panel, as it did before.
              if (on) setActiveId(place.id)
            }}
          />
        ))}
      </div>

      {/* Detail card — unchanged behaviour: name, description and one scent */}
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

          {target.boutiques.length > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-ivory/50">
              <Pin width={15} className="text-gold" />
              {target.boutiques.length} boutique{target.boutiques.length > 1 ? 's' : ''} here
            </p>
          )}

          <Link
            to={target.href}
            className="group mt-8 flex items-center gap-5 rounded-xl bg-ivory/5 p-4 ring-1 ring-ivory/10 transition hover:ring-gold/50"
          >
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-ivory/10">
              <img
                src={target.product.image}
                alt={target.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex-1">
              <p className="eyebrow text-ivory/40">{target.count > 1 ? 'The collection' : 'The scent'}</p>
              <p className="mt-1 font-display text-2xl text-ivory">{target.title}</p>
              <p className="text-sm text-ivory/50">{target.meta}</p>
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

function MapPin({
  place,
  isActive,
  isHovered,
  onActivate,
  onHoverChange,
}: {
  place: ScentPlace
  isActive: boolean
  isHovered: boolean
  onActivate: () => void
  onHoverChange: (on: boolean) => void
}) {
  const target = placeTarget(place)
  const lit = isActive || isHovered
  // Keep the card inside the map: pins on the right half open leftwards, and
  // pins near the top open downwards instead of over the section edge.
  const flip = place.x > 55
  const openDown = place.y < 38

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${place.x}%`, top: `${place.y}%`, zIndex: isHovered ? 30 : 20 }}
    >
      <button
        type="button"
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        onFocus={() => { onHoverChange(true); onActivate() }}
        onBlur={() => onHoverChange(false)}
        onClick={onActivate}
        className="group relative grid h-11 w-11 place-items-center"
        aria-label={`${place.place}: ${target.title}`}
      >
        {/* Client note: dots enlarged and brightened so the locations read at a glance */}
        {lit && (
          <span className="absolute h-11 w-11 animate-ping rounded-full bg-gold/35 [animation-duration:2.4s]" />
        )}
        <span
          className={`relative block rounded-full transition-all duration-300 ${
            lit
              ? 'h-5 w-5 bg-[#F3D68A] ring-[7px] ring-gold/35'
              : 'h-4 w-4 bg-gold-light ring-4 ring-gold/25 group-hover:bg-[#F3D68A]'
          }`}
          style={{ boxShadow: '0 0 14px rgba(243,214,138,0.85)' }}
        />
      </button>

      {/* Always-on label for the active pin */}
      <span
        className={`pointer-events-none absolute left-1/2 top-[38px] -translate-x-1/2 whitespace-nowrap text-[0.6rem] uppercase tracking-[0.16em] transition-opacity duration-300 ${
          isActive && !isHovered ? 'text-gold-light opacity-100' : 'opacity-0'
        }`}
      >
        {place.place}
      </span>

      {/* Hover pop-up */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: openDown ? -8 : 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openDown ? -6 : 6, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-none absolute hidden w-64 md:block ${
              openDown ? 'top-[calc(100%-6px)]' : 'bottom-[calc(100%-6px)]'
            } ${flip ? 'right-1/2 mr-[-14px]' : 'left-1/2 ml-[-14px]'}`}
          >
            <div className="plate-glass-dark rounded-lg p-4 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.85)] ring-1 ring-gold/30">
              <p className="eyebrow eyebrow-gold text-[0.6rem]">{place.region}</p>
              <p className="mt-1.5 font-display text-2xl leading-none text-ivory">{place.place}</p>

              <div className="mt-3 flex items-center gap-3 border-t border-ivory/12 pt-3">
                <img
                  src={target.product.image}
                  alt=""
                  className="h-12 w-10 shrink-0 rounded object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-base leading-tight text-ivory">
                    {target.title}
                  </p>
                  <p className="truncate text-[0.72rem] text-ivory/55">
                    {place.familyLabel ?? `${target.product.family} · ${formatRM(target.product.price)}`}
                  </p>
                </div>
              </div>

              {target.boutiques.length > 0 && (
                <p className="mt-3 flex items-start gap-1.5 text-[0.72rem] leading-snug text-ivory/55">
                  <Pin width={13} className="mt-[1px] shrink-0 text-gold" />
                  <span>
                    {target.boutiques.length} boutique{target.boutiques.length > 1 ? 's' : ''}
                    <span className="text-ivory/35"> · {target.boutiques[0].name}</span>
                  </span>
                </p>
              )}
            </div>

            {/* Tail — points back at the pin from whichever side the card opened */}
            <span
              className={`absolute h-3 w-3 rotate-45 bg-[rgba(20,17,14,0.72)] ${
                openDown
                  ? 'bottom-full translate-y-1/2 border-l border-t border-gold/30'
                  : 'top-full -translate-y-1/2 border-b border-r border-gold/30'
              } ${flip ? 'right-[8px]' : 'left-[8px]'}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
