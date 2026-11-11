<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useSlots } from 'vue'

import type { ListedSiteProject, SiteProjectId } from './projects.js'

import { useSiteAppearance } from './appearance.js'
import { loadSiteProjects, SITE_PROJECTS, SITE_PROJECTS_URL } from './projects.js'
import { useSiteHeaderShell } from './site-shell.js'
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
const bar = ref<HTMLElement>()
const siteHeaderShell = useSiteHeaderShell()

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
  // A section rail with headerMenu puts its phone Find and Menu buttons in the bar, and repeats
  // the links and the picker in its drawer. The getter keeps the links reactive.
  if (bar.value) siteHeaderShell.value = { bar: bar.value, get links() { return links }, appearance }
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerdown)
  if (siteHeaderShell.value?.bar === bar.value) siteHeaderShell.value = undefined
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
          class="fg-site-header__links fg-site-nav"
          aria-label="Site links"
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
      <!-- Empty unless a section rail with headerMenu puts its phone Find and Menu buttons here. -->
      <div
        ref="bar"
        class="fg-site-header__bar"
      />
    </div>
  </header>
</template>
