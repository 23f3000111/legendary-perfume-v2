import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'

/**
 * Real paths, not hash fragments.
 *
 * The site ran on a HashRouter because GitHub Pages cannot serve a deep link
 * to a single page app. Nothing behind a `#` is indexable, though, so a hash
 * route cannot carry a canonical, appear in a sitemap or be quoted by an answer
 * engine, which rules it out for a shop. Vercel rewrites every unknown path to
 * index.html instead, and public/404.html keeps the GitHub Pages preview
 * working by bouncing deep links back through the app.
 *
 * `basename` follows Vite's base, so a build served from a subpath still routes.
 */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

/*
 * Pick up a deep link that GitHub Pages bounced through its 404 page.
 * dist/404.html stashes the path it was asked for and reloads at the root; the
 * URL is put back here, before the router first reads the location, so the
 * visitor lands where they meant to with no flash of the home page.
 */
try {
  const redirect = sessionStorage.getItem('legendary:redirect')
  if (redirect) {
    sessionStorage.removeItem('legendary:redirect')
    if (redirect.startsWith('/') && !redirect.startsWith('//')) {
      history.replaceState(null, '', redirect)
    }
  }
} catch {
  // Private browsing can refuse sessionStorage; a normal load is unaffected.
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
