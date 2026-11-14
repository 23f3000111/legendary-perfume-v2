import type { JourneyDoc, MilestoneEntry } from '../../api/_lib/content/schema'
import { setOptional } from './blocks'
import { useContent } from './contentStore'
import { errorAt, ListEditor, TextArea, TextField } from './fields'
import PhotoField from './PhotoField'
import PublishBar from './PublishBar'
import { danger, panel } from './styles'

/** About what a journey card shows of its words before the end is cut off. */
const CARD_CHARACTERS = 200

/**
 * The Our Story journey: each year's title, words and photo, in the order
 * the page's rail shows them.
 */
export default function JourneyEditor() {
  const doc = useContent((s) => s.docs.journey)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const data = doc.working as JourneyDoc
  const err = (path: string) => errorAt(doc.errors, path)
  const nextYear = () => {
    const last = Number(data.milestones.at(-1)?.year)
    return String(Number.isFinite(last) && last > 0 ? last + 1 : new Date().getFullYear())
  }

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Our Story journey</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">The years on the Our Story page, in order.</p>
        <ListEditor
          items={data.milestones}
          onChange={(milestones: MilestoneEntry[]) => edit('journey', { ...data, milestones })}
          blank={(): MilestoneEntry => ({ year: nextYear(), title: '', body: '' })}
          addLabel="Add a year"
          itemLabel={(m) => (m.year ? m.year : 'this year')}
          disabled={busy}
          render={(m, update, i) => {
            const at = (field: string) => err(`milestones.${i}.${field}`)
            return (
              <>
                <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
                  <TextField label="Year" value={m.year} onChange={(year) => update({ ...m, year })} error={at('year')} disabled={busy} />
                  <TextField label="Title" value={m.title} onChange={(title) => update({ ...m, title })} error={at('title')} disabled={busy} />
                </div>
                <TextArea
                  label="Words"
                  hint={
                    m.body.length > CARD_CHARACTERS
                      ? 'Longer than a card shows: the end will be cut off.'
                      : `A card shows about ${CARD_CHARACTERS} characters.`
                  }
                  value={m.body}
                  onChange={(body) => update({ ...m, body })}
                  error={at('body')}
                  disabled={busy}
                />
                <div>
                  <PhotoField
                    kind="journey"
                    label="Photo (optional)"
                    value={m.photo}
                    onChange={(photo) => update(setOptional(m, 'photo', photo))}
                    disabled={busy}
                  />
                  <p className="mt-1 text-xs text-smoke">Left empty, the card shows the house pattern in gold.</p>
                  {at('photo') && <p className={`text-xs ${danger}`}>{at('photo')}</p>}
                </div>
              </>
            )
          }}
        />
      </section>

      <PublishBar docs={['journey']} previewPath="/about" />
    </div>
  )
}
