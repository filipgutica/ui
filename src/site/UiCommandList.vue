<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { useClipboardCopy } from '../use-clipboard-copy.js'

export interface UiCommandItem {
  command: string
  description?: string
}

export interface UiCommandListProps {
  items: readonly UiCommandItem[]
  /** Adds a copy button to each row once the page is interactive. */
  copyable?: boolean
  commandHeader?: string
  descriptionHeader?: string
}

const {
  items,
  copyable = true,
  commandHeader = 'Command',
  descriptionHeader = 'What it does',
} = defineProps<UiCommandListProps>()

defineSlots<{
  /** Replaces the plain description, for text with `<kbd>` or `<code>`. */
  description?(props: { item: UiCommandItem }): unknown
}>()

// Copying needs JavaScript, so the buttons appear after mount. The column is
// rendered on the server so the table does not shift when they do.
const mounted = ref(false)
onMounted(() => { mounted.value = true })

const { copied, pending, error, copy } = useClipboardCopy({
  unavailableMessage: 'Clipboard unavailable. Select the command to copy it.',
  failureMessage: 'Could not copy. Select the command to copy it.',
})
const lastCommand = ref('')
const statusMessage = computed(() => error.value || (copied.value ? `${lastCommand.value} copied to clipboard.` : ''))

const copyCommand = (command: string): Promise<void> => {
  lastCommand.value = command
  return copy(command)
}
</script>

<template>
  <div class="fg-command-list">
    <table class="fg-command-list__table">
      <thead>
        <tr>
          <th scope="col">
            {{ commandHeader }}
          </th>
          <th scope="col">
            {{ descriptionHeader }}
          </th>
          <td v-if="copyable" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.command"
        >
          <td class="fg-command-list__command">
            <code>{{ item.command }}</code>
          </td>
          <td class="fg-command-list__description">
            <slot
              name="description"
              :item="item"
            >
              {{ item.description }}
            </slot>
          </td>
          <td
            v-if="copyable"
            class="fg-command-list__action"
          >
            <button
              v-if="mounted"
              type="button"
              class="fg-command-list__copy"
              :disabled="pending"
              :aria-label="`Copy ${item.command}`"
              :title="`Copy ${item.command}`"
              @click="copyCommand(item.command)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <path
                  v-if="copied && !error && lastCommand === item.command"
                  d="m5 12 4 4L19 6"
                />
                <template v-else>
                  <rect
                    x="8"
                    y="8"
                    width="12"
                    height="13"
                    rx="2"
                  />
                  <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                </template>
              </svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Success is shown by the row icon; a failure tells the reader what to do instead. -->
    <span
      class="fg-command-list__status"
      :class="{ 'fg-site-sr-only': !error }"
      role="status"
    >{{ statusMessage }}</span>
  </div>
</template>
