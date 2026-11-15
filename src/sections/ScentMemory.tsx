import MalaysiaMap from '../components/MalaysiaMap'
import Reveal from '../components/ui/Reveal'
import Particles from '../components/ui/Particles'
import { Kicker } from '../components/ui/SplitText'
import Heading from '../components/ui/Heading'
import { pages } from '../data/pages'

export default function ScentMemory() {
  const words = pages.home.map
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-ivory md:py-32">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-rose/10 blur-3xl" />
      {/* Dust sits at z-0 so the map and copy always read above it */}
      <Particles />
      <div className="u-container relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <Kicker>{words.kicker}</Kicker>
          <Reveal>
            <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.03]">
              <Heading text={words.heading} />
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-ivory/60">{words.intro}</p>
          </Reveal>
        </div>

        <div className="mt-16">
          <MalaysiaMap />
        </div>
      </div>
    </section>
  )
}
