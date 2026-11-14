import type { CollectionsDoc, PlaceEntry, PlacesDoc, ProductsDoc } from '../../api/_lib/content/schema'
import { setOptional } from './blocks'
import { useContent } from './contentStore'
import { errorAt, TextArea, TextField } from './fields'
import PhotoField from './PhotoField'
import PublishBar from './PublishBar'
import { danger, panel } from './styles'

/**
 * The Scented Memory map on the Home page: each pin's name, the words on its
 * card and its card photo. Where a pin sits, the scent it opens and its
 * boutiques stay as they are, so pins are not added, moved or removed here.
 */
export default function PlacesEditor() {
  const doc = useContent((s) => s.docs.places)
  const products = useContent((s) => s.docs.products?.working) as ProductsDoc | null | undefined
  const collections = useContent((s) => s.docs.collections?.working) as CollectionsDoc | null | undefined
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const data = doc.working as PlacesDoc
  const err = (path: string) => errorAt(doc.errors, path)
  const set = (index: number, next: PlaceEntry) => edit('places', { ...data, places: data.places.map((p, i) => (i === index ? next : p)) })

  return (
    <div className="space-y-8">
      <p className="text-xs text-smoke">
        The pins on the Home page's map. Where each one sits, and the scent it opens, stay as they are.
      </p>
      {data.places.map((place, i) => {
        const product = products?.products.find((p) => p.id === place.productId)
        const collection = place.collectionId ? collections?.collections.find((c) => c.id === place.collectionId) : undefined
        const scent = product?.name ?? place.productId
        const at = (field: string) => err(`places.${i}.${field}`)
        const optional = (key: 'scentLabel' | 'familyLabel' | 'cardImage', value: string | undefined) =>
          set(i, setOptional(place, key, value))
        return (
          <section key={place.id} className={panel}>
            <h2 className="font-display text-xl">{place.place || 'This pin'}</h2>
            <p className="mb-5 mt-1 text-xs text-smoke">
              {collection ? `Opens the ${collection.name} collection.` : `Opens ${scent}.`}
            </p>
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Place name" value={place.place} onChange={(v) => set(i, { ...place, place: v })} error={at('place')} disabled={busy} />
                <TextField
                  label="Line above the name"
                  value={place.region}
                  onChange={(region) => set(i, { ...place, region })}
                  error={at('region')}
                  disabled={busy}
                />
              </div>
              <TextArea label="Words on its card" value={place.note} onChange={(note) => set(i, { ...place, note })} error={at('note')} disabled={busy} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Card heading (optional)"
                  hint={`Left empty, the card shows ${scent}.`}
                  value={place.scentLabel ?? ''}
                  onChange={(v) => optional('scentLabel', v)}
                  error={at('scentLabel')}
                  disabled={busy}
                />
                <TextField
                  label="Line under the heading (optional)"
                  hint={product ? `Left empty: ${product.family} · RM ${product.price}.` : undefined}
                  value={place.familyLabel ?? ''}
                  onChange={(v) => optional('familyLabel', v)}
                  error={at('familyLabel')}
                  disabled={busy}
                />
              </div>
              <div>
                <PhotoField kind="place" label="Card photo (optional)" value={place.cardImage} onChange={(path) => optional('cardImage', path)} disabled={busy} />
                <p className="mt-1 text-xs text-smoke">Left empty, the card shows {scent}'s lifestyle photo.</p>
                {at('cardImage') && <p className={`text-xs ${danger}`}>{at('cardImage')}</p>}
              </div>
            </div>
          </section>
        )
      })}

      <PublishBar docs={['places']} previewPath="/" />
    </div>
  )
}
