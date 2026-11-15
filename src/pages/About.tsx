import { asset } from '../lib/asset'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import JourneyCarousel from '../components/JourneyCarousel'
import { journeyDoc } from '../data/journey'
import Services from '../sections/Services'
import Reveal, { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, Sparkle, ShieldCheck, Compass, Droplet } from '../components/ui/icons'
import Seo from '../components/Seo'
import { SITE } from '../lib/seo'
import { pages } from '../data/pages'
import Heading from '../components/ui/Heading'

/** The values' icons, by position: the words are the page's. */
const VALUE_ICONS = [Sparkle, Compass, ShieldCheck, Droplet]

export default function About() {
  // Read at render, so a preview's drafts show.
  const words = pages.about
  return (
    <>
      <Seo
        title={words.seo.title}
        description={words.seo.description}
        image="/assets/client/banner-our-story.webp"
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Our Story', path: '/about' }]}
        jsonLd={[
          {
            '@type': 'AboutPage',
            name: words.header.title,
            mainEntity: { '@id': `${SITE.url}/#organisation` },
          },
        ]}
      />
      <PageHeader
        eyebrow={words.header.eyebrow}
        title={words.header.title}
        intro={words.header.intro}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Our Story' }]}
        image={asset('/assets/client/banner-our-story.webp')}
      />

      {/* Intro split */}
      <section className="u-container grid items-center gap-14 py-20 md:py-28 lg:grid-cols-2 lg:gap-20">
        {/* Client note: image reproportioned to sit level with the copy block.
            Revision 4: this was borrowing the home page's orchid shot. The
            client supplied a photograph of its own for "It started with a
            single flower". */}
        <Reveal className="mx-auto max-h-[58vh] w-full max-w-sm overflow-hidden rounded-sm">
          <img
            src={asset(words.beginning.photo)}
            alt={words.beginning.alt}
            className="aspect-[4/5] max-h-[58vh] w-full object-cover"
          />
        </Reveal>
        <div>
          <Kicker>{words.beginning.kicker}</Kicker>
          <Reveal><h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.05]"><Heading text={words.beginning.heading} /></h2></Reveal>
          <Reveal delay={0.1}>
            <div className="mt-6 space-y-5 text-lg text-ink-soft">
              {words.beginning.body.split(/\n\s*\n/).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <Link to="/shop" className="btn-solid group mt-9">
              {words.beginning.button}
              <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Company attributes — moved here from the home page per the client */}
      <Services />

      {/* Timeline */}
      <section className="bg-ink py-20 text-ivory md:py-28">
        <div className="u-container">
          <div className="mx-auto max-w-2xl text-center">
            <Kicker>{words.journey.kicker}</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)]"><Heading text={words.journey.heading} /></h2>
          </div>
          <JourneyCarousel milestones={journeyDoc.milestones} />
        </div>
      </section>

      {/* Vision & mission */}
      <section className="bg-porcelain py-20 md:py-28">
        <div className="u-container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Kicker>{words.purpose.kicker}</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)]"><Heading text={words.purpose.heading} /></h2>
          </div>
          <RevealGroup className="grid gap-8 lg:grid-cols-2">
            {words.purpose.items.map((v, i) => (
              <RevealItem key={i} className="border-t border-gold/40 pt-8">
                <p className="eyebrow eyebrow-gold">{v.label}</p>
                <h3 className="mt-4 font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.15]">{v.title}</h3>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">{v.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Values */}
      <section className="bg-ivory py-20 md:py-28">
        <div className="u-container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Kicker>{words.values.kicker}</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)]"><Heading text={words.values.heading} /></h2>
          </div>
          <RevealGroup className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {words.values.items.map((v, i) => {
              const Icon = VALUE_ICONS[i] ?? Sparkle
              return (
              <RevealItem key={i} className="rounded-sm border border-line bg-porcelain p-7">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/30 text-gold"><Icon width={22} /></span>
                <h3 className="mt-5 font-display text-2xl">{v.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{v.body}</p>
              </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-ink py-24 text-center text-ivory">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] peranakan" style={{ color: '#CBAA5D' }} />
        <div className="u-container relative">
          <h2 className="mx-auto max-w-2xl font-display text-[clamp(2rem,4.5vw,3.6rem)] leading-[1.05]">
            <Heading text={words.cta.heading} />
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/shop" className="btn-gold">{words.cta.shop}</Link>
            <Link to="/stores" className="btn-outline-light">{words.cta.stores}</Link>
          </div>
        </div>
      </section>
    </>
  )
}
