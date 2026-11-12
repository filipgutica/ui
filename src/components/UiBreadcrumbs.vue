<template>
  <nav
    class="fg-breadcrumbs"
    :aria-label="label"
  >
    <ol>
      <li
        v-for="(item, index) in items"
        :key="index"
      >
        <span
          v-if="index === items.length - 1"
          class="fg-breadcrumbs__current"
          aria-current="page"
        >{{ item.label }}</span>
        <a
          v-else-if="item.href !== undefined"
          class="fg-breadcrumbs__link"
          :href="item.href"
        >{{ item.label }}</a>
        <span v-else>{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
export interface UiBreadcrumbItem {
  label: string
  /** The ancestor page's URL. The last item is the current page and renders as text, so it needs none. */
  href?: string
}

export interface UiBreadcrumbsProps {
  /** The path from the site's home page to this page; the last item is the current page. */
  items: readonly UiBreadcrumbItem[]
  /** The navigation's accessible name. Give each trail on a page its own name. */
  label?: string
}

const { items, label = 'Breadcrumb' } = defineProps<UiBreadcrumbsProps>()
</script>
