<template>
  <div class="playground" :data-compact="compact ? 'true' : undefined">
    <div v-if="!compact" class="playground-controls" aria-label="Component controls">
      <p class="pane-label pane-label--accent">Controls</p>
      <template v-if="slug === 'button'">
        <UiField control-id="button-variant" label="Variant">
          <UiSelect id="button-variant" v-model="buttonVariant">
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="ghost">Ghost</option>
            <option value="danger">Danger</option>
            <option value="text">Text</option>
          </UiSelect>
        </UiField>
        <UiField control-id="button-label" label="Label">
          <UiInput id="button-label" v-model="label" />
        </UiField>
        <UiCheckbox v-model="disabled">Disabled</UiCheckbox>
        <UiCheckbox v-model="loading">Loading</UiCheckbox>
      </template>

      <template v-else-if="slug === 'alert' || slug === 'badge'">
        <UiField control-id="feedback-tone" label="Tone">
          <UiSelect id="feedback-tone" v-model="tone">
            <option value="neutral">Neutral</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger</option>
          </UiSelect>
        </UiField>
        <UiField control-id="feedback-label" label="Content">
          <UiInput id="feedback-label" v-model="label" />
        </UiField>
      </template>

      <template v-else-if="slug === 'input' || slug === 'field'">
        <UiField control-id="input-value" label="Value">
          <UiInput id="input-value" v-model="inputValue" />
        </UiField>
        <UiField control-id="field-error" label="Error message">
          <UiInput id="field-error" v-model="error" />
        </UiField>
        <UiCheckbox v-model="disabled">Disabled</UiCheckbox>
      </template>

      <template v-else-if="slug === 'select'">
        <UiField control-id="select-value" label="Selected value">
          <UiSelect id="select-value" v-model="selectValue">
            <option value="all">All statuses</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </UiSelect>
        </UiField>
        <UiCheckbox v-model="disabled">Disabled</UiCheckbox>
      </template>

      <template v-else-if="slug === 'checkbox'">
        <UiCheckbox v-model="checked">Checked</UiCheckbox>
        <UiCheckbox v-model="disabled">Disabled</UiCheckbox>
      </template>

      <template v-else-if="slug === 'progress'">
        <UiField control-id="progress-value" label="Value">
          <input id="progress-value" v-model.number="progressValue" class="docs-range" type="range" min="0" max="100">
        </UiField>
        <output for="progress-value">{{ progressValue }}%</output>
      </template>

      <template v-else-if="slug === 'surface'">
        <UiField control-id="surface-padding" label="Padding">
          <UiSelect id="surface-padding" v-model="surfacePadding">
            <option value="none">None</option>
            <option value="compact">Compact</option>
            <option value="default">Default</option>
          </UiSelect>
        </UiField>
      </template>

      <template v-else-if="slug === 'dialog'">
        <UiField control-id="dialog-title" label="Title">
          <UiInput id="dialog-title" v-model="dialogTitle" />
        </UiField>
        <UiField control-id="dialog-description" label="Description">
          <UiInput id="dialog-description" v-model="dialogDescription" />
        </UiField>
      </template>
    </div>

    <div class="playground-preview" aria-label="Component preview">
      <p v-if="!compact" class="pane-label pane-label--accent">Preview</p>
      <div class="playground-stage">
        <UiButton
          v-if="slug === 'button'"
          :disabled="disabled"
          :loading="loading"
          :variant="buttonVariant"
        >
          {{ compact ? 'Inspect evidence' : label }}
        </UiButton>

        <UiAlert v-else-if="slug === 'alert'" :tone="tone">
          {{ compact ? 'Theme imported successfully.' : label }}
        </UiAlert>

        <UiBadge v-else-if="slug === 'badge'" :tone="badgeTone">
          {{ compact ? 'Needs review' : label }}
        </UiBadge>

        <UiCheckbox
          v-else-if="slug === 'checkbox'"
          v-model="checked"
          :disabled="disabled"
        >
          Include archived sessions
        </UiCheckbox>

        <template v-else-if="slug === 'dialog'">
          <UiButton variant="secondary" @click="dialogOpen = true">Open dialog</UiButton>
          <UiDialog
            :open="dialogOpen"
            :title="dialogTitle"
            :description="dialogDescription"
            @update:open="dialogOpen = $event"
          >
            Review the details before continuing.
            <template #footer>
              <UiButton variant="secondary" @click="dialogOpen = false">Cancel</UiButton>
              <UiButton @click="dialogOpen = false">Continue</UiButton>
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
          <UiInput v-model="inputValue" :disabled="disabled" type="search" />
        </UiField>

        <UiInput
          v-else-if="slug === 'input'"
          v-model="inputValue"
          :disabled="disabled"
          :invalid="Boolean(error)"
          type="search"
          placeholder="Search sessions"
          aria-label="Search sessions"
        />

        <UiProgress
          v-else-if="slug === 'progress'"
          label="Theme import progress"
          :value="compact ? 64 : progressValue"
          :max="100"
        />

        <UiSelect
          v-else-if="slug === 'select'"
          v-model="selectValue"
          :disabled="disabled"
          aria-label="Status"
        >
          <option value="all">All statuses</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </UiSelect>

        <UiSurface v-else-if="slug === 'surface'" :padding="surfacePadding">
          <h3>Session summary</h3>
          <p>12 tool calls across 4 turns.</p>
        </UiSurface>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  UiAlert,
  UiBadge,
  UiButton,
  UiCheckbox,
  UiDialog,
  UiField,
  UiInput,
  UiProgress,
  UiSelect,
  UiSurface,
} from '../../../src/index.js'
import type {
  UiAlertProps,
  UiButtonProps,
  UiSurfaceProps,
} from '../../../src/index.js'

withDefaults(defineProps<{
  compact?: boolean
  slug: string
}>(), {
  compact: false,
})

const label = ref('Inspect evidence')
const buttonVariant = ref<NonNullable<UiButtonProps['variant']>>('primary')
const tone = ref<NonNullable<UiAlertProps['tone']>>('info')
const inputValue = ref('agent workbench')
const selectValue = ref('all')
const error = ref('')
const checked = ref(false)
const disabled = ref(false)
const loading = ref(false)
const progressValue = ref(42)
const surfacePadding = ref<NonNullable<UiSurfaceProps['padding']>>('default')
const dialogOpen = ref(false)
const dialogTitle = ref('Review evidence')
const dialogDescription = ref('Confirm the evidence before continuing.')

const badgeTone = computed(() => tone.value === 'error' ? 'danger' : tone.value)
</script>
