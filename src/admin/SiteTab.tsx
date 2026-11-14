import type { DocKey } from '../../api/_lib/content/keys'
import CollectionsEditor from './CollectionsEditor'
import { useContent } from './contentStore'
import { ContentGate } from './fields'
import PlacesEditor from './PlacesEditor'
import SiteDetailsEditor from './SiteDetailsEditor'

/**
 * The Site tab: the house's details and the lists that appear across the
 * site, one screen each, every one with its own publish bar.
 */
export const SITE_SCREENS = ['site', 'collections', 'places'] as const satisfies readonly DocKey[]

export type SiteScreen = (typeof SITE_SCREENS)[number]

export function isSiteScreen(doc: string): doc is SiteScreen {
  return (SITE_SCREENS as readonly string[]).includes(doc)
}

export default function SiteTab({ screen, onScreen }: { screen: SiteScreen; onScreen: (next: SiteScreen) => void }) {
  return (
    <ContentGate>
      <Screens screen={screen} onScreen={onScreen} />
    </ContentGate>
  )
}

function Screens({ screen, onScreen }: { screen: SiteScreen; onScreen: (next: SiteScreen) => void }) {
  const state = useContent()
  const unpublished = new Set(state.dirty())
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b border-line pb-3">
        {SITE_SCREENS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onScreen(key)}
            aria-current={screen === key ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs transition ${
              screen === key ? 'bg-ink text-ivory' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {state.docs[key]?.label ?? key}
            {unpublished.has(key) && <span className="h-1.5 w-1.5 rounded-full bg-gold" title="Unpublished changes" />}
          </button>
        ))}
      </nav>
      {screen === 'site' && <SiteDetailsEditor />}
      {screen === 'collections' && <CollectionsEditor />}
      {screen === 'places' && <PlacesEditor />}
    </div>
  )
}
