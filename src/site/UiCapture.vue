<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue'

import UiButton from '../components/UiButton.vue'
import UiDialog from '../components/UiDialog.vue'
import UiTabs from '../components/UiTabs.vue'
import CaptureScreen from './CaptureScreen.vue'

export interface UiCaptureItem {
  id: string
  label: string
  /** Trusted, checked-in terminal markup. It is rendered as HTML. */
  html: string
  /** The command that produced the capture, shown below it. */
  command?: string
}

export interface UiCaptureProps {
  items: readonly UiCaptureItem[]
  /** The accessible name of the tab list. */
  label: string
  /** Prefix for each capture's element ID, so `#frame-<id>` links select its tab. */
  idPrefix?: string
}

const { items, label, idPrefix = 'frame-' } = defineProps<UiCaptureProps>()

/** The active capture ID. Defaults to the first item. */
const model = defineModel<string>()

defineSlots<{
  /** Text shown below the command, such as what the capture shows. */
  caption?(props: { item: UiCaptureItem }): unknown
}>()

const enhanced = ref(false)
const tabs = computed(() => items.map(({ id, label: tabLabel }) => ({ value: id, label: tabLabel })))
const active = computed(() => model.value ?? items[0]?.id ?? '')
const activeItem = computed(() => items.find(({ id }) => id === active.value))

const viewerOpen = ref(false)
const viewed = shallowRef<UiCaptureItem>()
let viewerTrigger: HTMLElement | undefined
let firstFrame = 0
let secondFrame = 0

const openViewer = (item: UiCaptureItem, event: MouseEvent): void => {
  if (event.currentTarget instanceof HTMLElement) viewerTrigger = event.currentTarget
  viewed.value = item
  viewerOpen.value = true
}

const restoreViewerFocus = (event: Event): void => {
  if (!viewerTrigger?.isConnected) return
  event.preventDefault()
  viewerTrigger.focus({ preventScroll: true })
}

const currentHashTarget = (): HTMLElement | null => {
  try {
    return document.getElementById(decodeURIComponent(location.hash.slice(1)))
  } catch {
    // A malformed escape in the hash cannot name an element.
    return null
  }
}

// Enhancement hides inactive captures, so a deep link is realigned after preview sizing settles.
const alignCurrentHash = async (): Promise<void> => {
  await nextTick()
  cancelAnimationFrame(firstFrame)
  cancelAnimationFrame(secondFrame)
  firstFrame = requestAnimationFrame(() => {
    secondFrame = requestAnimationFrame(() => currentHashTarget()?.scrollIntoView({ behavior: 'instant', block: 'start' }))
  })
}

const selectHashCapture = (): boolean => {
  const target = currentHashTarget()
  if (!target) return false
  const item = items.find(({ id }) => document.getElementById(`${idPrefix}${id}`)?.contains(target))
  if (!item || active.value === item.id) return false
  model.value = item.id
  return true
}

const onHashChange = (): void => {
  if (selectHashCapture()) void alignCurrentHash()
}

onMounted(() => {
  enhanced.value = true
  selectHashCapture()
  if (location.hash) void alignCurrentHash()
  window.addEventListener('hashchange', onHashChange)
  window.addEventListener('popstate', onHashChange)
})
onUnmounted(() => {
  cancelAnimationFrame(firstFrame)
  cancelAnimationFrame(secondFrame)
  window.removeEventListener('hashchange', onHashChange)
  window.removeEventListener('popstate', onHashChange)
})
</script>

<template>
  <div
    class="fg-capture"
    :data-enhanced="enhanced"
  >
    <!-- The visible control. Clicking the capture itself is a pointer shortcut for the same viewer. -->
    <button
      v-if="enhanced && activeItem"
      type="button"
      class="fg-capture__full"
      :aria-label="`Expand ${activeItem.label} capture at full size`"
      aria-haspopup="dialog"
      @click="openViewer(activeItem, $event)"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
      <span class="fg-capture__full-label">Full size</span>
    </button>
    <UiTabs
      :model-value="active"
      :items="tabs"
      :label="label"
      @update:model-value="model = $event"
    >
      <template #panel="{ value }">
        <template
          v-for="item in items"
          :key="item.id"
        >
          <figure
            v-if="item.id === value"
            :id="`${idPrefix}${item.id}`"
            class="fg-capture__figure"
          >
            <div class="fg-capture__preview">
              <CaptureScreen
                :html="item.html"
                :label="`Terminal capture: ${item.label}`"
                :fit="enhanced"
              />
              <button
                v-if="enhanced"
                type="button"
                class="fg-capture__expand"
                tabindex="-1"
                aria-hidden="true"
                :title="`Open ${item.label} capture at full size`"
                @click="openViewer(item, $event)"
              />
            </div>
            <figcaption
              v-if="item.command || $slots.caption"
              class="fg-capture__caption"
            >
              <code v-if="item.command">{{ item.command }}</code>
              <slot
                name="caption"
                :item="item"
              />
            </figcaption>
          </figure>
        </template>
      </template>
    </UiTabs>
    <UiDialog
      v-model:open="viewerOpen"
      :title="`${viewed?.label ?? ''} capture`"
      description="Scroll to read the full capture."
      class="fg-capture-viewer"
      @close-auto-focus="restoreViewerFocus"
    >
      <CaptureScreen
        v-if="viewed"
        :html="viewed.html"
        :label="`${viewed.label} capture at full size`"
        :fit="false"
      />
      <template #footer>
        <UiButton
          variant="secondary"
          size="lg"
          @click="viewerOpen = false"
        >
          Close capture
        </UiButton>
      </template>
    </UiDialog>
  </div>
</template>
