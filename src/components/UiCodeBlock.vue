<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'

export interface UiCodeBlockProps {
  code: string
  language?: string
  title?: string
  copyable?: boolean
  lineNumbers?: boolean
  wrap?: boolean
  variant?: 'default' | 'compact'
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
const copied = ref(false)
const { start: resetCopied } = useTimeoutFn(() => { copied.value = false }, 1500, { immediate: false })
const pending = ref(false)
const error = ref('')
const copySucceeded = computed(() => copied.value && !error.value)
const compactSuccess = computed(() => variant === 'compact' && copySucceeded.value && !highlightingError.value)
const statusMessage = computed(() => {
  if (error.value) return error.value
  if (variant === 'compact' && highlightingError.value) {
    return copied.value ? `Code copied to clipboard. ${highlightingError.value}` : highlightingError.value
  }
  return copied.value ? 'Code copied to clipboard.' : highlightingError.value
})

const copyCode = async (): Promise<void> => {
  error.value = ''
  copied.value = false
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    error.value = 'Clipboard unavailable. Select the code to copy it.'
    return
  }
  pending.value = true
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    resetCopied()
  } catch {
    error.value = 'Could not copy. Select the code to copy it.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div
    class="fg-code-block"
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
          class="fg-code-block__copy"
          :disabled="pending"
          aria-label="Copy code"
          :title="variant === 'compact' ? (copySucceeded ? 'Copied' : 'Copy code') : undefined"
          @click="copyCode"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path
              v-if="variant === 'compact' && copySucceeded"
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
          <span v-if="variant === 'default'">{{ copySucceeded ? 'Copied' : 'Copy' }}</span>
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
      :data-state="compactSuccess ? 'success' : undefined"
    >{{ statusMessage }}</span>
  </div>
</template>
