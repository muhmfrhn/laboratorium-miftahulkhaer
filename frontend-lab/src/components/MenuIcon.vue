<script setup lang="ts">
import { computed } from 'vue'
import type { MenuKey } from '../lib/menu'

const props = defineProps<{ name: MenuKey }>()

const ICONS: Record<MenuKey, string[]> = {
  dashboard: [
    'M4.5 4.5h6v6h-6z',
    'M13.5 4.5h6v6h-6z',
    'M4.5 13.5h6v6h-6z',
    'M13.5 13.5h6v6h-6z',
  ],
  users: [
    'M15.5 19.5v-1.6a3.4 3.4 0 0 0-3.4-3.4H7.9a3.4 3.4 0 0 0-3.4 3.4v1.6',
    'M9.5 11.4a3.45 3.45 0 1 0 0-6.9 3.45 3.45 0 0 0 0 6.9',
    'M19.9 19.5v-1.6a3.4 3.4 0 0 0-2.5-3.3',
    'M15.4 4.7a3.45 3.45 0 0 1 0 6.6',
  ],
  laboratorium: [
    'M10 3.5v5.7l-4.9 9.2A2 2 0 0 0 6.8 21.5h10.4a2 2 0 0 0 1.7-3.1L14 9.2V3.5',
    'M8.6 3.5h6.8',
    'M7.5 15h9',
  ],
  inventory: [
    'M3.8 7.6 12 3.4l8.2 4.2v8.8L12 20.6l-8.2-4.2z',
    'M3.8 7.6 12 11.8l8.2-4.2',
    'M12 11.8v8.8',
  ],
  category: [
    'M4 5.5h16v4h-16z',
    'M4 10.5h16v4h-16z',
    'M4 15.5h10v4H4z',
  ],
  jadwal: [
    'M4.6 7.4a2 2 0 0 1 2-2h10.8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.6a2 2 0 0 1-2-2z',
    'M8.4 3.4v3.2',
    'M15.6 3.4v3.2',
    'M4.6 10.2h14.8',
  ],
  laporan: [
    'M7.5 3.5h6.5l3.5 3.5v12.5a1.5 1.5 0 0 1-1.5 1.5h-8.5a1.5 1.5 0 0 1-1.5-1.5v-14.5a1.5 1.5 0 0 1 1.5-1.5z',
    'M14 3.5V7h3.5',
    'M8.5 11h6',
    'M8.5 14.5h6',
    'M8.5 18h3.5',
  ],
}

const paths = computed(() => ICONS[props.name] ?? [])
</script>

<template>
  <svg
    class="menu-ico"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.menu-ico {
  display: block;
  width: 1.3em;
  height: 1.3em;
  flex: 0 0 auto;
}
</style>
