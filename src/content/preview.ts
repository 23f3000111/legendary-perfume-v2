import { isDocKey } from '../../api/_lib/content/keys'
import { adminPreviewDrafts, ApiError } from '../lib/api'
import { setPreviewMedia } from '../lib/asset'
import { CONTENT } from './registry'

/**
 * Preview: the real site, showing the dashboard's drafts.
 *
 * The dashboard opens a page with `?preview`. Before the site first renders,
 * the drafts are fetched (only a signed-in session gets them) and swapped into
 * the content objects the site reads, so what shows is exactly the page as it
 * will be once published. The flag lives in sessionStorage, so moving around
 * the site in that tab stays in preview; nothing persists anywhere else, and
 * nothing a visitor without the session sees is touched.
 */

const FLAG = 'legendary-preview'
let active = false

/** True when the address asks for preview, or this tab already is one. */
export function previewRequested(search: string, stored: string | null): boolean {
  return new URLSearchParams(search).has('preview') || stored === '1'
}

/** Put each draft into its document, keeping the object the site holds. */
export function applyDrafts(
  drafts: Record<string, unknown>,
  target: Record<string, Record<string, unknown>> = CONTENT,
): void {
  for (const [key, draft] of Object.entries(drafts)) {
    if (!isDocKey(key) || !target[key] || !draft || typeof draft !== 'object') continue
    const doc = target[key]
    const next = draft as Record<string, unknown>
    // Arrays the site already holds keep their identity: src/data/products.ts
    // hands out `products`, the array itself, and it must show the draft's
    // products. Everything else is replaced.
    const both = (k: string) => Array.isArray(doc[k]) && Array.isArray(next[k])
    for (const own of Object.keys(doc)) if (!both(own)) delete doc[own]
    for (const [k, value] of Object.entries(next)) {
      if (both(k)) {
        const held = doc[k] as unknown[]
        held.splice(0, held.length, ...(value as unknown[]))
      } else {
        doc[k] = value
      }
    }
  }
}

function readFlag(): string | null {
  try {
    return sessionStorage.getItem(FLAG)
  } catch {
    return null
  }
}

function writeFlag(on: boolean) {
  try {
    if (on) sessionStorage.setItem(FLAG, '1')
    else sessionStorage.removeItem(FLAG)
  } catch {
    // Private browsing can refuse sessionStorage; preview then lasts one page.
  }
}

export function previewWanted(): boolean {
  return previewRequested(window.location.search, readFlag())
}

/** Load and apply the drafts. False when this browser is not signed in. */
export async function bootPreview(): Promise<boolean> {
  try {
    const { drafts, media } = await adminPreviewDrafts()
    applyDrafts(drafts)
    setPreviewMedia(media)
    writeFlag(true)
    try {
      // A preview is for checking content: skip the intro curtain.
      sessionStorage.setItem('legendary-intro', '1')
    } catch {
      // Without sessionStorage the curtain plays once, which is harmless.
    }
    active = true
    return true
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) writeFlag(false)
    return false
  }
}

export function isPreview(): boolean {
  return active
}

export function exitPreview(): void {
  writeFlag(false)
  const url = new URL(window.location.href)
  url.searchParams.delete('preview')
  window.location.replace(url.toString())
}
