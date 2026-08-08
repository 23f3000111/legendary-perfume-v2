import { Link } from 'react-router-dom'
import { asset } from '../lib/asset'
import { getProduct } from '../data/products'
import Reveal from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, ShieldCheck } from '../components/ui/icons'

export default function Signature() {
  const orchid = getProduct('orchid')!

  return (
    <section className="relative overflow-hidden bg-ivory py-24 md:py-32">
      <div className="u-container grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Text */}
        <div className="order-2 lg:order-1">
          <Kicker>The Signature</Kicker>
          <Reveal>
            <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.02]">
              Orchid — the scent<br />that began it all
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-lg text-lg text-ink-soft">{orchid.story}</p>
          </Reveal>

          {/* Client layout: years in trade beside lifetime bottles sold */}
          <Reveal delay={0.15}>
            <div className="mt-9 flex max-w-lg flex-wrap items-center gap-x-10 gap-y-6 border-y border-line py-7">
              <div className="text-center">
                <p className="font-display text-[2.4rem] font-bold leading-none text-ink">2015</p>
                <span className="mx-auto my-1.5 block h-px w-4 bg-smoke/60" />
                <p className="font-display text-[1.5rem] font-bold uppercase leading-none tracking-[0.02em] text-ink">
                  Till date
                </p>
              </div>
              <span className="hidden h-14 w-px bg-line sm:block" />
              <div>
                <p className="font-display text-[clamp(2.2rem,4.4vw,3.2rem)] font-bold leading-none text-gold-deep">
                  30,000,000+
                </p>
                <p className="mt-2 text-sm text-ink-soft">totalled bottles sold</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link to="/product/orchid" className="btn-solid group">
                Discover Orchid
                <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <span className="flex items-center gap-2 text-sm text-smoke">
                <ShieldCheck width={18} className="text-gold" /> Halal Certified · 30ml EDP
              </span>
            </div>
          </Reveal>
        </div>

        {/* Image — static, per client note to drop the hover movement */}
        <Reveal className="order-1 lg:order-2" delay={0.1}>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-sm">
            <img
              src={asset('/assets/client/signature-orchid.webp')}
              alt="Orchid eau de parfum"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/20" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
