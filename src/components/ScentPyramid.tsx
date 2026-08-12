import { motion } from 'framer-motion'
import type { ScentNotes } from '../data/products'
import type { AccentKey } from '../data/products'
import { accent } from '../lib/accents'

const tiers: { key: keyof ScentNotes; label: string; sub: string }[] = [
  { key: 'top', label: 'Top', sub: 'First impression' },
  { key: 'heart', label: 'Heart', sub: 'The character' },
  { key: 'base', label: 'Base', sub: 'The memory' },
]

/**
 * "A fragrance in three acts".
 *
 * The client's occasion chart (Sport · Work · Social · Vacation · Casual) sits
 * beside a single notes plate, with the scent's botanical bleeding off the
 * right edge of the parent band.
 *
 * Client amendment: the plate used to run past its column and press against
 * the section edge. It now sits inside its column, and the parent band adds
 * padding on the right, so the plate is shifted clear of the botanical. The
 * whole block is also trimmed down to fit inside one screen.
 */
export default function ScentPyramid({
  notes,
  radar,
  accentKey,
  name,
}: {
  notes: ScentNotes
  radar: string
  accentKey: AccentKey
  /** Used for the chart's alt text. */
  name: string
}) {
  const tone = accent(accentKey)

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
      {/* Occasion chart */}
      <motion.div
        className="mx-auto w-full max-w-[400px]"
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={radar}
          alt={`Where ${name} is best worn: sport, work, social, vacation and casual`}
          className="h-auto w-full"
        />
      </motion.div>

      {/* Notes plate — gradient opacity, sitting inside its own column */}
      <motion.div
        className="relative rounded-xl p-7 backdrop-blur-[3px] sm:p-8"
        style={{
          background:
            'linear-gradient(100deg, rgba(251,248,242,0.95) 0%, rgba(251,248,242,0.88) 55%, rgba(251,248,242,0.55) 100%)',
        }}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative z-10 space-y-6">
          {tiers.map((tier) => (
            <div key={tier.key}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-xl text-ink">{tier.label} Notes</h3>
                <span className="eyebrow shrink-0" style={{ color: tone.ink }}>{tier.sub}</span>
              </div>
              <p className="mt-1.5 text-[0.97rem] text-ink-soft">
                {notes[tier.key].map((n, i) => (
                  <span key={n}>
                    {n}
                    {i < notes[tier.key].length - 1 && <span className="mx-1.5 text-gold/50">·</span>}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
