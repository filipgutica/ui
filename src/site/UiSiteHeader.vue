<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'

import type { SiteAppearanceChoice } from './appearance.js'
import type { SiteProjectId } from './projects.js'

import { useSiteAppearance } from './appearance.js'
import { SITE_PROJECTS } from './projects.js'

export interface UiSiteLink {
  label: string
  href: string
}

export interface UiSiteHeaderProps {
  /** The site this header belongs to. It is marked as current in the project menu. */
  project: SiteProjectId
  /** Page links shown beside the appearance control, such as a user guide or releases. */
  links?: readonly UiSiteLink[]
}

const { project, links = [] } = defineProps<UiSiteHeaderProps>()

defineSlots<{
  /** Replaces the System, Light, and Dark picker with a page-specific appearance control. */
  default?(): unknown
}>()

const appearanceChoices: readonly { value: SiteAppearanceChoice, label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const currentLabel = computed(() => SITE_PROJECTS.find(({ id }) => id === project)?.label ?? project)

// Without a slot the header owns the shared picker. The page's own control
// must not also write to the shared choice.
const appearance = useSlots().default ? undefined : useSiteAppearance()

// The project menu works without JavaScript. The picker needs it, so it is only
// rendered once mounted, which also keeps hydration identical to the server output.
const mounted = ref(false)
const menu = ref<HTMLDetailsElement>()
const trigger = ref<HTMLElement>()

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
  document.addEventListener('pointerdown', onDocumentPointerdown)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerdown))

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
          class="fg-site-projects__trigger"
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
            v-for="item in SITE_PROJECTS"
            :key="item.id"
            :href="item.href"
            :aria-current="item.id === project ? 'page' : undefined"
          >{{ item.label }}</a>
        </nav>
      </details>

      <div class="fg-site-header__end">
        <nav
          v-if="links.length > 0"
          class="fg-site-header__links"
          aria-label="Site links"
        >
          <a
            v-for="link in links"
            :key="link.href"
            :href="link.href"
          >{{ link.label }}</a>
        </nav>
        <slot>
          <div
            v-if="mounted && appearance"
            class="fg-site-appearance"
            role="group"
            aria-label="Color theme"
          >
            <button
              v-for="choice in appearanceChoices"
              :key="choice.value"
              type="button"
              class="fg-site-appearance__choice"
              :aria-label="`${choice.label} theme`"
              :title="`${choice.label} theme`"
              :aria-pressed="appearance.choice.value === choice.value"
              @click="appearance.chooseAppearance(choice.value)"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <template v-if="choice.value === 'system'">
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="13"
                    rx="2"
                  />
                  <path d="M8 21h8m-4-4v4" />
                </template>
                <template v-else-if="choice.value === 'light'">
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                  />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
                </template>
                <path
                  v-else
                  d="M20.5 13.5A9 9 0 0 1 10.5 3a9 9 0 1 0 10 10.5Z"
                />
              </svg>
            </button>
          </div>
        </slot>
      </div>
    </div>
  </header>
</template>
