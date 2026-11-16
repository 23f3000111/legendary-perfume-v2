import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Accordion from '../components/ui/Accordion'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, WhatsApp } from '../components/ui/icons'
import { faq } from '../data/faq'
import { site, waLink } from '../data/site'
import { pages, shareImage } from '../data/pages'
import Heading from '../components/ui/Heading'
import Seo from '../components/Seo'

export default function Faq() {
  return (
    <>
      <Seo
        title={pages.faq.seo.title}
        description={pages.faq.seo.description}
        image={shareImage(pages.faq)}
        crumbs={[{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }]}
        jsonLd={[
          {
            '@type': 'FAQPage',
            mainEntity: faq.sections.flatMap((s) =>
              s.items.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.list ? `${f.a} ${f.list.join('. ')}` : f.a,
                },
              })),
            ),
          },
        ]}
      />
      <PageHeader
        eyebrow={pages.faq.header.eyebrow}
        title={pages.faq.header.title}
        intro={faq.intro}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]}
        banner={pages.faq.banner}
      />

      {/* Revision 5: the client's sheet runs to roughly fifty questions,
          already sorted into groups. One accordion of fifty rows is a wall, so
          the page keeps their grouping and gives each section its own heading. */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="u-narrow space-y-14">
          {faq.sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-[clamp(1.5rem,2.8vw,2rem)] leading-tight">
                {section.title}
              </h2>
              <div className="mt-5">
                <Accordion
                  items={section.items.map((f) => ({
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
            </div>
          ))}
        </div>
      </section>

      {/* Still stuck */}
      <section className="border-t border-line bg-porcelain py-16 md:py-20">
        <FaqHelp />
      </section>
    </>
  )
}

/**
 * "Ask us anything": the page's words either side of the WhatsApp number,
 * which comes from the site details, so a new number shows here too.
 */
export function FaqHelp() {
  const help = pages.faq.help
  return (
    <div className="u-narrow text-center">
      <Kicker className="justify-center">{help.kicker}</Kicker>
      <h2 className="mt-4 font-display text-[clamp(1.8rem,3.6vw,2.8rem)]">
        <Heading text={help.heading} />
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-ink-soft">
        {help.before} {site.whatsapp}
        {/* Publish trims what is typed, so a word after the number needs its space back. */}
        {/^[,.;:!?)]/.test(help.after) ? '' : ' '}
        {help.after}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={waLink('Hi Legendary! I have a question.')}
          target="_blank"
          rel="noreferrer"
          className="btn-gold gap-2"
        >
          <WhatsApp width={16} /> {help.whatsapp}
        </a>
        <Link to="/contact" className="btn-ghost group gap-2">
          {help.message}
          <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
