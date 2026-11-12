import { create } from 'zustand'
import type { DocKey } from '../../api/_lib/content/keys'
import {
  ApiError, adminContentState, adminDeployStatus, adminDiscardDraft, adminPublish, adminRestore, adminSaveDraft,
  type ContentIssue,
} from '../lib/api'

/**
 * The dashboard's working copy of every editable document.
 *
 * Edits land here at once and are saved as a draft after 800 ms of quiet, so a
 * closed tab loses nothing. The server checks each draft against its schema as
 * it saves and sends the problems back, which is what blocks Publish; the
 * dashboard does not need a copy of the schemas.
 *
 * Publishing saves anything still waiting, asks for one commit, then watches
 * Vercel's deployment of it until it is live, fails, or five minutes pass.
 * Editing is held while the publish request runs, so nothing typed in that
 * moment is lost when the server clears the drafts it has just published.
 */

const AUTOSAVE_MS = 800
const POLL_MS = 5000
const POLL_LIMIT_MS = 5 * 60 * 1000

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'signed-out'

export interface EditableDoc {
  label: string
  /** What GitHub holds now. */
  published: unknown
  sha: string | null
  /** What the editor shows: the draft, or the published copy when there is none. */
  working: unknown
  draftBase: string | null
  errors: ContentIssue[]
  warnings: string[]
  save: SaveState
  saveMessage?: string
}

export interface Publishing {
  state: 'idle' | 'publishing' | 'deploying' | 'live' | 'failed' | 'conflict'
  commit?: string
  /** The documents this publish (or restore) covers. */
  docs?: DocKey[]
  conflicts?: DocKey[]
  message?: string
}

interface ContentStore {
  status: 'loading' | 'ready' | 'unconfigured' | 'error'
  error?: string
  durable: boolean
  docs: Partial<Record<DocKey, EditableDoc>>
  publishing: Publishing
  load(): Promise<void>
  edit(doc: DocKey, next: unknown): void
  flush(doc: DocKey): Promise<void>
  discard(doc: DocKey): Promise<void>
  publish(docs: DocKey[], overwrite?: DocKey[]): Promise<void>
  /** After a conflict: drop these drafts and show what was published meanwhile. */
  takeTheirs(docs: DocKey[]): Promise<void>
  restore(doc: DocKey, sha: string): Promise<void>
  dismiss(): void
  dirty(): DocKey[]
}

/** Structural equality for JSON values, so key order never reads as a change. */
export function sameContent(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const other = b as unknown[]
    return a.length === other.length && a.every((v, i) => sameContent(v, other[i]))
  }
  const ak = Object.keys(a as object).filter((k) => (a as Record<string, unknown>)[k] !== undefined)
  const bk = Object.keys(b as object).filter((k) => (b as Record<string, unknown>)[k] !== undefined)
  return (
    ak.length === bk.length &&
    ak.every((k) => sameContent((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
  )
}

const timers = new Map<DocKey, ReturnType<typeof setTimeout>>()
let poll: ReturnType<typeof setTimeout> | undefined

const messageOf = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

export const useContent = create<ContentStore>((set, get) => {
  const patchDoc = (doc: DocKey, patch: Partial<EditableDoc>) =>
    set((s) => (s.docs[doc] ? { docs: { ...s.docs, [doc]: { ...s.docs[doc]!, ...patch } } } : s))

  const watchDeploy = (commit: string, docs: DocKey[]) => {
    if (poll) clearTimeout(poll)
    const started = Date.now()
    const tick = async () => {
      let state = 'pending'
      try {
        state = (await adminDeployStatus(commit)).state
      } catch {
        // A missed answer is not a verdict; ask again on the next tick.
      }
      if (get().publishing.commit !== commit) return
      if (state === 'success') {
        set({ publishing: { state: 'live', commit, docs } })
        await get().load()
        return
      }
      if (state === 'failure') {
        set({
          publishing: {
            state: 'failed',
            commit,
            docs,
            message: 'Vercel could not build the site with this change, so the live site is unchanged. Ask the developer to look.',
          },
        })
        return
      }
      if (Date.now() - started >= POLL_LIMIT_MS) {
        set({ publishing: { state: 'failed', commit, docs, message: 'Not live after 5 minutes. The site is unchanged.' } })
        return
      }
      poll = setTimeout(tick, POLL_MS)
    }
    poll = setTimeout(tick, POLL_MS)
  }

  return {
    status: 'loading',
    durable: true,
    docs: {},
    publishing: { state: 'idle' },

    async load() {
      try {
        const state = await adminContentState()
        if (!state.configured) {
          set({ status: 'unconfigured', docs: {}, durable: state.durable })
          return
        }
        const docs: Partial<Record<DocKey, EditableDoc>> = {}
        for (const [key, d] of Object.entries(state.docs) as [DocKey, NonNullable<(typeof state.docs)[DocKey]>][]) {
          docs[key] = {
            label: d.label,
            published: d.published,
            sha: d.sha,
            working: d.draft ?? d.published,
            draftBase: d.draftBase,
            errors: d.errors,
            warnings: d.warnings,
            save: d.draft ? 'saved' : 'idle',
          }
        }
        set({ status: 'ready', docs, durable: state.durable, error: undefined })
      } catch (err) {
        set({ status: 'error', error: messageOf(err, 'The content could not be loaded. Check the connection.') })
      }
    },

    edit(doc, next) {
      if (!get().docs[doc] || get().publishing.state === 'publishing') return
      patchDoc(doc, { working: next, save: 'idle', saveMessage: undefined })
      const pending = timers.get(doc)
      if (pending) clearTimeout(pending)
      timers.set(doc, setTimeout(() => void get().flush(doc), AUTOSAVE_MS))
    },

    async flush(doc) {
      const pending = timers.get(doc)
      if (pending) clearTimeout(pending)
      timers.delete(doc)
      const entry = get().docs[doc]
      if (!entry || (entry.save !== 'idle' && entry.save !== 'error')) return
      const working = entry.working
      patchDoc(doc, { save: 'saving' })
      try {
        if (sameContent(working, entry.published)) {
          // Back to what is published: there is nothing to keep a draft of.
          await adminDiscardDraft(doc)
          patchDoc(doc, { save: 'saved', draftBase: null, errors: [], warnings: [] })
          return
        }
        const res = await adminSaveDraft(doc, working)
        const now = get().docs[doc]
        patchDoc(doc, {
          // A newer edit may have arrived while this one was saving.
          save: now && now.working === working ? 'saved' : 'idle',
          draftBase: res.draft.baseSha,
          errors: res.errors,
          warnings: res.warnings,
        })
      } catch (err) {
        patchDoc(
          doc,
          err instanceof ApiError && err.status === 401
            ? { save: 'signed-out', saveMessage: 'Your session ended. Sign in again in a new tab; nothing here is lost.' }
            : { save: 'error', saveMessage: messageOf(err, 'Not saved yet. Check the connection.') },
        )
      }
    },

    async discard(doc) {
      const pending = timers.get(doc)
      if (pending) clearTimeout(pending)
      timers.delete(doc)
      try {
        await adminDiscardDraft(doc)
        const entry = get().docs[doc]
        if (entry) patchDoc(doc, { working: entry.published, save: 'idle', draftBase: null, errors: [], warnings: [] })
      } catch (err) {
        patchDoc(doc, { saveMessage: messageOf(err, 'Could not discard. Check the connection.') })
      }
    },

    async publish(docs, overwrite = []) {
      set({ publishing: { state: 'publishing', docs } })
      for (const doc of docs) await get().flush(doc)
      const unsaved = docs.filter((d) => {
        const save = get().docs[d]?.save
        return save === 'signed-out' || save === 'error'
      })
      if (unsaved.length) {
        set({ publishing: { state: 'failed', docs, message: 'Some changes are not saved yet, so nothing was published.' } })
        return
      }
      try {
        const { commit } = await adminPublish(docs, overwrite)
        // The server cleared these drafts: what was edited is what is published.
        for (const doc of docs) patchDoc(doc, { published: get().docs[doc]!.working, draftBase: null, save: 'idle' })
        set({ publishing: { state: 'deploying', commit, docs } })
        watchDeploy(commit, docs)
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          const conflicts = (err.detail as { conflicts?: DocKey[] } | undefined)?.conflicts ?? []
          set({ publishing: { state: 'conflict', docs, conflicts, message: err.message } })
          return
        }
        if (err instanceof ApiError && err.status === 400) {
          const errors = (err.detail as { errors?: Partial<Record<DocKey, ContentIssue[]>> } | undefined)?.errors
          for (const [doc, issues] of Object.entries(errors ?? {}) as [DocKey, ContentIssue[]][]) patchDoc(doc, { errors: issues })
        }
        set({ publishing: { state: 'failed', docs, message: messageOf(err, 'Publishing failed. Check the connection and try again.') } })
      }
    },

    async takeTheirs(docs) {
      for (const doc of docs) await get().discard(doc)
      set({ publishing: { state: 'idle' } })
      await get().load()
    },

    async restore(doc, sha) {
      set({ publishing: { state: 'publishing', docs: [doc] } })
      try {
        const { commit } = await adminRestore(doc, sha)
        await get().load()
        set({ publishing: { state: 'deploying', commit, docs: [doc] } })
        watchDeploy(commit, [doc])
      } catch (err) {
        set({ publishing: { state: 'failed', docs: [doc], message: messageOf(err, 'The restore failed. Check the connection and try again.') } })
      }
    },

    dismiss() {
      if (poll) clearTimeout(poll)
      set({ publishing: { state: 'idle' } })
    },

    dirty() {
      const { docs } = get()
      return (Object.keys(docs) as DocKey[]).filter((d) => !sameContent(docs[d]!.working, docs[d]!.published))
    },
  }
})
