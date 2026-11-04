import { onMounted, onUnmounted, readonly, ref } from 'vue'
import type { Ref } from 'vue'

export interface ActiveSectionOptions {
  /** Section IDs in page order. Missing elements are ignored after mounting. */
  targetIds: readonly string[]
}

interface Jump {
  id: string
  /** The scroll position that brings the section to the inset, clamped to the scroll range. */
  landing: number
  /** The closest the scroll position has come to the landing since the jump. */
  closest: number
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
    const root = document.documentElement
    const insetOf = (): number => Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0

    // After a jump (a section link, a hash change, or a deep link) the target stays current
    // until the reader scrolls away from where the jump lands, because a short page cannot
    // scroll the target to the top. Moving toward the landing, as a smooth scroll does, keeps it.
    let jump: Jump | undefined
    const update = (): void => {
      frame = undefined
      if (jump) {
        const distance = Math.abs(window.scrollY - jump.landing)
        if (distance > jump.closest + 2) jump = undefined
        else jump.closest = Math.min(jump.closest, distance)
      }
      const inset = insetOf()
      let current = targets[0]?.id
      for (const target of targets) {
        if (target.element.getBoundingClientRect().top <= inset + 1) current = target.id
      }
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= root.scrollHeight - 2) {
        current = targets.at(-1)?.id
      }
      activeId.value = jump?.id ?? current
    }
    const schedule = (): void => {
      if (frame === undefined) frame = requestAnimationFrame(update)
    }
    const jumpTo = (id: string): void => {
      const target = targets.find(candidate => candidate.id === id)
      // A jump to an empty or untracked hash, such as going back to the page's own URL, ends a
      // held jump, so the scroll position decides again.
      jump = undefined
      if (target) {
        const range = Math.max(0, root.scrollHeight - window.innerHeight)
        const offset = window.scrollY + target.element.getBoundingClientRect().top - insetOf()
        const landing = Math.min(Math.max(offset, 0), range)
        jump = { id, landing, closest: Math.abs(window.scrollY - landing) }
      }
      schedule()
    }
    const followHash = (): void => jumpTo(location.hash.slice(1))
    // A second click on the same link changes no hash, so clicks start a jump too.
    const followClick = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const href = event.target instanceof Element
        ? event.target.closest('a[href^="#"]')?.getAttribute('href')
        : undefined
      if (href) jumpTo(href.slice(1))
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('pageshow', schedule)
    window.addEventListener('hashchange', followHash)
    document.addEventListener('click', followClick)
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
      window.removeEventListener('hashchange', followHash)
      document.removeEventListener('click', followClick)
      document.body.removeEventListener('transitionend', schedule)
    }
    if (location.hash) followHash()
    update()
  })

  onUnmounted(() => {
    removeListeners?.()
    observer?.disconnect()
    if (frame !== undefined) cancelAnimationFrame(frame)
  })

  return readonly(activeId)
}
