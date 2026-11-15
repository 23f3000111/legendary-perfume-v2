import { useState } from 'react'
import type { PagesDoc } from '../../api/_lib/content/schema'
import { sameContent, useContent } from './contentStore'
import { ContentGate, errorAt, LinesField, NumberField, TextArea, TextField } from './fields'
import { getAt, PAGE_SPECS, setAt, type PageField } from './pages'
import PhotoField from './PhotoField'
import PublishBar from './PublishBar'
import { danger, panel, small } from './styles'

/**
 * The Pages tab: every page's own words, one page at a time, its sections in
 * page order. The lists those pages show (collections, reviews, the journey,
 * the logos and the map) are edited on the Site tab.
 */
export default function PagesEditor() {
  return (
    <ContentGate>
      <Editor />
    </ContentGate>
  )
}

function Editor() {
  const doc = useContent((s) => s.docs.pages)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  const [open, setOpen] = useState<string | null>(null)
  if (!doc) return null
  const data = doc.working as PagesDoc
  const live = doc.published as PagesDoc | null
  const spec = PAGE_SPECS.find((p) => p.key === open)

  if (spec) {
    const set = (path: string, value: unknown) => edit('pages', setAt(data, path, value))
    return (
      <div className="space-y-8">
        <button type="button" onClick={() => setOpen(null)} className="text-xs text-smoke underline transition hover:text-ink">
          All pages
        </button>
        <h2 className="font-display text-2xl">{spec.title}</h2>
        {spec.sections.map((section) => (
          <section key={section.title} className={panel}>
            <h3 className="font-display text-xl">
              {spec.title} · {section.title}
            </h3>
            <div className="mt-5 space-y-5">
              {section.fields.map((f) => (
                <Field
                  key={f.path}
                  field={f}
                  value={getAt(data, f.path)}
                  onChange={(value) => set(f.path, value)}
                  error={errorAt(doc.errors, f.path)}
                  busy={busy}
                />
              ))}
            </div>
          </section>
        ))}
        <PublishBar docs={['pages']} previewPath={spec.preview} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Pages</h2>
        <p className="mt-1 text-xs text-smoke">
          Each page's own words, in page order. The lists on them (collections, reviews, the journey, the logos and the
          map) are on the Site tab.
        </p>
        <ul className="mt-5 divide-y divide-line">
          {PAGE_SPECS.map((p) => {
            const changed = !sameContent((data as Record<string, unknown>)[p.key], (live as Record<string, unknown> | null)?.[p.key])
            const issues = doc.errors.filter((e) => e.path === p.key || e.path.startsWith(`${p.key}.`)).length
            return (
              <li key={p.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink">
                  {p.title}
                  {changed && <Tag>Changed</Tag>}
                  {issues > 0 && <span className={`text-xs ${danger}`}>Needs attention</span>}
                </p>
                <button type="button" onClick={() => setOpen(p.key)} className={small}>
                  Edit
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <PublishBar docs={['pages']} previewPath="/" />
    </div>
  )
}

/** One field, drawn by its kind. A soft limit adds its warning to the hint; it never stops a publish. */
function Field({
  field, value, onChange, error, busy,
}: {
  field: PageField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  busy: boolean
}) {
  const words = typeof value === 'string' ? value : ''
  const over = field.warnAt !== undefined && words.length > field.warnAt
  const hint = over ? [field.warning, field.hint].filter(Boolean).join(' ') : field.hint
  switch (field.kind) {
    case 'heading':
      return <TextArea label={field.label} rows={2} value={words} onChange={onChange} error={error} hint={hint} disabled={busy} />
    case 'area':
      return <TextArea label={field.label} rows={3} value={words} onChange={onChange} error={error} hint={hint} disabled={busy} />
    case 'paragraphs':
      return <TextArea label={field.label} rows={7} value={words} onChange={onChange} error={error} hint={hint} disabled={busy} />
    case 'lines':
      return (
        <LinesField
          label={field.label}
          lines={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          error={error}
          hint={hint}
          disabled={busy}
        />
      )
    case 'number':
      return <NumberField label={field.label} value={Number(value) || 0} onChange={onChange} error={error} hint={hint} disabled={busy} />
    case 'photo':
      return (
        <div>
          <PhotoField kind="page" label={field.label} value={words || undefined} onChange={(path) => onChange(path ?? '')} disabled={busy} />
          {error && <p className={`mt-1 text-xs ${danger}`}>{error}</p>}
        </div>
      )
    default:
      return <TextField label={field.label} value={words} onChange={onChange} error={error} hint={hint} disabled={busy} />
  }
}

function Tag({ children }: { children: string }) {
  return <span className="rounded-sm border border-line px-1.5 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-ink-soft">{children}</span>
}
