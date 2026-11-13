<script setup lang="ts">
import { computed, ref } from 'vue'

import type { UiAlertProps, UiButtonProps, UiCodeBlockProps, UiControlSize, UiFigureProps } from '../../../src/index.js'

import {
  UiAlert,
  UiBadge,
  UiBreadcrumbs,
  UiButton,
  UiCard,
  UiCheckbox,
  UiCodeBlock,
  UiDialog,
  UiDrawer,
  UiExample,
  UiField,
  UiFigure,
  UiInput,
  UiProgress,
  UiRadioCard,
  UiRadioCardGroup,
  UiScore,
  UiSegmentedControl,
  UiSelect,
  UiSlider,
  UiSwitch,
  UiTabs,
  UiToggleButton,
} from '../../../src/index.js'

const {
  buttonVariant,
  compact,
  codeVariant,
  controlSize,
  dialogDescription,
  dialogTitle,
  disabled,
  error,
  label,
  loading,
  language,
  numbered,
  score,
  slug,
  tone,
} = defineProps<{
  buttonVariant: NonNullable<UiButtonProps['variant']>
  compact: boolean
  codeVariant: NonNullable<UiCodeBlockProps['variant']>
  controlSize: UiControlSize
  dialogDescription: string
  dialogTitle: string
  disabled: boolean
  error: string
  label: string
  loading: boolean
  language: CodeLanguage
  numbered: boolean
  score: number
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

const segmentItems = [
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
  { value: 'timeline', label: 'Timeline' },
]
const segmentValue = ref('list')
const figureProps = computed((): UiFigureProps => compact || numbered ? { number: 1 } : {})
const dialogOpen = ref(false)
const drawerOpen = ref(false)
const selectedTab = ref('list')

type CodeLanguage = 'vue' | 'typescript' | 'javascript' | 'json' | 'yaml' | 'css' | 'html' | 'bash' | 'text'

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
  yaml: `# Shared site appearance
name: Aurora
type: dark
colors:
  editor.background: "#101218"
  editor.foreground: "#f4f5f8"`,
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

const codeExample = computed(() => language === 'bash' && codeVariant === 'compact'
  ? 'pnpm add @filipgutica/ui'
  : codeExamples[language])
</script>

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

      <UiSwitch
        v-else-if="slug === 'switch'"
        v-model="checked"
        label="Email notifications"
        description="Receive updates about your account."
        :disabled="disabled"
        :size="controlSize"
      />

      <UiToggleButton
        v-else-if="slug === 'toggle-button'"
        v-model:pressed="checked"
        :disabled="disabled"
        :size="controlSize"
      >
        Tests with signal
        <template #description>
          Pillar 3
        </template>
      </UiToggleButton>

      <UiScore
        v-else-if="slug === 'score'"
        :score="compact ? 2 : score"
      />

      <UiFigure
        v-else-if="slug === 'figure'"
        v-bind="figureProps"
      >
        <table class="figure-example">
          <thead>
            <tr>
              <th>Safeguard</th>
              <th>Problem it stops</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>One check command</td>
              <td>Due date stored as text</td>
              <td><UiScore :score="3" /></td>
            </tr>
            <tr>
              <td>Tests with signal</td>
              <td>Due-today tasks marked overdue</td>
              <td><UiScore :score="2" /></td>
            </tr>
          </tbody>
        </table>
        <template #caption>
          Each safeguard stops one problem before review. The table scrolls inside the plate on narrow screens.
        </template>
      </UiFigure>
      <UiExample
        v-else-if="slug === 'example'"
        code="<UiButton variant=&quot;secondary&quot;>Save draft</UiButton>"
        language="vue"
      >
        <UiButton variant="secondary">
          Save draft
        </UiButton>
        <template #caption>
          A secondary button for a reversible action.
        </template>
      </UiExample>

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
        <UiDialog
          :open="dialogOpen"
          :title="dialogTitle"
          :description="dialogDescription"
          @update:open="dialogOpen = $event"
        >
          <template #trigger>
            <UiButton variant="secondary">
              Open dialog
            </UiButton>
          </template>
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

      <UiDrawer
        v-else-if="slug === 'drawer'"
        v-model:open="drawerOpen"
        :title="dialogTitle"
      >
        <template #trigger>
          <UiButton
            variant="secondary"
            size="lg"
          >
            Open drawer
          </UiButton>
        </template>
        <nav aria-label="Example navigation">
          <a
            href="#/components/drawer"
            @click="drawerOpen = false"
          >Drawer documentation</a>
        </nav>
      </UiDrawer>

      <UiBreadcrumbs
        v-else-if="slug === 'breadcrumbs'"
        label="Example breadcrumb"
        :items="[
          { label: 'Components', href: '#/' },
          { label: 'Layout', href: '#/components/drawer' },
          { label: 'Breadcrumbs' },
        ]"
      />

      <UiTabs
        v-else-if="slug === 'tabs'"
        v-model="selectedTab"
        label="Process captures"
        :items="[{ value: 'list', label: 'List' }, { value: 'details', label: 'Details' }]"
      >
        <template #panel="{ value }">
          <p>{{ value === 'list' ? 'Process list capture' : 'Process details capture' }}</p>
        </template>
      </UiTabs>

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

      <UiSegmentedControl
        v-else-if="slug === 'segmented-control'"
        v-model="segmentValue"
        label="View"
        :items="segmentItems"
        :disabled="disabled"
        :size="controlSize"
      />

      <UiSelect
        v-else-if="slug === 'select'"
        v-model="selectValue"
        :disabled="disabled"
        :size="controlSize"
        aria-label="Status"
      >
        <option value="">
          Choose a status
        </option>
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
        :variant="codeVariant"
        :wrap="disabled"
      />
    </div>
  </div>
</template>
