import { useEffect } from 'react'

/**
 * Client request: visitors should not be able to download the house's imagery
 * or lift its copy. This blocks image dragging and the copy/save/print
 * keyboard shortcuts.
 *
 * The context menu is deliberately NOT blocked. Suppressing it stopped the
 * team inspecting the page, and it bought little: images carry
 * `pointer-events: none` in index.css, so a right click lands on the wrapping
 * link rather than the picture and "Save image as" never appears for them.
 *
 * This is a deterrent, not DRM — anything rendered in a browser can still be
 * captured.
 */
export function useContentGuard() {
  useEffect(() => {
    /**
     * Where the shortcuts are left alone: form fields, and anything the site
     * deliberately marks as copyable.
     *
     * The second half matters now that the shop is live. An order reference is
     * the only way a customer finds their order again, so blocking Ctrl+C over
     * it would be actively hostile. Those are set `select-all`, which doubles
     * as the marker for this exemption.
     */
    const isEditable = (el: EventTarget | null) => {
      const node = el as HTMLElement | null
      return !!node?.closest?.(
        'input, textarea, select, [contenteditable="true"], .select-all, [data-allow-copy]',
      )
    }

    const onDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'IMG') e.preventDefault()
    }

    /**
     * What is selected, rather than what has focus.
     *
     * A keydown with no field focused targets the body, so checking the event
     * target alone would still block copying text the page has marked as
     * copyable. The selection is what a copy would actually take.
     */
    const selectionIsExempt = () => {
      const selection = window.getSelection?.()
      if (!selection || selection.isCollapsed) return false
      const node = selection.anchorNode
      const el = node?.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node?.parentElement
      return isEditable(el ?? null)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      // Copying an order reference has to keep working; everything else the
      // client asked to deter stays deterred.
      if ((key === 'c' || key === 'x') && selectionIsExempt()) return
      // copy / cut / save / print / view-source
      if (['c', 'x', 's', 'p', 'u'].includes(key)) {
        e.preventDefault()
      }
    }

    document.addEventListener('dragstart', onDragStart)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('dragstart', onDragStart)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
