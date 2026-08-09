import { asset } from '../lib/asset'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import JourneyCarousel, { type Milestone } from '../components/JourneyCarousel'
import Services from '../sections/Services'
import Reveal, { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, Sparkle, ShieldCheck, Compass, Droplet } from '../components/ui/icons'

// Years match the photography supplied by the client for the journey carousel.
const timeline: Milestone[] = [
  { year: '2015', title: 'A House is Born', body: 'Legendary opens in Kuala Lumpur with a single scent, Orchid, inspired by the wild bloom of the rainforest.' },
  { year: '2016', title: 'Parkson', body: 'Expanded our brand presence into Parkson, a renowned department store.' },
  { year: '2017', title: 'KLIA', body: 'Entered Valiram at KLIA T1, garnering notable recognition in the Korean and Chinese markets.' },
  { year: '2018', title: 'SaSa Expansion', body: 'Established a strong presence at SaSa Malaysia, marking our success in the market.' },
  { year: '2019', title: 'Top-Selling Brand', body: 'Achieved top-selling brand status at Parkson, reflecting strong customer demand.' },
  { year: '2022', title: 'Air Asia', body: 'Forged a strategic partnership with AirAsia, outshining as a top-3 best-selling brand on the platform.' },
  { year: '2023', title: '3 Wishes', body: 'An alcohol free, skin safe trio for gentle everyday luxury becomes an instant bestseller.' },
]

const visionMission = [
  {
    label: 'Our Vision',
    title: 'To carry the scent of Malaysia to the world',
    body: 'To be the fragrance house the world recognises as Malaysia’s own, proving that a scent born of this country’s landscapes, culture and craft belongs on any dressing table, anywhere.',
  },
  {
    label: 'Our Mission',
    title: 'Luxury that stays welcoming',
    body: 'To compose Malaysian fragrances of genuine quality at a price that invites people in rather than shutting them out. Made in authenticity, worn with pride, and served with complimentary samples, wrapping and delivery on every order.',
  },
]

const values = [
  { I: Sparkle, title: 'Heritage', body: 'Every scent is a memory of Malaysia: its landscapes, its culture, its soul.' },
  { I: Compass, title: 'Craft', body: 'Composed in three considered acts: a first impression, a character, a memory.' },
  { I: ShieldCheck, title: 'Integrity', body: 'Made to the same standard every time, so you can wear it with confidence and pride.' },
  { I: Droplet, title: 'Generosity', body: 'Complimentary samples, wrapping and delivery, because luxury should feel welcoming.' },
]

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="The House"
        title="A scented memory of the country we call home"
        intro="Established in 2015, Legendary is a Malaysian perfume house on a mission to share the best of Malaysia’s fragrances with the world."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Our Story' }]}
        image={asset('/assets/client/banner-our-story.webp')}
      />

      {/* Intro split */}
      <section className="u-container grid items-center gap-14 py-20 md:py-28 lg:grid-cols-2 lg:gap-20">
        {/* Client note: image reproportioned to sit level with the copy block */}
        <Reveal className="mx-auto max-h-[58vh] w-full max-w-sm overflow-hidden rounded-sm">
          <img
            src={asset('/assets/client/signature-orchid.webp')}
            alt="Orchid, the signature scent"
            className="aspect-[4/5] max-h-[58vh] w-full object-cover"
          />
        </Reveal>
        <div>
          <Kicker>Our Beginning</Kicker>
          <Reveal><h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.05]">It started with a single flower</h2></Reveal>
          <Reveal delay={0.1}>
            <div className="mt-6 space-y-5 text-lg text-ink-soft">
              <p>Legendary began with Orchid, a scent drawn from the wild orchids of Malaysia’s rainforests and a timeless dance of grace and serenity. It remains the soul of the house.</p>
              <p>Rooted in authenticity and creativity, Legendary celebrates diversity while aspiring to global recognition. We believe the right fragrance empowers confidence and leaves a subtle, lasting impression.</p>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <Link to="/shop" className="btn-solid group mt-9">
              Explore the fragrances
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
            <Kicker>The Journey</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)]">Eleven years, in scent</h2>
          </div>
          <JourneyCarousel milestones={timeline} />
        </div>
      </section>

      {/* Vision & mission */}
      <section className="bg-porcelain py-20 md:py-28">
        <div className="u-container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <Kicker>What Drives Us</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)]">Vision &amp; mission</h2>
          </div>
          <RevealGroup className="grid gap-8 lg:grid-cols-2">
            {visionMission.map((v) => (
              <RevealItem key={v.label} className="border-t border-gold/40 pt-8">
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
            <Kicker>What We Believe</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)]">The values we wear</h2>
          </div>
          <RevealGroup className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <RevealItem key={v.title} className="rounded-sm border border-line bg-porcelain p-7">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/30 text-gold"><v.I width={22} /></span>
                <h3 className="mt-5 font-display text-2xl">{v.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{v.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-ink py-24 text-center text-ivory">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] peranakan" style={{ color: '#CBAA5D' }} />
        <div className="u-container relative">
          <h2 className="mx-auto max-w-2xl font-display text-[clamp(2rem,4.5vw,3.6rem)] leading-[1.05]">
            Come find your <span className="italic text-gilt">scent</span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/shop" className="btn-gold">Shop Fragrances</Link>
            <Link to="/stores" className="btn-outline-light">Visit a Boutique</Link>
          </div>
        </div>
      </section>
    </>
  )
}
