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
  meta,
  crumbs,
  image,
  size = 'default',
  scrim = 'light',
}: {
  eyebrow: string
  title: string
  intro?: string
  /** A small line below the intro, e.g. an article's date and reading time. */
  meta?: string
  crumbs?: Crumb[]
  image?: string
  /**
   * Article titles run far longer than a page name, so they get a smaller
   * setting. Everything else keeps the display size the house opens with.
   */
  size?: 'default' | 'compact'
  /**
   * The supplied page banners are shot dark and already carry a scrim, so they
   * only need a light one here. An article's own photograph does not, and a
   * bright one leaves the breadcrumb and the standfirst unreadable.
   */
  scrim?: 'light' | 'strong'
}) {
  const titleSize =
    size === 'compact'
      ? 'max-w-3xl text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.1]'
      : 'max-w-4xl text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.0]'
  return (
    <header className="relative overflow-hidden bg-ink pb-16 pt-32 text-ivory md:pb-20 md:pt-40">
      {image ? (
        <>
          <img src={image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          {/* Black transparency so the title always reads. */}
          <div className={`absolute inset-0 ${scrim === 'strong' ? 'bg-ink/55' : 'bg-ink/35'}`} />
          <div
            className={`absolute inset-0 bg-gradient-to-r ${
              scrim === 'strong' ? 'from-ink/85 via-ink/55 to-ink/20' : 'from-ink/70 via-ink/30 to-transparent'
            }`}
          />
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
          className={`mt-4 font-display drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] ${titleSize}`}
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
        {meta && (
          <motion.p
            className="mt-6 text-[0.72rem] uppercase tracking-[0.18em] text-ivory/55"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.35 }}
          >
            {meta}
          </motion.p>
        )}
      </div>
    </header>
  )
}
