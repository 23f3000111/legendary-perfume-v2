import { useState } from 'react'
import { asset } from '../lib/asset'

export interface Milestone {
  year: string
  title: string
  body: string
}

/**
 * "Eleven years, in scent" — client asked for a carousel whose panel enlarges
 * when hovered. On desktop the active panel takes a wider flex basis; on
 * touch the row becomes a horizontal snap scroller.
 */
export default function JourneyCarousel({ milestones }: { milestones: Milestone[] }) {
  const [active, setActive] = useState(3)

  return (
    <div className="mt-14">
      {/* Year of the focused panel */}
      <p
        key={milestones[active].year}
        className="text-center font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-none text-ivory"
      >
        {milestones[active].year}
      </p>

      <div className="mt-8 flex gap-3 overflow-x-auto pb-4 md:overflow-visible">
        {milestones.map((m, i) => {
          const isActive = i === active
          return (
            <button
              key={m.year}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`${m.year}: ${m.title}`}
              className={`group relative h-[22rem] shrink-0 overflow-hidden rounded-sm text-left transition-all duration-700 ease-luxe md:h-[26rem] md:shrink ${
                isActive ? 'md:flex-[2.2]' : 'md:flex-1'
              }`}
              style={{ width: 'min(72vw, 15rem)' }}
            >
              <img
                src={asset(`/assets/client/journey-${m.year}.webp`)}
                alt=""
                className={`h-full w-full object-cover transition-all duration-700 ease-luxe ${
                  isActive ? 'scale-100 grayscale-0' : 'scale-105 grayscale'
                }`}
                loading="lazy"
              />
              <div
                className={`absolute inset-0 transition-opacity duration-700 ${
                  isActive
                    ? 'bg-gradient-to-t from-gold-deep/90 via-gold-deep/25 to-transparent'
                    : 'bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10'
                }`}
              />

              {/* Year badge, always visible so the row reads as a timeline */}
              <span className="absolute left-5 top-4 font-display text-2xl text-ivory/85">{m.year}</span>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-xl italic text-ivory">{m.title}</h3>
                <p
                  className={`mt-2 text-[0.8rem] leading-snug text-ivory/85 transition-all duration-500 ${
                    isActive ? 'max-h-32 opacity-100' : 'max-h-0 overflow-hidden opacity-0 md:mt-0'
                  }`}
                >
                  {m.body}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
