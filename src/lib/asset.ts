import { apiUrl } from './api'

// Resolve a public asset path against Vite's base URL so it works both in local
// dev (base "/") and when deployed under a subpath (e.g. GitHub Pages).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/**
 * Dashboard photos that exist only as drafts, in a preview tab.
 *
 * They are not in the build yet, so for those paths alone the photo comes from
 * the dashboard's photo API. Empty outside preview, so nothing changes there.
 */
let previewMedia = new Set<string>()

export function setPreviewMedia(paths: string[]): void {
  previewMedia = new Set(paths)
}

/**
 * A public path resolved against the site's base. Idempotent: a path already
 * under the base, or a full address, comes back as it is, so a photo resolved
 * twice (a map card's own photo, or a product's) still points at one copy.
 */
export function resolveAsset(path: string, base: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path
  if (base && (path === base || path.startsWith(`${base}/`))) return path
  return base + (path.startsWith('/') ? path : '/' + path)
}

export function asset(path: string): string {
  if (previewMedia.has(path)) return apiUrl(`/api/admin/media?file=${path.slice('/assets/cms/'.length)}`)
  return resolveAsset(path, BASE)
}
