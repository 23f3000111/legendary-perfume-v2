import { useRef } from 'react'
import type { Box, HeroDoc, PosterEntry } from '../../api/_lib/content/schema'
import { frameFor, headerHeight } from '../lib/poster'
import { useContent } from './contentStore'
import { ContentGate, errorUnder, Select, TextArea } from './fields'
import PhotoField, { PhotoPreview } from './PhotoField'
import { moveBox, nudgeBox, posterImageFrom, posterShapeWarning, resizeBox, type Corner } from './poster'
import PublishBar from './PublishBar'
import { danger, panel } from './styles'

const BOXES_HINT =
  'Drag the gold box over the lettering and the ivory one over the bottle, and a corner to resize. On other screens the poster is cropped around them: the words always stay whole, the picture as far as the words allow.'

/**
 * The Poster tab: the campaign poster that follows the film at the top of the
 * Home page. Whether it shows, its image, its words for anyone who cannot see
 * it, whether the header turns dark over it, and the two boxes every crop of
 * it keeps in view. The words over the film are Home's, in the Pages tab.
 */
export default function PosterEditor() {
  return (
    <ContentGate>
      <Editor />
    </ContentGate>
  )
}

function Editor() {
  const doc = useContent((s) => s.docs.hero)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const data = doc.working as HeroDoc
  const poster = data.poster
  const set = (next: Partial<PosterEntry>) => edit('hero', { ...data, poster: { ...poster, ...next } })
  const err = (path: string) => errorUnder(doc.errors, path)

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">The poster</h2>
        <p className="mb-5 mt-1 text-xs text-smoke">
          The campaign poster that follows the film at the top of the Home page. The words over the film are in the
          Pages tab, under Home.
        </p>
        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={poster.show} onChange={(e) => set({ show: e.target.checked })} disabled={busy} />
              Show the poster after the film
            </label>
            <p className="mt-1 text-xs text-smoke">Off, the film plays on its own, over and over.</p>
          </div>
          <div>
            <PhotoField
              kind="poster"
              label="Poster"
              value={poster.image.prints[0]?.path}
              removable={false}
              disabled={busy}
              // A new poster keeps the boxes where they were: drag them over its own words and picture.
              onChange={(_path, _second, derived) => {
                const image = derived && posterImageFrom(derived)
                if (image) set({ image })
              }}
            />
            {err('poster.image') && <p className={`mt-1 text-xs ${danger}`}>{err('poster.image')}</p>}
            {posterShapeWarning(poster.image) && (
              <p className="mt-2 max-w-3xl text-xs text-gold-deep">{posterShapeWarning(poster.image)}</p>
            )}
          </div>
          <TextArea
            label="Describe the poster"
            rows={3}
            value={poster.alt}
            onChange={(alt) => set({ alt })}
            error={err('poster.alt')}
            hint="Read aloud to people who cannot see it."
            disabled={busy}
          />
          <Select
            label="Header over the poster"
            value={poster.tone}
            options={[
              { value: 'light', label: 'Light poster: the header and arrows turn dark' },
              { value: 'dark', label: 'Dark poster: they stay light' },
            ]}
            onChange={(tone) => set({ tone: tone as PosterEntry['tone'] })}
            error={err('poster.tone')}
            disabled={busy}
          />
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">The two boxes</h2>
        <p className="mt-1 max-w-3xl text-xs text-smoke">{BOXES_HINT}</p>
        <Boxes poster={poster} onChange={(words, picture) => set({ words, picture })} disabled={busy} />
        {(['words', 'picture'] as const).map((which) =>
          err(`poster.${which}`) ? (
            <p key={which} className={`mt-1 text-xs ${danger}`}>
              {which === 'words' ? 'Words' : 'Picture'}: {err(`poster.${which}`)}
            </p>
          ) : null,
        )}
        <Previews poster={poster} />
      </section>

      <PublishBar docs={['hero']} previewPath="/" />
    </div>
  )
}

type Which = 'words' | 'picture'

const NAMES: Record<Which, string> = { words: 'Words', picture: 'Picture' }
const CORNERS: Record<Corner, string> = {
  tl: '-left-1.5 -top-1.5 cursor-nwse-resize',
  tr: '-right-1.5 -top-1.5 cursor-nesw-resize',
  bl: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
  br: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
}

/**
 * The poster with its two boxes over it. A box is dragged by its body and
 * resized by a corner; focused, the arrow keys move it, and with Shift they
 * move its right or bottom edge.
 */
function Boxes({
  poster, onChange, disabled,
}: {
  poster: PosterEntry
  onChange: (words: Box, picture: Box) => void
  disabled: boolean
}) {
  const area = useRef<HTMLDivElement>(null)
  // The drag under way: which box, by its body or a corner, from where, and the box as it began.
  const drag = useRef<{ which: Which; corner: Corner | null; x: number; y: number; box: Box; width: number; height: number } | null>(null)
  const put = (which: Which, box: Box) => onChange(which === 'words' ? box : poster.words, which === 'picture' ? box : poster.picture)

  const start = (which: Which, corner: Corner | null) => (e: React.PointerEvent<HTMLElement>) => {
    if (disabled || !area.current) return
    // A corner is inside its box: the box itself must not start a move too.
    e.stopPropagation()
    e.preventDefault()
    // preventDefault keeps the page from selecting text under the drag, but it
    // also keeps the box from taking focus, so it is given focus here: a box
    // dragged roughly into place then takes the arrow keys for the last steps.
    ;(e.currentTarget.closest('[data-box]') as HTMLElement | null)?.focus({ preventScroll: true })
    const rect = area.current.getBoundingClientRect()
    drag.current = { which, corner, x: e.clientX, y: e.clientY, box: poster[which], width: rect.width, height: rect.height }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.x) / d.width
    const dy = (e.clientY - d.y) / d.height
    put(d.which, d.corner ? resizeBox(d.box, d.corner, dx, dy) : moveBox(d.box, dx, dy))
  }
  const end = () => {
    drag.current = null
  }

  return (
    <div
      ref={area}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      className="relative mt-5 max-w-3xl touch-none select-none overflow-hidden rounded-sm bg-sand"
      style={{ aspectRatio: `${poster.image.width} / ${poster.image.height}` }}
    >
      <PhotoPreview path={poster.image.prints[0].path} className="pointer-events-none block h-full w-full" />
      {(['words', 'picture'] as const).map((which) => {
        const [left, top, right, bottom] = poster[which]
        return (
          <div
            key={which}
            role="group"
            tabIndex={disabled ? -1 : 0}
            aria-label={`${NAMES[which]} box. The arrow keys move it; with Shift they resize it.`}
            data-box={which}
            onPointerDown={start(which, null)}
            onKeyDown={(e) => {
              if (disabled) return
              const next = nudgeBox(poster[which], e.key, e.shiftKey)
              if (!next) return
              e.preventDefault()
              put(which, next)
            }}
            className={`absolute cursor-move border-2 outline-none focus-visible:ring-2 focus-visible:ring-ink ${
              which === 'words' ? 'border-gold bg-gold/15' : 'border-ivory bg-ivory/20'
            }`}
            style={{
              left: `${left * 100}%`,
              top: `${top * 100}%`,
              width: `${(right - left) * 100}%`,
              height: `${(bottom - top) * 100}%`,
            }}
          >
            <span className="pointer-events-none absolute left-1 top-1 rounded-sm bg-ink/70 px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-ivory">
              {NAMES[which]}
            </span>
            {(Object.keys(CORNERS) as Corner[]).map((corner) => (
              <span
                key={corner}
                data-corner={corner}
                onPointerDown={start(which, corner)}
                className={`absolute h-3 w-3 border border-ink bg-ivory ${CORNERS[corner]}`}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

/** The screens the previews stand for, and the header's height over them. */
const SCREENS = [
  { label: 'A laptop', width: 1440, height: 900 },
  { label: 'A wide screen', width: 2560, height: 1080 },
  { label: 'A phone', width: 390, height: 844 },
]
// Each under the header the site draws at its width (headerHeight).

/**
 * How the site crops the poster on three shapes of screen, framed by the same
 * function the Home page uses. The dark band at the top is where the header sits.
 */
function Previews({ poster }: { poster: PosterEntry }) {
  return (
    <div className="mt-6 flex flex-wrap items-end gap-4">
      {SCREENS.map((screen) => {
        const header = headerHeight(screen.width)
        const frame = frameFor(screen.width, screen.height, poster, header)
        return (
          <figure key={screen.label} style={{ width: screen.width > screen.height ? 240 : 104 }}>
            <div
              className="relative overflow-hidden rounded-sm bg-ink"
              style={{ aspectRatio: `${screen.width} / ${screen.height}` }}
            >
              {frame.fit !== 'cover' && (
                <PhotoPreview path={poster.image.fill} className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className={`absolute inset-0 flex justify-center ${frame.fit === 'card' ? 'items-center' : 'items-end'}`}>
                <PhotoPreview
                  path={poster.image.prints[0].path}
                  className={frame.fit === 'cover' ? 'absolute inset-0 h-full w-full object-cover' : 'h-auto w-full'}
                  style={frame.fit === 'cover' ? { objectPosition: `${frame.x}% ${frame.y}%` } : undefined}
                />
              </div>
              <div className="absolute inset-x-0 top-0 bg-ink/45" style={{ height: `${(header / screen.height) * 100}%` }} />
            </div>
            <figcaption className="mt-1 text-[0.68rem] text-smoke">{screen.label}</figcaption>
          </figure>
        )
      })}
    </div>
  )
}
