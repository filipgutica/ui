<script setup lang="ts">
import type { UiSiteFindScope } from './find-scope.js'

import { createReusableTemplate, useStorage } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'

import UiButton from '../components/UiButton.vue'
import UiDrawer from '../components/UiDrawer.vue'
import UiSwitch from '../components/UiSwitch.vue'
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
  /** More words Find matches besides the label and the group label, such as a purpose or aliases. */
  terms?: string
}

export interface UiSiteNavGroup {
  label?: string
  items: readonly UiSiteNavItem[]
}

export interface UiSiteNavFind {
  /** The field's accessible name and placeholder, such as "Find a component". */
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
   * Keeps every row in place at 800px and below when the page has no JavaScript, as a section
   * rail does, instead of a closed disclosure. With JavaScript it changes nothing: every rail
   * shows the labelled trigger that opens the drawer.
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
let media: MediaQueryList | undefined
let destination: HTMLElement | null = null

const toggle = (): HTMLElement | null | undefined => root.value?.querySelector<HTMLElement>('button.fg-site-rail__toggle')
const focusFirstLink = (): void => {
  void nextTick(() => root.value?.querySelector<HTMLElement>('.fg-site-nav a')?.focus({ preventScroll: true }))
}

// Moves focus to the matching control when the rail and the drawer trigger swap.
const syncBreakpoint = (): void => {
  const active = document.activeElement
  const leavingFocusedRail = media?.matches === true && !mobile.value && root.value?.contains(active)
  const leavingFocusedTrigger = media?.matches === false && mobile.value && !open.value && toggle() === active
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
// a tap moves it to the drawer, so no ring shows and no on-screen keyboard opens; the / shortcut
// focuses Find. Closing returns focus to the trigger, as the dialog does.
let opening: { toFind?: boolean; byPointer?: boolean; select?: boolean } | undefined
// The trigger opens the drawer itself; this only records how. detail is 0 for a click made with
// Enter or Space, and 1 or more for a tap or a mouse click.
const onTriggerClick = (event: MouseEvent): void => {
  opening = { byPointer: event.detail > 0 }
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
  // A tap never focuses Find, even with no current row in view, so no on-screen keyboard opens.
  if (how.byPointer) dialog.focus({ preventScroll: true })
  else if (field && (how.toFind || !current)) {
    field.focus({ preventScroll: true })
    if (how.select) field.select()
  } else if (current) current.focus({ preventScroll: true })
  else dialog.focus({ preventScroll: true })
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
  } else {
    event.preventDefault()
    // A page that moved focus itself while the drawer closed keeps it there, as a hash router
    // that focuses the heading of the page a row opened.
    const active = document.activeElement
    const moved = active && active !== document.body && !(event.target instanceof Node && event.target.contains(active))
    // The trigger sits above the page, so returning focus to it must keep the reader's position,
    // as after the / shortcut opened the drawer mid-page.
    if (!moved) toggle()?.focus({ preventScroll: true })
  }
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

// The Find field renders in the rail or in the drawer, and in both while the drawer animates
// closed. This component tracks its own fields, so another app's Find never takes focus.
const findFields = new Set<HTMLInputElement>()
const trackFindField = (el: unknown): void => {
  if (el instanceof HTMLInputElement) findFields.add(el)
  // Vue unmounts a field before its element leaves the page, so forget detached fields after that.
  else void nextTick(() => findFields.forEach(field => field.isConnected || findFields.delete(field)))
}
const findField = (): HTMLInputElement | undefined => {
  let field: HTMLInputElement | undefined
  for (const candidate of findFields) {
    // The newest field is the rail's when it mounts while the drawer closes.
    if (candidate.isConnected) field = candidate
  }
  return field
}
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
  // While an input method composes text, Enter, Escape, and the arrows belong to it. Some browsers
  // report composition keys only as keyCode 229.
  if (event.isComposing || event.keyCode === 229) return
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
  } else if (mobile.value) {
    opening = { toFind: true, select: true }
    open.value = true
  }
}

const [DefineFind, ReuseFind] = createReusableTemplate()
const [DefineEmpty, ReuseEmpty] = createReusableTemplate()
const [DefineFoot, ReuseFoot] = createReusableTemplate()

// The location changed under the drawer, as on browser Back or Forward, so it shows a page the
// reader did not pick from it. Find keeps its query. Back and Forward fire popstate before
// hashchange, so the drawer releases focus before a hash router focuses its new page.
const closeOnLocationChange = (): void => {
  open.value = false
}

onMounted(() => {
  media = matchMedia(MOBILE_QUERY)
  syncBreakpoint()
  enhanced.value = true
  media.addEventListener('change', syncBreakpoint)
  document.addEventListener('keydown', onShortcut)
  window.addEventListener('popstate', closeOnLocationChange)
  window.addEventListener('hashchange', closeOnLocationChange)
})
onUnmounted(() => {
  media?.removeEventListener('change', syncBreakpoint)
  document.removeEventListener('keydown', onShortcut)
  window.removeEventListener('popstate', closeOnLocationChange)
  window.removeEventListener('hashchange', closeOnLocationChange)
  clearTimeout(announce)
})
</script>

<template>
  <div
    ref="root"
    class="fg-site-rail"
    :data-enhanced="enhanced"
    :data-header-menu="headerMenu || undefined"
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
            :ref="trackFindField"
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
          @click="onTriggerClick"
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
