import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Particles from './Particles'

interface Crumb { label: string; to?: string }

/**
 * Client change: every inner page title bar sits on a photograph behind a
 * black transparency, rather than the flat ink band it used before.
 */
export default function PageHeader({
  eyebrow,
  title,
  intro,
  crumbs,
  image,
}: {
  eyebrow: string
  title: string
  intro?: string
  crumbs?: Crumb[]
  image?: string
}) {
  return (
    <header className="relative overflow-hidden bg-ink pb-16 pt-32 text-ivory md:pb-20 md:pt-40">
      {image ? (
        <>
          <img src={image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          {/* Black transparency so the title always reads. Kept light — the
              supplied banners already carry a scrim of their own. */}
          <div className="absolute inset-0 bg-ink/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] peranakan" style={{ color: '#CBAA5D' }} />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        </>
      )}

      <Particles max={45} />
      <div className="u-container relative z-10">
        {crumbs && (
          <nav className="mb-6 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-ivory/50">
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex items-center gap-2">
                {c.to ? <Link to={c.to} className="transition hover:text-gold">{c.label}</Link> : <span className="text-ivory/80">{c.label}</span>}
                {i < crumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </nav>
        )}
        <motion.p className="eyebrow eyebrow-gold" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          {eyebrow}
        </motion.p>
        <motion.h1
          className="mt-4 max-w-4xl font-display text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.0] drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)]"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
        >
          {title}
        </motion.h1>
        {intro && (
          <motion.p
            className="mt-6 max-w-xl text-lg text-ivory/75"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.25 }}
          >
            {intro}
          </motion.p>
        )}
      </div>
    </header>
  )
}
