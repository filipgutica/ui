<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, useId } from 'vue'

import UiButton from '../components/UiButton.vue'
import UiDrawer from '../components/UiDrawer.vue'
import { useActiveSection } from '../use-active-section.js'
import SiteNavLinks from './SiteNavLinks.vue'

export interface UiSiteNavItem {
  label: string
  /** A `#id` link is tracked as the reader scrolls and marked as the current location. */
  href: string
  /** Marks the current page on a multi-page site. */
  current?: boolean
  /** Shows the label in the monospace font, for command or file names. */
  code?: boolean
}

export interface UiSiteNavGroup {
  label?: string
  items: readonly UiSiteNavItem[]
}

export interface UiSiteNavProps {
  /** The visible heading and accessible name of the navigation. */
  label: string
  groups: readonly UiSiteNavGroup[]
}

const { label, groups } = defineProps<UiSiteNavProps>()

// Keep in sync with the max-width: 800px rules for .fg-site-rail in site.css.
const MOBILE_QUERY = '(max-width: 800px)'

const contentId = useId()
const root = ref<HTMLElement>()
const enhanced = ref(false)
const mobile = ref(false)
const open = ref(false)
// Section links are read once; pages keep their in-page links stable.
const activeId = useActiveSection({
  targetIds: groups.flatMap(group => group.items)
    .flatMap(({ href }) => href.startsWith('#') && href.length > 1 ? [href.slice(1)] : []),
})
let media: MediaQueryList | undefined
let destination: HTMLElement | null = null

const toggle = (): HTMLElement | null | undefined => root.value?.querySelector<HTMLElement>('button.fg-site-rail__toggle')
const focusFirstLink = (): void => {
  void nextTick(() => root.value?.querySelector<HTMLElement>('.fg-site-nav a')?.focus({ preventScroll: true }))
}

// Moves focus to the matching control when the rail and the drawer trigger swap.
const syncBreakpoint = (): void => {
  const leavingFocusedRail = media?.matches && !mobile.value
    && root.value?.contains(document.activeElement)
  const leavingFocusedTrigger = media?.matches === false && mobile.value && !open.value
    && toggle() === document.activeElement
  mobile.value = media?.matches === true
  if (!mobile.value) open.value = false
  if (leavingFocusedRail) void nextTick(() => toggle()?.focus({ preventScroll: true }))
  else if (leavingFocusedTrigger) focusFirstLink()
}

const navigate = (href: string, event: MouseEvent): void => {
  if (!open.value || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
  destination = href.startsWith('#') ? document.getElementById(href.slice(1)) : null
  open.value = false
}

const closeAutoFocus = (event: Event): void => {
  if (destination) {
    event.preventDefault()
    destination.tabIndex = -1
    destination.focus({ preventScroll: true })
    destination = null
  } else if (!mobile.value) {
    // The drawer trigger disappears when crossing into the desktop rail.
    event.preventDefault()
    focusFirstLink()
  }
}

onMounted(() => {
  media = matchMedia(MOBILE_QUERY)
  syncBreakpoint()
  enhanced.value = true
  media.addEventListener('change', syncBreakpoint)
})
onUnmounted(() => media?.removeEventListener('change', syncBreakpoint))
</script>

<template>
  <div
    ref="root"
    class="fg-site-rail"
    :data-enhanced="enhanced"
  >
    <!-- Without JavaScript the details element is the phone menu; CSS keeps it open on desktop. -->
    <details
      v-if="!enhanced || !mobile"
      class="fg-site-rail__menu"
      :open="enhanced && !mobile"
    >
      <summary
        class="fg-site-rail__summary"
        :aria-controls="contentId"
      >
        Menu
      </summary>
      <SiteNavLinks
        :content-id="contentId"
        :label="label"
        :groups="groups"
        :active-id="activeId"
      />
    </details>
    <UiDrawer
      v-else
      v-model:open="open"
      title="Navigation"
      @close-auto-focus="closeAutoFocus"
    >
      <template #trigger>
        <UiButton
          variant="ghost"
          size="lg"
          class="fg-site-rail__toggle"
        >
          Menu
        </UiButton>
      </template>
      <SiteNavLinks
        :content-id="contentId"
        :label="label"
        :groups="groups"
        :active-id="activeId"
        @navigate="navigate"
      />
    </UiDrawer>
  </div>
</template>
