import type { CollectionsDoc, ProductEntry } from '../../api/_lib/content/schema'
import { collections as publishedCollections } from '../data/collections'
import { moodList } from '../data/products'
import { accents } from '../lib/accents'
import { setOptional } from './blocks'
import { LinesField, ListEditor, NumberField, Select, TextArea, TextField } from './fields'
import PhotoField from './PhotoField'
import { renameProduct } from './products'
import { useContent } from './contentStore'
import { danger, panel, small } from './styles'

type Err = (path: string) => string | undefined
type Variant = NonNullable<ProductEntry['variants']>[number]
type Notes = ProductEntry['notes']

const AUDIENCES: ProductEntry['audience'][] = ['For Her', 'For Him', 'Unisex']
const ACCENT_KEYS = Object.keys(accents) as ProductEntry['accent'][]

/** The first message for a list of lines: the list itself, or one of its lines. */
const linesError = (err: Err, path: string, count: number) =>
  err(path) ?? Array.from({ length: count }, (_, k) => err(`${path}.${k}`)).find(Boolean)

/**
 * Everything a product's page and tile show, for one product: its name and
 * place in the shop, its price while it is new, its words, what is in the
 * box, its notes, its six photos and, for a set, each fragrance in it.
 */
export default function ProductForm({
  product, published, publishedIds, taken, onChange, err, busy,
}: {
  product: ProductEntry
  /** On the site already: its address is fixed, and its price lives in the price table. */
  published: boolean
  publishedIds: Set<string>
  /** Every other product's address. */
  taken: Set<string>
  onChange: (next: ProductEntry) => void
  /** The message for a path inside this product, such as `notes.top` or `variants.0.radar`. */
  err: Err
  busy: boolean
}) {
  const set = <K extends keyof ProductEntry>(key: K, value: ProductEntry[K]) => onChange({ ...product, [key]: value })
  // The collections as the team is editing them, so a new one can take products before it is published.
  const working = useContent((s) => s.docs.collections?.working) as CollectionsDoc | undefined
  const collections = working?.collections ?? publishedCollections
  const photo = (key: 'image' | 'hoverImage' | 'box' | 'included' | 'radar') => (path: string | undefined) =>
    set(key, path ?? '')

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">{product.name || 'New product'}</h2>
        <div className="mt-5 space-y-5">
          <div>
            <TextField
              label="Name"
              value={product.name}
              onChange={(name) => onChange(renameProduct(product, name, publishedIds, taken))}
              error={err('name')}
              disabled={busy}
            />
            <p className="mt-1 text-xs text-smoke">Address: /product/{product.id}</p>
            <p className="text-xs text-smoke">Made from the name. It stays the same once the product is published.</p>
            {err('id') && <p className={`mt-1 text-xs ${danger}`}>{err('id')}</p>}
          </div>
          <TextField label="Subtitle" value={product.subtitle} onChange={(v) => set('subtitle', v)} error={err('subtitle')} disabled={busy} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Collection"
              value={product.collectionId}
              options={collections.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(id) => {
                const chosen = collections.find((c) => c.id === id)
                if (chosen) onChange({ ...product, collectionId: chosen.id, collection: chosen.name })
              }}
              error={err('collectionId') ?? err('collection')}
              disabled={busy}
            />
            <TextField label="Scent family" value={product.family} onChange={(v) => set('family', v)} error={err('family')} disabled={busy} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Who it is for"
              value={product.audience}
              options={AUDIENCES.map((a) => ({ value: a, label: a }))}
              onChange={(a) => set('audience', a as ProductEntry['audience'])}
              error={err('audience')}
              disabled={busy}
            />
            <TextField
              label="Size"
              hint="As the page shows it, for example 30ml Eau de Parfum."
              value={product.size}
              onChange={(v) => set('size', v)}
              error={err('size')}
              disabled={busy}
            />
          </div>
          <fieldset>
            <legend className="eyebrow text-smoke">Moods</legend>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {moodList.map((mood) => (
                <label key={mood} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={product.moods.includes(mood)}
                    onChange={(e) =>
                      set('moods', e.target.checked ? moodList.filter((m) => m === mood || product.moods.includes(m)) : product.moods.filter((m) => m !== mood))
                    }
                    disabled={busy}
                  />
                  {mood}
                </label>
              ))}
            </div>
            {err('moods') && <p className={`mt-1 text-xs ${danger}`}>{err('moods')}</p>}
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Select
                label="Colour"
                value={product.accent}
                options={ACCENT_KEYS.map((key) => ({ value: key, label: key[0].toUpperCase() + key.slice(1) }))}
                onChange={(key) => set('accent', key as ProductEntry['accent'])}
                error={err('accent')}
                disabled={busy}
              />
              <span className="mt-2 inline-block h-4 w-10 rounded-sm" style={{ background: accents[product.accent]?.hex }} aria-hidden />
            </div>
            <div>
              <span className="eyebrow text-smoke">Composition band colour (optional)</span>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Composition band colour"
                  value={product.compositionTint ?? '#f4efe6'}
                  onChange={(e) => onChange(setOptional(product, 'compositionTint', e.target.value))}
                  disabled={busy}
                  className="h-8 w-14 cursor-pointer border border-line bg-transparent"
                />
                {product.compositionTint ? (
                  <button type="button" disabled={busy} onClick={() => onChange(setOptional(product, 'compositionTint', ''))} className={small}>
                    Clear
                  </button>
                ) : (
                  <span className="text-xs text-smoke">Left empty, the band uses a wash of the colour.</span>
                )}
              </div>
              {err('compositionTint') && <p className={`mt-1 text-xs ${danger}`}>{err('compositionTint')}</p>}
            </div>
          </div>
          <LinesField
            label="Badges"
            hint="One per line, up to four. They show on the product's tile."
            lines={product.badges}
            onChange={(badges) => set('badges', badges)}
            error={linesError(err, 'badges', product.badges.length)}
            disabled={busy}
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={Boolean(product.gift)}
              onChange={(e) => onChange(setOptional(product, 'gift', e.target.checked))}
              disabled={busy}
            />
            Show under Gifts &amp; Sets
          </label>
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Price</h2>
        {published ? (
          <p className="mt-3 text-sm text-ink-soft">
            RM {product.price}
            {product.compareAt ? `, was RM ${product.compareAt}` : ''}. Change prices in the price table below; they change on the site at once.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <NumberField
              label="Price (RM)"
              hint="Whole ringgit. Checkout charges this once the product is published."
              value={product.price}
              min={1}
              max={10000}
              onChange={(price) => set('price', price)}
              error={err('price')}
              disabled={busy}
            />
            <NumberField
              label="Was price (RM, optional)"
              hint="Shown struck through beside the price."
              value={product.compareAt ?? 0}
              min={1}
              max={10000}
              onChange={(compareAt) => {
                const { compareAt: _old, ...rest } = product
                onChange(compareAt ? { ...rest, compareAt } : rest)
              }}
              error={err('compareAt')}
              disabled={busy}
            />
          </div>
        )}
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">The words</h2>
        <div className="mt-5 space-y-5">
          <TextArea label="Story" value={product.story} onChange={(v) => set('story', v)} error={err('story')} disabled={busy} />
          <TextArea label="Description" rows={5} value={product.description} onChange={(v) => set('description', v)} error={err('description')} disabled={busy} />
          <TextArea
            label="Good to know (optional)"
            hint="Left empty, the page shows the house wording."
            value={product.goodToKnow ?? ''}
            onChange={(v) => onChange(setOptional(product, 'goodToKnow', v))}
            error={err('goodToKnow')}
            disabled={busy}
          />
          <TextArea
            label="Care (optional)"
            hint="Left empty, the page shows the house wording."
            value={product.care ?? ''}
            onChange={(v) => onChange(setOptional(product, 'care', v))}
            error={err('care')}
            disabled={busy}
          />
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">What&apos;s included</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">The first line names the scent and its pour, as on the other products.</p>
        {err('includedItems') && <p className={`mb-3 text-xs ${danger}`}>{err('includedItems')}</p>}
        <ListEditor
          items={product.includedItems}
          onChange={(items) => set('includedItems', items)}
          blank={() => ({ label: '', detail: '' })}
          addLabel="Add a line"
          itemLabel={(item) => (item.label ? `"${item.label}"` : 'this line')}
          disabled={busy}
          render={(item, update, j) => (
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <TextField label="Item" value={item.label} onChange={(label) => update({ ...item, label })} error={err(`includedItems.${j}.label`)} disabled={busy} />
              <TextField label="Detail" value={item.detail} onChange={(detail) => update({ ...item, detail })} error={err(`includedItems.${j}.detail`)} disabled={busy} />
            </div>
          )}
        />
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Notes</h2>
        <div className="mt-5">
          <NotesFields notes={product.notes} onChange={(notes) => set('notes', notes)} err={(p) => err(`notes.${p}`)} disabled={busy} />
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Photos</h2>
        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <Photo kind="productLife" label="Lifestyle photo" value={product.image} onChange={photo('image')} error={err('image')} busy={busy} />
          <Photo kind="productPack" label="Pack cut-out" value={product.hoverImage} onChange={photo('hoverImage')} error={err('hoverImage')} busy={busy} white />
          <Photo kind="productBox" label="Box shot" value={product.box} onChange={photo('box')} error={err('box')} busy={busy} />
          <Photo kind="productIncluded" label="What's included flat-lay" value={product.included} onChange={photo('included')} error={err('included')} busy={busy} />
          <Photo kind="productChart" label="Occasion chart" value={product.radar} onChange={photo('radar')} error={err('radar')} busy={busy} />
          <Photo
            kind="productBloom"
            label="Botanical (optional)"
            value={product.bloom}
            onChange={(path) => onChange(setOptional(product, 'bloom', path))}
            error={err('bloom')}
            busy={busy}
          />
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Fragrances in the box</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">
          Only for sets. Each fragrance gets its own composition band, with its own notes, chart and botanical.
        </p>
        {err('variants') && <p className={`mb-3 text-xs ${danger}`}>{err('variants')}</p>}
        <ListEditor<Variant>
          items={product.variants ?? []}
          onChange={(variants) => {
            const { variants: _old, ...rest } = product
            onChange(variants.length ? { ...rest, variants } : rest)
          }}
          blank={() => ({ name: '', notes: { top: [], heart: [], base: [] }, radar: '' })}
          addLabel="Add a fragrance"
          itemLabel={(v) => (v.name ? v.name : 'this fragrance')}
          disabled={busy}
          render={(v, update, j) => (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Name" value={v.name} onChange={(name) => update({ ...v, name })} error={err(`variants.${j}.name`)} disabled={busy} />
                <TextField
                  label="Scent family (optional)"
                  value={v.family ?? ''}
                  onChange={(family) => update(setOptional(v, 'family', family))}
                  error={err(`variants.${j}.family`)}
                  disabled={busy}
                />
              </div>
              <NotesFields notes={v.notes} onChange={(notes) => update({ ...v, notes })} err={(p) => err(`variants.${j}.notes.${p}`)} disabled={busy} />
              <div className="grid gap-8 lg:grid-cols-2">
                <Photo
                  kind="productChart"
                  label="Occasion chart"
                  value={v.radar}
                  onChange={(path) => update({ ...v, radar: path ?? '' })}
                  error={err(`variants.${j}.radar`)}
                  busy={busy}
                />
                <Photo
                  kind="productBloom"
                  label="Botanical (optional)"
                  value={v.bloom}
                  onChange={(path) => update(setOptional(v, 'bloom', path))}
                  error={err(`variants.${j}.bloom`)}
                  busy={busy}
                />
              </div>
            </>
          )}
        />
      </section>
    </div>
  )
}

/** Top, heart and base notes, one per line each. */
function NotesFields({ notes, onChange, err, disabled }: { notes: Notes; onChange: (next: Notes) => void; err: Err; disabled: boolean }) {
  const tiers = [
    ['top', 'Top notes'],
    ['heart', 'Heart notes'],
    ['base', 'Base notes'],
  ] as const
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {tiers.map(([tier, label]) => (
        <LinesField
          key={tier}
          label={label}
          hint="One per line."
          lines={notes[tier]}
          onChange={(lines) => onChange({ ...notes, [tier]: lines })}
          error={linesError(err, tier, notes[tier].length)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

/** A photo slot with its problem, if it has one. */
function Photo({
  kind, label, value, onChange, error, busy, white,
}: {
  kind: 'productLife' | 'productPack' | 'productBox' | 'productIncluded' | 'productChart' | 'productBloom'
  label: string
  value: string | undefined
  onChange: (path: string | undefined) => void
  error?: string
  busy: boolean
  white?: boolean
}) {
  return (
    <div>
      <PhotoField kind={kind} label={label} value={value || undefined} onChange={onChange} disabled={busy} white={white} />
      {error && <p className={`mt-1 text-xs ${danger}`}>{error}</p>}
    </div>
  )
}
