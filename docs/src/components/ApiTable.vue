<template>
  <div v-if="items.length" class="api-table-wrap">
    <table class="api-table">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Type</th>
          <th scope="col">Default</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.name">
          <th scope="row"><code>{{ item.name }}</code></th>
          <td><code>{{ item.type }}</code></td>
          <td><code>{{ item.default ?? '—' }}</code></td>
          <td>{{ item.description }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="empty-api">None.</p>
</template>

<script setup lang="ts">
import type { ApiItem } from '../component-docs.js'

defineProps<{
  items: ApiItem[]
}>()
</script>
