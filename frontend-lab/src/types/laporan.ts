// Tipe untuk laporan penggunaan laboratorium per bulan.
// GET /api/laporan/penggunaan-lab?bulan=YYYY-MM -> JSON preview
// GET /api/laporan/penggunaan-lab/csv?bulan=YYYY-MM -> file CSV

export interface LaporanPenggunaanLabItem {
  tanggal: string
  hari: string
  jamMulai: string
  jamSelesai: string
  durasiMenit: number
  laboratoriumKode: string
  laboratoriumNama: string
  guruNama: string
  guruEmail: string
  catatan: string
}

export interface RekapLaboratorium {
  laboratoriumKode: string
  laboratoriumNama: string
  jumlahSesi: number
  totalMenit: number
}

export interface LaporanPenggunaanLab {
  bulan: string
  periode: {
    mulai: string
    selesai: string
  }
  totalSesi: number
  totalMenit: number
  data: LaporanPenggunaanLabItem[]
  rekap: RekapLaboratorium[]
}
