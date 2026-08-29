import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

export default function NotFound() {
  return (
    <div className="grid min-h-[80vh] place-items-center bg-ink px-5 text-center text-ivory">
      <Seo title="Page not found" description="This page has drifted away like a top note." noindex />
      <div>
        <p className="eyebrow eyebrow-gold">Lost the scent</p>
        <h1 className="mt-4 font-display text-[clamp(4rem,14vw,9rem)] leading-none text-gilt">404</h1>
        <p className="mt-4 text-ivory/60">This page has drifted away like a top note.</p>
        <Link to="/" className="btn-gold mt-8">Return home</Link>
      </div>
    </div>
  )
}
