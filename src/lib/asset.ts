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

export function asset(path: string): string {
  if (previewMedia.has(path)) return apiUrl(`/api/admin/media?file=${path.slice('/assets/cms/'.length)}`)
  return BASE + (path.startsWith('/') ? path : '/' + path)
}
