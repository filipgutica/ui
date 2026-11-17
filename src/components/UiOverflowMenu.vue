<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import { computed, ref, useTemplateRef } from 'vue'

export interface UiOverflowMenuItem {
  /** Emitted by `select` when the item runs. */
  id: string
  label: string
  /** A destructive action: it renders last, after a separator, in the danger text colour. */
  tone?: 'danger'
  disabled?: boolean
}

export interface UiOverflowMenuProps {
  /** The trigger's accessible name. Name what it acts on, such as "More actions for API latency". */
  label: string
  /** The actions, ordered by how often they are used. */
  items: readonly UiOverflowMenuItem[]
  /** Disables the trigger. */
  disabled?: boolean
}

const { label, items, disabled = false } = defineProps<UiOverflowMenuProps>()

const emit = defineEmits<{
  (event: 'select', id: string): void
}>()

defineSlots<{
  icon?(props: { item: UiOverflowMenuItem }): unknown
}>()

const root = useTemplateRef<HTMLElement>('root')
const open = ref(false)

// Destructive items go last, after one separator, whatever order the caller passes.
const rows = computed(() => {
  const actions = items.filter(item => item.tone !== 'danger')
  const destructive = items.filter(item => item.tone === 'danger')
  return [...actions, ...destructive].map((item, index) => ({
    item,
    separatorBefore: index > 0 && index === actions.length,
  }))
})

// The menu button pattern opens on the last item from Up Arrow. Reka's trigger handles only
// Enter, Space, and Down Arrow, so Up Arrow opens the menu here and moves focus once it mounts.
let focusLastOnOpen = false
const openOnLast = () => {
  // Shift+Tab from an item leaves the menu open with focus on the trigger; nothing mounts then.
  if (open.value) return
  focusLastOnOpen = true
  open.value = true
}
const focusLast = (event: Event) => {
  if (!focusLastOnOpen) return
  focusLastOnOpen = false
  if (!(event.target instanceof HTMLElement)) return
  const enabled = event.target.querySelectorAll<HTMLElement>('[role="menuitem"]:not([data-disabled])')
  const last = enabled[enabled.length - 1]
  if (!last) return
  event.preventDefault()
  last.focus()
}

// A selected item emits only once the menu has closed and focus is back on the trigger, so a
// confirm dialog the caller opens from it returns focus to the trigger when it closes.
let selectedId: string | undefined
const emitSelected = (event: Event) => {
  if (selectedId === undefined) return
  const id = selectedId
  selectedId = undefined
  event.preventDefault()
  root.value?.querySelector<HTMLElement>('.fg-overflow-menu__trigger')?.focus()
  emit('select', id)
}
</script>

<template>
  <div
    ref="root"
    class="fg-overflow-menu"
  >
    <!-- Not modal and not portalled: Tab closes the menu and moves on from the trigger's place in the page. -->
    <DropdownMenuRoot
      v-model:open="open"
      :modal="false"
    >
      <DropdownMenuTrigger
        as-child
        :disabled="disabled"
      >
        <button
          type="button"
          class="fg-overflow-menu__trigger fg-quiet-action"
          :aria-label="label"
          @keydown.up.prevent="openOnLast"
        >
          <!-- Three round dots: zero-length strokes with round caps, never a text glyph. -->
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M3 8h.01M8 8h.01M13 8h.01" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <!-- Aligned to the trigger's end edge; 4px is --space-1 at the 16px root. Reka flips it above when there is no room below. -->
      <DropdownMenuContent
        class="fg-overflow-menu__content"
        side="bottom"
        align="end"
        :side-offset="4"
        loop
        @open-auto-focus="focusLast"
        @close-auto-focus="emitSelected"
      >
        <template
          v-for="{ item, separatorBefore } in rows"
          :key="item.id"
        >
          <DropdownMenuSeparator
            v-if="separatorBefore"
            class="fg-overflow-menu__separator"
          />
          <DropdownMenuItem
            as-child
            :disabled="item.disabled === true"
            :text-value="item.label"
            @select="selectedId = item.id"
          >
            <button
              type="button"
              class="fg-overflow-menu__item"
              :data-tone="item.tone"
              :disabled="item.disabled"
            >
              <slot
                name="icon"
                :item="item"
              />
              {{ item.label }}
            </button>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  </div>
</template>
