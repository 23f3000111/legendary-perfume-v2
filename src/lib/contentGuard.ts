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
    const isEditable = (el: EventTarget | null) => {
      const node = el as HTMLElement | null
      return !!node?.closest?.('input, textarea, select, [contenteditable="true"]')
    }

    const onDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'IMG') e.preventDefault()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      // copy / cut / save / print / view-source
      if (['c', 'x', 's', 'p', 'u'].includes(e.key.toLowerCase())) {
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
