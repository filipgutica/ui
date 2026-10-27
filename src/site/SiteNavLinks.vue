<script setup lang="ts">
import type { UiSiteNavGroup, UiSiteNavItem } from './UiSiteNav.vue'

const { contentId, label, groups, activeId } = defineProps<{
  contentId: string
  label: string
  groups: readonly UiSiteNavGroup[]
  activeId: string | undefined
}>()

const emit = defineEmits<{
  (event: 'navigate', href: string, click: MouseEvent): void
}>()

const labelId = `${contentId}-label`
const groupLabelId = (index: number): string => `${contentId}-group-${index}`

// A destination page outranks the tracked section, so a page link never shows both markers.
const currentState = (item: UiSiteNavItem): 'page' | 'location' | undefined => {
  if (item.current) return 'page'
  return activeId !== undefined && item.href === `#${activeId}` ? 'location' : undefined
}
</script>

<template>
  <div
    :id="contentId"
    class="fg-site-rail__content"
  >
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
          @click="emit('navigate', item.href, $event)"
        ><code v-if="item.code">{{ item.label }}</code><template v-else>{{ item.label }}</template></a>
      </div>
    </nav>
  </div>
</template>
