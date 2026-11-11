<script setup lang="ts">
import type { UiSiteFindScope } from './find-scope.js'

import { createReusableTemplate, useStorage } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'

import UiButton from '../components/UiButton.vue'
import UiDrawer from '../components/UiDrawer.vue'
import UiSwitch from '../components/UiSwitch.vue'
import { useActiveSection } from '../use-active-section.js'
import { siteHeaderShell } from './site-shell.js'
import SiteNavLinks from './SiteNavLinks.vue'
import UiSiteAppearancePicker from './UiSiteAppearancePicker.vue'

export interface UiSiteNavItem {
  label: string
  /** A `#id` link is tracked as the reader scrolls and marked as the current location. */
  href: string
  /** Marks the current page on a multi-page site. */
  current?: boolean
  /** Shows the label in the monospace font, for command or file names. */
  code?: boolean
  /** More words Find matches besides the label and the group label, such as a purpose or aliases. */
  terms?: string
}

export interface UiSiteNavGroup {
  label?: string
  items: readonly UiSiteNavItem[]
}

export interface UiSiteNavFind {
  /** The field's accessible name and placeholder, and the phone Find button's name, such as "Find a component". */
  label: string
  /** What a row is, for the empty state: "No component matches “query”." Defaults to "section". */
  noun?: string
}

export interface UiSiteNavProps {
  /** The visible heading and accessible name of the navigation. */
  label: string
  groups: readonly UiSiteNavGroup[]
  /** Adds a Find field above the rows that filters them as the reader types, with a `/` shortcut. */
  find?: UiSiteNavFind
  /**
   * At 800px and below, puts icon-only Find and Menu buttons in the `UiSiteHeader` row instead of
   * the labelled trigger. The Menu drawer holds Find, the header's links and appearance picker, and
   * the rows. Without a site header on the page, the labelled trigger stays.
   */
  headerMenu?: boolean
}

const { label, groups, find = undefined, headerMenu = false } = defineProps<UiSiteNavProps>()

// Keep in sync with the max-width: 800px rules for .fg-site-rail in site.css.
const MOBILE_QUERY = '(max-width: 800px)'
// Shared by every site in the family, as the appearance choice is.
const SHORTCUTS_KEY = 'tool-site-shortcuts'

const contentId = useId()
const statusId = useId()
const root = ref<HTMLElement>()
const enhanced = ref(false)
const mobile = ref(false)
const open = ref(false)
// Section links are read once; pages keep their in-page links stable.
const activeId = useActiveSection({
  targetIds: groups.flatMap(group => group.items)
    .flatMap(({ href }) => href.startsWith('#') && href.length > 1 ? [href.slice(1)] : []),
})
const currentPage = computed(() => groups.flatMap(group => group.items).find(item => item.current)?.label)
const currentSection = computed(() => groups.flatMap(group => group.items).find(item => item.href === `#${activeId.value}`)?.label)
const disclosureLabel = computed(() => {
  const current = currentPage.value ?? currentSection.value
  return current ? `${label}: ${current}` : label
})
// The site header that holds the phone Find and Menu buttons, while it applies.
const headerShell = computed(() => headerMenu && enhanced.value && mobile.value ? siteHeaderShell.value : undefined)
let media: MediaQueryList | undefined
let destination: HTMLElement | null = null

const toggle = (): HTMLElement | null | undefined => headerShell.value
  ? headerShell.value.bar.querySelector<HTMLElement>('.fg-site-header__menu')
  : root.value?.querySelector<HTMLElement>('button.fg-site-rail__toggle')
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

// How the drawer opens decides where focus goes. A keyboard open moves focus to the current row;
// a tap moves it to the drawer, so no ring shows and no on-screen keyboard opens; Find focuses
// the field. The labelled trigger opens without one and keeps the dialog's own focus.
let opening: { toFind?: boolean; byPointer?: boolean; select?: boolean } | undefined
// The phone buttons are not the dialog's trigger, so focus returns to whichever one opened it.
let opener: HTMLElement | undefined
const openMenu = (how: NonNullable<typeof opening>): void => {
  opening = how
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
  open.value = true
}

// Scrolls a list so a row sits at its centre. It sets the list's own scrollTop, so the page never moves.
const centre = (box: HTMLElement, row: HTMLElement): void => {
  const a = box.getBoundingClientRect()
  const b = row.getBoundingClientRect()
  box.scrollTop += b.top - a.top - a.height / 2 + b.height / 2
}

const openAutoFocus = (event: Event): void => {
  const how = opening
  opening = undefined
  if (!how || !(event.target instanceof HTMLElement)) return
  event.preventDefault()
  const dialog = event.target
  const body = dialog.querySelector<HTMLElement>('.fg-drawer__body')
  const current = dialog.querySelector<HTMLElement>('.fg-site-rail__nav a[aria-current]:not([hidden])')
  if (body && current) centre(body, current)
  const field = dialog.querySelector<HTMLInputElement>('.fg-site-find__input')
  if (field && (how.toFind || !current)) {
    field.focus({ preventScroll: true })
    if (how.select) field.select()
  } else if (how.byPointer || !current) dialog.focus({ preventScroll: true })
  else current.focus({ preventScroll: true })
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
  } else if (opener) {
    event.preventDefault()
    opener.focus({ preventScroll: true })
  }
  opener = undefined
}

// Find filters the rows only, never the page, so deep links and the page order stay stable. Every
// word must appear in a row's terms: its label, its group's label, and its own terms. The count is
// announced after a pause. A page can hook its own content in through window.findScope.
const query = ref('')
const findStatus = ref('')
// undefined shows every row.
const visible = ref<ReadonlySet<UiSiteNavItem>>()
let announce: ReturnType<typeof setTimeout> | undefined
watch(query, (value) => {
  const words = value.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const scope: UiSiteFindScope | undefined = window.findScope
  const result = scope?.filter(words)
  const shown = new Set<UiSiteNavItem>()
  for (const group of groups) {
    for (const item of group.items) {
      const terms = [item.label, group.label, item.terms].filter(Boolean).join(' ').toLowerCase()
      const keep = scope ? scope.keeps(new URL(item.href, location.href)) : words.every(word => terms.includes(word))
      if (keep) shown.add(item)
    }
  }
  visible.value = words.length || scope ? shown : undefined
  const { count, one, many } = result ?? { count: shown.size, one: 'match', many: 'matches' }
  clearTimeout(announce)
  announce = setTimeout(() => {
    findStatus.value = words.length ? (count ? `${count} ${count === 1 ? one : many}` : `No ${many}`) : ''
  }, 500)
})

// The / shortcut can be turned off (WCAG 2.1.4); the choice is saved.
const shortcuts = useStorage(SHORTCUTS_KEY, true, undefined, {
  initOnMounted: true,
  writeDefaults: false,
  onError: () => {
    // Storage can be unavailable. The choice then lasts for this visit.
  },
  serializer: { read: raw => raw !== 'off', write: value => (value ? 'on' : 'off') },
})

const findField = (): HTMLInputElement | null => document.querySelector<HTMLInputElement>(`[aria-describedby="${statusId}"]`)
const firstMatch = (field: HTMLElement): HTMLAnchorElement | null | undefined => field
  .closest('.fg-site-rail__content')
  ?.querySelector<HTMLAnchorElement>('.fg-site-rail__group:not([hidden]) a:not([hidden])')

// Goes to a row's destination and focuses it. In the drawer the click closes it, and the drawer moves focus.
const go = (link: HTMLAnchorElement): void => {
  link.click()
  if (open.value) return
  const target = link.hash ? document.getElementById(link.hash.slice(1)) : null
  if (!target) return
  if (!target.hasAttribute('tabindex')) target.tabIndex = -1
  target.focus({ preventScroll: true })
}

const onFindKeydown = (event: KeyboardEvent): void => {
  if (!(event.currentTarget instanceof HTMLInputElement)) return
  const field = event.currentTarget
  if (event.key === 'Escape') {
    // The first Escape clears the query; the next one leaves the field, or closes the drawer.
    if (query.value) {
      event.preventDefault()
      query.value = ''
    } else if (!open.value) field.blur()
    return
  }
  const first = firstMatch(field)
  if (!first) return
  if (event.key === 'Enter') {
    event.preventDefault()
    go(first)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    first.focus()
  }
}

const clearFind = (): void => {
  query.value = ''
  findField()?.focus()
}

const editable = (target: EventTarget | null): boolean => target instanceof Element
  && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !== null
const onShortcut = (event: KeyboardEvent): void => {
  if (!find || !shortcuts.value || event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey
    || event.defaultPrevented || editable(event.target)) return
  // Another dialog owns the keyboard.
  if (document.querySelector('dialog[open], [role="dialog"][data-state="open"]:not(.fg-site-rail__drawer)')) return
  event.preventDefault()
  const field = findField()
  if (field) {
    field.focus()
    field.select()
  } else if (mobile.value) openMenu({ toFind: true, select: true })
}

const [DefineFind, ReuseFind] = createReusableTemplate()
const [DefineEmpty, ReuseEmpty] = createReusableTemplate()
const [DefineFoot, ReuseFoot] = createReusableTemplate()

onMounted(() => {
  media = matchMedia(MOBILE_QUERY)
  syncBreakpoint()
  enhanced.value = true
  media.addEventListener('change', syncBreakpoint)
  document.addEventListener('keydown', onShortcut)
})
onUnmounted(() => {
  media?.removeEventListener('change', syncBreakpoint)
  document.removeEventListener('keydown', onShortcut)
  clearTimeout(announce)
})
</script>

<template>
  <div
    ref="root"
    class="fg-site-rail"
    :data-enhanced="enhanced"
    :data-header-menu="headerMenu || undefined"
    :data-in-header="headerShell ? true : undefined"
    :role="find ? 'complementary' : undefined"
    :aria-label="find ? label : undefined"
  >
    <!-- With Find, the rail is a named aside, so the field and the shortcut switch sit in a landmark. -->
    <!-- Find needs JavaScript, so it renders only once the page is interactive. -->
    <DefineFind>
      <div
        v-if="find && enhanced"
        class="fg-site-find"
      >
        <div class="fg-site-find__field">
          <svg
            class="fg-site-find__icon"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle
              cx="7"
              cy="7"
              r="4.5"
            />
            <path d="M10.5 10.5 14 14" />
          </svg>
          <input
            v-model="query"
            class="fg-input fg-site-find__input"
            data-size="md"
            type="search"
            :placeholder="find.label"
            :aria-label="find.label"
            :aria-describedby="statusId"
            :aria-keyshortcuts="shortcuts ? '/' : undefined"
            autocomplete="off"
            spellcheck="false"
            @keydown="onFindKeydown"
          >
          <kbd
            v-if="shortcuts"
            class="fg-site-find__key"
            aria-hidden="true"
          >/</kbd>
        </div>
        <p
          :id="statusId"
          class="fg-site-sr-only"
          role="status"
        >
          {{ findStatus }}
        </p>
      </div>
    </DefineFind>
    <DefineEmpty>
      <div
        v-if="find"
        class="fg-site-find__empty"
        :hidden="visible === undefined || visible.size > 0"
      >
        <p>No {{ find.noun ?? 'section' }} matches <q>{{ query.trim() }}</q>.</p>
        <UiButton
          variant="text"
          @click="clearFind"
        >
          Clear
        </UiButton>
      </div>
    </DefineEmpty>
    <DefineFoot>
      <div
        v-if="find && enhanced"
        class="fg-site-rail__foot"
      >
        <UiSwitch
          v-model="shortcuts"
          label="Single-key shortcuts"
        />
      </div>
    </DefineFoot>
    <!-- Without JavaScript the details element is the phone menu; CSS keeps it open on desktop.
      With headerMenu it stays open on phones too, so every row shows in place. -->
    <details
      v-if="!enhanced || !mobile"
      class="fg-site-rail__menu"
      :open="headerMenu || (enhanced && !mobile)"
    >
      <summary
        class="fg-button fg-site-rail__summary"
        data-variant="secondary"
        data-size="lg"
        :aria-controls="contentId"
      >
        {{ disclosureLabel }}
      </summary>
      <SiteNavLinks
        :content-id="contentId"
        :label="label"
        :groups="groups"
        :active-id="activeId"
        :visible="visible"
      >
        <template #before>
          <ReuseFind />
        </template>
        <template #empty>
          <ReuseEmpty />
        </template>
        <template #after>
          <ReuseFoot />
        </template>
      </SiteNavLinks>
    </details>
    <template v-else-if="headerShell">
      <Teleport :to="headerShell.bar">
        <UiButton
          v-if="find"
          variant="secondary"
          size="lg"
          class="fg-site-header__bar-button"
          :aria-label="find.label"
          aria-haspopup="dialog"
          @click="openMenu({ toFind: true })"
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle
              cx="7"
              cy="7"
              r="4.5"
            />
            <path d="M10.5 10.5 14 14" />
          </svg>
        </UiButton>
        <!-- detail is 0 for a click made with Enter or Space, and 1 or more for a tap or a mouse click. -->
        <UiButton
          variant="secondary"
          size="lg"
          class="fg-site-header__bar-button fg-site-header__menu"
          aria-label="Menu"
          aria-haspopup="dialog"
          @click="openMenu({ byPointer: $event.detail > 0 })"
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M1.5 3.5h13M1.5 8h13M1.5 12.5h13" />
          </svg>
        </UiButton>
      </Teleport>
      <UiDrawer
        v-model:open="open"
        title="Menu"
        class="fg-site-rail__drawer"
        @open-auto-focus="openAutoFocus"
        @close-auto-focus="closeAutoFocus"
      >
        <SiteNavLinks
          :content-id="contentId"
          :label="label"
          :groups="groups"
          :active-id="activeId"
          :visible="visible"
          @navigate="navigate"
        >
          <template #before>
            <ReuseFind />
            <nav
              v-if="headerShell.links.length > 0"
              class="fg-site-nav fg-site-rail__pages"
              aria-label="Site links"
            >
              <span
                class="fg-site-rail__group-label"
                aria-hidden="true"
              >Pages</span>
              <a
                v-for="link in headerShell.links"
                :key="link.href"
                :href="link.href"
                :aria-current="link.current ? 'page' : undefined"
                @click="navigate(link.href, $event)"
              >{{ link.label }}</a>
            </nav>
            <div
              v-if="headerShell.appearance"
              class="fg-site-rail__appearance"
            >
              <span
                class="fg-site-rail__group-label"
                aria-hidden="true"
              >Appearance</span>
              <UiSiteAppearancePicker
                :model-value="headerShell.appearance.choice.value"
                @update:model-value="headerShell.appearance.chooseAppearance"
              />
            </div>
          </template>
          <template #empty>
            <ReuseEmpty />
          </template>
          <template #after>
            <ReuseFoot />
          </template>
        </SiteNavLinks>
      </UiDrawer>
    </template>
    <UiDrawer
      v-else
      v-model:open="open"
      :title="label"
      class="fg-site-rail__drawer"
      @open-auto-focus="openAutoFocus"
      @close-auto-focus="closeAutoFocus"
    >
      <template #trigger>
        <UiButton
          variant="secondary"
          size="lg"
          class="fg-site-rail__toggle"
        >
          {{ disclosureLabel }}
        </UiButton>
      </template>
      <SiteNavLinks
        :content-id="contentId"
        :label="label"
        :groups="groups"
        :active-id="activeId"
        :visible="visible"
        @navigate="navigate"
      >
        <template #before>
          <ReuseFind />
        </template>
        <template #empty>
          <ReuseEmpty />
        </template>
        <template #after>
          <ReuseFoot />
        </template>
      </SiteNavLinks>
    </UiDrawer>
  </div>
</template>
