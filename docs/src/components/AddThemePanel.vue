<template>
  <div
    class="add-theme-panel"
    :aria-busy="panelBusy ? 'true' : undefined"
  >
    <div class="add-theme-panel__intro">
      <h3>Search community theme extensions</h3>
      <p>Find Open VSX candidates. Install validates the selected color theme before applying it.</p>
    </div>

    <div class="theme-search-field">
      <span
        class="theme-search-field__icon"
        aria-hidden="true"
      >⌕</span>
      <UiInput
        id="open-vsx-query"
        v-model="query"
        type="search"
        placeholder="Search themes…"
        aria-label="Search themes"
        autocomplete="off"
        :disabled="panelBusy"
      />
    </div>

    <div class="theme-search-toolbar">
      <div
        class="theme-search-suggestions"
        aria-label="Suggested theme searches"
      >
        <UiButton
          v-for="suggestion in suggestions"
          :key="suggestion.label"
          size="sm"
          variant="ghost"
          :aria-pressed="query === suggestion.query"
          :disabled="panelBusy"
          @click="query = suggestion.query"
        >
          {{ suggestion.label }}
        </UiButton>
      </div>
      <span
        class="theme-searching"
        role="status"
      >
        {{ searchBusy ? 'Searching…' : `${data?.length ?? 0} extensions` }}
      </span>
    </div>

    <UiAlert
      v-if="searchError"
      tone="error"
    >
      {{ searchError.message }}
    </UiAlert>
    <UiAlert
      v-else-if="installError"
      tone="error"
    >
      {{ installError }}
    </UiAlert>
    <p
      v-else-if="!searchBusy && data?.length === 0"
      class="theme-empty-state"
      role="status"
    >
      No theme extensions found.
    </p>

    <ul
      v-if="data?.length"
      class="theme-results"
      aria-label="Open VSX theme results"
    >
      <li
        v-for="themeSummary in data"
        :key="themeSummary.id"
      >
        <div class="theme-result__heading">
          <span
            class="theme-result__mark"
            aria-hidden="true"
          >{{ themeSummary.name.slice(0, 1) }}</span>
          <div>
            <strong>{{ themeSummary.name }}</strong>
            <span>{{ themeSummary.publisher }} · {{ formatDownloads(themeSummary.downloadCount) }} downloads</span>
          </div>
        </div>
        <p>{{ themeSummary.description || 'A community theme extension for VS Code.' }}</p>
        <UiButton
          class="theme-result__install"
          variant="secondary"
          size="sm"
          :loading="importingId === themeSummary.id"
          :disabled="panelBusy"
          @click="installOpenVsxTheme(themeSummary)"
        >
          Install
        </UiButton>
      </li>
    </ul>

    <div class="theme-import-divider">
      <span>or import a file</span>
    </div>

    <div
      ref="dropZone"
      class="theme-drop-zone"
      :data-dragging="isOverDropZone ? 'true' : undefined"
    >
      <div>
        <strong>Theme file</strong>
        <span>Drop a T3 Code or VS Code .json/.jsonc file</span>
      </div>
      <UiButton
        variant="secondary"
        size="sm"
        :loading="fileBusy"
        :disabled="panelBusy"
        @click="openFileDialog()"
      >
        Choose file
      </UiButton>
    </div>

    <UiAlert
      v-if="fileError"
      tone="error"
    >
      {{ fileError }}
    </UiAlert>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn, useDropZone, useFileDialog } from '@vueuse/core'
import useSWRV from 'swrv'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import type { OpenVsxThemeSummary, NormalizedTheme } from '../../../src/theme/index.js'

import { UiAlert, UiButton, UiInput } from '../../../src/index.js'
import { importOpenVsxTheme, searchOpenVsx } from '../open-vsx-client.js'
import { parseThemeFile } from '../theme-file.js'

export interface InstalledTheme {
  id: string
  theme: NormalizedTheme
}

const { preferredAppearance } = defineProps<{
  preferredAppearance: 'light' | 'dark'
}>()

const emit = defineEmits<{
  installed: [value: InstalledTheme]
}>()

const SEARCH_KEY_PREFIX = 'open-vsx:'
const suggestions = [
  { label: 'Popular', query: '' },
  { label: 'Dracula', query: 'Dracula' },
  { label: 'Catppuccin', query: 'Catppuccin' },
  { label: 'Nord', query: 'Nord' },
  { label: 'Tokyo Night', query: 'Tokyo Night' },
]

const query = ref('')
const debouncedQuery = ref('')
const importingId = ref('')
const fileBusy = ref(false)
const installError = ref('')
const fileError = ref('')
const dropZone = ref<HTMLElement | null>(null)
let searchController: AbortController | undefined
let importController: AbortController | undefined
let acceptingResults = true

const updateDebouncedQuery = useDebounceFn((value: string) => {
  debouncedQuery.value = value.trim()
}, 300)

watch(query, (value) => {
  installError.value = ''
  updateDebouncedQuery(value)
})

const { data, error: searchError, isLoading, isValidating } = useSWRV<OpenVsxThemeSummary[], Error>(
  () => `${SEARCH_KEY_PREFIX}${debouncedQuery.value}`,
  async (key: string) => {
    searchController?.abort()
    searchController = new AbortController()
    return searchOpenVsx(key.slice(SEARCH_KEY_PREFIX.length), { signal: searchController.signal })
  },
  {
    dedupingInterval: 2_000,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    ttl: 5 * 60_000,
  },
)

const searchBusy = computed(() => query.value.trim() !== debouncedQuery.value || isLoading.value || isValidating.value)
const panelBusy = computed(() => Boolean(importingId.value) || fileBusy.value)

const installOpenVsxTheme = async (themeSummary: OpenVsxThemeSummary): Promise<void> => {
  if (panelBusy.value) return
  const controller = new AbortController()
  importController = controller
  importingId.value = themeSummary.id
  installError.value = ''
  try {
    const theme = await importOpenVsxTheme({
      extensionId: themeSummary.id,
      preferredAppearance,
      signal: controller.signal,
    })
    if (!acceptingResults || controller.signal.aborted) return
    emit('installed', { id: themeSummary.id, theme })
  } catch (error) {
    if (!acceptingResults || controller.signal.aborted) return
    installError.value = error instanceof Error ? error.message : 'Could not import that theme.'
  } finally {
    if (importController === controller) {
      importingId.value = ''
      importController = undefined
    }
  }
}

const importThemeFile = async (file: File | undefined): Promise<void> => {
  if (!file || panelBusy.value) return
  fileBusy.value = true
  fileError.value = ''
  try {
    const theme = await parseThemeFile(file)
    if (!acceptingResults) return
    emit('installed', { id: `file:${file.name}:${theme.name}`, theme })
  } catch (error) {
    if (!acceptingResults) return
    fileError.value = error instanceof Error ? error.message : 'Could not read that theme file.'
  } finally {
    if (acceptingResults) fileBusy.value = false
  }
}

const { open: openFileDialog, onChange } = useFileDialog({
  accept: '.json,.jsonc,application/json',
  multiple: false,
  reset: true,
})

onChange(files => importThemeFile(files?.[0]))

const { isOverDropZone } = useDropZone(dropZone, {
  multiple: false,
  onDrop: files => importThemeFile(files?.[0]),
})

const formatDownloads = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(count >= 100_000 ? 0 : 1)}K`
  return String(count)
}

onBeforeUnmount(() => {
  acceptingResults = false
  searchController?.abort()
  importController?.abort()
})
</script>
