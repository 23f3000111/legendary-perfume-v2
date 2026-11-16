import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { homeHead } from './scripts/home-head.mjs'

/**
 * The Home page's search words and sharing image, from the dashboard's Pages
 * document, written into the static head a link preview reads. Read when the
 * page is served or built, so a published change goes out with the next build.
 */
function homeHeadPlugin(): Plugin {
  return {
    name: 'legendary-home-head',
    transformIndexHtml(html) {
      const pages = JSON.parse(readFileSync(new URL('./src/content/pages.json', import.meta.url), 'utf8'))
      return homeHead(html, pages.home.seo, process.env.SITE_URL ?? 'https://legendary.com.my')
    },
  }
}

/**
 * https://vitejs.dev/config/
 *
 * Two deployment targets, so the base path is decided per build:
 *
 *  - Vercel serves the site at the root of its own domain, and the functions
 *    under /api sit alongside it. VERCEL is set during that build.
 *  - GitHub Pages serves the static preview from a repository subpath, so the
 *    bundle and every asset have to resolve under it.
 *
 * Local dev is always the root.
 */
export default defineConfig(({ command }) => {
  const onVercel = Boolean(process.env.VERCEL)
  const base = process.env.VITE_BASE ?? (command === 'build' && !onVercel ? '/legendary-perfume-v2/' : '/')

  return {
    base,
    plugins: [react(), homeHeadPlugin()],
    server: {
      port: 5173,
      open: true,
      /**
       * `vercel dev` serves the functions on 3000. Proxying keeps the browser
       * on one origin, so the checkout is not fighting CORS locally when it
       * would never meet it in production.
       */
      proxy: {
        // Everything under /api except /api/_lib/: the site imports the content
        // dashboard's shared schema code from api/_lib/content, and in dev
        // those modules are files Vite must serve, not routes to forward.
        '^/api/(?!_lib/)': {
          target: process.env.VITE_DEV_API ?? 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      // The shop pulls in Stripe and framer-motion; splitting the vendor code
      // out means a copy change does not invalidate all of it in the cache.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
            stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          },
        },
      },
    },
  }
})
