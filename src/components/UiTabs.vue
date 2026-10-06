<script setup lang="ts">
import { computed, onMounted, ref, useId } from 'vue'

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
}
</script>

<template>
  <div class="fg-tabs">
    <div
      v-if="enhanced"
      class="fg-tabs__list"
      role="tablist"
      :aria-label="label"
      @keydown="moveFocus"
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
