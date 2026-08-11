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
 * Client amendment: the plate used to run 14% past its column and pressed
 * against the section edge. The overhang is now half that, so the plate still
 * carries over the botanical but keeps a clear gutter on the right.
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
    <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
      {/* Occasion chart — client asked for this 20% larger */}
      <motion.div
        className="mx-auto w-full max-w-[504px]"
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

      {/* Notes plate — gradient opacity, running wide enough to carry over the
          botanical without reaching the edge of the band. */}
      <motion.div
        className="relative rounded-xl p-8 backdrop-blur-[3px] sm:p-10 lg:-mr-[7%] lg:w-[107%]"
        style={{
          background:
            'linear-gradient(100deg, rgba(251,248,242,0.95) 0%, rgba(251,248,242,0.88) 55%, rgba(251,248,242,0.55) 100%)',
        }}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative z-10 space-y-8">
          {tiers.map((tier) => (
            <div key={tier.key}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl text-ink">{tier.label} Notes</h3>
                <span className="eyebrow shrink-0" style={{ color: tone.ink }}>{tier.sub}</span>
              </div>
              <p className="mt-2 text-[1.02rem] text-ink-soft">
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
