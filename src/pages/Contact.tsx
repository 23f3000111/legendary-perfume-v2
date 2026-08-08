import { useState } from 'react'
import { asset } from '../lib/asset'
import PageHeader from '../components/ui/PageHeader'
import { Kicker } from '../components/ui/SplitText'
import { WhatsApp, Instagram, Facebook, Phone, Pin, Check, ArrowRight } from '../components/ui/icons'
import { waLink } from '../lib/concierge'
import { mapEmbedUrl } from '../data/stores'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const channels = [
    { I: WhatsApp, label: 'WhatsApp', value: '+60 19-383 6633', href: waLink('Hi Legendary! I have a question.') },
    { I: Instagram, label: 'Instagram', value: '@legendaryofficial.my', href: 'https://www.instagram.com/legendaryofficial.my/' },
    { I: Facebook, label: 'Facebook', value: 'LegendaryPerfumeMY', href: 'https://www.facebook.com/LegendaryPerfumeMY' },
    { I: Phone, label: 'Call us', value: '+60 11-6767 1888', href: 'tel:+601167671888' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Say Hello"
        title="We’d love to hear from you"
        intro="Questions about a scent, an order, or a gift? Our concierge team replies quickly — choose whichever way suits you."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
        image={asset('/assets/client/banner-contact.webp')}
      />

      <section className="bg-ivory py-16 md:py-24">
        <div className="u-container grid gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Form */}
          <div>
            <Kicker>Send a message</Kicker>
            <form
              onSubmit={(e) => { e.preventDefault(); setSent(true); setForm({ name: '', email: '', message: '' }) }}
              className="mt-8 space-y-6"
            >
              {([
                { k: 'name', label: 'Your name', type: 'text' },
                { k: 'email', label: 'Email address', type: 'email' },
              ] as const).map((f) => (
                <div key={f.k}>
                  <label className="eyebrow text-smoke">{f.label}</label>
                  <input
                    required type={f.type}
                    value={form[f.k]}
                    onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                    className="mt-2 w-full border-b border-line bg-transparent py-3 outline-none transition focus:border-gold"
                  />
                </div>
              ))}
              <div>
                <label className="eyebrow text-smoke">Message</label>
                <textarea
                  required rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="mt-2 w-full resize-none border-b border-line bg-transparent py-3 outline-none transition focus:border-gold"
                />
              </div>
              <button className="btn-solid group gap-2">
                {sent ? <><Check width={16} /> Message sent</> : <>Send message <ArrowRight width={16} className="transition-transform group-hover:translate-x-1" /></>}
              </button>
              {sent && <p className="text-sm text-gold-deep">Thank you — we’ll be in touch within one business day.</p>}
            </form>
          </div>

          {/* Channels + map */}
          <div>
            <Kicker>Reach us directly</Kicker>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {channels.map((c) => (
                <a
                  key={c.label} href={c.href} target="_blank" rel="noreferrer"
                  className="group flex items-center gap-4 rounded-sm border border-line bg-porcelain p-4 transition hover:border-gold"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/30 text-gold"><c.I width={20} /></span>
                  <span>
                    <span className="block text-[0.7rem] uppercase tracking-[0.12em] text-smoke">{c.label}</span>
                    <span className="block text-sm text-ink">{c.value}</span>
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-6 flex items-start gap-3 text-sm text-ink-soft">
              <Pin width={18} className="mt-0.5 shrink-0 text-gold" />
              <p>Flagship: 3, Jalan Hang Lekir, 75200 Melaka · plus 8 boutiques nationwide.</p>
            </div>

            <div className="mt-6 overflow-hidden rounded-sm border border-line">
              <iframe
                title="Legendary Melaka flagship"
                src={mapEmbedUrl('Jalan Hang Lekir, Melaka')}
                loading="lazy"
                className="h-64 w-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
