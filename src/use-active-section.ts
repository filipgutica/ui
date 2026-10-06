import { onMounted, onUnmounted, readonly, ref } from 'vue'
import type { Ref } from 'vue'

export interface ActiveSectionOptions {
  /** Section IDs in page order. Missing elements are ignored after mounting. */
  targetIds: readonly string[]
}

/** Tracks the last section heading above the document's scroll-padding inset. */
export const useActiveSection = ({ targetIds }: ActiveSectionOptions): Readonly<Ref<string | undefined>> => {
  const activeId = ref<string | undefined>(targetIds[0])
  let frame: number | undefined
  let observer: ResizeObserver | undefined
  let removeListeners: (() => void) | undefined

  onMounted(() => {
    const targets = targetIds.flatMap(id => {
      const element = document.getElementById(id)
      return element ? [{ id, element }] : []
    })
    const update = (): void => {
      frame = undefined
      const root = document.documentElement
      const inset = Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0
      let current = targets[0]?.id
      for (const target of targets) {
        if (target.element.getBoundingClientRect().top <= inset + 1) current = target.id
      }
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= root.scrollHeight - 2) {
        current = targets.at(-1)?.id
      }
      activeId.value = current
    }
    const schedule = (): void => {
      if (frame === undefined) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('pageshow', schedule)
    // Transforms can move headings without changing their observed dimensions.
    document.body.addEventListener('transitionend', schedule)
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(schedule)
      observer.observe(document.body)
    }
    removeListeners = () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('pageshow', schedule)
      document.body.removeEventListener('transitionend', schedule)
    }
    update()
  })

  onUnmounted(() => {
    removeListeners?.()
    observer?.disconnect()
    if (frame !== undefined) cancelAnimationFrame(frame)
  })

  return readonly(activeId)
}
