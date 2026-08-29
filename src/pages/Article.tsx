import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Prose from '../components/ui/Prose'
import ReadingProgress from '../components/ui/ReadingProgress'
import ShareRow from '../components/ui/ShareRow'
import { getArticle, articleNeighbours, type Article as Entry } from '../data/articles'
import { ChevronRight } from '../components/ui/icons'
import Seo from '../components/Seo'
import { absolute, SITE } from '../lib/seo'

/**
 * One template for every journal article. Copy lives in src/data/articles.ts as
 * Block[], so this file owns the furniture around the words and nothing else.
 */
export default function Article() {
  const { slug = '' } = useParams()
  const article = getArticle(slug)
  const body = useRef<HTMLDivElement>(null)

  if (!article) {
    return (
      <div className="grid min-h-[70vh] place-items-center pt-24 text-center">
        <div>
          <p className="font-display text-4xl">Article not found</p>
          <Link to="/journal" className="btn-gold mt-6">Back to the Journal</Link>
        </div>
      </div>
    )
  }

  const { prev, next } = articleNeighbours(article.slug)

  return (
    <>
      <Seo
        title={article.title}
        description={article.excerpt}
        image={article.hero}
        type="article"
        canonicalPath={`/journal/${article.slug}`}
        crumbs={[
          { name: 'Home', path: '/' },
          { name: 'Journal', path: '/journal' },
          { name: article.cardTitle ?? article.title, path: `/journal/${article.slug}` },
        ]}
        jsonLd={[
          {
            '@type': 'Article',
            '@id': absolute(`/journal/${article.slug}#article`),
            headline: article.title,
            description: article.excerpt,
            image: absolute(article.hero),
            datePublished: article.published,
            dateModified: article.published,
            articleSection: article.category,
            inLanguage: 'en-MY',
            author: { '@id': `${SITE.url}/#organisation` },
            publisher: { '@id': `${SITE.url}/#organisation` },
            mainEntityOfPage: absolute(`/journal/${article.slug}`),
          },
        ]}
      />
      <ReadingProgress target={body} />

      <PageHeader
        size="compact"
        scrim="strong"
        eyebrow={article.category}
        title={article.title}
        intro={article.excerpt}
        meta={`${article.date} · ${article.readTime} read`}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Journal', to: '/journal' },
          { label: article.cardTitle ?? article.title },
        ]}
        image={article.hero}
      />

      <section className="bg-ivory py-16 md:py-24">
        {/* Narrower than u-narrow: long-form copy wants a 70 character measure,
            and the widest block in any article is a 34rem table. */}
        <div ref={body} className="mx-auto w-full max-w-[44rem] px-5 sm:px-8">
          <Prose blocks={article.body} />
          <ShareRow title={article.title} />
        </div>
      </section>

      {(prev || next) && (
        <section className="border-t border-line bg-porcelain py-12">
          <div className="u-narrow grid gap-4 sm:grid-cols-2">
            {prev ? <Neighbour article={prev} side="prev" /> : <span className="hidden sm:block" />}
            {next && <Neighbour article={next} side="next" />}
          </div>
        </section>
      )}
    </>
  )
}

function Neighbour({ article, side }: { article: Entry; side: 'prev' | 'next' }) {
  const isNext = side === 'next'
  return (
    <Link
      to={`/journal/${article.slug}`}
      className={`group flex items-center gap-4 rounded-sm border border-line bg-ivory px-5 py-5 transition hover:border-gold ${
        isNext ? 'sm:flex-row-reverse sm:text-right' : ''
      }`}
    >
      <ChevronRight
        width={18}
        className={`shrink-0 text-gold transition-transform duration-500 ${
          isNext ? 'group-hover:translate-x-1' : 'rotate-180 group-hover:-translate-x-1'
        }`}
      />
      <span>
        <span className="eyebrow text-smoke">{isNext ? 'Next article' : 'Previous article'}</span>
        <span className="mt-1.5 block font-display text-lg leading-snug text-ink">
          {article.cardTitle ?? article.title}
        </span>
      </span>
    </Link>
  )
}
