import { ref } from 'vue'
import { ApiError } from '../lib/http'
import { downloadLaporanPenggunaanLabCsv, getLaporanPenggunaanLab } from '../lib/laporan-api'
import type { LaporanPenggunaanLab } from '../types/laporan'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useLaporan() {
  const bulan = ref(currentMonth())
  const data = ref<LaporanPenggunaanLab | null>(null)
  const loading = ref(false)
  const downloading = ref(false)
  const errorMsg = ref('')
  const errorStatus = ref(0)

  function setBulan(value: string): void {
    bulan.value = value
  }

  async function load(): Promise<void> {
    loading.value = true
    errorMsg.value = ''
    errorStatus.value = 0
    try {
      data.value = await getLaporanPenggunaanLab(bulan.value)
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0
      const raw = e instanceof Error ? e.message : 'Gagal memuat laporan'
      errorMsg.value = status === 401 ? 'Sesi berakhir, silakan login ulang.' : raw || 'Gagal memuat laporan'
      errorStatus.value = status
      data.value = null
    } finally {
      loading.value = false
    }
  }

  async function download(): Promise<string> {
    downloading.value = true
    try {
      await downloadLaporanPenggunaanLabCsv(bulan.value)
      return 'Laporan CSV berhasil diunduh'
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0
      const raw = e instanceof Error ? e.message : 'Gagal mengunduh laporan'
      const err = new Error(
        status === 401 ? 'Sesi berakhir, silakan login ulang.' : raw || 'Gagal mengunduh laporan',
      ) as Error & { status: number }
      err.status = status
      throw err
    } finally {
      downloading.value = false
    }
  }

  return {
    bulan,
    data,
    loading,
    downloading,
    errorMsg,
    errorStatus,
    setBulan,
    load,
    download,
  }
}
