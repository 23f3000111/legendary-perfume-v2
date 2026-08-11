import { Link, useLocation } from 'react-router-dom'
import { asset } from '../lib/asset'
import PageHeader from '../components/ui/PageHeader'
import Prose from '../components/ui/Prose'
import { getPolicy, policies } from '../data/policies'
import { ArrowRight } from '../components/ui/icons'

/**
 * One template for shipping, returns, terms and privacy. Copy lives in
 * src/data/policies.ts as Block[], so all four read in the same typography.
 */
export default function Policy() {
  // Each policy has its own top level route, so the slug is the path itself.
  const slug = useLocation().pathname.replace(/^\/|\/$/g, '')
  const policy = getPolicy(slug)

  if (!policy) {
    return (
      <div className="grid min-h-[70vh] place-items-center pt-24 text-center">
        <div>
          <p className="font-display text-4xl">Page not found</p>
          <Link to="/" className="btn-gold mt-6">Back to the house</Link>
        </div>
      </div>
    )
  }

  const others = policies.filter((p) => p.slug !== policy.slug)

  return (
    <>
      <PageHeader
        eyebrow={policy.eyebrow}
        title={policy.title}
        intro={policy.intro}
        crumbs={[{ label: 'Home', to: '/' }, { label: policy.title }]}
        image={asset('/assets/client/banner-journal.webp')}
      />

      <section className="bg-ivory py-16 md:py-24">
        <div className="u-narrow">
          <p className="eyebrow text-smoke">Last updated · {policy.updated}</p>
          <Prose blocks={policy.body} className="mt-8" />
        </div>
      </section>

      {/* The rest of the customer care set */}
      <section className="border-t border-line bg-porcelain py-14">
        <div className="u-narrow">
          <p className="eyebrow text-smoke">Also worth reading</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {others.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/${p.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-sm border border-line bg-ivory px-5 py-4 transition hover:border-gold"
                >
                  <span className="font-display text-lg text-ink">{p.title}</span>
                  <ArrowRight
                    width={16}
                    className="shrink-0 text-gold transition-transform duration-500 group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
