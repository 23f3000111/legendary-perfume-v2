import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { ContentIssue } from '../lib/api'
import { useContent } from './contentStore'
import { danger, field, small } from './styles'
import { hasLongDash, replaceLongDashes } from './text'

/**
 * The pieces every content editor is built from: plain text fields, lines,
 * lists that can be added to, reordered and trimmed, and the notes under a
 * field (a problem to fix, or a long dash house style would avoid).
 */

/** The message for one field, from the server's check of the draft. */
export const errorAt = (errors: ContentIssue[], path: string) => errors.find((e) => e.path === path)?.message

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  disabled?: boolean
}

function Notes({ value, onChange, error, hint, disabled }: Omit<FieldProps, 'label'>) {
  return (
    <>
      {error && <p className={`mt-1 text-xs ${danger}`}>{error}</p>}
      {hasLongDash(value) && (
        <p className="mt-1 text-xs text-gold-deep">
          House style avoids long dashes.{' '}
          <button type="button" disabled={disabled} onClick={() => onChange(replaceLongDashes(value))} className="underline">
            Use a comma
          </button>
        </p>
      )}
      {hint && !error && <p className="mt-1 text-xs text-smoke">{hint}</p>}
    </>
  )
}

export function TextField(props: FieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-smoke">{props.label}</label>
      <input
        id={id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        className={`${field} ${props.error ? 'border-[#A4352C]' : ''}`}
      />
      <Notes {...props} />
    </div>
  )
}

export function TextArea({ rows = 3, ...props }: FieldProps & { rows?: number }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-smoke">{props.label}</label>
      <textarea
        id={id}
        rows={rows}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        className={`${field} resize-y leading-relaxed ${props.error ? 'border-[#A4352C]' : ''}`}
      />
      <Notes {...props} />
    </div>
  )
}

/** A whole number, such as minutes. An emptied box reads as 0, which the schema then asks to fill. */
export function NumberField({
  label, value, onChange, min, max, error, hint, disabled,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  error?: string
  hint?: string
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-smoke">{label}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        step={1}
        min={min}
        max={max}
        value={value ? String(value) : ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        disabled={disabled}
        className={`${field} ${error ? 'border-[#A4352C]' : ''}`}
      />
      {error && <p className={`mt-1 text-xs ${danger}`}>{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-smoke">{hint}</p>}
    </div>
  )
}

/** A day, as YYYY-MM-DD, with the browser's own date picker. */
export function DateField({
  label, value, onChange, error, disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-smoke">{label}</label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${field} ${error ? 'border-[#A4352C]' : ''}`}
      />
      {error && <p className={`mt-1 text-xs ${danger}`}>{error}</p>}
    </div>
  )
}

/**
 * One item per line, such as opening hours or a bulleted list. Blank lines are
 * left out of what is saved, but the box keeps what is typed, so pressing
 * Enter for a new line does not snap back.
 */
export function LinesField({
  label, lines, onChange, error, hint, disabled,
}: {
  label: string
  lines: string[]
  onChange: (lines: string[]) => void
  error?: string
  hint?: string
  disabled?: boolean
}) {
  const id = useId()
  const [text, setText] = useState(lines.join('\n'))
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(lines.join('\n'))
  }, [lines])
  const update = (value: string) => {
    setText(value)
    onChange(value.split('\n').map((l) => l.trim()).filter(Boolean))
  }
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-smoke">{label}</label>
      <textarea
        id={id}
        rows={Math.max(2, Math.min(6, lines.length + 1))}
        value={text}
        onFocus={() => { focused.current = true }}
        onBlur={() => { focused.current = false; setText(lines.join('\n')) }}
        onChange={(e) => update(e.target.value)}
        disabled={disabled}
        className={`${field} resize-y leading-relaxed ${error ? 'border-[#A4352C]' : ''}`}
      />
      <Notes value={text} onChange={update} error={error} hint={hint} disabled={disabled} />
    </div>
  )
}

/**
 * A list the team can add to, reorder and trim. `canRemove` returns why an
 * item must stay, when it must.
 */
export function ListEditor<T>({
  items, onChange, render, blank, addLabel, itemLabel, canRemove, disabled,
}: {
  items: T[]
  onChange: (next: T[]) => void
  render: (item: T, update: (next: T) => void, index: number) => ReactNode
  blank: () => T
  addLabel: string
  itemLabel: (item: T, index: number) => string
  canRemove?: (item: T, index: number) => string | null
  disabled?: boolean
}) {
  const move = (from: number, to: number) => {
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  const remove = (index: number) => {
    const reason = canRemove?.(items[index], index)
    if (reason) {
      window.alert(reason)
      return
    }
    if (!window.confirm(`Remove ${itemLabel(items[index], index)}?`)) return
    onChange(items.filter((_, i) => i !== index))
  }
  const control = 'text-xs text-smoke transition hover:text-ink disabled:opacity-30'
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-sm border border-line bg-porcelain/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="truncate text-xs text-smoke">{itemLabel(item, index)}</span>
            <div className="flex shrink-0 gap-3">
              <button type="button" disabled={disabled || index === 0} onClick={() => move(index, index - 1)} className={control}>
                Move up
              </button>
              <button type="button" disabled={disabled || index === items.length - 1} onClick={() => move(index, index + 1)} className={control}>
                Move down
              </button>
              <button type="button" disabled={disabled} onClick={() => remove(index)} className={`${control} hover:text-[#A4352C]`}>
                Remove
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {render(item, (next) => onChange(items.map((x, i) => (i === index ? next : x))), index)}
          </div>
        </div>
      ))}
      <button type="button" disabled={disabled} onClick={() => onChange([...items, blank()])} className={small}>
        {addLabel}
      </button>
    </div>
  )
}

/** What an editing tab shows before its document is ready. */
export function ContentGate({ children }: { children: ReactNode }) {
  const status = useContent((s) => s.status)
  const error = useContent((s) => s.error)
  if (status === 'loading') return <p className="py-16 text-center text-sm text-smoke">Reading the content…</p>
  if (status === 'error') return <p className={`py-16 text-center text-sm ${danger}`}>{error}</p>
  if (status === 'unconfigured') {
    return (
      <p className="py-16 text-center text-sm text-smoke">
        Publishing is not set up yet. Add <code>GITHUB_TOKEN</code> and <code>GITHUB_REPO</code> in Vercel and redeploy.
      </p>
    )
  }
  return <>{children}</>
}

/** A labelled select, in the dashboard's field style. */
export function Select({
  label, value, options, onChange, error, disabled,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}) {
  const id = useId()
  const known = options.some((o) => o.value === value)
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-smoke">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={field}>
        {!known && <option value={value}>{value || 'Choose one'}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className={`mt-1 text-xs ${danger}`}>{error}</p>}
    </div>
  )
}
