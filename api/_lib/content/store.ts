import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { db } from '../db.js'
import { optionalEnv } from '../http.js'
import type { DocKey } from './keys.js'
import type { SlotKind } from './slots.js'

/**
 * Where the dashboard keeps work that is not published yet.
 *
 * A draft is a whole document as the Legendary team left it, saved as they
 * type, with the version of the published document it started from. That
 * version is how publishing notices that someone else changed the document in
 * the meantime: see the conflict rule in api/admin/content.ts.
 *
 * Photos are kept here from upload until the publish that first uses them
 * commits them to the repository. Unused uploads are cleared after a month.
 */

export interface Draft {
  doc: DocKey
  data: unknown
  /** The published document's blob sha when the draft began. */
  baseSha: string | null
  updatedAt: string
}

export interface MediaRow {
  /** `m/<hash>.webp` for a library master, `<hash>.webp` for a copy sized for one place. */
  file: string
  bytes: Buffer
  width: number
  height: number
  kind: 'master' | SlotKind
  /** The master a sized copy was made from. */
  source: string | null
  published: boolean
  createdAt: string
}

export type MediaInfo = Omit<MediaRow, 'bytes'>

export interface ContentStore {
  readonly kind: 'postgres' | 'file'
  /** True when drafts outlive this function instance. */
  readonly durable: boolean
  drafts(): Promise<Draft[]>
  /** Upserts the document. The first save sets `baseSha`; later saves keep it. */
  saveDraft(doc: DocKey, data: unknown, baseSha: string | null): Promise<Draft>
  deleteDraft(doc: DocKey): Promise<void>
  /** Saving the same file twice is harmless: files are named by their content. */
  putMedia(row: Omit<MediaRow, 'published' | 'createdAt'>): Promise<void>
  getMedia(file: string): Promise<MediaRow | null>
  listMedia(): Promise<MediaInfo[]>
  markPublished(files: string[]): Promise<void>
  /** Deletes unpublished media older than `days`, returning how many went. */
  purgeStale(days: number): Promise<number>
}

const DAY_MS = 24 * 60 * 60 * 1000

// ------------------------------------------------------------------ postgres

function postgresStore(): ContentStore {
  const draftRow = (r: Record<string, unknown>): Draft => ({
    doc: r.doc as DocKey,
    data: r.data,
    baseSha: (r.base_sha as string | null) ?? null,
    updatedAt: new Date(r.updated_at as string).toISOString(),
  })
  const mediaInfo = (r: Record<string, unknown>): MediaInfo => ({
    file: r.file as string,
    width: r.width as number,
    height: r.height as number,
    kind: r.kind as MediaInfo['kind'],
    source: (r.source as string | null) ?? null,
    published: Boolean(r.published),
    createdAt: new Date(r.created_at as string).toISOString(),
  })

  return {
    kind: 'postgres',
    durable: true,
    async drafts() {
      const { rows } = await (await db()).query('SELECT * FROM content_drafts ORDER BY doc')
      return rows.map(draftRow)
    },
    async saveDraft(doc, data, baseSha) {
      // base_sha is left alone on conflict: it records where the draft began.
      const { rows } = await (await db()).query(
        `INSERT INTO content_drafts (doc, data, base_sha, updated_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (doc) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
         RETURNING *`,
        [doc, JSON.stringify(data), baseSha],
      )
      return draftRow(rows[0])
    },
    async deleteDraft(doc) {
      await (await db()).query('DELETE FROM content_drafts WHERE doc = $1', [doc])
    },
    async putMedia(row) {
      await (await db()).query(
        `INSERT INTO content_media (file, bytes, width, height, kind, source)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (file) DO NOTHING`,
        [row.file, row.bytes, row.width, row.height, row.kind, row.source],
      )
    },
    async getMedia(file) {
      const { rows } = await (await db()).query('SELECT * FROM content_media WHERE file = $1', [file])
      if (!rows[0]) return null
      return { ...mediaInfo(rows[0]), bytes: rows[0].bytes as Buffer }
    },
    async listMedia() {
      const { rows } = await (await db()).query(
        `SELECT file, width, height, kind, source, published, created_at
         FROM content_media ORDER BY created_at DESC`,
      )
      return rows.map(mediaInfo)
    },
    async markPublished(files) {
      if (files.length === 0) return
      await (await db()).query('UPDATE content_media SET published = true WHERE file = ANY($1)', [files])
    },
    async purgeStale(days) {
      const { rowCount } = await (await db()).query(
        `DELETE FROM content_media
         WHERE published = false AND created_at < now() - make_interval(days => $1)`,
        [days],
      )
      return rowCount ?? 0
    },
  }
}

// ---------------------------------------------------------------------- file

/**
 * JSON and image files beside the project, for local development only.
 *
 * A serverless instance has no durable disk, so this reports `durable: false`
 * and the dashboard says so. Production sets DATABASE_URL. Paths resolve on
 * every call, from the working directory, like the override store's.
 */
function fileStore(): ContentStore {
  const root = () => resolve(process.cwd(), '.data/content')
  const draftsPath = () => resolve(root(), 'drafts.json')
  const indexPath = () => resolve(root(), 'media.json')
  const bytesPath = (file: string) => resolve(root(), 'media', file.replace(/\//g, '__'))

  const readJson = <T>(path: string, fallback: T): T => {
    try {
      return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : fallback
    } catch {
      return fallback
    }
  }
  const writeJson = (path: string, data: unknown) => {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
  }
  const readDrafts = () => readJson<Record<string, Draft>>(draftsPath(), {})
  const readIndex = () => readJson<Record<string, MediaInfo>>(indexPath(), {})

  return {
    kind: 'file',
    durable: false,
    async drafts() {
      return Object.values(readDrafts()).sort((a, b) => a.doc.localeCompare(b.doc))
    },
    async saveDraft(doc, data, baseSha) {
      const all = readDrafts()
      const draft: Draft = {
        doc,
        data,
        baseSha: all[doc] ? all[doc].baseSha : baseSha,
        updatedAt: new Date().toISOString(),
      }
      all[doc] = draft
      writeJson(draftsPath(), all)
      return draft
    },
    async deleteDraft(doc) {
      const all = readDrafts()
      delete all[doc]
      writeJson(draftsPath(), all)
    },
    async putMedia(row) {
      const index = readIndex()
      if (index[row.file]) return
      const path = bytesPath(row.file)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, row.bytes)
      const { bytes: _bytes, ...info } = row
      index[row.file] = { ...info, published: false, createdAt: new Date().toISOString() }
      writeJson(indexPath(), index)
    },
    async getMedia(file) {
      const info = readIndex()[file]
      if (!info || !existsSync(bytesPath(file))) return null
      return { ...info, bytes: readFileSync(bytesPath(file)) }
    },
    async listMedia() {
      return Object.values(readIndex()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async markPublished(files) {
      const index = readIndex()
      for (const file of files) if (index[file]) index[file].published = true
      writeJson(indexPath(), index)
    },
    async purgeStale(days) {
      const index = readIndex()
      const cutoff = Date.now() - days * DAY_MS
      let removed = 0
      for (const [file, info] of Object.entries(index)) {
        if (!info.published && Date.parse(info.createdAt) < cutoff) {
          rmSync(bytesPath(file), { force: true })
          delete index[file]
          removed += 1
        }
      }
      writeJson(indexPath(), index)
      return removed
    },
  }
}

let cached: ContentStore | undefined

export function contentStore(): ContentStore {
  if (!cached) cached = optionalEnv('DATABASE_URL') ? postgresStore() : fileStore()
  return cached
}
