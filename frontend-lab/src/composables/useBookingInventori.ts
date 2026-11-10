import { reactive, ref } from 'vue'
import { ApiError } from '../lib/http'
import { waitMinLoading } from '../lib/min-loading'
import {
  cancelBookingInventori,
  createBookingInventori,
  listBookingInventori,
  type BookingInventoriFilters,
} from '../lib/booking-inventori-api'
import type {
  BookingInventoriItem,
  BookingInventoriListResult,
  CreateBookingInventoriPayload,
} from '../types/booking-inventori'

const SEARCH_DEBOUNCE_MS = 400

function toFriendlyMessage(e: unknown, fallback: string): { message: string; status: number } {
  const status = e instanceof ApiError ? e.status : 0
  const raw = e instanceof Error ? e.message : fallback
  if (status === 401) return { message: 'Sesi berakhir, silakan login ulang.', status }
  if (status === 403) return { message: 'Anda tidak berhak melakukan aksi ini.', status }
  if (status === 400 || status === 404 || status === 409) return { message: raw, status }
  return { message: raw || fallback, status }
}

export interface BookingInventoriFilterState extends BookingInventoriFilters {
  search: string
}

export function useBookingInventori(opts?: { size?: number }) {
  const items = ref<BookingInventoriItem[]>([])
  const paging = ref({ page: 1, size: opts?.size ?? 10, total_item: 0, total_page: 0 })
  const filters = reactive<BookingInventoriFilterState>({ search: '' })
  const loading = ref(false)
  const errorMsg = ref('')
  const errorStatus = ref(0)

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  async function load(): Promise<void> {
    loading.value = true
    const startedAt = Date.now()
    errorMsg.value = ''
    errorStatus.value = 0
    try {
      const result: BookingInventoriListResult = await listBookingInventori(
        paging.value.page,
        filters,
        opts?.size,
      )
      items.value = result.data
      paging.value = result.paging
    } catch (e) {
      const friendly = toFriendlyMessage(e, 'Gagal memuat booking inventori')
      errorMsg.value = friendly.message
      errorStatus.value = friendly.status
    } finally {
      await waitMinLoading(startedAt)
      loading.value = false
    }
  }

  async function refresh(): Promise<void> {
    await load()
  }

  function setPage(page: number): void {
    if (page < 1 || page > Math.max(paging.value.total_page, 1)) return
    paging.value.page = page
    void load()
  }

  function setSearch(value: string): void {
    filters.search = value
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      paging.value.page = 1
      void load()
    }, SEARCH_DEBOUNCE_MS)
  }

  function setStatus(value: string | undefined): void {
    filters.status = value
    paging.value.page = 1
    void load()
  }

  async function createBooking(payload: CreateBookingInventoriPayload): Promise<void> {
    try {
      await createBookingInventori(payload)
      await refresh()
    } catch (e) {
      const friendly = toFriendlyMessage(e, 'Gagal membuat booking inventori')
      const err = new Error(friendly.message) as Error & { status: number }
      err.status = friendly.status
      throw err
    }
  }

  async function cancelById(id: number): Promise<void> {
    try {
      await cancelBookingInventori(id)
      await refresh()
    } catch (e) {
      const friendly = toFriendlyMessage(e, 'Gagal membatalkan booking inventori')
      throw new Error(friendly.message)
    }
  }

  return {
    items,
    paging,
    filters,
    loading,
    errorMsg,
    errorStatus,
    load,
    refresh,
    setPage,
    setSearch,
    setStatus,
    createBooking,
    cancelById,
  }
}
