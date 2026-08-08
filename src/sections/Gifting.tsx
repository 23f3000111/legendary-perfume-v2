import { asset } from '../lib/asset'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Reveal from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { Gift, ArrowRight } from '../components/ui/icons'

export default function Gifting() {
  return (
    <section className="relative overflow-hidden bg-porcelain py-24 md:py-32">
      <div className="u-container grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Image */}
        <Reveal className="relative">
          <div className="relative overflow-hidden rounded-sm">
            <img src={asset('/assets/client/gifting-wishes.webp')} alt="3 Wishes gift set with ribbon" className="aspect-[4/3] w-full object-cover" />
          </div>
          <motion.div
            className="absolute -bottom-6 -right-4 hidden rounded-full bg-ivory px-6 py-6 text-center shadow-xl sm:block"
            initial={{ scale: 0, rotate: -12 }} whileInView={{ scale: 1, rotate: -8 }} viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.3 }}
          >
            <Gift width={26} className="mx-auto text-gold" />
            <p className="mt-1 font-display text-sm leading-tight">Complimentary<br />gift wrapping</p>
          </motion.div>
        </Reveal>

        {/* Text */}
        <div>
          <Kicker>The Art of Gifting</Kicker>
          <Reveal>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,4.5vw,3.8rem)] leading-[1.02]">
              Make every gift<br /><span className="italic text-gilt">unforgettable</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-lg text-lg text-ink-soft">
              Every set is presented in signature packaging, hand-tied and ready to delight — complete
              with a personal note and complimentary samples to discover together.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className="mt-8 space-y-3 text-ink-soft">
              {['Hand-wrapped in signature ivory & gold', 'A personalised post card', 'Discovery samples with every order'].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {f}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.2}>
            <Link to="/shop?filter=gifts" className="btn-gold group mt-9">
              Find the perfect gift
              <ArrowRight width={16} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
