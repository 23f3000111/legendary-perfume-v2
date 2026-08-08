import { useEffect } from 'react'

/**
 * Client request: visitors should not be able to download the house's imagery
 * or lift its copy. This blocks the context menu, image dragging and the
 * copy/save/print keyboard shortcuts.
 *
 * This is a deterrent, not DRM — anything rendered in a browser can still be
 * captured. It stops the casual right-click → "Save image as".
 */
export function useContentGuard() {
  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const node = el as HTMLElement | null
      return !!node?.closest?.('input, textarea, select, [contenteditable="true"]')
    }

    const onContextMenu = (e: MouseEvent) => {
      if (isEditable(e.target)) return
      e.preventDefault()
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

    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('dragstart', onDragStart)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('dragstart', onDragStart)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
