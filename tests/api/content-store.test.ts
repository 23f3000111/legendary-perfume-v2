import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { contentStore } from '../../api/_lib/content/store'

let dir: string
let previous: string

beforeEach(() => {
  delete process.env.DATABASE_URL
  previous = process.cwd()
  dir = mkdtempSync(join(tmpdir(), 'content-store-'))
  process.chdir(dir)
})

afterEach(() => {
  vi.useRealTimers()
  process.chdir(previous)
  rmSync(dir, { recursive: true, force: true })
})

const photo = (file: string, byte: number) => ({
  file,
  bytes: Buffer.from([byte, byte, byte]),
  width: 10,
  height: 20,
  kind: 'master' as const,
  source: null,
})

describe('the local file store', () => {
  it('a second save keeps the first base', async () => {
    const store = contentStore()
    expect(store.kind).toBe('file')
    await store.saveDraft('faq', { intro: 'one' }, 'a')
    const second = await store.saveDraft('faq', { intro: 'two' }, 'b')
    expect(second.baseSha).toBe('a')
    expect(second.data).toEqual({ intro: 'two' })
    expect((await store.drafts()).map((d) => [d.doc, d.baseSha, d.data])).toEqual([['faq', 'a', { intro: 'two' }]])
  })

  it('deleteDraft removes it', async () => {
    const store = contentStore()
    await store.saveDraft('faq', { intro: 'one' }, 'a')
    await store.saveDraft('stores', { regions: [] }, 'c')
    await store.deleteDraft('faq')
    expect((await store.drafts()).map((d) => d.doc)).toEqual(['stores'])
  })

  it('putMedia twice keeps one row', async () => {
    const store = contentStore()
    await store.putMedia(photo('m/abc.webp', 1))
    await store.putMedia(photo('m/abc.webp', 1))
    expect((await store.listMedia()).map((m) => m.file)).toEqual(['m/abc.webp'])
    expect((await store.getMedia('m/abc.webp'))!.bytes).toEqual(Buffer.from([1, 1, 1]))
  })

  it('purgeStale removes only old unpublished media', async () => {
    const store = contentStore()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'))
    await store.putMedia(photo('m/old.webp', 1))
    await store.putMedia(photo('m/kept.webp', 2))
    await store.markPublished(['m/kept.webp'])
    vi.setSystemTime(new Date('2026-11-12T00:00:00Z'))
    await store.putMedia(photo('m/new.webp', 3))

    expect(await store.purgeStale(30)).toBe(1)
    expect((await store.listMedia()).map((m) => m.file).sort()).toEqual(['m/kept.webp', 'm/new.webp'])
    expect(await store.getMedia('m/old.webp')).toBeNull()
  })
})
