import type { ProductEntry, ProductsDoc } from '../../api/_lib/content/schema'
import { collectionName, collections } from '../data/collections'
import { insertAt, moveItem } from './blocks'
import { sameContent, useContent } from './contentStore'
import { ContentGate, errorAt } from './fields'
import { issueCount } from './journal'
import ProductForm from './ProductForm'
import { blankProduct, duplicateProduct, pinReason } from './products'
import PublishBar from './PublishBar'
import { danger, panel, small } from './styles'

/**
 * The shop's products as pages: every product in shelf order, to write a new
 * one, copy, reorder or remove, and one product at a time in the form.
 *
 * `open` is the address of the product in the form, or null for the list. It
 * belongs to the Products tab, so the price table's "Edit page" can open a
 * product here too.
 */
export default function ProductsEditor({ open, onOpen }: { open: string | null; onOpen: (id: string | null) => void }) {
  return (
    <ContentGate>
      <Editor open={open} onOpen={onOpen} />
    </ContentGate>
  )
}

function Editor({ open, onOpen }: { open: string | null; onOpen: (id: string | null) => void }) {
  const doc = useContent((s) => s.docs.products)
  const edit = useContent((s) => s.edit)
  const busy = useContent((s) => s.publishing.state === 'publishing')
  if (!doc) return null

  const data = doc.working as ProductsDoc
  const live = (doc.published as ProductsDoc | null)?.products ?? []
  const publishedIds = new Set(live.map((p) => p.id))
  const setProducts = (products: ProductEntry[]) => edit('products', { ...data, products })
  const taken = (except: number) => new Set(data.products.filter((_, i) => i !== except).map((p) => p.id))

  // The product in the form, found by its address. If the list changed under
  // it (a discard dropped a new product, say), the form gives way to the list.
  const index = open === null ? -1 : data.products.findIndex((p) => p.id === open)
  if (index >= 0) {
    const product = data.products[index]
    return (
      <div className="space-y-8">
        <button type="button" onClick={() => onOpen(null)} className="text-xs text-smoke underline transition hover:text-ink">
          All products
        </button>
        <ProductForm
          product={product}
          published={publishedIds.has(product.id)}
          publishedIds={publishedIds}
          taken={taken(index)}
          onChange={(next) => {
            setProducts(data.products.map((p, i) => (i === index ? next : p)))
            if (next.id !== product.id) onOpen(next.id)
          }}
          err={(path) => errorAt(doc.errors, `products.${index}.${path}`)}
          busy={busy}
        />
        <PublishBar docs={['products']} previewPath={`/product/${product.id}`} />
      </div>
    )
  }

  const create = () => {
    const fresh = blankProduct(new Set([...data.products.map((p) => p.id), ...publishedIds]), collections[0])
    setProducts([...data.products, fresh])
    onOpen(fresh.id)
  }
  const duplicate = (i: number) => {
    const copy = duplicateProduct(data.products[i], new Set([...data.products.map((p) => p.id), ...publishedIds]))
    setProducts(insertAt(data.products, i + 1, copy))
    onOpen(copy.id)
  }
  const remove = (i: number) => {
    const product = data.products[i]
    const reason = pinReason(product.id)
    if (reason) {
      window.alert(`${reason} It cannot be removed here; hide it from the shop in the price table instead.`)
      return
    }
    const name = product.name || 'this product'
    const question = publishedIds.has(product.id)
      ? `Remove "${name}"? It leaves the shop and its page stops working once you publish.`
      : `Remove "${name}"?`
    if (!window.confirm(question)) return
    setProducts(data.products.filter((_, j) => j !== i))
  }
  const listError = errorAt(doc.errors, 'products')

  return (
    <div className="space-y-8">
      <section className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Products on the shop</h2>
            <p className="mt-1 text-xs text-smoke">In the order the shop shows them. Each product's page, words and photos.</p>
          </div>
          <button type="button" onClick={create} disabled={busy} className={small}>
            New product
          </button>
        </div>
        {listError && <p className={`mt-3 text-xs ${danger}`}>{listError}</p>}
        <ul className="mt-5 divide-y divide-line">
          {data.products.map((product, i) => {
            const isNew = !publishedIds.has(product.id)
            const changed = !isNew && !sameContent(product, live.find((p) => p.id === product.id))
            const issues = issueCount(doc.errors, i, 'products')
            const control = 'text-xs text-smoke transition hover:text-ink disabled:opacity-30'
            return (
              <li key={`${i}:${product.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{product.name || 'Unnamed product'}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-smoke">
                    <span>
                      {collectionName(product)}
                      {product.price ? ` · RM ${product.price}` : ''}
                    </span>
                    {isNew && <Tag>New</Tag>}
                    {changed && <Tag>Changed</Tag>}
                    {issues > 0 && <span className={danger}>Needs attention</span>}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <button type="button" onClick={() => onOpen(product.id)} className={small}>
                    Edit
                  </button>
                  <button type="button" onClick={() => duplicate(i)} disabled={busy} className={control}>
                    Duplicate
                  </button>
                  <button type="button" onClick={() => setProducts(moveItem(data.products, i, i - 1))} disabled={busy || i === 0} className={control}>
                    Move up
                  </button>
                  <button
                    type="button"
                    onClick={() => setProducts(moveItem(data.products, i, i + 1))}
                    disabled={busy || i === data.products.length - 1}
                    className={control}
                  >
                    Move down
                  </button>
                  <button type="button" onClick={() => remove(i)} disabled={busy} className={`${control} hover:text-[#A4352C]`}>
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <PublishBar docs={['products']} previewPath="/shop" />
    </div>
  )
}

function Tag({ children }: { children: string }) {
  return <span className="rounded-sm border border-line px-1.5 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-ink-soft">{children}</span>
}
