import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface Crumb { label: string; to?: string }

export default function PageHeader({
  eyebrow,
  title,
  intro,
  crumbs,
}: {
  eyebrow: string
  title: string
  intro?: string
  crumbs?: Crumb[]
}) {
  return (
    <header className="relative overflow-hidden bg-ink pb-16 pt-32 text-ivory md:pb-20 md:pt-40">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] peranakan" style={{ color: '#CBAA5D' }} />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div className="u-container relative">
        {crumbs && (
          <nav className="mb-6 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-ivory/40">
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex items-center gap-2">
                {c.to ? <Link to={c.to} className="transition hover:text-gold">{c.label}</Link> : <span className="text-ivory/70">{c.label}</span>}
                {i < crumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </nav>
        )}
        <motion.p className="eyebrow eyebrow-gold" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          {eyebrow}
        </motion.p>
        <motion.h1
          className="mt-4 max-w-4xl font-display text-[clamp(2.4rem,6vw,4.6rem)] font-light leading-[1.0]"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
        >
          {title}
        </motion.h1>
        {intro && (
          <motion.p
            className="mt-6 max-w-xl text-lg text-ivory/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.25 }}
          >
            {intro}
          </motion.p>
        )}
      </div>
    </header>
  )
}
