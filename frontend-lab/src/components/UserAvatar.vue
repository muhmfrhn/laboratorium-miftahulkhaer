<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name?: string | null
    email?: string | null
    foto?: string | null
    size?: number
    alt?: string
  }>(),
  { size: 36, name: null, email: null, foto: null, alt: '' },
)

const initials = computed(() => {
  const source = (props.name ?? props.email ?? '?').trim()
  const parts = source.split(/[\s.@_-]+/).filter(Boolean)
  const value = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)
  return value.toUpperCase()
})

const label = computed(() => props.alt || props.name || props.email || 'Pengguna')
const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.max(11, Math.round(props.size * 0.36))}px`,
}))
</script>

<template>
  <span class="avatar" :style="style" role="img" :aria-label="label">
    <img v-if="foto" :src="foto" alt="" />
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>

<style scoped>
.avatar {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 50%;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  background: linear-gradient(140deg, var(--brand-2), var(--brand));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
