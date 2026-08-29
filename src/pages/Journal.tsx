import { Link } from 'react-router-dom'
import { asset } from '../lib/asset'
import { articles } from '../data/articles'
import PageHeader from '../components/ui/PageHeader'
import { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { ArrowUpRight } from '../components/ui/icons'
import Seo from '../components/Seo'

/**
 * The Journal index. The newest article leads at half width, the rest follow in
 * a row of three. Everything comes from src/data/articles.ts, already sorted
 * newest first, so adding an article here is a data change and nothing more.
 */
export default function Journal() {
  const [feature, ...rest] = articles

  return (
    <>
      <Seo
        title="The Journal"
        description="Stories from the house on scent, craft and the Malaysian culture that shapes every Legendary fragrance."
        image="/assets/client/banner-journal.webp"
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Journal', path: '/journal' }]}
      />
      <PageHeader
        eyebrow="The Journal"
        title="Notes, rituals & heritage"
        intro="Stories from the house on scent, craft and the Malaysian culture that shapes every Legendary fragrance."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Journal' }]}
        image={asset('/assets/client/banner-journal.webp')}
      />

      <section className="bg-ivory py-14 md:py-20">
        <div className="u-container">
          {/* Feature */}
          <Link
            to={`/journal/${feature.slug}`}
            className="group grid gap-8 overflow-hidden rounded-sm md:grid-cols-2 md:items-stretch"
          >
            <div className="overflow-hidden rounded-sm">
              <img
                src={feature.hero}
                alt={feature.heroAlt}
                className="aspect-[4/3] h-full w-full object-cover transition-transform duration-[1100ms] ease-luxe group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="eyebrow eyebrow-gold">{feature.category} · Featured</p>
              <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.05]">
                {feature.cardTitle ?? feature.title}
              </h2>
              <p className="mt-4 max-w-md text-lg text-ink-soft">{feature.excerpt}</p>
              <p className="mt-5 text-xs text-smoke">{feature.date} · {feature.readTime} read</p>
              <span className="mt-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-gold-deep">
                Read article <ArrowUpRight width={15} />
              </span>
            </div>
          </Link>

          {/* Grid */}
          <RevealGroup className="mt-16 grid gap-8 md:grid-cols-3">
            {rest.map((post) => (
              <RevealItem key={post.slug}>
                <Link to={`/journal/${post.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-sm">
                    <img
                      src={post.hero}
                      alt={post.heroAlt}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-[1100ms] ease-luxe group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 bg-ivory/90 px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-ink backdrop-blur">
                      {post.category}
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-smoke">{post.date} · {post.readTime} read</p>
                  <h3 className="mt-2 font-display text-2xl leading-snug">{post.cardTitle ?? post.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{post.excerpt}</p>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  )
}
