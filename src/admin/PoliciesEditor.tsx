import { useState } from 'react'
import type { PoliciesDoc, PolicyEntry } from '../../api/_lib/content/schema'
import BlocksEditor from './BlocksEditor'
import { sameContent, useContent } from './contentStore'
import { ContentGate, errorAt, TextArea, TextField } from './fields'
import { issueCount } from './journal'
import PublishBar from './PublishBar'
import { danger, panel, small } from './styles'

/**
 * The four policy pages: shipping, returns, terms and privacy, one at a time,
 * from the title down to the page itself, written with the journal's blocks.
 *
 * Each page keeps its own address, so the four are never added, removed or
 * reordered here.
 */
export default function PoliciesEditor() {
  return (
    <ContentGate>
      <Editor />
    </ContentGate>
  )
}

function Editor() {
  const doc = useContent((s) => s.docs.policies)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  // The open page, by its address, which never changes.
  const [open, setOpen] = useState<string | null>(null)
  if (!doc) return null
  const data = doc.working as PoliciesDoc
  const live = (doc.published as PoliciesDoc | null)?.policies ?? []
  const set = (index: number, next: PolicyEntry) =>
    edit('policies', { ...data, policies: data.policies.map((p, i) => (i === index ? next : p)) })

  const index = open ? data.policies.findIndex((p) => p.slug === open) : -1
  if (index >= 0) {
    const policy = data.policies[index]
    const err = (path: string) => errorAt(doc.errors, `policies.${index}.${path}`)
    const update = (next: PolicyEntry) => set(index, next)
    return (
      <div className="space-y-8">
        <button type="button" onClick={() => setOpen(null)} className="text-xs text-smoke underline transition hover:text-ink">
          All policies
        </button>
        <section className={panel}>
          <h2 className="font-display text-xl">{policy.title || 'This policy'}</h2>
          <p className="mt-1 text-xs text-smoke">Address: /{policy.slug}</p>
          <div className="mt-5 space-y-5">
            <TextField label="Title" value={policy.title} onChange={(title) => update({ ...policy, title })} error={err('title')} disabled={busy} />
            <TextField
              label="Line above the title"
              value={policy.eyebrow}
              onChange={(eyebrow) => update({ ...policy, eyebrow })}
              error={err('eyebrow')}
              disabled={busy}
            />
            <TextArea label="Introduction" value={policy.intro} onChange={(intro) => update({ ...policy, intro })} error={err('intro')} disabled={busy} />
            <TextField
              label="Last updated"
              hint="As the page shows it, for example August 2026."
              value={policy.updated}
              onChange={(updated) => update({ ...policy, updated })}
              error={err('updated')}
              disabled={busy}
            />
          </div>
        </section>
        <section className={panel}>
          <h2 className="font-display text-xl">The page</h2>
          <div className="mt-5">
            <BlocksEditor
              blocks={policy.body}
              onChange={(body) => update({ ...policy, body })}
              err={(p) => errorAt(doc.errors, p ? `policies.${index}.body.${p}` : `policies.${index}.body`)}
              disabled={busy}
            />
          </div>
        </section>
        <PublishBar docs={['policies']} previewPath={`/${policy.slug}`} />
      </div>
    )
  }

  const listError = errorAt(doc.errors, 'policies')
  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Policies</h2>
        <p className="mt-1 text-xs text-smoke">The customer care pages, each at its own address.</p>
        {listError && <p className={`mt-3 text-xs ${danger}`}>{listError}</p>}
        <ul className="mt-5 divide-y divide-line">
          {data.policies.map((policy, i) => {
            const changed = !sameContent(policy, live.find((p) => p.slug === policy.slug))
            const issues = issueCount(doc.errors, i, 'policies')
            return (
              <li key={policy.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{policy.title || 'Untitled policy'}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-smoke">
                    <span>Last updated · {policy.updated}</span>
                    {changed && <Tag>Changed</Tag>}
                    {issues > 0 && <span className={danger}>Needs attention</span>}
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(policy.slug)} className={small}>
                  Edit
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <PublishBar docs={['policies']} previewPath="/shipping" />
    </div>
  )
}

function Tag({ children }: { children: string }) {
  return <span className="rounded-sm border border-line px-1.5 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-ink-soft">{children}</span>
}
