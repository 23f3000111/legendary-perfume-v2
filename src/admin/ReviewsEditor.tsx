import type { ReviewEntry, ReviewsDoc } from '../../api/_lib/content/schema'
import { setOptional } from './blocks'
import { useContent } from './contentStore'
import { errorAt, ListEditor, Select, TextArea, TextField } from './fields'
import PublishBar from './PublishBar'
import { setStars } from './site'
import { panel } from './styles'

const STARS = [
  { value: '5', label: 'Five stars' },
  { value: '4', label: 'Four stars' },
  { value: '3', label: 'Three stars' },
  { value: '2', label: 'Two stars' },
  { value: '1', label: 'One star' },
]

/**
 * The customer wall on the Home page: each review's words, who left it, what
 * they bought and where it was left, in the order the wall shows them.
 */
export default function ReviewsEditor() {
  const doc = useContent((s) => s.docs.reviews)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const data = doc.working as ReviewsDoc
  const err = (path: string) => errorAt(doc.errors, path)

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Reviews</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">The customer wall on the Home page, in order.</p>
        <ListEditor
          items={data.reviews}
          onChange={(reviews: ReviewEntry[]) => edit('reviews', { ...data, reviews })}
          blank={(): ReviewEntry => ({ quote: '', author: '' })}
          addLabel="Add a review"
          itemLabel={(r) => (r.author ? `the review by ${r.author}` : 'this review')}
          disabled={busy}
          render={(r, update, i) => {
            const at = (field: string) => err(`reviews.${i}.${field}`)
            return (
              <>
                <TextArea label="Quote" value={r.quote} onChange={(quote) => update({ ...r, quote })} error={at('quote')} disabled={busy} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    label="Name"
                    hint="Their name on the platform, or Verified buyer."
                    value={r.author}
                    onChange={(author) => update({ ...r, author })}
                    error={at('author')}
                    disabled={busy}
                  />
                  <TextField
                    label="What they bought (optional)"
                    hint="Shown under the name, as a link when the review has one."
                    value={r.product ?? ''}
                    onChange={(v) => update(setOptional(r, 'product', v))}
                    error={at('product')}
                    disabled={busy}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Select
                    label="Stars"
                    value={String(r.rating ?? 5)}
                    options={STARS}
                    onChange={(v) => update(setStars(r, Number(v)))}
                    error={at('rating')}
                    disabled={busy}
                  />
                  <TextField
                    label="Link to the review (optional)"
                    hint="Where it was left, such as its Shopee listing. It starts https://"
                    value={r.href ?? ''}
                    onChange={(v) => update(setOptional(r, 'href', v))}
                    error={at('href')}
                    disabled={busy}
                  />
                </div>
              </>
            )
          }}
        />
      </section>

      <PublishBar docs={['reviews']} previewPath="/" />
    </div>
  )
}
