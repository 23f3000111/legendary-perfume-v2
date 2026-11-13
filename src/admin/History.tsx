import { useCallback, useEffect, useState } from 'react'
import type { DocKey } from '../../api/_lib/content/keys'
import { ApiError, adminHistory, adminVersion, type ContentCommit } from '../lib/api'
import { restoreChanges, titleList } from './changes'
import { useContent } from './contentStore'
import { danger, panel, small } from './styles'

const when = (iso: string, withTime = true) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Asia/Kuala_Lumpur',
  })

/**
 * Every published change to the content, newest first, and the way back.
 *
 * Restore works on one document: putting the FAQ back as it was last week
 * publishes that version of the FAQ as a new change and leaves everything
 * else, including anything published since, as it is.
 */
export default function History() {
  const [commits, setCommits] = useState<ContentCommit[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const docs = useContent((s) => s.docs)
  const restore = useContent((s) => s.restore)
  const publishing = useContent((s) => s.publishing)

  const refresh = useCallback(() => {
    adminHistory()
      .then((r) => setCommits(r.commits))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'The history could not be loaded.'))
  }, [])
  useEffect(refresh, [refresh])
  useEffect(() => {
    if (publishing.state === 'deploying' || publishing.state === 'live') refresh()
  }, [publishing.state, refresh])

  if (error) return <p className={`py-16 text-center text-sm ${danger}`}>{error}</p>
  if (!commits) return <p className="py-16 text-center text-sm text-smoke">Reading the history…</p>

  // The newest version of each document is the one on the site: nothing to restore.
  const current = new Map<DocKey, string>()
  for (const c of commits) for (const d of c.docs) if (!current.has(d)) current.set(d, c.sha)

  const put = async (doc: DocKey, commit: ContentCommit) => {
    const label = docs[doc]?.label ?? doc
    // The Journal holds every article, so a restore can take some off the site
    // and bring others back. Say which before asking.
    let what = ''
    if (doc === 'journal') {
      try {
        const { removed, returned } = restoreChanges(docs[doc]?.published, (await adminVersion(doc, commit.sha)).data)
        if (removed.length) what += ` This takes ${titleList(removed)} off the site.`
        if (returned.length) what += ` It brings back ${titleList(returned)}.`
      } catch {
        // The plain question still stands.
      }
    }
    if (!window.confirm(`Put the ${label} back as it was on ${when(commit.date, false)}?${what}`)) return
    void restore(doc, commit.sha)
  }

  return (
    <section className={panel}>
      <h2 className="font-display text-xl">History</h2>
      <p className="mt-1 text-xs text-smoke">
        Every published change, newest first. Restoring publishes an earlier version of one document as a new change.
      </p>
      {publishing.state === 'failed' && <p className={`mt-4 text-sm ${danger}`}>{publishing.message}</p>}
      <ul className="mt-6 divide-y divide-line">
        {commits.map((c) => (
          <li key={c.sha} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">{c.message.replace(/^Dashboard: /, '')}</p>
              <p className="text-xs text-smoke">{when(c.date)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.docs.map((d) =>
                current.get(d) === c.sha ? (
                  <span key={d} className="rounded-full bg-ink/5 px-3 py-1 text-xs text-ink-soft">
                    {docs[d]?.label ?? d}: on the site
                  </span>
                ) : (
                  <button
                    key={d}
                    onClick={() => void put(d, c)}
                    disabled={publishing.state === 'publishing'}
                    className={small}
                  >
                    Restore {docs[d]?.label ?? d}
                  </button>
                ),
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
