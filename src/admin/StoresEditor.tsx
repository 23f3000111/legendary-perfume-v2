import { useId } from 'react'
import type { StoresDoc } from '../../api/_lib/content/schema'
import { useContent } from './contentStore'
import { ContentGate, errorAt, LinesField, ListEditor, TextArea, TextField } from './fields'
import PhotoField from './PhotoField'
import PublishBar from './PublishBar'
import { danger, field, panel } from './styles'
import { newId } from './text'

type Store = StoresDoc['stores'][number]

/**
 * The store locator: the region tabs, in order, and every counter with its
 * address, opening hours, map search and photo.
 *
 * A store's id goes into the map and the page's anchors, so it is made from
 * the name while the store is new and fixed once it has been published.
 */
export default function StoresEditor() {
  return (
    <ContentGate>
      <Editor />
    </ContentGate>
  )
}

function Editor() {
  const doc = useContent((s) => s.docs.stores)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const data = doc.working as StoresDoc
  const publishedIds = new Set(((doc.published as StoresDoc | null)?.stores ?? []).map((s) => s.id))
  const err = (path: string) => errorAt(doc.errors, path)
  const set = (next: StoresDoc) => edit('stores', next)

  const rename = (store: Store, index: number, name: string): Store => {
    if (publishedIds.has(store.id) && store.id) return { ...store, name }
    const taken = new Set(data.stores.filter((_, i) => i !== index).map((s) => s.id))
    return { ...store, name, id: newId(name, taken) }
  }

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Regions</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">The filter tabs on the Stores page, in order. The page adds "All" in front.</p>
        <ListEditor
          items={data.regions}
          onChange={(regions) => set({ ...data, regions })}
          blank={() => ''}
          addLabel="Add a region"
          itemLabel={(r) => (r ? `the region "${r}"` : 'this region')}
          canRemove={(r) => {
            const using = data.stores.filter((s) => s.region === r)
            return using.length
              ? `${using.map((s) => s.name).join(', ')} ${using.length > 1 ? 'are' : 'is'} in ${r}. Move ${using.length > 1 ? 'them' : 'it'} to another region first.`
              : null
          }}
          disabled={busy}
          render={(region, update, i) => (
            <TextField
              label="Region name"
              value={region}
              onChange={(next) => {
                // Stores in this region follow it when it is renamed.
                set({
                  ...data,
                  regions: data.regions.map((r, j) => (j === i ? next : r)),
                  stores: data.stores.map((s) => (s.region === region ? { ...s, region: next } : s)),
                })
              }}
              error={err(`regions.${i}`)}
              disabled={busy}
            />
          )}
        />
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Stores</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">In the order the Stores page lists them.</p>
        <ListEditor
          items={data.stores}
          onChange={(stores) => set({ ...data, stores })}
          blank={() => ({ id: '', name: '', region: data.regions[0] ?? '', address: '', phone: '', hours: [], mapQuery: '' })}
          addLabel="Add a store"
          itemLabel={(s) => (s.name ? s.name : 'this store')}
          disabled={busy}
          render={(store, update, i) => (
            <>
              <TextField
                label="Name"
                value={store.name}
                onChange={(name) => update(rename(store, i, name))}
                error={err(`stores.${i}.name`) ?? err(`stores.${i}.id`)}
                disabled={busy}
              />
              <RegionSelect
                value={store.region}
                regions={data.regions}
                onChange={(region) => update({ ...store, region })}
                error={err(`stores.${i}.region`)}
                disabled={busy}
              />
              <TextArea
                label="Address"
                rows={2}
                value={store.address}
                onChange={(address) => update({ ...store, address })}
                error={err(`stores.${i}.address`)}
                disabled={busy}
              />
              <TextField
                label="Phone"
                value={store.phone}
                onChange={(phone) => update({ ...store, phone })}
                error={err(`stores.${i}.phone`)}
                disabled={busy}
              />
              <LinesField
                label="Opening hours"
                hint="One line each, for example: Daily · 10:00 to 22:00"
                lines={store.hours}
                onChange={(hours) => update({ ...store, hours })}
                error={err(`stores.${i}.hours`)}
                disabled={busy}
              />
              <TextField
                label="Map search"
                hint="What Google Maps is asked to find, for the map and Get directions."
                value={store.mapQuery}
                onChange={(mapQuery) => update({ ...store, mapQuery })}
                error={err(`stores.${i}.mapQuery`)}
                disabled={busy}
              />
              <PhotoField
                kind="store"
                value={store.image}
                onChange={(image) => {
                  const { image: _old, ...rest } = store
                  update(image ? { ...rest, image } : rest)
                }}
                disabled={busy}
              />
              {err(`stores.${i}.image`) && <p className={`text-xs ${danger}`}>{err(`stores.${i}.image`)}</p>}
            </>
          )}
        />
      </section>

      <PublishBar docs={['stores']} previewPath="/stores" />
    </div>
  )
}

function RegionSelect({
  value, regions, onChange, error, disabled,
}: {
  value: string
  regions: string[]
  onChange: (region: string) => void
  error?: string
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-smoke">Region</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={field}>
        {!regions.includes(value) && <option value={value}>{value || 'Choose a region'}</option>}
        {regions.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {error && <p className={`mt-1 text-xs ${danger}`}>{error}</p>}
    </div>
  )
}
