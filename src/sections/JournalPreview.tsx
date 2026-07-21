import { Link } from 'react-router-dom'
import { journalPosts } from '../data/journal'
import { RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Kicker } from '../components/ui/SplitText'
import { ArrowRight, ArrowUpRight } from '../components/ui/icons'

export default function JournalPreview() {
  const posts = journalPosts.slice(0, 3)
  return (
    <section className="bg-ivory py-24 md:py-32">
      <div className="u-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>The Journal</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.02]">Stories from the house</h2>
          </div>
          <Link to="/journal" className="group flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-ink">
            All articles <ArrowRight width={15} className="text-gold transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <RevealGroup className="mt-12 grid gap-8 md:grid-cols-3">
          {posts.map((post) => (
            <RevealItem key={post.id}>
              <Link to="/journal" className="group block">
                <div className="relative overflow-hidden rounded-sm">
                  <img src={post.image} alt={post.title} className="aspect-[4/3] w-full object-cover transition-transform duration-[1100ms] ease-luxe group-hover:scale-105" />
                  <span className="absolute left-4 top-4 bg-ivory/90 px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-ink backdrop-blur">
                    {post.category}
                  </span>
                </div>
                <div className="mt-5">
                  <p className="text-xs text-smoke">{post.date} · {post.readTime} read</p>
                  <h3 className="mt-2 flex items-start gap-2 font-display text-2xl leading-snug text-ink">
                    {post.title}
                    <ArrowUpRight width={18} className="mt-1 shrink-0 text-gold opacity-0 transition group-hover:opacity-100" />
                  </h3>
                  <p className="mt-2 text-sm text-ink-soft">{post.excerpt}</p>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
