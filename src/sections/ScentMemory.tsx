import MalaysiaMap from '../components/MalaysiaMap'
import Reveal from '../components/ui/Reveal'
import Particles from '../components/ui/Particles'
import { Kicker } from '../components/ui/SplitText'

export default function ScentMemory() {
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-ivory md:py-32">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-rose/10 blur-3xl" />
      {/* Dust sits at z-0 so the map and copy always read above it */}
      <Particles />
      <div className="u-container relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <Kicker>A Scented Memory of Malaysia</Kicker>
          <Reveal>
            <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.03]">
              Every scent is born<br />of a <span className="italic text-gilt">place</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-ivory/60">
              From the sun kissed shores of Langkawi to the historic heart of Melaka, our scents
              translate the spirit of Malaysia into fine perfumery. Select a place to begin your
              sensory journey.
            </p>
          </Reveal>
        </div>

        <div className="mt-16">
          <MalaysiaMap />
        </div>
      </div>
    </section>
  )
}
