import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SLOT_KINDS, type SlotKind } from '../../api/_lib/content/slots'
import { adminDerivePhoto, apiUrl, type DerivedPhoto } from '../lib/api'
import { asset } from '../lib/asset'
import { coarsePointer, LibraryPicker, messageOf, uploadToLibrary, type LibraryChoice } from './PhotoLibrary'
import { siteSecond } from './site'
import { danger, small } from './styles'

/**
 * One place for a photo, such as a store's picture.
 *
 * A new upload, or a photo picked from the library, is copied at the size this
 * kind of place needs, and that copy's path is what the content holds. A photo
 * the site already shows is used as it is.
 */
export default function PhotoField({
  kind, value, onChange, label, disabled, onBusy, white: offerWhite, removable = true,
}: {
  kind: SlotKind
  value?: string
  /**
   * The photo's path; for a logo, its black and white print's path too, and for
   * one of the site's banners its phone crop's. A photo fitted from the library
   * also comes with everything the fitting gave (a poster's prints and fill).
   */
  onChange: (path: string | undefined, second?: string, derived?: DerivedPhoto) => void
  label?: string
  disabled?: boolean
  /** Told when a photo starts and stops being uploaded or fitted, so the form can hold still meanwhile. */
  onBusy?: (busy: boolean) => void
  /** Offer to make a white background see-through, for a cut-out sent on white. */
  white?: boolean
  /** Whether the photo can be taken away; a page's banner cannot, only replaced. */
  removable?: boolean
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [onWhite, setOnWhite] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const coarse = coarsePointer()

  // An upload takes seconds, and the form goes on meanwhile: someone types the
  // photo's description, or closes the form. The photo is placed through the
  // onChange of the latest render, so nothing typed in the meantime is undone,
  // and not at all once this field is gone; the photo stays in the library.
  const latest = useRef({ onChange, onBusy })
  useLayoutEffect(() => {
    latest.current = { onChange, onBusy }
  })
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const done = (path: string | undefined, second?: string, derived?: DerivedPhoto) => {
    if (alive.current) latest.current.onChange(path, second, derived)
  }

  const run = async (work: () => Promise<void>) => {
    setError(null)
    latest.current.onBusy?.(true)
    try {
      await work()
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setBusy(null)
      latest.current.onBusy?.(false)
    }
  }
  const place = async (master: string) => {
    setBusy('Fitting the photo…')
    const derived = await adminDerivePhoto(master, kind, { white: offerWhite && onWhite })
    done(derived.path, derived.mono ?? derived.phone, derived)
  }
  const upload = (file: File) =>
    run(async () => {
      setBusy('Uploading…')
      const master = await uploadToLibrary(file)
      await place(master.file)
    })
  const pick = (choice: LibraryChoice) => {
    setPicking(false)
    void run(async () => {
      if ('master' in choice) await place(choice.master)
      // A logo or banner the site already has keeps the second print beside it.
      else done(choice.site, siteSecond(SLOT_KINDS[kind], choice.site) ?? undefined)
    })
  }
  const locked = disabled || Boolean(busy)

  return (
    <div>
      <span className="eyebrow text-smoke">{label ?? SLOT_KINDS[kind].label}</span>
      <div className="mt-2 flex items-start gap-4">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-sm bg-sand text-[0.65rem] text-smoke">
          {value ? <Preview path={value} /> : 'No photo'}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {coarse ? (
              <span className="text-xs text-smoke">Use a computer to add photos</span>
            ) : (
              <button type="button" disabled={locked} onClick={() => input.current?.click()} className={small}>
                Upload
              </button>
            )}
            <button type="button" disabled={locked} onClick={() => setPicking(true)} className={small}>
              Choose from library
            </button>
            {value && removable && (
              <button type="button" disabled={locked} onClick={() => onChange(undefined)} className="text-xs text-smoke underline transition hover:text-ink">
                Remove photo
              </button>
            )}
          </div>
          {busy && <p className="text-xs text-smoke">{busy}</p>}
          {error && <p className={`text-xs ${danger}`}>{error}</p>}
          {offerWhite && (
            <label className="flex items-center gap-2 text-xs text-ink-soft">
              <input type="checkbox" checked={onWhite} onChange={(e) => setOnWhite(e.target.checked)} disabled={locked} />
              The photo is on a white background: make the white see-through
            </label>
          )}
          <p className="text-xs text-smoke">Shown up to {SLOT_KINDS[kind].maxSide} px across.</p>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void upload(file)
        }}
      />
      {picking && <LibraryPicker kind={kind} onPick={pick} onClose={() => setPicking(false)} />}
    </div>
  )
}

/** A dashboard photo may not be in this build yet; the photo API holds every one it stored. */
function Preview({ path }: { path: string }) {
  return <PhotoPreview path={path} className="h-full w-full object-cover" />
}

/**
 * A stored photo in the dashboard: one made here comes from the photo API
 * (the build may not have it yet), and falls back to the site's own copy.
 */
export function PhotoPreview({ path, className, style }: { path: string; className?: string; style?: React.CSSProperties }) {
  const first = path.startsWith('/assets/cms/') ? apiUrl(`/api/admin/media?file=${path.slice('/assets/cms/'.length)}`) : asset(path)
  const [src, setSrc] = useState(first)
  useEffect(() => setSrc(first), [first])
  return <img src={src} alt="" onError={() => setSrc(asset(path))} className={className} style={style} />
}
