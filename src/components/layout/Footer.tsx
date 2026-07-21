import { useState } from 'react'
import { Link } from 'react-router-dom'
import { collections } from '../../data/collections'
import { WhatsApp, Instagram, Facebook, TikTok, ArrowRight, Check } from '../ui/icons'
import { waLink } from '../../lib/concierge'

const care = [
  ['FAQ', '/about'],
  ['Shipping', '/about'],
  ['Returns & Exchange', '/about'],
  ['Terms of Service', '/about'],
  ['Privacy Policy', '/about'],
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  return (
    <footer className="relative overflow-hidden bg-ink text-ivory">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] peranakan" style={{ color: '#CBAA5D' }} />

      {/* Newsletter */}
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
            {done && <p className="mt-3 text-xs text-gold">Welcome to Legendary — check your inbox.</p>}
          </form>
        </div>
      </div>

      {/* Columns */}
      <div className="u-container relative grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="font-display text-2xl tracking-[0.22em]">LEGENDARY</Link>
          <p className="mt-4 max-w-xs text-sm text-ivory/55">
            A Malaysian perfume house on a mission to share the best of Malaysia’s fragrances with the world.
          </p>
          <div className="mt-6 flex gap-3">
            {[
              { I: Facebook, href: 'https://www.facebook.com/LegendaryPerfumeMY', label: 'Facebook' },
              { I: Instagram, href: 'https://www.instagram.com/legendaryofficial.my/', label: 'Instagram' },
              { I: TikTok, href: '#', label: 'TikTok' },
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
          <p className="eyebrow text-ivory/50">Fragrances</p>
          <ul className="mt-5 space-y-2.5 text-sm text-ivory/70">
            <li><Link to="/shop" className="link-gold">All Fragrances</Link></li>
            {collections.map((c) => (
              <li key={c.id}><Link to={`/shop?collection=${c.id}`} className="link-gold">{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-ivory/50">The House</p>
          <ul className="mt-5 space-y-2.5 text-sm text-ivory/70">
            <li><Link to="/about" className="link-gold">Our Story</Link></li>
            <li><Link to="/stores" className="link-gold">Store Locator</Link></li>
            <li><Link to="/journal" className="link-gold">Journal</Link></li>
            <li><Link to="/contact" className="link-gold">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow text-ivory/50">Customer Care</p>
          <ul className="mt-5 space-y-2.5 text-sm text-ivory/70">
            {care.map(([label, to]) => (
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
