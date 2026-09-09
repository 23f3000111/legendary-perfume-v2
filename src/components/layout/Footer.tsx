import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { WhatsApp, Instagram, Facebook, TikTok, ArrowRight, Check, ChevronDown } from '../ui/icons'
import { waLink } from '../../lib/concierge'
import Particles from '../ui/Particles'
import { Wordmark } from '../ui/Wordmark'

// Client change: this column now mirrors the Shop menu rather than listing
// collections, and every link resolves to a real destination.
//
// Revision 7: the four filters below are hidden until All Fragrances is
// pressed. Listed flat they read as five equal destinations, when four of them
// are really ways of looking at the fifth.
const shopFilters: [string, string][] = [
  ['Bestsellers', '/shop?filter=bestsellers'],
  ['For Her', '/shop?filter=her'],
  ['For Him', '/shop?filter=him'],
  ['Gifts & Sets', '/shop?filter=gifts'],
]

const houseLinks: [string, string][] = [
  ['Our Story', '/about'],
  ['Store Locator', '/stores'],
  ['Journal', '/journal'],
  ['Contact', '/contact'],
]

// Revision 2: the client supplied the FAQ, shipping, returns, terms and
// privacy copy, so each of these now has a page of its own.
const careLinks: [string, string][] = [
  ['FAQ', '/faq'],
  ['Shipping Policy', '/shipping'],
  ['Return, Refund & Exchange', '/returns'],
  ['Terms of Service', '/terms'],
  ['Privacy Policy', '/privacy'],
  ['Track My Order', '/track'],
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  // Closed to begin with: the client asked for the four filters to appear only
  // when All Fragrances is pressed.
  const [shopOpen, setShopOpen] = useState(false)
  // Client change: the newsletter sign-up appears on the contact page only.
  const showNewsletter = useLocation().pathname === '/contact'

  return (
    <footer className="relative overflow-hidden bg-ink text-ivory">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] peranakan" style={{ color: '#CBAA5D' }} />
      <Particles max={40} />

      {/* Newsletter — contact page only */}
      {showNewsletter && (
      <div className="u-container relative border-b border-ivory/10 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-end">
          <div>
            <p className="eyebrow eyebrow-gold">The Legendary House</p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05]">
              Join us, and receive<br />a scented welcome.
            </h2>
            <p className="mt-4 max-w-md text-sm text-ivory/60">
              Early access to new collections, private offers, and the stories behind each scent.
            </p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (email) { setDone(true); setEmail('') } }}
            className="md:justify-self-end md:w-full md:max-w-md"
          >
            <label className="eyebrow text-ivory/50">Email address</label>
            <div className="mt-3 flex items-center border-b border-ivory/30 focus-within:border-gold">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent py-3 text-ivory placeholder-ivory/30 outline-none"
              />
              <button className="grid h-11 w-11 shrink-0 place-items-center text-gold transition hover:translate-x-1" aria-label="Subscribe">
                {done ? <Check width={20} /> : <ArrowRight width={20} />}
              </button>
            </div>
            {done && <p className="mt-3 text-xs text-gold">Welcome to Legendary. Check your inbox.</p>}
          </form>
        </div>
      </div>
      )}

      {/* Columns */}
      <div className="u-container relative grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" aria-label="Legendary, home" className="inline-block text-ivory">
            <Wordmark height="1.7rem" />
          </Link>
          <p className="mt-4 max-w-xs text-sm text-ivory/55">
            A Malaysian perfume house on a mission to share the best of Malaysia’s fragrances with the world.
          </p>
          <div className="mt-6 flex gap-3">
            {[
              { I: Facebook, href: 'https://www.facebook.com/LegendaryPerfumeMY', label: 'Facebook' },
              { I: Instagram, href: 'https://www.instagram.com/legendaryofficial.my/', label: 'Instagram' },
              { I: TikTok, href: 'https://www.tiktok.com/@legendary.my', label: 'TikTok' },
              { I: WhatsApp, href: waLink('Hi Legendary!'), label: 'WhatsApp' },
            ].map(({ I, href, label }) => (
              <a
                key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-ivory/20 text-ivory/80 transition hover:border-gold hover:text-gold"
              >
                <I width={18} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow text-ivory/50">Shop</p>
          <div className="mt-5 text-sm text-ivory/70">
            <button
              onClick={() => setShopOpen((v) => !v)}
              aria-expanded={shopOpen}
              className="flex items-center gap-2 text-ivory transition hover:text-gold"
            >
              All Fragrances
              <ChevronDown
                width={14}
                className={`shrink-0 text-gold transition-transform duration-300 ${shopOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Indented behind a rule, so the four read as ways into All
                Fragrances rather than as siblings of it. */}
            <motion.div
              initial={false}
              animate={{ height: shopOpen ? 'auto' : 0, opacity: shopOpen ? 1 : 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <ul className="mt-3 space-y-2.5 border-l border-ivory/20 pl-4">
                {shopFilters.map(([label, to]) => (
                  <li key={label}><Link to={to} className="link-gold">{label}</Link></li>
                ))}
                <li>
                  <Link to="/shop" className="link-gold text-ivory/50">View every fragrance</Link>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>

        <div>
          <p className="eyebrow text-ivory/50">The House</p>
          <ul className="mt-5 space-y-2.5 text-sm text-ivory/70">
            {houseLinks.map(([label, to]) => (
              <li key={label}><Link to={to} className="link-gold">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-ivory/50">Customer Care</p>
          <ul className="mt-5 space-y-2.5 text-sm text-ivory/70">
            {careLinks.map(([label, to]) => (
              <li key={label}><Link to={to} className="link-gold">{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Revision 7: the studio credit that used to sit below this bar is gone
          at the client's instruction. The concierge launcher floats over the
          bottom right of the viewport, and this is the last line on the page
          again, so the extra room below keeps the payment marks clear of it.
          The launcher reaches about 84px up from the bottom edge at every
          width, hence the 96px. */}
      <div className="u-container relative flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pb-24 pt-6 text-xs text-ivory/45 sm:flex-row">
        <p className="text-center sm:text-left">© 2026 Legendary Perfume · Crafted in Malaysia</p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.62rem] uppercase tracking-[0.14em]">
          <span>Visa</span><span>Mastercard</span><span>GrabPay</span><span>Touch ’n Go</span><span>Apple Pay</span>
        </div>
      </div>
    </footer>
  )
}
