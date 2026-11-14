import type { SiteDoc } from '../../api/_lib/content/schema'
import { useContent } from './contentStore'
import { errorAt, TextArea, TextField } from './fields'
import PublishBar from './PublishBar'
import { panel } from './styles'

/**
 * The house's contact details and links, as every page uses them: the
 * WhatsApp number every WhatsApp button opens, the address search engines are
 * given, the social links and the Contact page's head office.
 */
export default function SiteDetailsEditor() {
  const doc = useContent((s) => s.docs.site)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null
  const data = doc.working as SiteDoc
  const err = (path: string) => errorAt(doc.errors, path)
  const set = (next: SiteDoc) => edit('site', next)

  return (
    <div className="space-y-8">
      <section className={panel}>
        <h2 className="font-display text-xl">Contact</h2>
        <div className="mt-5 space-y-5">
          <TextField
            label="WhatsApp number"
            hint="Shown on the Contact and FAQ pages, and used by every WhatsApp button. The FAQ answers and the policies write the number out in their own words: change it there too."
            value={data.whatsapp}
            onChange={(whatsapp) => set({ ...data, whatsapp })}
            error={err('whatsapp')}
            disabled={busy}
          />
          <TextField
            label="Email"
            hint="Given to search engines as the house's address. The FAQ and the privacy policy write it out in their own words."
            value={data.email}
            onChange={(email) => set({ ...data, email })}
            error={err('email')}
            disabled={busy}
          />
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Social links</h2>
        <div className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Instagram name"
              hint="As the Contact page shows it."
              value={data.instagram.handle}
              onChange={(handle) => set({ ...data, instagram: { ...data.instagram, handle } })}
              error={err('instagram.handle')}
              disabled={busy}
            />
            <TextField
              label="Instagram address"
              value={data.instagram.url}
              onChange={(url) => set({ ...data, instagram: { ...data.instagram, url } })}
              error={err('instagram.url')}
              disabled={busy}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Facebook name"
              hint="As the Contact page shows it."
              value={data.facebook.handle}
              onChange={(handle) => set({ ...data, facebook: { ...data.facebook, handle } })}
              error={err('facebook.handle')}
              disabled={busy}
            />
            <TextField
              label="Facebook address"
              value={data.facebook.url}
              onChange={(url) => set({ ...data, facebook: { ...data.facebook, url } })}
              error={err('facebook.url')}
              disabled={busy}
            />
          </div>
          <TextField
            label="TikTok address"
            hint="The footer's TikTok button."
            value={data.tiktok}
            onChange={(tiktok) => set({ ...data, tiktok })}
            error={err('tiktok')}
            disabled={busy}
          />
          <TextField
            label="Shopee shop address"
            hint="Given to search engines with the other links."
            value={data.shopee}
            onChange={(shopee) => set({ ...data, shopee })}
            error={err('shopee')}
            disabled={busy}
          />
        </div>
      </section>

      <section className={panel}>
        <h2 className="font-display text-xl">Head office</h2>
        <p className="mt-1 text-xs text-smoke">On the Contact page, with its map.</p>
        <div className="mt-5 space-y-5">
          <TextField
            label="Name"
            value={data.office.name}
            onChange={(name) => set({ ...data, office: { ...data.office, name } })}
            error={err('office.name')}
            disabled={busy}
          />
          <TextArea
            label="Address"
            rows={2}
            value={data.office.address}
            onChange={(address) => set({ ...data, office: { ...data.office, address } })}
            error={err('office.address')}
            disabled={busy}
          />
          <TextField
            label="Map search"
            hint="What Get directions asks Google Maps to find."
            value={data.office.mapQuery}
            onChange={(mapQuery) => set({ ...data, office: { ...data.office, mapQuery } })}
            error={err('office.mapQuery')}
            disabled={busy}
          />
          <TextField
            label="Map embed address"
            hint='From Google Maps: Share, then Embed a map. Copy the address inside src="…".'
            value={data.office.mapEmbed}
            onChange={(mapEmbed) => set({ ...data, office: { ...data.office, mapEmbed } })}
            error={err('office.mapEmbed')}
            disabled={busy}
          />
        </div>
      </section>

      <PublishBar docs={['site']} previewPath="/contact" />
    </div>
  )
}
