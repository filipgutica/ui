<script setup lang="ts">
import { onMounted, ref } from 'vue'

import CommandListCopy from './CommandListCopy.vue'

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
  /** Replaces the code-styled command, for a key shown as `<kbd>`. Copying still uses `item.command`. */
  command?(props: { item: UiCommandItem }): unknown
  /** Replaces the plain description, for text with `<kbd>` or `<code>`. */
  description?(props: { item: UiCommandItem }): unknown
}>()

// Copying needs JavaScript, so the buttons appear after mount. The column is
// rendered on the server so the table does not shift when they do.
const mounted = ref(false)
onMounted(() => { mounted.value = true })

// One live region for the list: success is announced only, and a failure stays visible.
const statusMessage = ref('')
const failed = ref(false)
const showResult = ({ command, error }: { command: string, error: string }): void => {
  failed.value = error !== ''
  statusMessage.value = error || `${command} copied to clipboard.`
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
            <slot
              name="command"
              :item="item"
            >
              <code>{{ item.command }}</code>
            </slot>
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
            <CommandListCopy
              v-if="mounted"
              :command="item.command"
              @start="statusMessage = ''"
              @settle="error => showResult({ command: item.command, error })"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Success is shown by the row icon; a failure tells the reader what to do instead. -->
    <span
      class="fg-command-list__status"
      :class="{ 'fg-site-sr-only': !failed }"
      role="status"
    >{{ statusMessage }}</span>
  </div>
</template>
