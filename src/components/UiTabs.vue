<script setup lang="ts">
import { computed, onMounted, ref, useId, useTemplateRef, watch } from 'vue'

import { useGlide } from '../use-glide.js'

export interface UiTabItem {
  value: string
  label: string
}

export interface UiTabsProps {
  items: readonly UiTabItem[]
  label: string
  modelValue: string
}

const { items, label, modelValue } = defineProps<UiTabsProps>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

defineSlots<{
  panel(props: { value: string }): unknown
}>()

const id = useId()
const enhanced = ref(false)
const activeValue = computed(() => items.some(item => item.value === modelValue)
  ? modelValue
  : items[0]?.value)
const tabId = (value: string): string => `${id}-tab-${encodeURIComponent(value)}`
const panelId = (value: string): string => `${id}-panel-${encodeURIComponent(value)}`
const headingId = (value: string): string => `${id}-heading-${encodeURIComponent(value)}`

onMounted(() => { enhanced.value = true })

// A narrow strip clips later tabs. Keep the selected one in view, on load, after a change, and
// when the strip resizes, by scrolling only the strip; scrollIntoView could also scroll the page.
// The strip's scroll padding keeps the tab clear of a faded edge.
const list = useTemplateRef<HTMLElement>('list')
const revealActive = (): void => {
  const strip = list.value
  const tab = strip?.querySelector<HTMLElement>('[aria-selected="true"]')
  if (!strip || !tab) return
  const bounds = strip.getBoundingClientRect()
  const style = getComputedStyle(strip)
  const start = bounds.left + (Number.parseFloat(style.scrollPaddingLeft) || 0)
  const end = bounds.right - (Number.parseFloat(style.scrollPaddingRight) || 0)
  const { left, right } = tab.getBoundingClientRect()
  if (left < start) strip.scrollLeft -= start - left
  else if (right > end) strip.scrollLeft += right - end
}

// The physical edges that hide tabs. CSS fades them so readers can tell the strip scrolls.
const clipped = ref<'left' | 'right' | 'both'>()
const measureClipping = (): void => {
  const strip = list.value
  if (!strip) return
  const hidden = strip.scrollWidth - strip.clientWidth
  // A right-to-left strip scrolls from 0 toward negative values.
  const fromLeft = getComputedStyle(strip).direction === 'rtl' ? strip.scrollLeft + hidden : strip.scrollLeft
  const left = fromLeft > 1
  const right = fromLeft < hidden - 1
  clipped.value = left && right ? 'both' : left ? 'left' : right ? 'right' : undefined
}

const fit = (): void => {
  revealActive()
  measureClipping()
}
// New or renamed tabs change what the strip clips without resizing a strip already at full width.
watch([enhanced, activeValue, () => items], fit, { flush: 'post', deep: true })
watch(list, (strip, _, onCleanup) => {
  if (!strip || typeof ResizeObserver === 'undefined') return
  const observer = new ResizeObserver(fit)
  observer.observe(strip)
  onCleanup(() => observer.disconnect())
})

// A change of tab glides the selected fill from the old tab, as the segmented thumb does.
useGlide({
  container: list,
  value: () => activeValue.value,
  index: value => items.findIndex(item => item.value === value),
  prefix: 'fg-tabs',
})

const select = (value: string): void => {
  if (value !== activeValue.value) emit('update:modelValue', value)
}

const moveFocus = (event: KeyboardEvent): void => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  const list = event.currentTarget
  const current = event.target
  if (!(list instanceof HTMLElement) || !(current instanceof HTMLButtonElement)) return

  const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
  const index = tabs.indexOf(current)
  if (index < 0 || tabs.length === 0) return

  const rtl = getComputedStyle(list).direction === 'rtl'
  const backwards = event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? tabs.length - 1
      : (index + (backwards ? -1 : 1) + tabs.length) % tabs.length
  const next = tabs[nextIndex]
  if (!next) return
  event.preventDefault()
  next.focus()
  // Focus leaves a partly visible tab where it is; reveal all of it inside the scrolling list.
  next.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}
</script>

<template>
  <div class="fg-tabs">
    <div
      v-if="enhanced"
      ref="list"
      class="fg-tabs__list"
      role="tablist"
      :aria-label="label"
      :data-clipped="clipped"
      @keydown="moveFocus"
      @scroll.passive="measureClipping"
    >
      <button
        v-for="item in items"
        :id="tabId(item.value)"
        :key="item.value"
        type="button"
        class="fg-tabs__tab"
        role="tab"
        :aria-controls="panelId(item.value)"
        :aria-selected="item.value === activeValue"
        :tabindex="item.value === activeValue ? 0 : -1"
        @click="select(item.value)"
        @focus="select(item.value)"
      >
        {{ item.label }}
      </button>
    </div>
    <section
      v-for="item in items"
      :id="panelId(item.value)"
      :key="item.value"
      class="fg-tabs__panel"
      :role="enhanced ? 'tabpanel' : undefined"
      :aria-labelledby="enhanced ? tabId(item.value) : headingId(item.value)"
      :hidden="enhanced && item.value !== activeValue"
      :tabindex="enhanced ? 0 : undefined"
    >
      <h3
        :id="headingId(item.value)"
        class="fg-tabs__heading"
        :hidden="enhanced"
      >
        {{ item.label }}
      </h3>
      <slot
        name="panel"
        :value="item.value"
      />
    </section>
  </div>
</template>
