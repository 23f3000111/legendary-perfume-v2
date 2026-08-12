import { useState } from 'react'
import { Link } from 'react-router-dom'
import { asset } from '../lib/asset'
import PageHeader from '../components/ui/PageHeader'
import { Kicker } from '../components/ui/SplitText'
import Accordion from '../components/ui/Accordion'
import { WhatsApp, Instagram, Facebook, Pin, Check, ArrowRight } from '../components/ui/icons'
import { waLink, WHATSAPP_DISPLAY } from '../lib/concierge'
import { directionsUrl, HEAD_OFFICE } from '../data/stores'
import { productFaq } from '../data/faq'

/*
 * Client amendments for revision 2:
 *   1. headline reads "Collaborate With Us"
 *   2. the landline is gone, WhatsApp is the only number
 *   3. the Melaka flagship address is replaced by the head office
 *   4. the form follows the Inside Scoop pattern the client referenced:
 *      one centred card, asked as a question, with the direct channels sitting
 *      right under it rather than in a second column
 */
export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const channels = [
    {
      I: WhatsApp,
      label: 'WhatsApp',
      value: WHATSAPP_DISPLAY,
      href: waLink('Hi Legendary! I have a question.'),
    },
    {
      I: Instagram,
      label: 'Instagram',
      value: '@legendaryofficial.my',
      href: 'https://www.instagram.com/legendaryofficial.my/',
    },
    {
      I: Facebook,
      label: 'Facebook',
      value: 'LegendaryPerfumeMY',
      href: 'https://www.facebook.com/LegendaryPerfumeMY',
    },
  ]

  const fields = [
    { k: 'name', label: 'Your name', type: 'text', placeholder: 'How should we address you?' },
    { k: 'email', label: 'Email address', type: 'email', placeholder: 'Where should we reply?' },
  ] as const

  return (
    <>
      <PageHeader
        eyebrow="Say Hello"
        title="Collaborate With Us"
        intro="Questions about a scent, an order or a gift? Our Malaysian concierge team replies quickly. Choose whichever way suits you."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
        image={asset('/assets/client/banner-contact.webp')}
      />

      {/* One centred card, the way the client's reference page works. */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="u-narrow">
          <div className="mx-auto max-w-2xl text-center">
            <Kicker className="justify-center">Send a message</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.05]">
              Do you have any questions?
            </h2>
            <p className="mt-4 text-ink-soft">
              Fill in the form below, or reach us straight away on{' '}
              <a href={waLink('Hi Legendary! I have a question.')} target="_blank" rel="noreferrer" className="link-gold text-gold-deep">
                WhatsApp
              </a>
              .
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
              setForm({ name: '', email: '', message: '' })
            }}
            className="mx-auto mt-10 max-w-2xl rounded-sm border border-line bg-porcelain p-7 sm:p-9"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.k}>
                  <label className="eyebrow text-smoke" htmlFor={f.k}>{f.label}</label>
                  <input
                    id={f.k}
                    required
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.k]}
                    onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                    className="mt-2 w-full border-b border-line bg-transparent py-3 outline-none transition placeholder:text-smoke/60 focus:border-gold"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6">
              <label className="eyebrow text-smoke" htmlFor="message">What would you like to ask?</label>
              <textarea
                id="message"
                required
                rows={5}
                placeholder="Tell us how we can help."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-2 w-full resize-none border-b border-line bg-transparent py-3 outline-none transition placeholder:text-smoke/60 focus:border-gold"
              />
            </div>

            <button className="btn-solid group mt-8 w-full justify-center gap-2">
              {sent ? (
                <><Check width={16} /> Message sent</>
              ) : (
                <>Submit <ArrowRight width={16} className="transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
            {sent && (
              <p className="mt-4 text-center text-sm text-gold-deep">
                Thank you. We will be in touch within one business day.
              </p>
            )}
          </form>

          {/* Direct channels, right under the form rather than in a column */}
          <div className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-sm border border-line bg-porcelain p-4 transition hover:border-gold"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/30 text-gold">
                  <c.I width={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.68rem] uppercase tracking-[0.12em] text-smoke">{c.label}</span>
                  <span className="block truncate text-sm text-ink">{c.value}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Head office */}
      <section className="border-t border-line bg-porcelain py-16 md:py-20">
        <div className="u-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <Kicker>Find us</Kicker>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.1]">
              {HEAD_OFFICE.name}
            </h2>
            <p className="mt-5 flex items-start gap-3 text-ink-soft">
              <Pin width={18} className="mt-1 shrink-0 text-gold" />
              <span>{HEAD_OFFICE.address}</span>
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={directionsUrl(HEAD_OFFICE.mapQuery)} target="_blank" rel="noreferrer" className="btn-ghost gap-2">
                Get directions <ArrowRight width={16} />
              </a>
              <Link to="/stores" className="btn-ghost gap-2">
                Our boutiques <ArrowRight width={16} />
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-sm border border-line">
            <iframe
              title={`Map of ${HEAD_OFFICE.name}`}
              src={HEAD_OFFICE.mapEmbed}
              loading="lazy"
              allowFullScreen
              className="h-72 w-full border-0"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </section>

      {/* FAQ — the short version; the full page lives at /faq */}
      <section id="faq" className="scroll-mt-32 border-t border-line bg-ivory py-16 md:py-24">
        <div className="u-narrow">
          <div className="text-center">
            <Kicker className="justify-center">Good to Know</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)]">Frequently asked questions</h2>
          </div>

          <div className="mt-12">
            <Accordion
              items={productFaq.map((f) => ({
                title: f.q,
                body: <p className="leading-relaxed text-ink-soft">{f.a}</p>,
              }))}
            />
          </div>

          <div className="mt-10 text-center">
            <Link to="/faq" className="btn-ghost group gap-2">
              Read every answer
              <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
