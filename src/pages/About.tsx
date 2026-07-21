import { asset } from '../lib/asset'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Reveal, { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, Sparkle, ShieldCheck, Compass, Droplet } from '../components/ui/icons'

const timeline = [
  { year: '2015', title: 'A house is born', body: 'Legendary opens in Kuala Lumpur with a single scent — Orchid — inspired by the wild bloom of the rainforest.' },
  { year: '2017', title: 'The first boutique', body: 'Our flagship counter arrives at Pavilion KL, bringing the house to the heart of the city.' },
  { year: '2019', title: 'The Nyonya Collection', body: 'A tribute to Peranakan heritage — Kebaya Blooms, Ondeh Delights and Nyonya Aromatic.' },
  { year: '2021', title: 'Taking flight', body: 'Boutiques open at KLIA and Langkawi, and on board AirAsia — Malaysia’s scent, to the world.' },
  { year: '2023', title: '3 Wishes', body: 'An alcohol-free, skin-safe trio for gentle everyday luxury becomes an instant bestseller.' },
  { year: '2026', title: 'Nationwide', body: 'Nine boutiques from KL to Sabah, and a home online — with a concierge in every pocket.' },
]

const values = [
  { I: Sparkle, title: 'Heritage', body: 'Every scent is a memory of Malaysia — its landscapes, its culture, its soul.' },
  { I: Compass, title: 'Craft', body: 'Composed in three considered acts: a first impression, a character, a memory.' },
  { I: ShieldCheck, title: 'Integrity', body: 'Halal certified without exception, made to be worn with confidence and pride.' },
  { I: Droplet, title: 'Generosity', body: 'Complimentary samples, wrapping and delivery — luxury should feel welcoming.' },
]

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="The House"
        title="A scented memory of the country we call home"
        intro="Established in 2015, Legendary is a Malaysian perfume house on a mission to share the best of Malaysia’s fragrances with the world."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Our Story' }]}
      />

      {/* Intro split */}
      <section className="u-container grid items-center gap-14 py-20 md:py-28 lg:grid-cols-2 lg:gap-20">
        <Reveal className="overflow-hidden rounded-sm">
          <img src={asset("/assets/orchid-mirror.webp")} alt="Orchid, the signature scent" className="aspect-[4/5] w-full object-cover" />
        </Reveal>
        <div>
          <Kicker>Our Beginning</Kicker>
          <Reveal><h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.05]">It started with a single flower</h2></Reveal>
          <Reveal delay={0.1}>
            <div className="mt-6 space-y-5 text-lg text-ink-soft">
              <p>Legendary began with Orchid — a scent drawn from the wild orchids of Malaysia’s rainforests, a timeless dance of grace and serenity. It remains the soul of the house.</p>
              <p>Rooted in authenticity and creativity, Legendary celebrates diversity while aspiring to global recognition. We believe the right fragrance empowers confidence and leaves a subtle, lasting impression.</p>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <Link to="/shop" className="btn-solid group mt-9 gap-2">
              Explore the fragrances <ArrowRight width={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-ink py-20 text-ivory md:py-28">
        <div className="u-container">
          <div className="mx-auto max-w-2xl text-center">
            <Kicker>The Journey</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)]">Eleven years, in scent</h2>
          </div>
          <div className="mt-16 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {timeline.map((t, i) => (
              <Reveal key={t.year} delay={i * 0.05}>
                <div className="border-t border-ivory/15 pt-5">
                  <p className="font-display text-4xl text-gilt">{t.year}</p>
                  <h3 className="mt-3 font-display text-xl">{t.title}</h3>
                  <p className="mt-2 text-sm text-ivory/60">{t.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
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
            <Link to="/stores" className="btn text-ivory ring-1 ring-ivory/40 hover:bg-ivory hover:text-ink">Visit a Boutique</Link>
          </div>
        </div>
      </section>
    </>
  )
}
