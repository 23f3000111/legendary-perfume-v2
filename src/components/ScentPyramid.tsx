import { motion } from 'framer-motion'
import type { ScentNotes, AccentKey } from '../data/products'
import { accent } from '../lib/accents'

const tiers: { key: keyof ScentNotes; label: string; sub: string }[] = [
  { key: 'top', label: 'Top', sub: 'First impression' },
  { key: 'heart', label: 'Heart', sub: 'The character' },
  { key: 'base', label: 'Base', sub: 'The memory' },
]

export default function ScentPyramid({
  notes,
  accentKey,
}: {
  notes: ScentNotes
  accentKey: AccentKey
}) {
  const tone = accent(accentKey)

  return (
    <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      {/* Diffusion rings */}
      <div className="relative mx-auto aspect-square w-full max-w-[360px]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: tone.hex, scale: 1 - i * 0.22, opacity: 0.28 + i * 0.06 }}
            animate={{ scale: [1 - i * 0.22, 1.02 - i * 0.22, 1 - i * 0.22] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            className="grid h-24 w-24 place-items-center rounded-full text-center"
            style={{ background: tone.soft, color: tone.ink }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="font-display text-sm leading-tight">Eau de<br/>Parfum</span>
          </motion.div>
        </div>
        {/* floating note dots */}
        {[...notes.top, ...notes.heart, ...notes.base].slice(0, 8).map((n, i, arr) => {
          const angle = (i / arr.length) * Math.PI * 2
          const r = 42
          const x = 50 + Math.cos(angle) * r
          const y = 50 + Math.sin(angle) * r
          return (
            <motion.span
              key={n + i}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-porcelain/85 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-ink-soft shadow-sm backdrop-blur"
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.09, duration: 0.6 }}
            >
              {n}
            </motion.span>
          )
        })}
      </div>

      {/* Tiered list */}
      <div className="space-y-8">
        {tiers.map((tier, ti) => (
          <motion.div
            key={tier.key}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: ti * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-line pt-5"
          >
            <div className="flex items-baseline justify-between">
              <h4 className="font-display text-2xl text-ink">{tier.label} Notes</h4>
              <span className="eyebrow" style={{ color: tone.ink }}>{tier.sub}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
              {notes[tier.key].map((n, i) => (
                <span key={n} className="text-[1.02rem] text-ink-soft">
                  {n}
                  {i < notes[tier.key].length - 1 && <span className="mx-1.5 text-gold/50">·</span>}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
