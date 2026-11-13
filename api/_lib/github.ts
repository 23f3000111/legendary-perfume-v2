import { createHash } from 'node:crypto'
import { optionalEnv } from './http.js'

/**
 * The GitHub calls the content dashboard publishes with.
 *
 * Publishing is a commit to the branch Vercel deploys from, made through the
 * Git Data API rather than a checkout: the function has no repository on
 * disk, and blobs, a tree, a commit and a ref update let every changed
 * document and photo go out as one commit with one message. The ref update is
 * never forced, so a branch that moved underneath (a developer's push, a
 * second tab) fails loudly with StaleBranchError instead of being overwritten.
 *
 * GITHUB_API_URL points this at scripts/fake-github.mjs for local work and
 * tests, so nothing here needs the real repository to be exercised.
 */

export interface GitHubConfig {
  token: string
  /** owner/name */
  repo: string
  branch: string
  apiUrl: string
}

/** The publishing settings, or null when publishing is not set up. */
export function githubConfig(): GitHubConfig | null {
  const token = optionalEnv('GITHUB_TOKEN')
  const repo = optionalEnv('GITHUB_REPO')
  if (!token || !repo) return null
  return {
    token,
    repo,
    branch: optionalEnv('GITHUB_BRANCH') ?? 'main',
    apiUrl: (optionalEnv('GITHUB_API_URL') ?? 'https://api.github.com').replace(/\/$/, ''),
  }
}

export class GitHubError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

/** The branch moved between reading its head and updating it. */
export class StaleBranchError extends Error {
  constructor() {
    super('The branch changed while publishing.')
  }
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/')

/** Git's id for a file's content, the `sha` the contents API reports for it. */
export function blobSha(content: string | Buffer): string {
  const bytes = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
}

async function call<T>(cfg: GitHubConfig, method: string, route: string, body?: unknown): Promise<T> {
  const res = await fetch(`${cfg.apiUrl}/repos/${cfg.repo}/${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'legendary-dashboard',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { message?: string } | null
    throw new GitHubError(res.status, detail?.message ?? `GitHub answered ${res.status}.`)
  }
  return (await res.json()) as T
}

export async function branchHead(cfg: GitHubConfig): Promise<{ commit: string; tree: string }> {
  const ref = await call<{ object: { sha: string } }>(cfg, 'GET', `git/ref/heads/${encodePath(cfg.branch)}`)
  const commit = await call<{ tree: { sha: string } }>(cfg, 'GET', `git/commits/${ref.object.sha}`)
  return { commit: ref.object.sha, tree: commit.tree.sha }
}

/** A text file and its blob sha, at `ref` or the branch head. Null when absent. */
export async function readFile(
  cfg: GitHubConfig,
  path: string,
  ref?: string,
): Promise<{ sha: string; text: string } | null> {
  try {
    const file = await call<{ sha: string; content: string }>(
      cfg,
      'GET',
      `contents/${encodePath(path)}?ref=${encodeURIComponent(ref ?? cfg.branch)}`,
    )
    return { sha: file.sha, text: Buffer.from(file.content, 'base64').toString('utf8') }
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) return null
    throw err
  }
}

interface TreeEntry {
  path: string
  type: string
  sha: string
}

async function headTree(cfg: GitHubConfig): Promise<TreeEntry[]> {
  const { tree } = await branchHead(cfg)
  const listing = await call<{ tree: TreeEntry[] }>(cfg, 'GET', `git/trees/${tree}?recursive=1`)
  return listing.tree.filter((entry) => entry.type === 'blob')
}

/**
 * A file's bytes at the branch head, through the blobs API, which serves
 * files of any size where the contents API stops at 1 MB.
 */
export async function readBinary(cfg: GitHubConfig, path: string): Promise<Buffer | null> {
  const entry = (await headTree(cfg)).find((e) => e.path === path)
  if (!entry) return null
  const blob = await call<{ content: string }>(cfg, 'GET', `git/blobs/${entry.sha}`)
  return Buffer.from(blob.content, 'base64')
}

/** Every file at the branch head whose path starts with `prefix`. */
export async function listFiles(cfg: GitHubConfig, prefix: string): Promise<Set<string>> {
  return new Set((await headTree(cfg)).map((e) => e.path).filter((p) => p.startsWith(prefix)))
}

/** One commit holding every file, on top of the branch head. Returns its sha. */
export async function commitFiles(
  cfg: GitHubConfig,
  input: { message: string; files: { path: string; content: string | Buffer }[] },
): Promise<string> {
  const head = await branchHead(cfg)
  const entries = []
  for (const file of input.files) {
    const blob = await call<{ sha: string }>(
      cfg,
      'POST',
      'git/blobs',
      typeof file.content === 'string'
        ? { content: file.content, encoding: 'utf-8' }
        : { content: file.content.toString('base64'), encoding: 'base64' },
    )
    entries.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha })
  }
  const tree = await call<{ sha: string }>(cfg, 'POST', 'git/trees', { base_tree: head.tree, tree: entries })
  const commit = await call<{ sha: string }>(cfg, 'POST', 'git/commits', {
    message: input.message,
    tree: tree.sha,
    parents: [head.commit],
  })
  try {
    await call(cfg, 'PATCH', `git/refs/heads/${encodePath(cfg.branch)}`, { sha: commit.sha, force: false })
  } catch (err) {
    // GitHub refuses a ref update that is not a fast forward with a 422.
    if (err instanceof GitHubError && err.status === 422) throw new StaleBranchError()
    throw err
  }
  return commit.sha
}

/** When a commit was made, as an ISO date. */
export async function commitDate(cfg: GitHubConfig, sha: string): Promise<string> {
  const commit = await call<{ committer: { date: string } }>(cfg, 'GET', `git/commits/${sha}`)
  return commit.committer.date
}

/** Commits that changed `path`, newest first, with the first line of each message. */
export async function fileHistory(
  cfg: GitHubConfig,
  path: string,
  limit = 30,
): Promise<{ sha: string; date: string; message: string }[]> {
  const commits = await call<{ sha: string; commit: { message: string; committer: { date: string } } }[]>(
    cfg,
    'GET',
    `commits?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(cfg.branch)}&per_page=${limit}`,
  )
  return commits.map((c) => ({ sha: c.sha, date: c.commit.committer.date, message: c.commit.message.split('\n')[0] }))
}

/**
 * Whether Vercel has deployed a commit, from the status its GitHub integration
 * posts with the context "Vercel". `none` until Vercel has seen the commit.
 */
export async function deployState(
  cfg: GitHubConfig,
  sha: string,
): Promise<'pending' | 'success' | 'failure' | 'none'> {
  let status: { statuses: { context: string; state: string }[] }
  try {
    status = await call(cfg, 'GET', `commits/${sha}/status`)
  } catch (err) {
    if (err instanceof GitHubError && (err.status === 404 || err.status === 422)) return 'none'
    throw err
  }
  const vercel = status.statuses.find((s) => s.context === 'Vercel')
  if (!vercel) return 'none'
  if (vercel.state === 'success') return 'success'
  if (vercel.state === 'failure' || vercel.state === 'error') return 'failure'
  return 'pending'
}
