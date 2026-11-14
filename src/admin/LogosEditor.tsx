import type { LogoEntry, PartnersDoc, SellersDoc } from '../../api/_lib/content/schema'
import { setOptional } from './blocks'
import { useContent } from './contentStore'
import { errorAt, ListEditor, Select, TextField } from './fields'
import PhotoField from './PhotoField'
import PublishBar from './PublishBar'
import { moveLogo } from './site'
import { danger, panel } from './styles'

type Err = (path: string) => string | undefined

/** Past this many, a partner row wraps onto a second line on a wide screen. */
const ROW_FITS = 6

const blankLogo = (): LogoEntry => ({ name: '', logo: '', mono: '' })

/**
 * A logo wall: Partnered With on the Home page, kept row by row as the client
 * drew it, or Trusted Sellers on the Stores page. Each logo is uploaded once;
 * the dashboard makes its colour print and the black and white one the wall
 * rests in.
 */
export default function LogosEditor({ wall }: { wall: 'partners' | 'sellers' }) {
  return wall === 'partners' ? <Partners /> : <Sellers />
}

function Partners() {
  const doc = useContent((s) => s.docs.partners)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const data = doc.working as PartnersDoc
  const err = (path: string) => errorAt(doc.errors, path)
  const setRows = (rows: PartnersDoc['rows']) => edit('partners', { ...data, rows })

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Partner logos</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">The Partnered With wall on the Home page, row by row as a wide screen shows it.</p>
        <ListEditor
          items={data.rows}
          onChange={setRows}
          blank={() => ({ logos: [] })}
          addLabel="Add a row"
          itemLabel={(_, i) => `Row ${i + 1}`}
          canRemove={(row, i) => (row.logos.length ? `Row ${i + 1} still has logos. Move or remove them first.` : null)}
          disabled={busy}
          render={(row, update, i) => (
            <>
              {row.logos.length > ROW_FITS && (
                <p className="text-xs text-gold-deep">Six fit across a wide screen; more wrap onto a second line.</p>
              )}
              {err(`rows.${i}.logos`) && <p className={`text-xs ${danger}`}>{err(`rows.${i}.logos`)}</p>}
              <ListEditor
                items={row.logos}
                onChange={(logos) => update({ ...row, logos })}
                blank={blankLogo}
                addLabel="Add a logo"
                itemLabel={(logo) => (logo.name ? logo.name : 'this logo')}
                disabled={busy}
                render={(logo, updateLogo, j) => (
                  <LogoFields
                    logo={logo}
                    onChange={updateLogo}
                    err={(field) => err(`rows.${i}.logos.${j}.${field}`)}
                    busy={busy}
                    row={{ index: i, count: data.rows.length, move: (to) => setRows(moveLogo(data.rows, { row: i, index: j }, to)) }}
                  />
                )}
              />
            </>
          )}
        />
      </section>

      <PublishBar docs={['partners']} previewPath="/" />
    </div>
  )
}

function Sellers() {
  const doc = useContent((s) => s.docs.sellers)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const data = doc.working as SellersDoc
  const err = (path: string) => errorAt(doc.errors, path)

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Trusted sellers</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">The Trusted Sellers wall on the Stores page, in order.</p>
        <ListEditor
          items={data.logos}
          onChange={(logos) => edit('sellers', { ...data, logos })}
          blank={blankLogo}
          addLabel="Add a logo"
          itemLabel={(logo) => (logo.name ? logo.name : 'this logo')}
          disabled={busy}
          render={(logo, update, i) => (
            <LogoFields logo={logo} onChange={update} err={(field) => err(`logos.${i}.${field}`)} busy={busy} />
          )}
        />
      </section>

      <PublishBar docs={['sellers']} previewPath="/stores" />
    </div>
  )
}

/** One logo: its name, its two prints from one upload, its height, and on the partner wall its row. */
function LogoFields({
  logo, onChange, err, busy, row,
}: {
  logo: LogoEntry
  onChange: (next: LogoEntry) => void
  err: Err
  busy: boolean
  row?: { index: number; count: number; move: (to: number) => void }
}) {
  const photoError = err('logo') ?? err('mono')
  return (
    <>
      <TextField
        label="Name"
        hint="For anyone who cannot see the logo."
        value={logo.name}
        onChange={(name) => onChange({ ...logo, name })}
        error={err('name')}
        disabled={busy}
      />
      <div>
        <PhotoField
          kind="logo"
          value={logo.logo || undefined}
          onChange={(path, mono) => onChange({ ...logo, logo: path ?? '', mono: path ? mono ?? path : '' })}
          disabled={busy}
        />
        {photoError && <p className={`mt-1 text-xs ${danger}`}>{photoError}</p>}
      </div>
      <label className="flex items-center gap-2 text-xs text-ink-soft">
        <input
          type="checkbox"
          checked={Boolean(logo.tall)}
          onChange={(e) => onChange(setOptional(logo, 'tall', e.target.checked))}
          disabled={busy}
        />
        An upright or square mark: give it more height
      </label>
      {row && row.count > 1 && (
        <Select
          label="Row"
          value={String(row.index)}
          options={Array.from({ length: row.count }, (_, k) => ({ value: String(k), label: `Row ${k + 1}` }))}
          onChange={(v) => row.move(Number(v))}
          disabled={busy}
        />
      )}
    </>
  )
}
