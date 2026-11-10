<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CreateBookingInventoriPayload } from '../types/booking-inventori'
import type { InventoryItem } from '../types/inventory'

const props = defineProps<{
  open: boolean
  item: InventoryItem | null
  saving: boolean
  serverError: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [payload: CreateBookingInventoriPayload]
}>()

const keperluan = ref('')
const catatan = ref('')
const tanggal = ref('')
const jamMulai = ref('08:00')
const jamSelesai = ref('10:00')
const formError = ref('')

function tomorrowKey(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

watch(
  () => [props.open, props.item],
  () => {
    keperluan.value = ''
    catatan.value = ''
    tanggal.value = tomorrowKey()
    jamMulai.value = '08:00'
    jamSelesai.value = '10:00'
    formError.value = ''
  },
  { immediate: true },
)

function buildDate(time: string): Date {
  return new Date(`${tanggal.value}T${time}:00`)
}

function onConfirm() {
  const namaKegiatan = keperluan.value.trim()
  if (!namaKegiatan) {
    formError.value = 'Keperluan wajib diisi'
    return
  }
  if (namaKegiatan.length > 191) {
    formError.value = 'Keperluan maksimal 191 karakter'
    return
  }
  if (!tanggal.value || !jamMulai.value || !jamSelesai.value) {
    formError.value = 'Tanggal dan jam wajib diisi'
    return
  }

  const mulai = buildDate(jamMulai.value)
  const selesai = buildDate(jamSelesai.value)
  if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime())) {
    formError.value = 'Tanggal atau jam tidak valid'
    return
  }
  if (selesai <= mulai) {
    formError.value = 'Jam selesai harus lebih besar dari jam mulai'
    return
  }
  if (mulai <= new Date()) {
    formError.value = 'Waktu mulai tidak boleh waktu yang sudah berlalu'
    return
  }

  formError.value = ''
  emit('confirm', {
    inventoryId: props.item?.id ?? 0,
    keperluan: namaKegiatan,
    tglmulai: mulai.toISOString(),
    tglselesai: selesai.toISOString(),
    catatan: catatan.value.trim() || undefined,
  })
}
</script>

<template>
  <div v-if="open && item" class="overlay" @click.self="emit('close')">
    <section class="dialog">
      <h2>Booking inventori</h2>
      <p class="summary">
        <strong>{{ item.nama }}</strong> · {{ item.kode }}<br />
        {{ item.laboratorium?.nama ?? `Lab #${item.laboratoriumId}` }}
        <span aria-hidden="true">·</span>
        {{ item.category?.nama ?? `Kategori #${item.categoryId}` }}
      </p>

      <label>
        Keperluan <span class="req">*</span>
        <input
          v-model="keperluan"
          type="text"
          maxlength="191"
          placeholder="Contoh: Praktikum Jaringan"
        />
      </label>

      <div class="grid3">
        <label>
          Tanggal
          <input v-model="tanggal" type="date" :min="tomorrowKey()" />
        </label>
        <label>
          Jam mulai
          <input v-model="jamMulai" type="time" />
        </label>
        <label>
          Jam selesai
          <input v-model="jamSelesai" type="time" />
        </label>
      </div>

      <label>
        Catatan <span class="opt">(opsional)</span>
        <textarea
          v-model="catatan"
          rows="3"
          maxlength="191"
          placeholder="Detail tambahan untuk teknisi..."
        />
      </label>

      <p v-if="formError || serverError" class="error">{{ formError || serverError }}</p>

      <div class="actions">
        <button class="btn ghost" :disabled="saving" @click="emit('close')">Batal</button>
        <button class="btn primary" :disabled="saving" @click="onConfirm">
          {{ saving ? 'Memproses...' : 'Konfirmasi booking' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 20px;
  overflow-y: auto;
  background: rgba(22, 18, 44, 0.42);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: fade 0.2s ease both;
}
.dialog {
  width: min(520px, 100%);
  margin: auto;
  box-sizing: border-box;
  padding: 26px 26px 22px;
  display: grid;
  gap: 4px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--card);
  box-shadow: var(--shadow-2);
  animation: rise 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}
h2 {
  margin: 0;
  color: var(--ink);
}
.summary {
  margin: 4px 0 8px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--muted);
}
.summary strong {
  color: var(--ink);
}
label {
  display: grid;
  gap: 6px;
  margin: 8px 0;
  min-width: 0;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--muted);
}
.req {
  color: var(--danger);
}
.opt {
  text-transform: none;
  letter-spacing: normal;
  color: var(--muted);
  font-weight: 400;
}
.grid3 {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 10px;
}
input,
textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--field);
  color: var(--ink);
  font-family: inherit;
  font-size: 15px;
  letter-spacing: normal;
  text-transform: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}
textarea {
  resize: vertical;
}
input::placeholder,
textarea::placeholder {
  color: var(--muted);
}
input:focus,
textarea:focus {
  outline: none;
  border-color: rgba(109, 90, 224, 0.55);
  box-shadow: 0 0 0 4px var(--brand-soft);
  background: var(--card);
}
.error {
  margin: 6px 0 0;
  padding: 10px 13px;
  border: 1px solid var(--danger-soft);
  border-radius: var(--r-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 13.5px;
  line-height: 1.45;
}
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
}
.btn {
  padding: 11px 18px;
  border-radius: var(--r-md);
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  width: auto;
  transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease,
    color 0.16s ease, box-shadow 0.16s ease;
}
.btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.btn.ghost {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--muted);
}
.btn.ghost:hover:not(:disabled) {
  background: var(--field);
  border-color: rgba(109, 90, 224, 0.4);
  color: var(--brand-ink);
}
.btn.primary {
  background: linear-gradient(135deg, var(--brand-2), var(--brand));
  border: 1px solid transparent;
  color: #fff;
  box-shadow: 0 14px 24px -16px rgba(109, 90, 224, 0.95);
}
.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}
.btn:disabled {
  opacity: 0.65;
  cursor: wait;
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
}
@media (max-width: 520px) {
  .grid3 {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .overlay,
  .dialog {
    animation: none;
  }
}
</style>
