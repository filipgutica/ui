<script setup lang="ts">
import { ref } from 'vue'

import type { UiAlertProps, UiButtonProps, UiCodeBlockProps, UiControlSize } from '../../../src/index.js'

import PlaygroundControls from './PlaygroundControls.vue'
import PlaygroundPreview from './PlaygroundPreview.vue'

const { compact = false, slug } = defineProps<{
  compact?: boolean
  slug: string
}>()

type CodeLanguage = 'vue' | 'typescript' | 'javascript' | 'json' | 'css' | 'html' | 'bash' | 'text'

const label = ref(slug === 'tabs' ? 'Process captures' : 'Inspect evidence')
const controlSize = ref<UiControlSize>('md')
const buttonVariant = ref<NonNullable<UiButtonProps['variant']>>('primary')
const tone = ref<NonNullable<UiAlertProps['tone']>>('info')
const inputValue = ref('agent workbench')
const selectValue = ref('all')
const error = ref('')
const checked = ref(false)
const radioCardValue = ref('system')
const disabled = ref(false)
const loading = ref(false)
const progressValue = ref(42)
const dialogTitle = ref(slug === 'drawer' ? 'Navigation' : 'Review evidence')
const dialogDescription = ref('Confirm the evidence before continuing.')
const language = ref<CodeLanguage>('vue')
const codeVariant = ref<NonNullable<UiCodeBlockProps['variant']>>('default')
</script>

<template>
  <div
    class="playground"
    :data-compact="compact ? 'true' : undefined"
  >
    <PlaygroundControls
      v-if="!compact"
      v-model:button-variant="buttonVariant"
      v-model:checked="checked"
      v-model:control-size="controlSize"
      v-model:disabled="disabled"
      v-model:error="error"
      v-model:input-value="inputValue"
      v-model:label="label"
      v-model:loading="loading"
      v-model:progress-value="progressValue"
      v-model:radio-card-value="radioCardValue"
      v-model:select-value="selectValue"
      v-model:tone="tone"
      v-model:dialog-description="dialogDescription"
      v-model:dialog-title="dialogTitle"
      v-model:language="language"
      v-model:code-variant="codeVariant"
      :slug="slug"
    />
    <PlaygroundPreview
      v-model:checked="checked"
      v-model:input-value="inputValue"
      v-model:progress-value="progressValue"
      v-model:radio-card-value="radioCardValue"
      v-model:select-value="selectValue"
      :button-variant="buttonVariant"
      :compact="compact"
      :control-size="controlSize"
      :code-variant="codeVariant"
      :dialog-description="dialogDescription"
      :dialog-title="dialogTitle"
      :disabled="disabled"
      :error="error"
      :label="label"
      :language="language"
      :loading="loading"
      :slug="slug"
      :tone="tone"
    />
  </div>
</template>
