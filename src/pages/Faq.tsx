import { Link } from 'react-router-dom'
import { asset } from '../lib/asset'
import PageHeader from '../components/ui/PageHeader'
import Accordion from '../components/ui/Accordion'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, WhatsApp } from '../components/ui/icons'
import { houseFaq, faqIntro } from '../data/faq'
import { waLink, WHATSAPP_DISPLAY } from '../lib/concierge'

export default function Faq() {
  return (
    <>
      <PageHeader
        eyebrow="Customer Care"
        title="Frequently asked questions"
        intro={faqIntro}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]}
        image={asset('/assets/client/banner-contact.webp')}
      />

      <section className="bg-ivory py-16 md:py-24">
        <div className="u-narrow">
          <Accordion
            items={houseFaq.map((f) => ({
              title: f.q,
              body: (
                <>
                  <p className="leading-[1.85] text-ink-soft">{f.a}</p>
                  {f.list && (
                    <ul className="mt-4 space-y-2.5">
                      {f.list.map((item) => (
                        <li key={item} className="relative pl-6 leading-[1.8] text-ink-soft">
                          <span className="absolute left-0 top-[0.72em] h-1.5 w-1.5 rotate-45 bg-gold/70" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ),
            }))}
          />
        </div>
      </section>

      {/* Still stuck */}
      <section className="border-t border-line bg-porcelain py-16 md:py-20">
        <div className="u-narrow text-center">
          <Kicker className="justify-center">Still wondering</Kicker>
          <h2 className="mt-4 font-display text-[clamp(1.8rem,3.6vw,2.8rem)]">
            Ask us anything
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-ink-soft">
            Our Malaysian concierge team answers in minutes on WhatsApp at {WHATSAPP_DISPLAY}, or you
            can send us a note and we will reply within one business day.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={waLink('Hi Legendary! I have a question.')}
              target="_blank"
              rel="noreferrer"
              className="btn-gold gap-2"
            >
              <WhatsApp width={16} /> Chat on WhatsApp
            </a>
            <Link to="/contact" className="btn-ghost group gap-2">
              Send a message
              <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
