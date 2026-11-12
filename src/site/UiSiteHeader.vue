<script setup lang="ts">
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useSlots, useTemplateRef, watch } from 'vue'

import type { ListedSiteProject, SiteProjectId } from './projects.js'

import { useSiteAppearance } from './appearance.js'
import { loadSiteProjects, SITE_PROJECTS, SITE_PROJECTS_URL } from './projects.js'
import UiSiteAppearancePicker from './UiSiteAppearancePicker.vue'

export interface UiSiteLink {
  label: string
  href: string
  /** Marks the page this link points to as the current page. */
  current?: boolean
}

export interface UiSiteHeaderProps {
  /**
   * The site this header belongs to, by its id in the project list. It is marked as current in
   * the project menu. Any string is accepted, so a site that is only in the published list works.
   */
  // `string & {}` keeps editor completion for the known ids while accepting any other string.
  project: SiteProjectId | (string & {})
  /** Page links shown beside the appearance control, such as a user guide or releases. */
  links?: readonly UiSiteLink[]
  /**
   * Where the project menu loads the published project list after mount. Defaults to the list
   * ui's docs site publishes. `null` keeps the list built into the package and fetches nothing.
   */
  projectsUrl?: string | null
}

const { project, links = [], projectsUrl = SITE_PROJECTS_URL } = defineProps<UiSiteHeaderProps>()

defineSlots<{
  /** Replaces the System, Light, and Dark picker with a page-specific appearance control. */
  default?(): unknown
}>()

// The server render and first paint use the built-in list; the published list replaces it after mount.
const loadedProjects = shallowRef<readonly ListedSiteProject[]>(SITE_PROJECTS)

// A site missing from the published list keeps its own entry, where the built-in list has it.
const projects = computed(() => {
  const list = loadedProjects.value
  if (list.some(({ id }) => id === project)) return list
  const index = SITE_PROJECTS.findIndex(({ id }) => id === project)
  const own = SITE_PROJECTS[index]
  if (!own) return list
  return [...list.slice(0, index), own, ...list.slice(index)]
})

const currentLabel = computed(() => projects.value.find(({ id }) => id === project)?.label ?? project)

// Without a slot the header owns the shared picker. The page's own control
// must not also write to the shared choice.
const appearance = useSlots().default ? undefined : useSiteAppearance()

// The project menu works without JavaScript. The picker needs it, so it is only
// rendered once mounted, which also keeps hydration identical to the server output.
const mounted = ref(false)
const menu = ref<HTMLDetailsElement>()
const trigger = ref<HTMLElement>()

// The site links scroll sideways where they do not fit, as on a phone. An edge that hides more
// than 12px of them fades, so the reader can tell the strip scrolls; a smaller overflow is padding.
const strip = useTemplateRef<HTMLElement>('strip')
const clip = ref<string>()
const measureClip = (): void => {
  const element = strip.value
  if (!element) return
  const hidden = element.scrollWidth - element.clientWidth
  const ends = [element.scrollLeft > 12 && 'start', hidden - element.scrollLeft > 12 && 'end'].filter(Boolean)
  clip.value = ends.length > 0 ? ends.join(' ') : undefined
}
// The strip starts with the current page in view, centred where it can be. It scrolls only the
// strip, at once, so the page never moves.
const revealCurrent = (): void => {
  const element = strip.value
  const current = element?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!element || !current) return
  const hidden = element.scrollWidth - element.clientWidth
  if (hidden <= 0) return
  const box = element.getBoundingClientRect()
  const row = current.getBoundingClientRect()
  const left = element.scrollLeft + (row.left + row.width / 2) - (box.left + box.width / 2)
  element.scrollTo({ left: Math.min(Math.max(left, 0), hidden), behavior: 'instant' })
}
// Once the reader moves the strip, it stays where they put it.
let moved = false
const markMoved = (): void => {
  moved = true
}
useResizeObserver(strip, measureClip)
useEventListener(strip, 'scroll', measureClip, { passive: true })
useEventListener(strip, ['wheel', 'pointerdown', 'touchstart', 'keydown'], markMoved, { passive: true })
// New or renamed links, and web fonts that finish loading after mount, change what the strip clips
// without resizing it. The font listeners are added on mount.
watch(() => links, measureClip, { deep: true, flush: 'post' })
let fonts: FontFaceSet | undefined

const closeMenu = (): void => {
  if (menu.value) menu.value.open = false
}

const onKeydown = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape' || !menu.value?.open) return
  closeMenu()
  trigger.value?.focus()
}

const onFocusout = (event: FocusEvent): void => {
  if (event.relatedTarget instanceof Node && !menu.value?.contains(event.relatedTarget)) closeMenu()
}

const onDocumentPointerdown = (event: PointerEvent): void => {
  if (event.target instanceof Node && !menu.value?.contains(event.target)) closeMenu()
}

onMounted(() => {
  mounted.value = true
  if (projectsUrl) {
    void loadSiteProjects(projectsUrl).then((list) => {
      if (list) loadedProjects.value = list
    })
  }
  document.addEventListener('pointerdown', onDocumentPointerdown)
  revealCurrent()
  measureClip()
  fonts = 'fonts' in document ? document.fonts : undefined
  fonts?.addEventListener('loadingdone', measureClip)
  // The fallback face's widths placed the current page; place it again in the loaded face, unless
  // the reader has moved the strip since.
  void fonts?.ready.then(() => {
    if (!moved) revealCurrent()
    measureClip()
  })
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerdown)
  fonts?.removeEventListener('loadingdone', measureClip)
})

</script>

<template>
  <header class="fg-site-header">
    <div class="fg-site-header__inner">
      <details
        ref="menu"
        class="fg-site-projects"
        @keydown="onKeydown"
        @focusout="onFocusout"
      >
        <summary
          ref="trigger"
          class="fg-site-projects__trigger fg-quiet-action"
          :aria-label="`Project: ${currentLabel}`"
        >
          <span>{{ currentLabel }}</span>
          <svg
            class="fg-site-projects__chevron"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </summary>
        <nav
          class="fg-site-projects__menu fg-site-nav"
          aria-label="Projects"
        >
          <a
            v-for="item in projects"
            :key="item.id"
            :href="item.href"
            :aria-current="item.id === project ? 'page' : undefined"
          >{{ item.label }}</a>
        </nav>
      </details>

      <div class="fg-site-header__end">
        <nav
          v-if="links.length > 0"
          ref="strip"
          class="fg-site-header__links fg-site-nav"
          aria-label="Site links"
          :data-clip="clip"
        >
          <a
            v-for="link in links"
            :key="link.href"
            :href="link.href"
            :aria-current="link.current ? 'page' : undefined"
          >{{ link.label }}</a>
        </nav>
        <slot>
          <UiSiteAppearancePicker
            v-if="mounted && appearance"
            class="fg-site-header__appearance"
            :model-value="appearance.choice.value"
            @update:model-value="appearance.chooseAppearance"
          />
        </slot>
      </div>
    </div>
  </header>
</template>
