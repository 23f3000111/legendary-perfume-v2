import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { asset } from '../lib/asset'
import PageHeader from '../components/ui/PageHeader'
import { Kicker } from '../components/ui/SplitText'
import Accordion from '../components/ui/Accordion'
import { Phone, Instagram, Facebook, Pin, Check, ArrowRight } from '../components/ui/icons'
import { waLink, WHATSAPP_DISPLAY } from '../lib/concierge'
import { directionsUrl, HEAD_OFFICE } from '../data/stores'
import { productFaq } from '../data/faq'
import Seo from '../components/Seo'
import { ApiError, sendContactMessage } from '../lib/api'

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
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  /* Honeypot, and the moment the form was first rendered. Both are checked on
     the server: a bot fills the hidden field, and nobody reads this page and
     writes a message in under three seconds. */
  const [company, setCompany] = useState('')
  const openedAt = useRef(Date.now())

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await sendContactMessage({
        ...form,
        company,
        elapsedMs: Date.now() - openedAt.current,
      })
      setSent(true)
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'We could not send that just now. Please try again, or reach us on WhatsApp.',
      )
    } finally {
      setSending(false)
    }
  }

  const channels = [
    {
      // Revision 4: the client supplied a ringed handset in place of the
      // WhatsApp glyph here. The card draws the ring, so the house's own
      // handset sits inside it and matches the stroke of its two neighbours.
      I: Phone,
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
      <Seo
        title="Contact"
        description="Talk to the house about a scent, an order, corporate gifting or a partnership. Message us on WhatsApp, or send a note and we will reply within one business day."
        image="/assets/client/banner-contact.webp"
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]}
      />
      <PageHeader
        eyebrow="Partnerships and Inquiries"
        title="Collaborate and Inquire"
        intro="Whether you are exploring creative partnerships, corporate gifting or need assistance with your personal fragrance journey, our team is at your service."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
        image={asset('/assets/client/banner-contact.webp')}
      />

      {/* One centred card, the way the client's reference page works. */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="u-narrow">
          <div className="mx-auto max-w-2xl text-center">
            <Kicker className="justify-center">Send a message</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.05]">
              How can we assist you?
            </h2>
            <p className="mt-4 text-ink-soft">
              Fill in the form below, or reach us directly on{' '}
              <a href={waLink('Hi Legendary! I have a question.')} target="_blank" rel="noreferrer" className="link-gold text-gold-deep">
                WhatsApp
              </a>
              .
            </p>
          </div>

          <form
            onSubmit={submit}
            className="mx-auto mt-10 max-w-2xl rounded-sm border border-line bg-porcelain p-7 sm:p-9"
          >
            {/* Honeypot. Hidden from people and from screen readers, so
                anything that fills it is a bot and the message is dropped
                server side without a word. */}
            <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
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

            <button
              type="submit"
              disabled={sending || sent}
              className="btn-solid group mt-8 w-full justify-center gap-2 disabled:opacity-60"
            >
              {sent ? (
                <><Check width={16} /> Message sent</>
              ) : sending ? (
                'Sending'
              ) : (
                <>Submit <ArrowRight width={16} className="transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
            {sent && (
              <p className="mt-4 text-center text-sm text-gold-deep">
                Thank you. We will be in touch within one business day.
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 text-center text-sm text-[#A4352C]">
                {error}
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
