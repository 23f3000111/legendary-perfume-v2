import { useEffect, useRef, useState } from 'react'
import { SLOT_KINDS, type SlotKind } from '../../api/_lib/content/slots'
import { adminDerivePhoto, apiUrl } from '../lib/api'
import { asset } from '../lib/asset'
import { coarsePointer, LibraryPicker, messageOf, uploadToLibrary, type LibraryChoice } from './PhotoLibrary'
import { danger, small } from './styles'

/**
 * One place for a photo, such as a store's picture.
 *
 * A new upload, or a photo picked from the library, is copied at the size this
 * kind of place needs, and that copy's path is what the content holds. A photo
 * the site already shows is used as it is.
 */
export default function PhotoField({
  kind, value, onChange, label, disabled,
}: {
  kind: SlotKind
  value?: string
  onChange: (path: string | undefined) => void
  label?: string
  disabled?: boolean
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const coarse = coarsePointer()

  const run = async (work: () => Promise<void>) => {
    setError(null)
    try {
      await work()
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setBusy(null)
    }
  }
  const place = async (master: string) => {
    setBusy('Fitting the photo…')
    const { path } = await adminDerivePhoto(master, kind)
    onChange(path)
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
      else onChange(choice.site)
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
            {value && (
              <button type="button" disabled={locked} onClick={() => onChange(undefined)} className="text-xs text-smoke underline transition hover:text-ink">
                Remove photo
              </button>
            )}
          </div>
          {busy && <p className="text-xs text-smoke">{busy}</p>}
          {error && <p className={`text-xs ${danger}`}>{error}</p>}
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
      {picking && <LibraryPicker onPick={pick} onClose={() => setPicking(false)} />}
    </div>
  )
}

/** A dashboard photo may not be in this build yet; the photo API holds every one it stored. */
function Preview({ path }: { path: string }) {
  const first = path.startsWith('/assets/cms/') ? apiUrl(`/api/admin/media?file=${path.slice('/assets/cms/'.length)}`) : asset(path)
  const [src, setSrc] = useState(first)
  useEffect(() => setSrc(first), [first])
  return <img src={src} alt="" onError={() => setSrc(asset(path))} className="h-full w-full object-cover" />
}
