import { Link } from 'react-router-dom'
import { asset } from '../lib/asset'
import { getProduct } from '../data/products'
import Reveal from '../components/ui/Reveal'
import RollingNumber from '../components/ui/RollingNumber'
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
              Orchid, the scent<br />that began it all
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-lg text-lg text-ink-soft">{orchid.story}</p>
          </Reveal>

          {/* Client layout: years in trade beside lifetime bottles sold.
              Revision 2 sets the copy to "Since 2015" and "bottles loved
              worldwide", the figure in Noto Serif Medium and the year in
              Minion Bold. */}
          <Reveal delay={0.15}>
            <div className="mt-9 flex max-w-lg flex-wrap items-center gap-x-10 gap-y-6 border-y border-line py-7">
              <div>
                <p className="font-minion text-[clamp(1.9rem,3.4vw,2.5rem)] font-bold leading-[1.05] tracking-[0.01em] text-ink">
                  Since<br />2015
                </p>
              </div>
              <span className="hidden h-14 w-px bg-line sm:block" />
              <div>
                {/* Revision 4: the figure rolls up when the section arrives. */}
                <p className="font-noto text-[clamp(2rem,4.2vw,3rem)] font-medium leading-none text-gold-deep">
                  <RollingNumber value={30_000_000} suffix="+" />
                </p>
                <p className="mt-2 text-sm text-ink-soft">bottles loved worldwide</p>
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
                <ShieldCheck width={18} className="text-gold" /> 30ml Eau de Parfum
              </span>
            </div>
          </Reveal>
        </div>

        {/* Image — static, per client note to drop the hover movement */}
        <Reveal className="order-1 lg:order-2" delay={0.1}>
          {/* Client note: capped so the whole image is appreciable without scrolling */}
          <div className="relative mx-auto aspect-[4/5] max-h-[58vh] w-full max-w-sm overflow-hidden rounded-sm">
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
