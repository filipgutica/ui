<template>
  <div
    class="playground-controls"
    aria-label="Component controls"
  >
    <p class="pane-label pane-label--accent">
      Controls
    </p>
    <UiField
      v-if="supportsControlSize"
      control-id="control-size"
      label="Size"
    >
      <UiSelect v-model="controlSize">
        <option
          v-for="option in sizeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </UiSelect>
    </UiField>

    <template v-if="slug === 'button'">
      <UiField
        control-id="button-variant"
        label="Variant"
      >
        <UiSelect v-model="buttonVariant">
          <option
            v-for="option in buttonVariantOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </UiSelect>
      </UiField>
      <UiField
        control-id="button-label"
        label="Label"
      >
        <UiInput v-model="label" />
      </UiField>
      <UiCheckbox v-model="disabled">
        Disabled
      </UiCheckbox>
      <UiCheckbox v-model="loading">
        Loading
      </UiCheckbox>
    </template>

    <template v-else-if="slug === 'alert' || slug === 'badge'">
      <UiField
        control-id="feedback-tone"
        label="Tone"
      >
        <UiSelect v-model="tone">
          <option
            v-for="option in toneOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </UiSelect>
      </UiField>
      <UiField
        control-id="feedback-label"
        label="Content"
      >
        <UiInput v-model="label" />
      </UiField>
    </template>

    <template v-else-if="slug === 'input' || slug === 'field'">
      <UiField
        control-id="input-value"
        label="Value"
      >
        <UiInput v-model="inputValue" />
      </UiField>
      <UiField
        control-id="field-error"
        label="Error message"
      >
        <UiInput v-model="error" />
      </UiField>
      <UiCheckbox v-model="disabled">
        Disabled
      </UiCheckbox>
    </template>

    <template v-else-if="slug === 'select'">
      <UiField
        control-id="select-value"
        label="Selected value"
      >
        <UiSelect v-model="selectValue">
          <option
            v-for="option in statusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </UiSelect>
      </UiField>
      <UiCheckbox v-model="disabled">
        Disabled
      </UiCheckbox>
    </template>

    <template v-else-if="slug === 'checkbox'">
      <UiCheckbox v-model="checked">
        Checked
      </UiCheckbox>
      <UiCheckbox v-model="disabled">
        Disabled
      </UiCheckbox>
    </template>

    <template v-else-if="slug === 'radio-card'">
      <UiCheckbox v-model="checked">
        Selected
      </UiCheckbox>
      <UiCheckbox v-model="disabled">
        Disabled
      </UiCheckbox>
    </template>

    <template v-else-if="slug === 'radio-card-group'">
      <UiField
        control-id="radio-card-value"
        label="Selected option"
      >
        <UiSelect v-model="radioCardValue">
          <option
            v-for="option in colorSchemeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </UiSelect>
      </UiField>
      <UiCheckbox v-model="disabled">
        Disabled
      </UiCheckbox>
    </template>

    <template v-else-if="slug === 'progress'">
      <UiField
        control-id="progress-value"
        label="Value"
      >
        <UiSlider
          v-model="progressValue"
          label="Value"
        />
      </UiField>
      <output for="progress-value">{{ progressValue }}%</output>
    </template>

    <template v-else-if="slug === 'slider'">
      <UiCheckbox v-model="disabled">
        Disabled
      </UiCheckbox>
    </template>

    <template v-else-if="slug === 'dialog'">
      <UiField
        control-id="dialog-title"
        label="Title"
      >
        <UiInput v-model="dialogTitle" />
      </UiField>
      <UiField
        control-id="dialog-description"
        label="Description"
      >
        <UiInput v-model="dialogDescription" />
      </UiField>
    </template>

    <template v-else-if="slug === 'code-block'">
      <UiField
        control-id="code-language"
        label="Language"
      >
        <UiSelect v-model="language">
          <option
            v-for="option in languageOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </UiSelect>
      </UiField>
      <p class="playground-control-hint">
        Copying is enabled by default. Adjust the code presentation here.
      </p>
      <UiCheckbox v-model="checked">
        Show line numbers
      </UiCheckbox>
      <UiCheckbox v-model="disabled">
        Wrap long lines
      </UiCheckbox>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { UiAlertProps, UiButtonProps, UiControlSize } from '../../../src/index.js'

import { UiCheckbox, UiField, UiInput, UiSelect, UiSlider } from '../../../src/index.js'

const { slug } = defineProps<{ slug: string }>()

const buttonVariant = defineModel<NonNullable<UiButtonProps['variant']>>('buttonVariant', { required: true })
const checked = defineModel<boolean>('checked', { required: true })
const controlSize = defineModel<UiControlSize>('controlSize', { required: true })
const disabled = defineModel<boolean>('disabled', { required: true })
const error = defineModel<string>('error', { required: true })
const inputValue = defineModel<string>('inputValue', { required: true })
const label = defineModel<string>('label', { required: true })
const loading = defineModel<boolean>('loading', { required: true })
const progressValue = defineModel<number>('progressValue', { required: true })
const radioCardValue = defineModel<string>('radioCardValue', { required: true })
const selectValue = defineModel<string>('selectValue', { required: true })
const tone = defineModel<NonNullable<UiAlertProps['tone']>>('tone', { required: true })
const dialogDescription = defineModel<string>('dialogDescription', { required: true })
const dialogTitle = defineModel<string>('dialogTitle', { required: true })
type CodeLanguage = 'vue' | 'typescript' | 'javascript' | 'json' | 'css' | 'html' | 'bash' | 'text'
const language = defineModel<CodeLanguage>('language', { required: true })

const sizeOptions = [
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
] satisfies Array<{ label: string, value: UiControlSize }>

const buttonVariantOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Ghost', value: 'ghost' },
  { label: 'Danger', value: 'danger' },
  { label: 'Text', value: 'text' },
] satisfies Array<{ label: string, value: NonNullable<UiButtonProps['variant']> }>

const toneOptions = [
  { label: 'Neutral', value: 'neutral' },
  { label: 'Info', value: 'info' },
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Danger', value: 'danger' },
  { label: 'Error', value: 'error' },
] satisfies Array<{ label: string, value: NonNullable<UiAlertProps['tone']> }>

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Passed', value: 'passed' },
  { label: 'Failed', value: 'failed' },
]

const colorSchemeOptions = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

const languageOptions = [
  { label: 'Vue', value: 'vue' },
  { label: 'TS', value: 'typescript' },
  { label: 'JS', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'CSS', value: 'css' },
  { label: 'HTML', value: 'html' },
  { label: 'bash', value: 'bash' },
  { label: 'plain', value: 'text' },
] satisfies Array<{ label: string, value: CodeLanguage }>

const supportsControlSize = computed(() => [
  'button',
  'checkbox',
  'field',
  'input',
  'select',
  'slider',
].includes(slug))
</script>
