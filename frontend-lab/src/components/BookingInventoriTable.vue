<script setup lang="ts">
import type { BookingInventoriItem, StatusBookingInventori } from '../types/booking-inventori'
import LoadingSpinner from './LoadingSpinner.vue'

defineProps<{
  items: BookingInventoriItem[]
  loading: boolean
  busyId: number | null
  emptyText?: string
}>()

const emit = defineEmits<{ cancel: [item: BookingInventoriItem] }>()

function formatDateTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusClass(status: StatusBookingInventori): string {
  if (status === 'DIBOOKING') return 'pending'
  if (status === 'SELESAI') return 'ok'
  return 'bad'
}

function statusLabel(status: StatusBookingInventori): string {
  if (status === 'DIBOOKING') return 'Dibooking'
  if (status === 'SELESAI') return 'Selesai'
  return 'Batal'
}
</script>

<template>
  <section class="table-wrap">
    <LoadingSpinner v-if="loading" />
    <p v-else-if="items.length === 0" class="state">
      {{ emptyText ?? 'Belum ada booking inventori.' }}
    </p>
    <table v-else>
      <thead>
        <tr>
          <th class="num-col">No</th>
          <th>Barang</th>
          <th>Laboratorium</th>
          <th>Mulai</th>
          <th>Selesai</th>
          <th>Keperluan</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in items" :key="item.id">
          <td class="num-col">{{ idx + 1 }}</td>
          <td>
            <span class="who">{{ item.inventory?.nama ?? `Barang #${item.inventoryId}` }}</span>
            <span v-if="item.inventory" class="kode">{{ item.inventory.kode }}</span>
          </td>
          <td class="mail">{{ item.laboratorium?.nama ?? '—' }}</td>
          <td class="mail nowrap">{{ formatDateTime(item.tglmulai) }}</td>
          <td class="mail nowrap">{{ formatDateTime(item.tglselesai) }}</td>
          <td class="note">{{ item.keperluan }}</td>
          <td>
            <span class="badge" :class="statusClass(item.status)">
              {{ statusLabel(item.status) }}
            </span>
          </td>
          <td class="row-actions">
            <button
              v-if="item.status === 'DIBOOKING'"
              class="btn small suspend"
              :disabled="busyId === item.id"
              @click="emit('cancel', item)"
            >
              {{ busyId === item.id ? '...' : 'Batalkan' }}
            </button>
            <span v-else class="dash">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--card-soft);
  box-shadow: var(--shadow-1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.state {
  margin: 0;
  padding: 34px 20px;
  text-align: center;
  font-size: 14.5px;
  color: var(--muted);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}
thead th {
  background: rgba(109, 90, 224, 0.06);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  white-space: nowrap;
}
@media (prefers-color-scheme: dark) {
  thead th {
    background: rgba(139, 124, 246, 0.12);
  }
}
tbody tr:last-child td {
  border-bottom: 0;
}
tbody tr {
  transition: background 0.16s ease;
}
tbody tr:hover {
  background: var(--brand-soft);
}
.num-col {
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  width: 1%;
  white-space: nowrap;
}
.who {
  display: block;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
}
.kode {
  display: inline-block;
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--muted);
  white-space: nowrap;
}
.mail {
  color: var(--muted);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.note {
  color: var(--muted);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nowrap {
  white-space: nowrap;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 11px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  background: var(--field);
  border: 1px solid var(--line);
  color: var(--muted);
}
.badge.pending {
  background: var(--brand-soft);
  border-color: transparent;
  color: var(--brand-ink);
}
.badge.ok {
  background: rgba(34, 197, 94, 0.14);
  border-color: transparent;
  color: #16a34a;
}
.badge.bad {
  background: var(--danger-soft);
  border-color: transparent;
  color: var(--danger);
}
.row-actions {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}
.dash {
  color: var(--muted);
}
.btn.small {
  padding: 6px 11px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  width: auto;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease,
    transform 0.16s ease;
}
.btn.small:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(109, 90, 224, 0.45);
  background: var(--brand-soft);
  color: var(--brand-ink);
}
.btn.small:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.btn.small:disabled {
  opacity: 0.55;
  cursor: wait;
}
.btn.small.suspend {
  color: var(--danger);
}
.btn.small.suspend:hover:not(:disabled) {
  background: var(--danger-soft);
  border-color: var(--danger-soft);
  color: var(--danger);
}
</style>
