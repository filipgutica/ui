<template>
  <RadioGroupRoot
    v-model="model"
    class="fg-radio-card-group"
    :disabled="disabled"
    :loop="loop"
    v-bind="orientation === undefined ? {} : { orientation }"
    @keydown="selectFocusedCard"
  >
    <slot />
  </RadioGroupRoot>
</template>

<script setup lang="ts">
import { RadioGroupRoot } from 'reka-ui'

export interface UiRadioCardGroupProps {
  disabled?: boolean
  loop?: boolean
  orientation?: 'horizontal' | 'vertical'
}

const {
  disabled = false,
  loop = true,
  orientation = undefined,
} = defineProps<UiRadioCardGroupProps>()

const model = defineModel<string>({ required: true })

const selectFocusedCard = (event: KeyboardEvent): void => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const root = event.currentTarget
  const current = event.target
  if (!(root instanceof HTMLElement) || !(current instanceof HTMLElement)) return

  const isHorizontalKey = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
  const isVerticalKey = event.key === 'ArrowUp' || event.key === 'ArrowDown'
  if (
    (!isHorizontalKey && !isVerticalKey && event.key !== 'Home' && event.key !== 'End')
    || (orientation === 'horizontal' && isVerticalKey)
    || (orientation === 'vertical' && isHorizontalKey)
  ) return

  const cards = [...root.querySelectorAll<HTMLElement>('[role="radio"]')]
    .filter(card => !card.hasAttribute('data-disabled') && card.getAttribute('aria-disabled') !== 'true')
  const currentIndex = cards.indexOf(current)
  if (currentIndex < 0 || cards.length === 0) return

  const rightToLeft = getComputedStyle(root).direction === 'rtl'
  const movesBackward = event.key === 'ArrowUp'
    || (event.key === 'ArrowLeft' && !rightToLeft)
    || (event.key === 'ArrowRight' && rightToLeft)
  let nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? cards.length - 1
      : currentIndex + (movesBackward ? -1 : 1)

  if (nextIndex < 0 || nextIndex >= cards.length) {
    if (!loop) return
    nextIndex = (nextIndex + cards.length) % cards.length
  }

  const nextCard = cards[nextIndex]
  if (!nextCard || nextCard === current) return
  event.preventDefault()
  nextCard.focus()
  nextCard.click()
}
</script>
