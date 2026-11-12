<script setup lang="ts">
import type { UiSiteNavGroup, UiSiteNavItem } from './UiSiteNav.vue'

const { contentId, label, groups, activeId, visible = undefined } = defineProps<{
  contentId: string
  label: string
  groups: readonly UiSiteNavGroup[]
  activeId: string | undefined
  /** The rows Find keeps; undefined shows every row. */
  visible?: ReadonlySet<UiSiteNavItem> | undefined
}>()

const emit = defineEmits<{
  (event: 'navigate', href: string, click: MouseEvent): void
}>()

defineSlots<{
  /** Above the rows: Find. */
  before?(): unknown
  /** After the groups, inside the navigation: Find's empty state. */
  empty?(): unknown
  /** Below the rows: the rail's settings. */
  after?(): unknown
}>()

const labelId = `${contentId}-label`
const groupLabelId = (index: number): string => `${contentId}-group-${index}`

// A destination page outranks the tracked section, so a page link never shows both markers.
const currentState = (item: UiSiteNavItem): 'page' | 'location' | undefined => {
  if (item.current) return 'page'
  return activeId !== undefined && item.href === `#${activeId}` ? 'location' : undefined
}
const shown = (item: UiSiteNavItem): boolean => visible?.has(item) ?? true
</script>

<template>
  <div
    :id="contentId"
    class="fg-site-rail__content"
  >
    <slot name="before" />
    <nav
      class="fg-site-rail__nav fg-site-nav"
      :aria-labelledby="labelId"
    >
      <h2
        :id="labelId"
        class="fg-site-rail__label"
      >
        {{ label }}
      </h2>
      <div
        v-for="(group, index) in groups"
        :key="group.label ?? index"
        class="fg-site-rail__group"
        :role="group.label ? 'group' : undefined"
        :aria-labelledby="group.label ? groupLabelId(index) : undefined"
        :hidden="!group.items.some(shown)"
      >
        <span
          v-if="group.label"
          :id="groupLabelId(index)"
          class="fg-site-rail__group-label"
        >{{ group.label }}</span>
        <a
          v-for="item in group.items"
          :key="item.href"
          :href="item.href"
          :aria-current="currentState(item)"
          :hidden="!shown(item)"
          @click="emit('navigate', item.href, $event)"
        ><code v-if="item.code">{{ item.label }}</code><template v-else>{{ item.label }}</template></a>
      </div>
      <slot name="empty" />
    </nav>
    <slot name="after" />
  </div>
</template>
