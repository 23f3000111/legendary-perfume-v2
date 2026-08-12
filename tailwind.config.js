/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Heritage Luxe canvas
        ivory: '#F4EEE2',       // warm paper base
        porcelain: '#FBF8F2',   // lighter cards / surfaces
        sand: '#EAE1D0',        // subtle section band
        ink: '#1C1815',         // warm near-black
        'ink-soft': '#3B342D',  // muted body text
        smoke: '#8A8177',       // captions / meta
        line: '#D9CFBD',        // hairline rules on ivory
        // Antique gold system
        gold: '#B08D3E',
        'gold-light': '#CBAA5D',
        'gold-deep': '#8A6D2A',
        // Peranakan collection accents
        rose: '#C24E63',        // Kebaya Blooms
        jade: '#6E8F5B',        // Ondeh Delights
        amber: '#C98A3E',       // Nyonya Aromatic
        plum: '#7E5A86',        // Violet
        teal: '#3FA69A',        // Spirit
        graphite: '#3A3F45',    // Man
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Garamond', 'Georgia', 'serif'],
        sans: ['Jost', 'system-ui', 'sans-serif'],
        // Client spec: figures set in Minion Variable Concept. That is an Adobe
        // licence we cannot serve, so it is named first and Source Serif 4
        // (Adobe's open sibling) carries the look everywhere else.
        minion: ['"Minion Variable Concept"', '"Minion Pro"', '"Source Serif 4"', 'Georgia', 'serif'],
        // Client spec: the bottles-sold figure is Noto Serif Medium.
        noto: ['"Noto Serif"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        luxe: '0.28em',
        wide2: '0.16em',
      },
      maxWidth: {
        edge: '1600px',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        drift: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-120px) rotate(40deg)', opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // The "keep scrolling" cue on the pinned collections rail
        bob: {
          '0%,100%': { transform: 'translateY(0)', opacity: '0.75' },
          '50%': { transform: 'translateY(6px)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 6s linear infinite',
        floaty: 'floaty 7s ease-in-out infinite',
        marquee: 'marquee 38s linear infinite',
        bob: 'bob 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
