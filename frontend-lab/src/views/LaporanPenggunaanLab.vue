<script setup lang="ts">
import { onMounted, watch } from 'vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useLaporan } from '../composables/useLaporan'
import { useToast } from '../composables/useToast'

const emit = defineEmits<{ sessionExpired: [] }>()

const { notify } = useToast()

const {
  bulan,
  data,
  loading,
  downloading,
  errorMsg,
  errorStatus,
  setBulan,
  load,
  download,
} = useLaporan()

function formatDurasi(menit: number): string {
  if (!menit || menit <= 0) return '0 menit'
  const jam = Math.floor(menit / 60)
  const sisa = menit % 60
  if (jam === 0) return `${sisa} menit`
  if (sisa === 0) return `${jam} jam`
  return `${jam} jam ${sisa} menit`
}

function labelBulan(value: string): string {
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return value
  return new Date(year, month - 1, 1).toLocaleString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

onMounted(() => {
  void load()
})

watch(errorStatus, (status) => {
  if (status === 401) emit('sessionExpired')
})

function onMonthChange(e: Event): void {
  const value = (e.target as HTMLInputElement).value
  if (!value) return
  setBulan(value)
  void load()
}

async function onDownload(): Promise<void> {
  try {
    const message = await download()
    notify(message, 'success')
  } catch (e) {
    const err = e as Error & { status?: number }
    if (err.status === 401) emit('sessionExpired')
    notify(err.message || 'Gagal mengunduh laporan', 'error')
  }
}

defineExpose({ refresh: load })
</script>

<template>
  <div class="view">
    <section class="filters">
      <label class="field">
        <span>Bulan laporan</span>
        <input type="month" :value="bulan" aria-label="Pilih bulan laporan" @change="onMonthChange" />
      </label>
      <button class="btn ghost" :disabled="loading" @click="load">
        {{ loading ? 'Memuat...' : 'Tampilkan' }}
      </button>
      <button class="btn primary" :disabled="downloading || loading" @click="onDownload">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 4v10" />
          <path d="m8 10 4 4 4-4" />
          <path d="M5 18.5h14" />
        </svg>
        {{ downloading ? 'Menyiapkan...' : 'Unduh CSV' }}
      </button>
    </section>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    <LoadingSpinner v-else-if="loading" text="Memuat laporan..." />

    <template v-else-if="data">
      <p class="periode">
        Periode {{ labelBulan(data.bulan) }} · {{ data.periode.mulai }} s/d {{ data.periode.selesai }}
      </p>

      <div class="stats">
        <article class="stat">
          <span class="label">Total sesi</span>
          <strong>{{ data.totalSesi }}</strong>
        </article>
        <article class="stat">
          <span class="label">Total durasi</span>
          <strong>{{ formatDurasi(data.totalMenit) }}</strong>
        </article>
        <article class="stat">
          <span class="label">Laboratorium terpakai</span>
          <strong>{{ data.rekap.length }}</strong>
        </article>
      </div>

      <section class="block">
        <h3>Rekap per laboratorium</h3>
        <div class="table-wrap">
          <p v-if="data.rekap.length === 0" class="state">Belum ada pemakaian lab pada bulan ini.</p>
          <table v-else>
            <thead>
              <tr>
                <th class="num-col">No</th>
                <th>Kode Lab</th>
                <th>Laboratorium</th>
                <th class="num-col">Jumlah Sesi</th>
                <th class="num-col">Total Durasi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(lab, idx) in data.rekap" :key="lab.laboratoriumKode">
                <td class="num-col">{{ idx + 1 }}</td>
                <td><span class="badge">{{ lab.laboratoriumKode }}</span></td>
                <td class="who">{{ lab.laboratoriumNama }}</td>
                <td class="num-col">{{ lab.jumlahSesi }}</td>
                <td class="num-col">{{ formatDurasi(lab.totalMenit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="block">
        <h3>Detail sesi</h3>
        <div class="table-wrap">
          <p v-if="data.data.length === 0" class="state">Belum ada sesi pada bulan ini.</p>
          <table v-else>
            <thead>
              <tr>
                <th class="num-col">No</th>
                <th>Tanggal</th>
                <th>Hari</th>
                <th>Jam</th>
                <th class="num-col">Durasi</th>
                <th>Laboratorium</th>
                <th>Guru</th>
                <th>Kelas/Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in data.data" :key="`${item.tanggal}-${item.jamMulai}-${item.laboratoriumKode}-${idx}`">
                <td class="num-col">{{ idx + 1 }}</td>
                <td class="nowrap">{{ item.tanggal }}</td>
                <td>{{ item.hari }}</td>
                <td class="nowrap">{{ item.jamMulai }} – {{ item.jamSelesai }}</td>
                <td class="num-col">{{ formatDurasi(item.durasiMenit) }}</td>
                <td class="who">{{ item.laboratoriumNama }}</td>
                <td>
                  <span class="guru">{{ item.guruNama }}</span>
                  <span class="email">{{ item.guruEmail }}</span>
                </td>
                <td class="note">{{ item.catatan }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.view {
  display: grid;
  gap: 18px;
  align-content: start;
}
.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: flex-end;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--card-soft);
  box-shadow: var(--shadow-1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.field {
  display: grid;
  gap: 6px;
  flex: 1 1 200px;
  min-width: 0;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--muted);
}
input[type='month'] {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--field);
  color: var(--ink);
  font-family: inherit;
  font-size: 14px;
  letter-spacing: normal;
  text-transform: none;
}
input[type='month']:focus {
  outline: none;
  border-color: rgba(109, 90, 224, 0.55);
  box-shadow: 0 0 0 4px var(--brand-soft);
  background: var(--card);
}
.periode {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--brand-ink);
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}
.stat {
  display: grid;
  gap: 4px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--card-soft);
  box-shadow: var(--shadow-1);
}
.stat .label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}
.stat strong {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.4px;
  font-variant-numeric: tabular-nums;
}
.block {
  display: grid;
  gap: 12px;
  align-content: start;
}
.block h3 {
  margin: 0;
  color: var(--ink);
  font-size: 16px;
}
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
  padding: 30px 20px;
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
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
}
.nowrap {
  white-space: nowrap;
}
.note {
  color: var(--muted);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.guru {
  display: block;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
}
.email {
  display: block;
  font-size: 11.5px;
  color: var(--muted);
  white-space: nowrap;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand-ink);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
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
.btn svg {
  width: 17px;
  height: 17px;
}
.btn:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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
