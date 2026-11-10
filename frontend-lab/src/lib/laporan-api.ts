// Client laporan penggunaan lab (khusus teknisi).
// JSON dipakai untuk preview; CSV diunduh via fetch + Blob agar header
// X-API-TOKEN tetap terkirim (link <a> biasa tidak bisa membawa header).

import { ApiError, getJson } from './http'
import { authHeaders } from './token-storage'
import type { LaporanPenggunaanLab } from '../types/laporan'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function getLaporanPenggunaanLab(bulan: string): Promise<LaporanPenggunaanLab> {
  return getJson('/api/laporan/penggunaan-lab', { bulan })
}

async function toErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}))
  if (typeof body?.error === 'string') return body.error
  if (typeof body?.errors === 'string') return body.errors
  if (Array.isArray(body?.errors) && body.errors.length > 0) {
    const first = body.errors[0] as { message?: string; path?: (string | number)[] }
    if (first?.message) {
      const where = Array.isArray(first.path) && first.path.length ? ` (${first.path.join('.')})` : ''
      return `${first.message}${where}`
    }
  }
  return `Gagal mengunduh laporan (${res.status})`
}

export async function downloadLaporanPenggunaanLabCsv(bulan: string): Promise<void> {
  const query = new URLSearchParams({ bulan })
  const res = await fetch(`${API_URL}/api/laporan/penggunaan-lab/csv?${query.toString()}`, {
    headers: { ...authHeaders() },
  })

  if (!res.ok) {
    throw new ApiError(await toErrorMessage(res), res.status)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `laporan-penggunaan-lab-${bulan}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Beri jeda singkat sebelum blob dilepas agar unduhan sempat dimulai.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
