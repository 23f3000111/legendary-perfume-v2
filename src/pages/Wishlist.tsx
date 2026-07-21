import { Link } from 'react-router-dom'
import { useShop } from '../store/shop'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import PageHeader from '../components/ui/PageHeader'
import { Heart } from '../components/ui/icons'

export default function Wishlist() {
  const wishlist = useShop((s) => s.wishlist)
  const items = products.filter((p) => wishlist.includes(p.id))

  return (
    <>
      <PageHeader
        eyebrow="Saved for later"
        title="Your Wishlist"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]}
      />
      <section className="bg-ivory py-16 md:py-24">
        <div className="u-container">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-sand text-rose"><Heart width={26} /></span>
              <p className="font-display text-3xl">Nothing saved yet</p>
              <p className="max-w-sm text-smoke">Tap the heart on any fragrance to keep it here for later.</p>
              <Link to="/shop" className="btn-gold mt-2">Explore Fragrances</Link>
            </div>
          ) : (
            <>
              <p className="mb-8 text-sm text-smoke">{items.length} {items.length === 1 ? 'fragrance' : 'fragrances'} saved</p>
              <div className="grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
                {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
