import type { BannerEntry } from '../../api/_lib/content/schema'
import { focusFrom } from './banner'
import PhotoField, { PhotoPreview } from './PhotoField'
import { small } from './styles'

const FOCUS_HINT = 'Click the photo where the bottle is: phones and wide screens keep that spot in view.'

/**
 * A banner behind a title: its photo, and the spot that stays in view. A title
 * bar is far wider than the photo on a laptop and near square on a phone, so
 * both crop around that spot; the two previews show what each will keep.
 *
 * `hint` says what the banner is for and shows always; how to set the spot
 * shows with the photo it is set on.
 */
export default function BannerField({
  label, value, onChange, disabled, optional = false, hint,
}: {
  label: string
  value?: BannerEntry
  onChange: (next: BannerEntry | undefined) => void
  disabled?: boolean
  /** A collection's banner may be taken away (the shop's own then shows); a page's cannot. */
  optional?: boolean
  hint?: string
}) {
  const focus = value?.focus ?? { x: 0.5, y: 0.5 }
  const position = { objectPosition: `${Math.round(focus.x * 100)}% ${Math.round(focus.y * 100)}%` }
  return (
    <div>
      <PhotoField
        kind="banner"
        label={label}
        value={value?.image}
        // A new photo starts centred: the old spot belonged to the old photo.
        onChange={(image, phone) => onChange(image ? { image, phone: phone ?? image } : undefined)}
        disabled={disabled}
        removable={optional}
      />
      {hint && <p className="mt-1 text-xs text-smoke">{hint}</p>}
      {value && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-smoke">{FOCUS_HINT}</p>
          <div
            role="button"
            tabIndex={-1}
            aria-label="Set the spot that stays in view"
            onClick={(e) => {
              if (disabled) return
              const box = e.currentTarget.getBoundingClientRect()
              onChange({ ...value, focus: focusFrom(e.clientX - box.left, e.clientY - box.top, box.width, box.height) })
            }}
            className="relative max-w-xl cursor-crosshair overflow-hidden rounded-sm"
          >
            <PhotoPreview path={value.image} className="block w-full" />
            <span
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ivory bg-gold shadow"
              style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }}
            />
          </div>
          <div className="flex max-w-xl items-start gap-3">
            <figure className="w-2/3">
              <div className="aspect-[3.5/1] overflow-hidden rounded-sm bg-sand">
                <PhotoPreview path={value.image} className="h-full w-full object-cover" style={position} />
              </div>
              <figcaption className="mt-1 text-[0.68rem] text-smoke">A wide screen</figcaption>
            </figure>
            <figure className="w-1/3">
              <div className="aspect-square overflow-hidden rounded-sm bg-sand">
                <PhotoPreview path={value.phone} className="h-full w-full object-cover" style={position} />
              </div>
              <figcaption className="mt-1 text-[0.68rem] text-smoke">A phone</figcaption>
            </figure>
          </div>
          {value.focus && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                const { focus: _old, ...centred } = value
                onChange(centred)
              }}
              className={small}
            >
              Centre
            </button>
          )}
        </div>
      )}
    </div>
  )
}
