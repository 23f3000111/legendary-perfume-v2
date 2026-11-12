import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, adminLibrary, adminUploadPhoto, apiUrl, type LibraryPhoto } from '../lib/api'
import { asset } from '../lib/asset'
import { shrinkForUpload } from './shrink'
import { danger, panel, small } from './styles'

/**
 * The photo library: every photo the team has added, kept large so it can go
 * anywhere later, and the photos the site already has.
 *
 * A whole round of photos can be dropped in at once and given their places
 * afterwards. Uploading is for a computer: a phone cannot shrink the client's
 * large originals reliably, so a touch screen is told so instead.
 */

export const coarsePointer = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches)

export const messageOf = (err: unknown) =>
  err instanceof ApiError || err instanceof Error ? err.message : 'That photo could not be uploaded.'

/** Shrink a photo in the browser, then add it to the library. */
export async function uploadToLibrary(file: File) {
  const { blob } = await shrinkForUpload(file)
  return adminUploadPhoto(blob)
}

function useLibrary() {
  const [library, setLibrary] = useState<{ photos: LibraryPhoto[]; site: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(() => {
    adminLibrary()
      .then((l) => {
        setLibrary(l)
        setError(null)
      })
      .catch((e) => setError(messageOf(e)))
  }, [])
  useEffect(refresh, [refresh])
  return { library, error, refresh }
}

const thumb = 'aspect-square w-full rounded-sm bg-sand object-cover'

export default function PhotoLibrary() {
  const { library, error, refresh } = useLibrary()
  const [progress, setProgress] = useState<string | null>(null)
  const [failures, setFailures] = useState<string[]>([])
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const coarse = coarsePointer()

  const upload = async (files: File[]) => {
    const failed: string[] = []
    for (let i = 0; i < files.length; i++) {
      setProgress(`Uploading ${i + 1} of ${files.length}: ${files[i].name}`)
      try {
        await uploadToLibrary(files[i])
      } catch (err) {
        failed.push(`${files[i].name}: ${messageOf(err)}`)
      }
    }
    setProgress(null)
    setFailures(failed)
    refresh()
  }

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Photos</h2>
        <p className="mt-1 text-xs text-smoke">
          Drop in the originals, as large as they come. Each is made web ready here and kept in the library, ready to
          be put on any page.
        </p>
        {coarse ? (
          <p className="mt-5 rounded-sm border border-line px-5 py-8 text-center text-sm text-smoke">
            Use a computer to add photos.
          </p>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(false)
              void upload([...e.dataTransfer.files])
            }}
            className={`mt-5 rounded-sm border border-dashed px-5 py-10 text-center transition ${
              over ? 'border-gold bg-gold/5' : 'border-line'
            }`}
          >
            <p className="text-sm text-ink-soft">Drop photos here</p>
            <button type="button" onClick={() => input.current?.click()} disabled={Boolean(progress)} className={`${small} mt-3`}>
              Choose photos
            </button>
            <input
              ref={input}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                const files = [...(e.target.files ?? [])]
                e.target.value = ''
                if (files.length) void upload(files)
              }}
            />
          </div>
        )}
        {progress && <p className="mt-3 text-sm text-ink" aria-live="polite">{progress}</p>}
        {failures.map((f) => (
          <p key={f} className={`mt-2 text-xs ${danger}`}>{f}</p>
        ))}
      </section>

      {error && <p className={`text-sm ${danger}`}>{error}</p>}
      {library && (
        <>
          <section className={panel}>
            <h3 className="font-display text-lg">Added in the dashboard</h3>
            {library.photos.length === 0 ? (
              <p className="mt-3 text-sm text-smoke">Nothing yet.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-8">
                {library.photos.map((p) => (
                  <li key={p.file}>
                    <img src={apiUrl(p.url)} alt="" loading="lazy" className={thumb} />
                    <p className="mt-1 text-[0.65rem] text-smoke">
                      {p.width} × {p.height}
                      {p.published ? '' : ' · not on the site yet'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={panel}>
            <h3 className="font-display text-lg">Already on the site</h3>
            <ul className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-8">
              {library.site.map((path) => (
                <li key={path}>
                  <img src={asset(path)} alt="" loading="lazy" className={thumb} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

export type LibraryChoice = { master: string } | { site: string }

/** Pick a photo for one place: from the library, or one the site already shows. */
export function LibraryPicker({ onPick, onClose }: { onPick: (choice: LibraryChoice) => void; onClose: () => void }) {
  const { library, error } = useLibrary()
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-sm border border-line bg-ivory shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-xl">Choose a photo</h2>
          <button type="button" onClick={onClose} className={small}>Close</button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          {error && <p className={`text-sm ${danger}`}>{error}</p>}
          {!library && !error && <p className="text-sm text-smoke">Opening the library…</p>}
          {library && (
            <>
              <p className="eyebrow text-smoke">Added in the dashboard</p>
              {library.photos.length === 0 && <p className="mt-2 text-sm text-smoke">Nothing yet. Add photos in the Photos tab.</p>}
              <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {library.photos.map((p) => (
                  <li key={p.file}>
                    <button type="button" onClick={() => onPick({ master: p.file })} className="block w-full transition hover:opacity-80">
                      <img src={apiUrl(p.url)} alt="" loading="lazy" className={thumb} />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="eyebrow mt-8 text-smoke">Already on the site</p>
              <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {library.site.map((path) => (
                  <li key={path}>
                    <button type="button" onClick={() => onPick({ site: path })} className="block w-full transition hover:opacity-80">
                      <img src={asset(path)} alt="" loading="lazy" className={thumb} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
