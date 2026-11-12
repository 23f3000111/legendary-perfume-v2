import type { DocKey } from '../../api/_lib/content/keys'
import { useContent } from './contentStore'
import { danger, primary, small } from './styles'

/**
 * The foot of every editing tab: what is unpublished, Preview, Publish and
 * Discard, and how a publish is going.
 *
 * Publish stays off while a document has a problem to fix or could not be
 * saved. A conflict (someone changed the same document since editing began)
 * opens a choice rather than overwriting anything.
 */
export default function PublishBar({ docs, previewPath }: { docs: DocKey[]; previewPath: string }) {
  const state = useContent()
  const { publishing } = state
  const dirty = state.dirty().filter((d) => docs.includes(d))
  const mine = (publishing.docs ?? []).some((d) => docs.includes(d))
  const showStatus = mine && publishing.state !== 'idle'
  if (dirty.length === 0 && !showStatus) return null

  const busy = publishing.state === 'publishing'
  const hasProblems = dirty.some((d) => (state.docs[d]?.errors.length ?? 0) > 0)
  const unsaved = dirty.some((d) => state.docs[d]?.save === 'signed-out' || state.docs[d]?.save === 'error')
  const labels = (list: DocKey[]) => list.map((d) => state.docs[d]?.label ?? d).join(', ')

  const preview = async () => {
    // Opened at once, inside the click, so no pop-up blocker objects; pointed
    // at the page once the latest edits are saved.
    const tab = window.open('', '_blank')
    for (const d of dirty) await state.flush(d)
    if (tab) tab.location.href = `${previewPath}?preview`
  }

  const discard = async () => {
    if (!window.confirm(`Discard your unpublished changes to ${labels(dirty)}? This cannot be undone.`)) return
    for (const d of dirty) await state.discard(d)
  }

  return (
    <>
      <div className="sticky bottom-0 z-20 -mx-5 mt-10 border-t border-line bg-ivory/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-14 lg:px-14">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 text-sm" aria-live="polite">
            {busy ? (
              <span className="text-ink">Publishing…</span>
            ) : showStatus && publishing.state === 'deploying' ? (
              <span className="text-ink">Published. The site updates in about a minute…</span>
            ) : showStatus && publishing.state === 'live' ? (
              <span className="text-jade">Live. The site shows your changes.</span>
            ) : showStatus && publishing.state === 'failed' ? (
              <span className={danger}>{publishing.message}</span>
            ) : (
              <span className="text-ink-soft">
                Unpublished changes: <span className="text-ink">{labels(dirty)}</span>
                <SaveNote docs={dirty} />
              </span>
            )}
            {hasProblems && !busy && (
              <span className={`mt-1 block text-xs ${danger}`}>Fix the fields marked in red before publishing.</span>
            )}
          </div>
          {showStatus && ['live', 'failed'].includes(publishing.state) && (
            <button onClick={state.dismiss} className={small}>OK</button>
          )}
          {dirty.length > 0 && (
            <>
              <button onClick={preview} disabled={busy} className={small}>Preview</button>
              <button onClick={discard} disabled={busy} className={small}>Discard</button>
              <button
                onClick={() => void state.publish(dirty)}
                disabled={busy || hasProblems || unsaved}
                className={primary}
              >
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      {publishing.state === 'conflict' && mine && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-5">
          <div className="w-full max-w-md rounded-sm border border-line bg-ivory p-6 shadow-xl">
            <h2 className="font-display text-xl">Someone else changed this</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {labels(publishing.conflicts ?? [])} changed on the site after you started editing. You can publish
              your version over it, or drop your changes and see the newer one.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={() => void state.takeTheirs(publishing.conflicts ?? [])} className={small}>
                Take the newer one
              </button>
              <button onClick={() => void state.publish(publishing.docs ?? [], publishing.conflicts ?? [])} className={primary}>
                Keep mine
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SaveNote({ docs }: { docs: DocKey[] }) {
  const all = useContent((s) => s.docs)
  const states = docs.map((d) => all[d]?.save)
  const message = docs.map((d) => all[d]?.saveMessage).find(Boolean)
  if (states.includes('signed-out') || states.includes('error')) {
    return <span className={`ml-2 text-xs ${danger}`}>{message}</span>
  }
  if (states.includes('saving') || states.includes('idle')) return <span className="ml-2 text-xs text-smoke">Saving…</span>
  return <span className="ml-2 text-xs text-smoke">Saved as a draft</span>
}
