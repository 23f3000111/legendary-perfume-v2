import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WhatsApp, Instagram, Facebook, TikTok, ArrowRight, Check } from '../ui/icons'
import { waLink } from '../../lib/concierge'
import Particles from '../ui/Particles'
import { Wordmark } from '../ui/Wordmark'

// Client change: this column now mirrors the Shop menu rather than listing
// collections, and every link resolves to a real destination.
const shopLinks: [string, string][] = [
  ['All Fragrances', '/shop'],
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
          <ul className="mt-5 space-y-2.5 text-sm text-ivory/70">
            {shopLinks.map(([label, to]) => (
              <li key={label}><Link to={to} className="link-gold">{label}</Link></li>
            ))}
          </ul>
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

      <div className="u-container relative flex flex-col items-center justify-between gap-4 border-t border-ivory/10 py-6 text-xs text-ivory/45 sm:flex-row">
        <p>© 2026 Legendary Perfume · Crafted in Malaysia</p>
        <div className="flex items-center gap-3 tracking-[0.14em] uppercase text-[0.62rem]">
          <span>Visa</span><span>Mastercard</span><span>GrabPay</span><span>Touch ’n Go</span><span>Apple Pay</span>
        </div>
      </div>
    </footer>
  )
}
