// Resolve a public asset path against Vite's base URL so it works both in local
// dev (base "/") and when deployed under a subpath (e.g. GitHub Pages).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export function asset(path: string): string {
  return BASE + (path.startsWith('/') ? path : '/' + path)
}
