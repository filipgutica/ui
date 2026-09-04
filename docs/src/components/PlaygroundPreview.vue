<template>
  <div
    class="playground-preview"
    aria-label="Component preview"
  >
    <p
      v-if="!compact"
      class="pane-label pane-label--accent"
    >
      Preview
    </p>
    <div class="playground-stage">
      <UiButton
        v-if="slug === 'button'"
        :disabled="disabled"
        :loading="loading"
        :size="compact ? 'sm' : controlSize"
        :variant="compact ? 'secondary' : buttonVariant"
      >
        {{ compact ? 'Inspect evidence' : label }}
      </UiButton>

      <UiAlert
        v-else-if="slug === 'alert'"
        :tone="tone"
      >
        {{ compact ? 'Theme imported successfully.' : label }}
      </UiAlert>

      <div
        v-else-if="slug === 'badge' && compact"
        class="badge-row"
      >
        <UiBadge tone="info">
          Queued
        </UiBadge>
        <UiBadge tone="success">
          Passed
        </UiBadge>
        <UiBadge tone="warning">
          Needs review
        </UiBadge>
        <UiBadge tone="error">
          Failed
        </UiBadge>
      </div>

      <UiBadge
        v-else-if="slug === 'badge'"
        :tone="tone"
      >
        {{ label }}
      </UiBadge>

      <UiCheckbox
        v-else-if="slug === 'checkbox'"
        v-model="checked"
        :disabled="disabled"
        :size="controlSize"
      >
        Include archived sessions
      </UiCheckbox>

      <UiRadioCardGroup
        v-else-if="slug === 'radio-card'"
        v-model="singleRadioCardValue"
        :disabled="disabled"
        aria-label="Color scheme"
      >
        <UiRadioCard value="system">
          <strong>System</strong>
          <span>Follow the device appearance.</span>
        </UiRadioCard>
      </UiRadioCardGroup>

      <UiRadioCardGroup
        v-else-if="slug === 'radio-card-group'"
        v-model="radioCardValue"
        :disabled="disabled"
        aria-label="Color scheme"
      >
        <UiRadioCard value="system">
          <strong>System</strong>
          <span>Follow the device appearance.</span>
        </UiRadioCard>
        <UiRadioCard value="light">
          <strong>Light</strong>
          <span>Use a light interface.</span>
        </UiRadioCard>
        <UiRadioCard value="dark">
          <strong>Dark</strong>
          <span>Use a dark interface.</span>
        </UiRadioCard>
      </UiRadioCardGroup>

      <template v-else-if="slug === 'dialog'">
        <UiButton
          variant="secondary"
          @click="dialogOpen = true"
        >
          Open dialog
        </UiButton>
        <UiDialog
          :open="dialogOpen"
          :title="dialogTitle"
          :description="dialogDescription"
          @update:open="dialogOpen = $event"
        >
          Review the details before continuing.
          <template #footer>
            <UiButton
              variant="secondary"
              @click="dialogOpen = false"
            >
              Cancel
            </UiButton>
            <UiButton @click="dialogOpen = false">
              Continue
            </UiButton>
          </template>
        </UiDialog>
      </template>

      <UiField
        v-else-if="slug === 'field'"
        control-id="preview-field"
        label="Search themes"
        description="Search Open VSX by name."
        :error="error"
      >
        <UiInput
          v-model="inputValue"
          :disabled="disabled"
          :size="controlSize"
          type="search"
        />
      </UiField>

      <UiInput
        v-else-if="slug === 'input'"
        v-model="inputValue"
        :disabled="disabled"
        :invalid="Boolean(error)"
        :size="controlSize"
        type="search"
        placeholder="Search sessions"
        aria-label="Search sessions"
      />

      <div
        v-else-if="slug === 'progress'"
        class="progress-example"
      >
        <UiProgress
          label="Theme import progress"
          :value="compact ? 64 : progressValue"
          :max="100"
        />
        <span>{{ compact ? 64 : progressValue }}% complete</span>
      </div>

      <UiSelect
        v-else-if="slug === 'select'"
        v-model="selectValue"
        :disabled="disabled"
        :size="controlSize"
        aria-label="Status"
      >
        <option value="all">
          All statuses
        </option>
        <option value="passed">
          Passed
        </option>
        <option value="failed">
          Failed
        </option>
      </UiSelect>

      <UiSlider
        v-else-if="slug === 'slider'"
        v-model="progressValue"
        :disabled="disabled"
        :size="controlSize"
        label="Confidence threshold"
      />

      <UiCard
        v-else-if="slug === 'card'"
        title="Session summary"
      >
        <p>12 tool calls across 4 turns.</p>
        <template #actions>
          <UiButton
            size="sm"
            variant="ghost"
          >
            View
          </UiButton>
        </template>
        <template #footer>
          Updated just now
        </template>
      </UiCard>

      <UiCodeBlock
        v-else-if="slug === 'code-block'"
        :code="codeExample"
        :language="language"
        :line-numbers="checked"
        :title="compact ? 'Vue' : 'Component usage'"
        :wrap="disabled"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import type { UiAlertProps, UiButtonProps, UiControlSize } from '../../../src/index.js'

import {
  UiAlert,
  UiBadge,
  UiButton,
  UiCard,
  UiCheckbox,
  UiCodeBlock,
  UiDialog,
  UiField,
  UiInput,
  UiProgress,
  UiRadioCard,
  UiRadioCardGroup,
  UiSelect,
  UiSlider,
} from '../../../src/index.js'

const {
  buttonVariant,
  compact,
  controlSize,
  dialogDescription,
  dialogTitle,
  disabled,
  error,
  label,
  loading,
  language,
  slug,
  tone,
} = defineProps<{
  buttonVariant: NonNullable<UiButtonProps['variant']>
  compact: boolean
  controlSize: UiControlSize
  dialogDescription: string
  dialogTitle: string
  disabled: boolean
  error: string
  label: string
  loading: boolean
  language: CodeLanguage
  slug: string
  tone: NonNullable<UiAlertProps['tone']>
}>()

const checked = defineModel<boolean>('checked', { required: true })
const inputValue = defineModel<string>('inputValue', { required: true })
const progressValue = defineModel<number>('progressValue', { required: true })
const radioCardValue = defineModel<string>('radioCardValue', { required: true })
const selectValue = defineModel<string>('selectValue', { required: true })
const singleRadioCardValue = computed({
  get: () => checked.value ? 'system' : '',
  set: value => {
    checked.value = value === 'system'
  },
})

const dialogOpen = ref(false)

type CodeLanguage = 'vue' | 'typescript' | 'javascript' | 'json' | 'css' | 'html' | 'bash' | 'text'

const codeExamples: Record<CodeLanguage, string> = {
  vue: `<UiCodeBlock
  title="Example.vue"
  language="vue"
  :code="snippet"
/>`,
  typescript: `const theme = parseVsCodeTheme({
  source,
  fileName: 'aurora.json',
})

applySemanticTheme({ root: document.documentElement, theme })`,
  javascript: `const theme = await importTheme('catppuccin')
setActiveTheme(theme)`,
  json: `{
  "name": "Aurora",
  "type": "dark",
  "colors": {
    "editor.background": "#101218",
    "editor.foreground": "#f4f5f8"
  }
}`,
  css: `@import "tailwindcss";
@import "@filipgutica/ui/theme.css";
@import "@filipgutica/ui/components.css";`,
  html: `<section aria-labelledby="summary-title">
  <h2 id="summary-title">Session summary</h2>
</section>`,
  bash: `pnpm add @filipgutica/ui
pnpm docs:dev`,
  text: 'Copy this value into your workspace configuration.',
}

const codeExample = computed(() => codeExamples[language])
</script>
