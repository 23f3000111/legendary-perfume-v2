import { useState } from 'react'
import type { JournalArticle, JournalDoc } from '../../api/_lib/content/schema'
import { formatDate } from '../data/articles'
import { estimateMinutes, setOptional } from './blocks'
import BlocksEditor from './BlocksEditor'
import { sameContent, useContent, type EditableDoc } from './contentStore'
import { ContentGate, DateField, errorAt, NumberField, TextArea, TextField } from './fields'
import { blankArticle, byDate, issueCount, retitle, todayInKL } from './journal'
import PhotoField from './PhotoField'
import PublishBar from './PublishBar'
import { danger, panel, small } from './styles'

/**
 * The Journal: every article, newest first, and one article at a time to
 * write or edit, from its title and photos down to its body.
 *
 * A new article's address follows its title until it is published, and then
 * stays, since links and search results point at it.
 */
export default function JournalEditor() {
  return (
    <ContentGate>
      <Editor />
    </ContentGate>
  )
}

/** The article open in the form: where it sits, and the address it had then. */
interface Open {
  index: number
  slug: string
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

function Editor() {
  const doc = useContent((s) => s.docs.journal)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  const [open, setOpen] = useState<Open | null>(null)
  if (!doc) return null

  const data = doc.working as JournalDoc
  const published = (doc.published as JournalDoc | null)?.articles ?? []
  const publishedSlugs = new Set(published.map((a) => a.slug))
  const setArticles = (articles: JournalArticle[]) => edit('journal', { ...data, articles })

  // The open article is the one at its place with the address it was opened
  // with (kept up to date as its title changes). If the list changed under it,
  // say a discard dropped a new article, the form gives way to the list.
  const current = open && data.articles[open.index]?.slug === open.slug ? data.articles[open.index] : null
  if (current && open) {
    return (
      <ArticleForm
        doc={doc}
        article={current}
        index={open.index}
        publishedSlugs={publishedSlugs}
        taken={new Set(data.articles.filter((_, i) => i !== open.index).map((a) => a.slug))}
        onChange={(next) => {
          setArticles(data.articles.map((a, i) => (i === open.index ? next : a)))
          setOpen({ index: open.index, slug: next.slug })
        }}
        onClose={() => setOpen(null)}
        busy={busy}
      />
    )
  }

  const create = () => {
    const fresh = blankArticle(new Set(data.articles.map((a) => a.slug)), todayInKL())
    setArticles([fresh, ...data.articles])
    setOpen({ index: 0, slug: fresh.slug })
  }
  const remove = (index: number) => {
    const article = data.articles[index]
    const name = article.title || 'this article'
    const question = publishedSlugs.has(article.slug)
      ? `Remove "${name}"? Its page stops working once you publish.`
      : `Remove "${name}"?`
    if (!window.confirm(question)) return
    setArticles(data.articles.filter((_, i) => i !== index))
  }
  const listError = errorAt(doc.errors, 'articles')

  return (
    <div className="space-y-8">
      <section className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Articles</h2>
            <p className="mt-1 text-xs text-smoke">Newest first, as the Journal page shows them.</p>
          </div>
          <button type="button" onClick={create} disabled={busy} className={small}>
            New article
          </button>
        </div>
        {listError && <p className={`mt-3 text-xs ${danger}`}>{listError}</p>}
        <ul className="mt-5 divide-y divide-line">
          {byDate(data.articles).map(({ article, index }) => {
            const isNew = !publishedSlugs.has(article.slug)
            const changed = !isNew && !sameContent(article, published.find((a) => a.slug === article.slug))
            const issues = issueCount(doc.errors, index)
            return (
              <li key={`${index}:${article.slug}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{article.cardTitle || article.title || 'Untitled article'}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-smoke">
                    <span>
                      {DAY.test(article.published) ? formatDate(article.published) : 'No date'}
                      {article.category ? ` · ${article.category}` : ''}
                    </span>
                    {isNew && <Tag>New</Tag>}
                    {changed && <Tag>Changed</Tag>}
                    {issues > 0 && <span className={danger}>Needs attention</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setOpen({ index, slug: article.slug })} className={small}>
                    Edit
                  </button>
                  <button type="button" onClick={() => remove(index)} disabled={busy} className={small}>
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <PublishBar docs={['journal']} previewPath="/journal" />
    </div>
  )
}

function Tag({ children }: { children: string }) {
  return <span className="rounded-sm border border-line px-1.5 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-ink-soft">{children}</span>
}

function ArticleForm({
  doc, article, index, publishedSlugs, taken, onChange, onClose, busy,
}: {
  doc: EditableDoc
  article: JournalArticle
  index: number
  publishedSlugs: Set<string>
  taken: Set<string>
  onChange: (next: JournalArticle) => void
  onClose: () => void
  busy: boolean
}) {
  const err = (path: string) => errorAt(doc.errors, `articles.${index}.${path}`)
  const estimate = estimateMinutes(article.body)
  const cardTitle = article.cardTitle ?? ''

  return (
    <div className="space-y-8">
      <button type="button" onClick={onClose} className="text-xs text-smoke underline transition hover:text-ink">
        All articles
      </button>

      <section className={panel}>
        <h2 className="font-display text-xl">{article.title || 'New article'}</h2>
        <div className="mt-5 space-y-5">
          <div>
            <TextField
              label="Title"
              value={article.title}
              onChange={(title) => onChange(retitle(article, title, publishedSlugs, taken))}
              error={err('title')}
              disabled={busy}
            />
            <p className="mt-1 text-xs text-smoke">Address: /journal/{article.slug}</p>
            <p className="text-xs text-smoke">Made from the title. It stays the same once the article is published.</p>
            {err('slug') && <p className={`mt-1 text-xs ${danger}`}>{err('slug')}</p>}
          </div>

          <TextField
            label="Card title (optional)"
            value={cardTitle}
            onChange={(next) => onChange(setOptional(article, 'cardTitle', next))}
            hint={
              cardTitle.length > 50
                ? 'Long card titles crowd the Journal page. Under 50 characters reads best.'
                : 'A shorter title for the Journal page and the links between articles.'
            }
            error={err('cardTitle')}
            disabled={busy}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Category"
              value={article.category}
              onChange={(category) => onChange({ ...article, category })}
              error={err('category')}
              disabled={busy}
            />
            <DateField
              label="Date"
              value={article.published}
              onChange={(published) => onChange({ ...article, published })}
              error={err('published')}
              disabled={busy}
            />
          </div>

          <div>
            <NumberField
              label="Reading time (minutes)"
              value={article.minutes}
              min={1}
              max={60}
              onChange={(minutes) => onChange({ ...article, minutes })}
              error={err('minutes')}
              disabled={busy}
            />
            <p className="mt-1 text-xs text-smoke">
              About {estimate} min at this length.{' '}
              {estimate !== article.minutes && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onChange({ ...article, minutes: estimate })}
                  className="underline transition hover:text-ink"
                >
                  Use {estimate}
                </button>
              )}
            </p>
          </div>

          <TextArea
            label="Summary"
            hint="Shown on the Journal page and under the title."
            value={article.excerpt}
            onChange={(excerpt) => onChange({ ...article, excerpt })}
            error={err('excerpt')}
            disabled={busy}
          />

          <div>
            <PhotoField
              kind="journal"
              label="Header photo"
              value={article.hero || undefined}
              onChange={(hero) => onChange({ ...article, hero: hero ?? '' })}
              disabled={busy}
            />
            {err('hero') && <p className={`mt-1 text-xs ${danger}`}>{err('hero')}</p>}
          </div>
          <TextField
            label="Header photo description"
            hint="What the photo shows, for anyone who cannot see it."
            value={article.heroAlt}
            onChange={(heroAlt) => onChange({ ...article, heroAlt })}
            error={err('heroAlt')}
            disabled={busy}
          />

          <div>
            <PhotoField
              kind="journal"
              label="Journal page photo (optional)"
              value={article.cardImage}
              onChange={(cardImage) => onChange(setOptional(article, 'cardImage', cardImage))}
              disabled={busy}
            />
            <p className="mt-1 text-xs text-smoke">Only when the header photo crops badly on the Journal page.</p>
            {err('cardImage') && <p className={`mt-1 text-xs ${danger}`}>{err('cardImage')}</p>}
          </div>
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Article</h2>
        <div className="mt-5">
          <BlocksEditor
            blocks={article.body}
            onChange={(body) => onChange({ ...article, body })}
            err={(p) => errorAt(doc.errors, p ? `articles.${index}.body.${p}` : `articles.${index}.body`)}
            disabled={busy}
          />
        </div>
      </section>

      <PublishBar docs={['journal']} previewPath={`/journal/${article.slug}`} />
    </div>
  )
}
