import { Link } from 'react-router-dom'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight } from '../components/ui/icons'

export default function Bestsellers() {
  const best = products.filter((p) => p.bestseller).slice(0, 4)
  return (
    <section className="bg-ivory py-24 md:py-32">
      <div className="u-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>Most Loved</Kicker>
            <Reveal>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02]">
                The bestsellers
              </h2>
            </Reveal>
          </div>
          <Link to="/shop?filter=bestsellers" className="group flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-ink">
            View all <ArrowRight width={15} className="text-gold transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
          {best.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
