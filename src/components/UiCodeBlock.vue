<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'

import { useClipboardCopy } from '../use-clipboard-copy.js'
import CopyIcon from './CopyIcon.vue'

export interface UiCodeBlockProps {
  code: string
  language?: string
  title?: string
  copyable?: boolean
  lineNumbers?: boolean
  wrap?: boolean
  variant?: 'default' | 'compact' | 'embedded'
}

const {
  code,
  language = 'text',
  title = '',
  copyable = true,
  lineNumbers = false,
  wrap = false,
  variant = 'default',
} = defineProps<UiCodeBlockProps>()

defineSlots<{ actions?(): unknown }>()
type CodeToken = { content: string; color?: string | undefined }
// Compact and embedded blocks show Copy as an icon in the code's corner, with no labels.
const iconOnly = computed(() => variant !== 'default')
// Compact commands may omit a language; typed source never receives a prompt.
// Embedded source sits under a live example, so it is never a command.
const command = computed(() => {
  if (variant === 'embedded') return false
  const normalizedLanguage = language.trim().toLowerCase()
  const shell = ['bash', 'sh', 'shell'].includes(normalizedLanguage)
  return variant === 'compact' ? shell || normalizedLanguage === 'text' : shell && !title
})
const highlighted = shallowRef<CodeToken[][]>()
const highlightingError = ref('')
const lines = computed<CodeToken[][]>(() => highlighted.value ?? code.split('\n').map(content => [{ content }]))
const languageAliases: Record<string, string> = {
  vue: 'vue', ts: 'typescript', typescript: 'typescript',
  js: 'javascript', javascript: 'javascript', json: 'json',
  css: 'css', html: 'html', bash: 'bash', sh: 'bash', shell: 'bash',
}

watch(() => [code, language] as const, async ([source, requestedLanguage], _, onCleanup) => {
  let cancelled = false
  onCleanup(() => { cancelled = true })
  highlighted.value = undefined
  highlightingError.value = ''
  const normalizedLanguage = requestedLanguage.trim().toLowerCase()
  const resolvedLanguage = Object.hasOwn(languageAliases, normalizedLanguage) ? languageAliases[normalizedLanguage] : undefined
  if (!resolvedLanguage) return
  try {
    const { highlightCode } = await import('../code-highlight.js')
    if (cancelled) return
    const tokens = await highlightCode({ code: source, language: resolvedLanguage })
    if (cancelled) return
    const originalLines = source.split('\n')
    // Preserve CRLF exactly; grammar engines strip the carriage returns.
    highlighted.value = originalLines.map((original, index) => {
      const line = tokens[index] ?? []
      return original.endsWith('\r') ? [...line, { content: '\r' }] : line
    })
  } catch {
    if (!cancelled) highlightingError.value = 'Syntax highlighting unavailable. Showing plain text.'
  }
}, { immediate: true })
const { copied, pending, error, copy } = useClipboardCopy({
  unavailableMessage: 'Clipboard unavailable. Select the code to copy it.',
  failureMessage: 'Could not copy. Select the code to copy it.',
})
// Copy shows a tick while copied holds. Success is announced, not shown: its message is visually
// hidden, and it blanks while a copy is in flight so a repeat copy is announced again.
const announced = computed(() => copied.value && !pending.value)
// Failures and the highlighting fallback stay visible.
const visibleMessage = computed(() => error.value || highlightingError.value)

const copyCode = (): Promise<void> => copy(code)
</script>

<template>
  <div
    class="fg-code-block"
    :data-command="command || undefined"
    :data-wrap="wrap"
    :data-line-numbers="lineNumbers"
    :data-variant="variant"
  >
    <div
      v-if="variant === 'default' || copyable || $slots.actions"
      class="fg-code-block__header"
    >
      <span
        v-if="variant === 'default'"
        class="fg-code-block__title"
      >{{ title || language }}</span>
      <span
        v-if="title && variant === 'default'"
        class="fg-code-block__language"
      >{{ language }}</span>
      <div class="fg-code-block__actions">
        <slot name="actions" />
        <button
          v-if="copyable"
          type="button"
          class="fg-code-block__copy fg-quiet-action"
          :disabled="pending"
          :data-copied="copied ? '' : undefined"
          aria-label="Copy code"
          :title="iconOnly ? 'Copy code' : undefined"
          @click="copyCode"
        >
          <CopyIcon :copied="copied" />
          <span v-if="variant === 'default'">Copy</span>
        </button>
      </div>
    </div>
    <pre
      class="fg-code-block__pre"
      tabindex="0"
      :aria-label="title || `${language} code`"
    ><code><span
      v-for="(line, index) in lines"
      :key="index"
      class="fg-code-block__line"
    ><span
      v-if="lineNumbers"
      class="fg-code-block__number"
      aria-hidden="true"
    >{{ index + 1 }}</span><span class="fg-code-block__text"><span
      v-for="(token, tokenIndex) in line"
      :key="tokenIndex"
      :style="{ color: token.color }"
    >{{ token.content }}</span>{{ index < lines.length - 1 ? '\n' : '' }}</span></span></code></pre>
    <span
      class="fg-code-block__status"
      role="status"
      :data-state="announced && !visibleMessage ? 'success' : undefined"
    ><span
      v-if="announced"
      class="fg-code-block__success"
    >Code copied to clipboard. </span>{{ visibleMessage }}</span>
  </div>
</template>
