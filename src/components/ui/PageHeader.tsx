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

  /* Client note on For Her and For Him, twice: the perfume was being cut off.
     The first pass grew the bar until a wide crop could not reach the bottle,
     which fixed the crop and broke something else: on a laptop the bar was
     taller than the space under the navigation, so the bottle fell below the
     fold and still read as cut.

     So the height is bounded on both axes. It grows with the viewport's width,
     which keeps the bar's proportions close to the banner's own 3:1 and the
     crop shallow, but never takes more than 62svh, so the whole thing is on
     screen on a short display. `svh` rather than `vh` because a mobile
     browser's toolbars are part of the height that vh promises and svh does
     not. Content still sets the floor, and centring it means the extra height
     reads as composition rather than as padding.

     The remaining crop is covered by the banners themselves: prepare-assets.py
     places each bottle inside the middle 66% of the frame, and the bounds here
     keep the visible band wider than that. An article's header keeps its old
     size, since its photograph is a normal frame rather than a 3:1 banner. */
  const depth = size === 'compact' ? '' : 'min-h-[max(19rem,min(28vw,62svh))]'
  return (
    <header
      className={`relative flex flex-col justify-center overflow-hidden bg-ink pb-12 pt-28 text-ivory md:pb-16 md:pt-36 ${depth}`}
    >
      {image ? (
        <>
          {/* Two crops, because one shape cannot serve both.
              A title bar is about 3.5:1 on a desktop and about 1:1 on a phone,
              and filling the second with the first magnifies it four times over:
              a narrow slice of an enormous bottle. So a phone is served a frame
              cropped for it, generated beside the wide one in
              prepare-assets.py. A banner with no phone crop simply falls back
              to the wide one. */}
          <picture className="absolute inset-0 h-full w-full">
            <source media="(max-width: 640px)" srcSet={image.replace(/\.webp$/, '-sm.webp')} />
            <img src={image} alt="" aria-hidden className="h-full w-full object-cover" />
          </picture>
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
