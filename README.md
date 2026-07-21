# Legendary — *A Scented Memory of Malaysia*

A premium, cinematic redesign of the Legendary Perfume storefront — built as an
interactive front‑end demo. Heritage‑luxe aesthetic (ivory, antique gold, Peranakan
motifs), scroll‑driven storytelling, and a working shop experience.

### 🔗 Live demo → **https://23f3000111.github.io/legendary-perfume/**

Deployed automatically to GitHub Pages on every push to `main`.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (e.g. http://localhost:5173).

```bash
npm run build   # type-check + production build → /dist
npm run preview # preview the production build
```

Requires Node 18+.

## Tech

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** — custom design tokens (`tailwind.config.js`, `src/index.css`)
- **Framer Motion** — intro ritual, scroll reveals, parallax, the pinned collections rail
- **Zustand** (+ `localStorage`) — cart & wishlist persistence (`src/store/`)
- **React Router** — multi-page routing

## What's inside

- **Cinematic hero** with the brand video, a page‑load intro ritual, ambient gold
  particles and a trailing cursor.
- **The Signature** — a mouse‑reactive Orchid feature.
- **Pinned horizontal collections rail** (desktop) / snap scroller (mobile).
- **"A Scented Memory of Malaysia"** — an interactive stylised map linking places to
  scents (`src/components/MalaysiaMap.tsx`).
- **The Olfactory Finder** — pick a mood, get matched fragrances.
- **Shop** with filtering & sorting, **product pages** with an animated scent pyramid,
  a slide‑over **cart**, **wishlist**, and a simulated multi‑step **checkout**.
- **Store locator** with embedded Google Maps + live directions (`src/pages/Stores.tsx`).
- **AI Concierge** — an in‑page assistant that answers scent/gift/store questions and
  hands off to the real WhatsApp number (`src/lib/concierge.ts`, `src/components/Concierge.tsx`).

## Notes

- Prices are in **RM (MYR)**.
- This is a demo: checkout processes **no real payment**, and the concierge is
  rule‑based (it deep‑links to WhatsApp for human follow‑up). Both are structured so a
  real payment gateway / LLM backend could be dropped in later.
- All product, store, and collection data lives in `src/data/`.
- Brand assets are bundled in `public/assets/` (sourced from the provided UI images).
