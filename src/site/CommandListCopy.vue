<script setup lang="ts">
import CopyIcon from '../components/CopyIcon.vue'
import { useClipboardCopy } from '../use-clipboard-copy.js'

// One row's Copy in UiCommandList. Each row owns its copied state and timer, so one row's
// tick does not end another's; the list owns the single live region.
const { command } = defineProps<{ command: string }>()

const emit = defineEmits<{
  /** A copy started, so the list blanks its live region and announces the result again. */
  start: []
  /** A copy settled, with its failure message, or an empty string after a success. */
  settle: [error: string]
}>()

const { copied, pending, error, copy } = useClipboardCopy({
  unavailableMessage: 'Clipboard unavailable. Select the command to copy it.',
  failureMessage: 'Could not copy. Select the command to copy it.',
})

const copyCommand = async (): Promise<void> => {
  emit('start')
  await copy(command)
  emit('settle', error.value)
}
</script>

<template>
  <button
    type="button"
    class="fg-command-list__copy fg-quiet-action"
    :disabled="pending"
    :data-copied="copied ? '' : undefined"
    :aria-label="`Copy ${command}`"
    :title="`Copy ${command}`"
    @click="copyCommand"
  >
    <CopyIcon :copied="copied" />
  </button>
</template>
