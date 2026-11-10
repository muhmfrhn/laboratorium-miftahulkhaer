<script setup lang="ts">
import type { InventoryItem } from '../types/inventory'

defineProps<{ item: InventoryItem; busy: boolean }>()

const emit = defineEmits<{ book: [item: InventoryItem] }>()
</script>

<template>
  <article class="card">
    <div class="head">
      <span class="kode">{{ item.kode }}</span>
      <span class="badge" :class="item.kondisi === 'bagus' ? 'ok' : 'bad'">
        {{ item.kondisi }}
      </span>
    </div>
    <strong class="nama">{{ item.nama }}</strong>
    <p class="meta">
      {{ item.laboratorium?.nama ?? `Lab #${item.laboratoriumId}` }}
      <span aria-hidden="true">·</span>
      {{ item.category?.nama ?? `Kategori #${item.categoryId}` }}
    </p>
    <p v-if="item.category" class="stock">Stok kategori: {{ item.category.jumlah }}</p>
    <button
      class="btn primary"
      :disabled="busy || item.kondisi === 'rusak'"
      @click="emit('book', item)"
    >
      {{ item.kondisi === 'rusak' ? 'Tidak tersedia' : busy ? '...' : 'Booking barang' }}
    </button>
  </article>
</template>

<style scoped>
.card {
  display: grid;
  gap: 6px;
  align-content: start;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--card-soft);
  box-shadow: var(--shadow-1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: transform 0.16s ease, border-color 0.16s ease;
}
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(109, 90, 224, 0.45);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.kode {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  border: 1px solid transparent;
}
.badge.ok {
  background: rgba(34, 197, 94, 0.14);
  color: #16a34a;
}
.badge.bad {
  background: var(--danger-soft);
  color: var(--danger);
}
.nama {
  font-size: 16px;
  font-weight: 650;
  color: var(--ink);
  letter-spacing: -0.2px;
}
.meta {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.45;
}
.stock {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
}
.btn.primary {
  margin-top: 6px;
  padding: 10px 16px;
  border-radius: var(--r-md);
  background: linear-gradient(135deg, var(--brand-2), var(--brand));
  border: 1px solid transparent;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 14px 24px -16px rgba(109, 90, 224, 0.95);
}
.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}
.btn.primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
