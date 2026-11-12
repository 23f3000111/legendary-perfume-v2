import type { FaqDoc } from '../../api/_lib/content/schema'
import { useContent } from './contentStore'
import { ContentGate, errorAt, LinesField, ListEditor, TextArea, TextField } from './fields'
import PublishBar from './PublishBar'
import { panel } from './styles'

type FaqItem = FaqDoc['product'][number]

/**
 * The FAQ page (its introduction and its groups of questions) and the short
 * list of questions every product page shows.
 */
export default function FaqEditor() {
  return (
    <ContentGate>
      <Editor />
    </ContentGate>
  )
}

function Editor() {
  const doc = useContent((s) => s.docs.faq)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const faq = doc.working as FaqDoc
  const err = (path: string) => errorAt(doc.errors, path)
  const set = (next: FaqDoc) => edit('faq', next)

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Introduction</h2>
        <div className="mt-4">
          <TextArea
            label="Shown under the page title"
            value={faq.intro}
            onChange={(intro) => set({ ...faq, intro })}
            error={err('intro')}
            disabled={busy}
          />
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Questions on the FAQ page</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">In groups, in the order shown on the page.</p>
        <ListEditor
          items={faq.sections}
          onChange={(sections) => set({ ...faq, sections })}
          blank={() => ({ title: '', items: [{ q: '', a: '' }] })}
          addLabel="Add a group"
          itemLabel={(s) => (s.title ? `the group "${s.title}"` : 'this group')}
          disabled={busy}
          render={(section, update, i) => (
            <>
              <TextField
                label="Group title"
                value={section.title}
                onChange={(title) => update({ ...section, title })}
                error={err(`sections.${i}.title`)}
                disabled={busy}
              />
              <Questions
                items={section.items}
                onChange={(items) => update({ ...section, items })}
                errorFor={(j, f) => err(`sections.${i}.items.${j}.${f}`)}
                disabled={busy}
              />
            </>
          )}
        />
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Questions on every product page</h2>
        <div className="mt-5">
          <Questions
            items={faq.product}
            onChange={(product) => set({ ...faq, product })}
            errorFor={(j, f) => err(`product.${j}.${f}`)}
            disabled={busy}
          />
        </div>
      </section>

      <PublishBar docs={['faq']} previewPath="/faq" />
    </div>
  )
}

function Questions({
  items, onChange, errorFor, disabled,
}: {
  items: FaqItem[]
  onChange: (items: FaqItem[]) => void
  errorFor: (index: number, field: string) => string | undefined
  disabled?: boolean
}) {
  return (
    <ListEditor<FaqItem>
      items={items}
      onChange={onChange}
      blank={() => ({ q: '', a: '' })}
      addLabel="Add a question"
      itemLabel={(item) => (item.q ? `"${item.q}"` : 'this question')}
      disabled={disabled}
      render={(item, update, j) => (
        <>
          <TextField label="Question" value={item.q} onChange={(q) => update({ ...item, q })} error={errorFor(j, 'q')} disabled={disabled} />
          <TextArea label="Answer" value={item.a} onChange={(a) => update({ ...item, a })} error={errorFor(j, 'a')} disabled={disabled} />
          <LinesField
            label="Bullet points under the answer (optional)"
            hint="One per line."
            lines={item.list ?? []}
            onChange={(list) => {
              const { list: _old, ...rest } = item
              update(list.length ? { ...rest, list } : rest)
            }}
            disabled={disabled}
          />
        </>
      )}
    />
  )
}
