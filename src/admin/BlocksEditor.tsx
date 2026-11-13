import { useId, useState } from 'react'
import type { JournalBlock } from '../../api/_lib/content/schema'
import { BLOCK_LABELS, blankBlock, insertAt, moveItem, setOptional, type BlockType } from './blocks'
import { sameContent } from './contentStore'
import { LinesField, ListEditor, TextArea, TextField } from './fields'
import PhotoField from './PhotoField'
import { danger, small } from './styles'
import TableField from './TableField'

type Err = (path: string) => string | undefined

const control = 'text-xs text-smoke transition hover:text-ink disabled:opacity-30'

/**
 * An article's body: paragraphs, headings, lists, quotes, photos, tables,
 * buttons and questions, in reading order.
 *
 * Any block can be moved or removed, and a new one can go straight after any
 * block ("Add below"), so the middle of a long article is as easy to reach as
 * its end.
 */
export default function BlocksEditor({
  blocks, onChange, err, disabled,
}: {
  blocks: JournalBlock[]
  onChange: (next: JournalBlock[]) => void
  /** The message for a path inside the body, such as `3.text` or `5.rows.1`; `''` is the body itself. */
  err: Err
  disabled?: boolean
}) {
  const [addingAfter, setAddingAfter] = useState<number | null>(null)
  // While a photo is uploading, the blocks hold still, so it lands on the block it was chosen for.
  const [photosAtWork, setPhotosAtWork] = useState(0)
  const onPhotoBusy = (busy: boolean) => setPhotosAtWork((n) => Math.max(0, n + (busy ? 1 : -1)))
  const locked = disabled || photosAtWork > 0
  const set = (index: number, next: JournalBlock) => onChange(blocks.map((b, i) => (i === index ? next : b)))
  const move = (from: number, to: number) => {
    setAddingAfter(null)
    onChange(moveItem(blocks, from, to))
  }
  const remove = (index: number) => {
    const block = blocks[index]
    // A block added a moment ago and left empty goes without a question.
    const untouched = sameContent(block, blankBlock(block.t))
    if (!untouched && !window.confirm(`Remove "${BLOCK_LABELS[block.t]}" from the article?`)) return
    setAddingAfter(null)
    onChange(blocks.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-smoke">Links: [words](/shop) or [words](https://example.com). Bold: **words**.</p>
      {err('') && <p className={`text-xs ${danger}`}>{err('')}</p>}

      {blocks.map((block, i) => (
        <div key={i} className="rounded-sm border border-line bg-porcelain/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-smoke">{BLOCK_LABELS[block.t]}</span>
            <div className="flex shrink-0 gap-3">
              <button type="button" disabled={locked || i === 0} onClick={() => move(i, i - 1)} className={control}>
                Move up
              </button>
              <button type="button" disabled={locked || i === blocks.length - 1} onClick={() => move(i, i + 1)} className={control}>
                Move down
              </button>
              <button type="button" disabled={locked} onClick={() => setAddingAfter(addingAfter === i ? null : i)} className={control}>
                Add below
              </button>
              <button type="button" disabled={locked} onClick={() => remove(i)} className={`${control} hover:text-[#A4352C]`}>
                Remove
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <BlockFields
              block={block}
              onChange={(next) => set(i, next)}
              err={(p) => err(`${i}.${p}`)}
              disabled={disabled}
              onPhotoBusy={onPhotoBusy}
            />
          </div>
          {addingAfter === i && (
            <div className="mt-4 border-t border-line pt-4">
              <AddBlock
                label="Add below this"
                onAdd={(t) => {
                  setAddingAfter(null)
                  onChange(insertAt(blocks, i + 1, blankBlock(t)))
                }}
                disabled={locked}
              />
            </div>
          )}
        </div>
      ))}

      <AddBlock label="Add to the end" onAdd={(t) => onChange([...blocks, blankBlock(t)])} disabled={locked} />
    </div>
  )
}

/** A choice of block, and Add. */
function AddBlock({ label, onAdd, disabled }: { label: string; onAdd: (t: BlockType) => void; disabled?: boolean }) {
  const id = useId()
  const [t, setT] = useState<BlockType>('p')
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="text-xs text-smoke">{label}</label>
      <select
        id={id}
        value={t}
        onChange={(e) => setT(e.target.value as BlockType)}
        disabled={disabled}
        className="border-b border-line bg-transparent py-1 text-sm text-ink outline-none transition focus:border-gold disabled:opacity-60"
      >
        {(Object.keys(BLOCK_LABELS) as BlockType[]).map((key) => (
          <option key={key} value={key}>{BLOCK_LABELS[key]}</option>
        ))}
      </select>
      <button type="button" disabled={disabled} onClick={() => onAdd(t)} className={small}>
        Add
      </button>
    </div>
  )
}

/** The first message for a list of lines: the list itself, or one of its lines. */
const linesError = (err: Err, count: number) =>
  err('items') ?? Array.from({ length: count }, (_, k) => err(`items.${k}`)).find(Boolean)

function BlockFields({
  block, onChange, err, disabled, onPhotoBusy,
}: {
  block: JournalBlock
  onChange: (next: JournalBlock) => void
  err: Err
  disabled?: boolean
  onPhotoBusy: (busy: boolean) => void
}) {
  switch (block.t) {
    case 'p':
    case 'lead':
    case 'tip':
      return (
        <TextArea
          label="Text"
          rows={block.t === 'tip' ? 2 : 4}
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          error={err('text')}
          disabled={disabled}
        />
      )

    case 'h2':
    case 'h3':
      return (
        <TextField label="Heading" value={block.text} onChange={(text) => onChange({ ...block, text })} error={err('text')} disabled={disabled} />
      )

    case 'ul':
    case 'ol':
    case 'refs':
      return (
        <LinesField
          label="Lines"
          hint="One per line."
          lines={block.items}
          onChange={(items) => onChange({ ...block, items })}
          error={linesError(err, block.items.length)}
          disabled={disabled}
        />
      )

    case 'quote':
      return (
        <>
          <TextArea label="Quote" value={block.text} onChange={(text) => onChange({ ...block, text })} error={err('text')} disabled={disabled} />
          <TextField
            label="Who said it (optional)"
            value={block.cite ?? ''}
            onChange={(cite) => onChange(setOptional(block, 'cite', cite))}
            error={err('cite')}
            disabled={disabled}
          />
        </>
      )

    case 'image':
      return (
        <>
          <PhotoField
            kind="journal"
            label="Photo"
            value={block.src || undefined}
            onChange={(src) => onChange({ ...block, src: src ?? '' })}
            disabled={disabled}
            onBusy={onPhotoBusy}
          />
          {err('src') && <p className={`text-xs ${danger}`}>{err('src')}</p>}
          <TextField
            label="Photo description"
            hint="What the photo shows, for anyone who cannot see it."
            value={block.alt}
            onChange={(alt) => onChange({ ...block, alt })}
            error={err('alt')}
            disabled={disabled}
          />
          <TextField
            label="Caption (optional)"
            value={block.caption ?? ''}
            onChange={(caption) => onChange(setOptional(block, 'caption', caption))}
            error={err('caption')}
            disabled={disabled}
          />
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={Boolean(block.narrow)}
              onChange={(e) => onChange(setOptional(block, 'narrow', e.target.checked))}
              disabled={disabled}
            />
            Upright photo, shown narrower
          </label>
        </>
      )

    case 'table':
      return <TableField table={block} onChange={onChange} err={err} disabled={disabled} />

    case 'cta':
      return (
        <>
          <TextField label="Button text" value={block.label} onChange={(label) => onChange({ ...block, label })} error={err('label')} disabled={disabled} />
          <TextField
            label="Goes to"
            hint="An address on this site, such as /stores or /shop?collection=nyonya"
            value={block.to}
            onChange={(to) => onChange({ ...block, to })}
            error={err('to')}
            disabled={disabled}
          />
        </>
      )

    case 'faq':
      return (
        <>
          {err('items') && <p className={`text-xs ${danger}`}>{err('items')}</p>}
          <ListEditor
            items={block.items}
            onChange={(items) => onChange({ ...block, items })}
            blank={() => ({ q: '', a: '' })}
            addLabel="Add a question"
            itemLabel={(item) => (item.q ? `"${item.q}"` : 'this question')}
            disabled={disabled}
            render={(item, update, j) => (
              <>
                <TextField label="Question" value={item.q} onChange={(q) => update({ ...item, q })} error={err(`items.${j}.q`)} disabled={disabled} />
                <TextArea label="Answer" value={item.a} onChange={(a) => update({ ...item, a })} error={err(`items.${j}.a`)} disabled={disabled} />
              </>
            )}
          />
        </>
      )
  }
}
