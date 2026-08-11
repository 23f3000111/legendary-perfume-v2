import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Local dev serves at "/"; production build is served from the GitHub Pages
// subpath so assets and the bundle resolve correctly.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/legendary-perfume-v2/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
}))
