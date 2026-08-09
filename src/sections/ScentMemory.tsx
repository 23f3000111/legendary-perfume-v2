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
              From the isles of Langkawi to the streets of old Melaka, each fragrance is a postcard
              of the country that made us. Choose a place to uncover its scent.
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
