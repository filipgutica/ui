import { nextTick, onMounted, watch } from 'vue'

import type { Ref } from 'vue'

export interface GlideOptions<T> {
  /** The element whose children draw the fill; it takes `data-slide` and the start offsets. */
  container: Readonly<Ref<HTMLElement | null | undefined>>
  /** The selected value. */
  value: () => T
  /** The index of the child that a value selects, or -1. */
  index: (value: T) => number
  /** Names the custom properties `--<prefix>-slide-left` and `--<prefix>-slide-right`, and the
   * keyframes `<prefix>-left-edge` and `<prefix>-right-edge` that read them. */
  prefix: string
}

/*
 * Glides a selection fill between the children of a container, as the segmented thumb and the
 * selected tab do. Each selected child draws its own fill in CSS, which also covers server
 * rendering and resizes. A change of value only starts the new fill where the old one is, and
 * CSS animations glide each edge home. The pre flush reads the old fill before the DOM changes,
 * so no frame shows the fill already moved.
 */
export const useGlide = <T>({ container, value, index, prefix }: GlideOptions<T>): void => {
  const left = `--${prefix}-slide-left`
  const right = `--${prefix}-slide-right`

  // A value set while the page loads, such as a restored choice, shows at once.
  // Glides start only after mount and the first frame, once that has settled.
  let canSlide = false
  onMounted(() => requestAnimationFrame(() => { canSlide = true }))

  // Each change's glide; a newer change makes an older glide's ending irrelevant.
  let current = 0

  const clear = (): void => {
    if (!container.value) return
    delete container.value.dataset.slide
    container.value.style.removeProperty(left)
    container.value.style.removeProperty(right)
  }

  watch(value, (next, previous) => {
    const element = container.value
    if (!element) return
    const from = element.children[index(previous)]
    const to = element.children[index(next)]
    if (!canSlide || !(from instanceof HTMLElement) || !(to instanceof HTMLElement)
      || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clear()
      return
    }
    // An interrupted glide starts from where its fill is now, read before it stops.
    const fromFill = getComputedStyle(from, '::before')
    // No fill is drawn, as in forced colors for tabs, so there is nothing to glide.
    if (fromFill.content === 'none') {
      clear()
      return
    }
    const fromRect = from.getBoundingClientRect()
    const fromLeft = fromRect.left + parseFloat(fromFill.left)
    const fromRight = fromRect.right - parseFloat(fromFill.right)
    const toRect = to.getBoundingClientRect()
    clear()
    element.style.setProperty(left, `${fromLeft - toRect.left}px`)
    element.style.setProperty(right, `${toRect.right - fromRight}px`)
    const direction = toRect.left + toRect.right > fromLeft + fromRight ? 'right' : 'left'
    const trailingEdge = `${prefix}-${direction === 'right' ? 'left' : 'right'}-edge`
    element.dataset.slide = direction
    const glide = ++current
    const end = () => { if (glide === current) clear() }
    // The glide is over when its trailing edge settles: finished, or cancelled by reduced
    // motion or hiding the container, which can happen before the animation ever starts.
    void nextTick(() => {
      const trailing = element.getAnimations({ subtree: true })
        .find(animation => (animation as CSSAnimation).animationName === trailingEdge)
      if (trailing) trailing.finished.then(end, end)
      else end()
    })
  }, { flush: 'pre' })
}
