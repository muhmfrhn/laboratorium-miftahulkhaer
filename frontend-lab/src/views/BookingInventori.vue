<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BookingInventoriTable from '../components/BookingInventoriTable.vue'
import InventoriBookingDialog from '../components/InventoriBookingDialog.vue'
import InventoriCard from '../components/InventoriCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import PaginationBar from '../components/PaginationBar.vue'
import { useBookingInventori } from '../composables/useBookingInventori'
import { useInventory } from '../composables/useInventory'
import { useToast } from '../composables/useToast'
import { listAllLabs } from '../lib/laboratorium-api'
import type { BookingInventoriItem, CreateBookingInventoriPayload } from '../types/booking-inventori'
import type { InventoryItem } from '../types/inventory'
import type { LabItem } from '../types/laboratorium'

const emit = defineEmits<{ sessionExpired: [] }>()

const { notify } = useToast()

const {
  items: inventoryItems,
  paging: inventoryPaging,
  filters: inventoryFilters,
  loading: inventoryLoading,
  errorMsg: inventoryError,
  errorStatus: inventoryErrorStatus,
  refresh: refreshInventory,
  setPage: setInventoryPage,
  setSearch: setInventorySearch,
  setLaboratoriumFilter,
  resetFilters,
} = useInventory()

const {
  items: bookings,
  loading: bookingsLoading,
  errorMsg: bookingsError,
  errorStatus: bookingsErrorStatus,
  refresh: refreshBookings,
  createBooking,
  cancelById,
} = useBookingInventori({ size: 100 })

const labs = ref<LabItem[]>([])
const dialogOpen = ref(false)
const selectedItem = ref<InventoryItem | null>(null)
const saving = ref(false)
const dialogError = ref('')
const busyId = ref<number | null>(null)

// Barang bagus ditampilkan lebih dulu; barang rusak tetap tampil tapi tidak bisa dibooking.
const sortedInventory = computed(() =>
  inventoryItems.value
    .slice()
    .sort((a, b) => (a.kondisi === b.kondisi ? 0 : a.kondisi === 'bagus' ? -1 : 1)),
)

const activeBookingCount = computed(
  () => bookings.value.filter((b) => b.status === 'DIBOOKING').length,
)

function onLabChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  setLaboratoriumFilter(raw ? Number(raw) : undefined)
}

async function loadLabs(): Promise<void> {
  try {
    labs.value = await listAllLabs()
  } catch {
    // Dropdown lab boleh gagal diam-diam; daftar barang tetap tampil.
  }
}

onMounted(() => {
  void refreshInventory()
  void refreshBookings()
  void loadLabs()
})

watch(inventoryErrorStatus, (status) => {
  if (status === 401) emit('sessionExpired')
})
watch(bookingsErrorStatus, (status) => {
  if (status === 401) emit('sessionExpired')
})

function openBooking(item: InventoryItem): void {
  if (item.kondisi === 'rusak') return
  selectedItem.value = item
  dialogError.value = ''
  dialogOpen.value = true
}

async function onConfirmBooking(payload: CreateBookingInventoriPayload): Promise<void> {
  saving.value = true
  dialogError.value = ''
  try {
    await createBooking(payload)
    dialogOpen.value = false
    selectedItem.value = null
    notify('Booking inventori berhasil dibuat', 'success')
    void refreshInventory()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gagal booking inventori'
    dialogError.value = message
    notify(message, 'error')
  } finally {
    saving.value = false
  }
}

async function onCancel(item: BookingInventoriItem): Promise<void> {
  const ok = window.confirm(
    `Batalkan booking ${item.inventory?.nama ?? 'barang ini'}? Booking akan berstatus batal.`,
  )
  if (!ok) return
  busyId.value = item.id
  try {
    await cancelById(item.id)
    notify('Booking inventori dibatalkan', 'success')
  } catch (e) {
    notify(e instanceof Error ? e.message : 'Gagal membatalkan booking', 'error')
  } finally {
    busyId.value = null
  }
}

async function refresh(): Promise<void> {
  await Promise.all([refreshInventory(), refreshBookings()])
}

defineExpose({ refresh })
</script>

<template>
  <div class="view">
    <section class="block">
      <div class="block-head">
        <h3>Barang tersedia</h3>
        <p class="count">{{ inventoryPaging.total_item }} barang</p>
      </div>

      <section class="filters">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.4" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            :value="inventoryFilters.search"
            type="search"
            placeholder="Cari kode / nama barang..."
            aria-label="Cari inventori"
            @input="setInventorySearch(($event.target as HTMLInputElement).value)"
          />
        </div>
        <select
          :value="inventoryFilters.laboratoriumId ?? ''"
          aria-label="Filter laboratorium"
          @change="onLabChange"
        >
          <option value="">Semua lab</option>
          <option v-for="lab in labs" :key="lab.id" :value="lab.id">
            {{ lab.kode }} — {{ lab.nama }}
          </option>
        </select>
        <button class="btn ghost" @click="resetFilters">Reset</button>
      </section>

      <p v-if="inventoryError" class="error">{{ inventoryError }}</p>
      <LoadingSpinner v-else-if="inventoryLoading" text="Memuat barang..." />
      <div v-else-if="sortedInventory.length > 0" class="cards">
        <InventoriCard
          v-for="item in sortedInventory"
          :key="item.id"
          :item="item"
          :busy="saving && selectedItem?.id === item.id"
          @book="openBooking"
        />
      </div>
      <p v-else class="state">Tidak ada barang yang cocok.</p>

      <PaginationBar
        :page="inventoryPaging.page"
        :total-page="inventoryPaging.total_page"
        :total-item="inventoryPaging.total_item"
        :loading="inventoryLoading"
        @prev="setInventoryPage(inventoryPaging.page - 1)"
        @next="setInventoryPage(inventoryPaging.page + 1)"
      />
    </section>

    <section class="block">
      <div class="block-head">
        <h3>Booking saya</h3>
        <p class="count">{{ activeBookingCount }} booking aktif</p>
      </div>
      <p v-if="bookingsError" class="error">{{ bookingsError }}</p>
      <BookingInventoriTable
        :items="bookings"
        :loading="bookingsLoading || busyId !== null"
        :busy-id="busyId"
        empty-text="Belum ada booking. Pilih barang di atas untuk mulai membooking."
        @cancel="onCancel"
      />
    </section>

    <InventoriBookingDialog
      :open="dialogOpen"
      :item="selectedItem"
      :saving="saving"
      :server-error="dialogError"
      @close="dialogOpen = false"
      @confirm="onConfirmBooking"
    />
  </div>
</template>

<style scoped>
.view {
  display: grid;
  gap: 24px;
  align-content: start;
}
.block {
  display: grid;
  gap: 12px;
  align-content: start;
}
.block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.block-head h3 {
  margin: 0;
  color: var(--ink);
  font-size: 16px;
}
.count {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--card-soft);
  box-shadow: var(--shadow-1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 2 1 220px;
  min-width: 0;
}
.search svg {
  position: absolute;
  left: 12px;
  width: 17px;
  height: 17px;
  color: var(--muted);
  pointer-events: none;
}
.search input {
  width: 100%;
  min-width: 0;
  padding: 10px 12px 10px 38px;
}
input,
select {
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--field);
  color: var(--ink);
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}
input::placeholder {
  color: var(--muted);
}
input:focus,
select:focus {
  outline: none;
  border-color: rgba(109, 90, 224, 0.55);
  box-shadow: 0 0 0 4px var(--brand-soft);
  background: var(--card);
}
select {
  flex: 1 1 180px;
  min-width: 0;
  cursor: pointer;
}
.btn {
  padding: 10px 16px;
  border-radius: var(--r-md);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: auto;
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease,
    color 0.18s ease;
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
.btn.ghost:hover {
  background: var(--field);
  border-color: rgba(109, 90, 224, 0.4);
  color: var(--brand-ink);
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}
.state {
  margin: 0;
  padding: 22px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
  border: 1px dashed var(--line);
  border-radius: 18px;
}
.error {
  margin: 0;
  padding: 12px 15px;
  border: 1px solid var(--danger-soft);
  border-radius: var(--r-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 14px;
}
</style>
