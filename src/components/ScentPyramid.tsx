import { motion } from 'framer-motion'
import type { Product, ScentNotes } from '../data/products'
import { accent } from '../lib/accents'

const tiers: { key: keyof ScentNotes; label: string; sub: string }[] = [
  { key: 'top', label: 'Top', sub: 'First impression' },
  { key: 'heart', label: 'Heart', sub: 'The character' },
  { key: 'base', label: 'Base', sub: 'The memory' },
]

/**
 * "A fragrance in three acts".
 *
 * Client redesign: the animated diffusion rings are replaced by their supplied
 * occasion chart (Sport · Work · Social · Vacation · Casual) beside a single
 * notes plate, with the scent's botanical bleeding off the right edge.
 */
export default function ScentPyramid({ product }: { product: Product }) {
  const tone = accent(product.accent)
  const { notes } = product

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
      {/* Occasion chart */}
      <motion.div
        className="mx-auto w-full max-w-[420px]"
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={product.radar}
          alt={`Where ${product.name} is best worn — sport, work, social, vacation and casual`}
          className="h-auto w-full"
        />
      </motion.div>

      {/* Notes plate */}
      <motion.div
        className="relative rounded-xl bg-porcelain/70 p-8 backdrop-blur-sm sm:p-10"
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
