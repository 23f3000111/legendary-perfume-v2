import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
// @ts-expect-error: a plain .mjs dev tool, without types
import { startFakeGitHub } from '../../scripts/fake-github.mjs'
import {
  branchHead, commitFiles, deployState, fileHistory, GitHubError, listFiles, readBinary, readFile,
  StaleBranchError, type GitHubConfig,
} from '../../api/_lib/github'

let seed: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fake: any
let cfg: GitHubConfig

beforeEach(async () => {
  seed = mkdtempSync(join(tmpdir(), 'fake-github-'))
  mkdirSync(join(seed, 'src/content'), { recursive: true })
  writeFileSync(join(seed, 'src/content/faq.json'), '{"intro":"one"}\n')
  writeFileSync(join(seed, 'src/content/stores.json'), '{"regions":[]}\n')
  mkdirSync(join(seed, 'public/assets/client'), { recursive: true })
  writeFileSync(join(seed, 'public/assets/client/a.webp'), Buffer.from([1, 2, 3]))
  fake = await startFakeGitHub({ port: 0, seedDir: seed, token: 'test-token', statusDelayMs: null })
  cfg = { token: 'test-token', repo: 'local/legendary', branch: 'main', apiUrl: fake.url }
})

afterEach(async () => {
  await fake.close()
  rmSync(seed, { recursive: true, force: true })
})


describe('the fake GitHub', () => {
  // A Windows checkout (core.autocrlf) has CRLF in text files, while git, and
  // so GitHub, holds LF. Seeded with CRLF, the fake would never match a file
  // the dashboard writes back, and every byte for byte check would fail.
  it('holds content files the way git does, with LF line endings', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fake-github-crlf-'))
    try {
      mkdirSync(join(dir, 'src/content'), { recursive: true })
      writeFileSync(join(dir, 'src/content/faq.json'), '{\r\n  "intro": "one"\r\n}\r\n')
      mkdirSync(join(dir, 'public/assets'), { recursive: true })
      const photo = Buffer.from([0x0d, 0x0a, 0xff, 0x0d, 0x0a])
      writeFileSync(join(dir, 'public/assets/a.webp'), photo)
      const crlf = await startFakeGitHub({ port: 0, seedDir: dir, token: 'test-token', statusDelayMs: null })
      try {
        expect(crlf.files().get('src/content/faq.json').toString('utf8')).toBe('{\n  "intro": "one"\n}\n')
        // A photo's bytes are left exactly as they are.
        expect(crlf.files().get('public/assets/a.webp')).toEqual(photo)
      } finally {
        await crlf.close()
      }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('the GitHub client', () => {
  it('commitFiles then readFile returns the new text and a new sha', async () => {
    const before = await readFile(cfg, 'src/content/faq.json')
    expect(before?.text).toBe('{"intro":"one"}\n')

    const commit = await commitFiles(cfg, {
      message: 'Dashboard: FAQ',
      files: [{ path: 'src/content/faq.json', content: '{"intro":"two"}\n' }],
    })

    expect(commit).toMatch(/^[0-9a-f]{40}$/)
    expect((await branchHead(cfg)).commit).toBe(commit)
    const after = await readFile(cfg, 'src/content/faq.json')
    expect(after?.text).toBe('{"intro":"two"}\n')
    expect(after?.sha).not.toBe(before?.sha)
    expect(await readFile(cfg, 'src/content/missing.json')).toBeNull()
  })

  it('a Buffer is committed byte for byte', async () => {
    const bytes = Buffer.from([0, 255, 10, 13, 128, 0])
    await commitFiles(cfg, { message: 'Dashboard: photo', files: [{ path: 'public/assets/cms/x.webp', content: bytes }] })

    expect(fake.files().get('public/assets/cms/x.webp')).toEqual(bytes)
    expect(await readBinary(cfg, 'public/assets/cms/x.webp')).toEqual(bytes)
    expect([...(await listFiles(cfg, 'public/assets/cms/'))]).toEqual(['public/assets/cms/x.webp'])
  })

  it('a moved branch raises StaleBranchError', async () => {
    let theirs = ''
    fake.onBeforeRefUpdate(async () => {
      theirs = await commitFiles(cfg, {
        message: 'Someone else',
        files: [{ path: 'src/content/faq.json', content: '{"intro":"theirs"}\n' }],
      })
    })

    await expect(
      commitFiles(cfg, { message: 'Mine', files: [{ path: 'src/content/faq.json', content: '{"intro":"mine"}\n' }] }),
    ).rejects.toBeInstanceOf(StaleBranchError)
    expect((await branchHead(cfg)).commit).toBe(theirs)
    expect((await readFile(cfg, 'src/content/faq.json'))?.text).toBe('{"intro":"theirs"}\n')
  })

  it('fileHistory lists newest first', async () => {
    await commitFiles(cfg, { message: 'Dashboard: one', files: [{ path: 'src/content/faq.json', content: '{"intro":"1"}\n' }] })
    await commitFiles(cfg, { message: 'Dashboard: stores', files: [{ path: 'src/content/stores.json', content: '{"regions":["A"]}\n' }] })
    await commitFiles(cfg, { message: 'Dashboard: two\n\nA longer body.', files: [{ path: 'src/content/faq.json', content: '{"intro":"2"}\n' }] })

    const history = await fileHistory(cfg, 'src/content/faq.json')
    expect(history.map((c) => c.message)).toEqual(['Dashboard: two', 'Dashboard: one', 'Seed'])
    expect(history[0].date >= history[1].date).toBe(true)
  })

  it("deployState reads Vercel's status", async () => {
    const commit = await commitFiles(cfg, { message: 'Dashboard: FAQ', files: [{ path: 'src/content/faq.json', content: '{}\n' }] })
    expect(await deployState(cfg, commit)).toBe('pending')
    fake.setStatus(commit, 'success')
    expect(await deployState(cfg, commit)).toBe('success')
    fake.setStatus(commit, 'error')
    expect(await deployState(cfg, commit)).toBe('failure')
    expect(await deployState(cfg, '0'.repeat(40))).toBe('none')
  })

  it('a 401 becomes GitHubError with status 401', async () => {
    const wrong = { ...cfg, token: 'expired' }
    const failure = await readFile(wrong, 'src/content/faq.json').catch((e: unknown) => e)
    expect(failure).toBeInstanceOf(GitHubError)
    expect((failure as GitHubError).status).toBe(401)
  })
})
