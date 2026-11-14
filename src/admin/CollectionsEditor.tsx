import type { CollectionEntry, CollectionsDoc, PlacesDoc, ProductsDoc } from '../../api/_lib/content/schema'
import { accents } from '../lib/accents'
import { useContent } from './contentStore'
import { errorAt, ListEditor, Select, TextArea, TextField } from './fields'
import PhotoField from './PhotoField'
import PublishBar from './PublishBar'
import { blankCollection, collectionInUse, renameCollection } from './site'
import { danger, panel } from './styles'

const ACCENT_KEYS = Object.keys(accents) as CollectionEntry['accent'][]

/**
 * The collections: their names and words in the menu, on the Home page's rail
 * and in the shop, their colour and their square cover.
 *
 * A collection's address, /shop?collection=<id>, is made from its name while
 * it is new and fixed once it is published. One that products are in, or that
 * a pin on the Scented Memory map opens, cannot be removed.
 */
export default function CollectionsEditor() {
  const doc = useContent((s) => s.docs.collections)
  // The working products and places, so a move the team has not published yet counts.
  const products = useContent((s) => s.docs.products?.working) as ProductsDoc | null | undefined
  const places = useContent((s) => s.docs.places?.working) as PlacesDoc | null | undefined
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const data = doc.working as CollectionsDoc
  const publishedIds = new Set(((doc.published as CollectionsDoc | null)?.collections ?? []).map((c) => c.id))
  const err = (path: string) => errorAt(doc.errors, path)
  const set = (collections: CollectionEntry[]) => edit('collections', { ...data, collections })
  const othersThan = (index: number) => new Set(data.collections.filter((_, i) => i !== index).map((c) => c.id))

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Collections</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">In the order the menu, the shop and the Home page's rail show them.</p>
        <ListEditor
          items={data.collections}
          onChange={set}
          blank={() => blankCollection(new Set([...data.collections.map((c) => c.id), ...publishedIds]))}
          addLabel="Add a collection"
          itemLabel={(c) => (c.name ? c.name : 'this collection')}
          canRemove={(c) => collectionInUse(c, products?.products ?? [], places?.places ?? [])}
          disabled={busy}
          render={(c, update, i) => {
            const at = (field: string) => err(`collections.${i}.${field}`)
            return (
              <>
                <div>
                  <TextField
                    label="Name"
                    value={c.name}
                    onChange={(name) => update(renameCollection(c, name, publishedIds, othersThan(i)))}
                    error={at('name')}
                    disabled={busy}
                  />
                  <p className="mt-1 text-xs text-smoke">Address: /shop?collection={c.id}</p>
                  <p className="text-xs text-smoke">Made from the name. It stays the same once the collection is published.</p>
                  {at('id') && <p className={`mt-1 text-xs ${danger}`}>{at('id')}</p>}
                </div>
                <TextField
                  label="Tagline"
                  hint="Under its name in the menu, and on its card on the Home page."
                  value={c.tagline}
                  onChange={(tagline) => update({ ...c, tagline })}
                  error={at('tagline')}
                  disabled={busy}
                />
                <TextArea
                  label="On the Home page"
                  hint="The words on its card in the Home page's collection rail."
                  value={c.description}
                  onChange={(description) => update({ ...c, description })}
                  error={at('description')}
                  disabled={busy}
                />
                <TextArea
                  label="In the shop"
                  hint="Under the title when the shop shows this collection."
                  value={c.intro}
                  onChange={(intro) => update({ ...c, intro })}
                  error={at('intro')}
                  disabled={busy}
                />
                <div>
                  <Select
                    label="Colour"
                    value={c.accent}
                    options={ACCENT_KEYS.map((key) => ({ value: key, label: key[0].toUpperCase() + key.slice(1) }))}
                    onChange={(key) => update({ ...c, accent: key as CollectionEntry['accent'] })}
                    error={at('accent')}
                    disabled={busy}
                  />
                  <span className="mt-2 inline-block h-4 w-10 rounded-sm" style={{ background: accents[c.accent]?.hex }} aria-hidden />
                </div>
                <PhotoField
                  kind="collection"
                  label="Cover photo"
                  value={c.image || undefined}
                  onChange={(image) => update({ ...c, image: image ?? '' })}
                  disabled={busy}
                />
                {at('image') && <p className={`text-xs ${danger}`}>{at('image')}</p>}
              </>
            )
          }}
        />
      </section>

      <PublishBar docs={['collections']} previewPath="/shop" />
    </div>
  )
}
