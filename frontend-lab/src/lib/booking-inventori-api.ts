// Client untuk Booking Inventori.
// GET /api/booking-inventori -> { data, paging } (guru: hanya booking miliknya)
// POST /api/booking-inventori -> { data: item } 201
// PATCH /api/booking-inventori/:id/cancel -> { data: item }

import { getJson, patchJson, postJsonAuth } from './http'
import type {
  BookingInventoriItem,
  BookingInventoriListResult,
  CreateBookingInventoriPayload,
} from '../types/booking-inventori'

const PAGE_SIZE = 10

export interface BookingInventoriFilters {
  search?: string
  status?: string
  inventoryId?: number
  laboratoriumId?: number
  date?: string
}

export function listBookingInventori(
  page: number,
  filters: BookingInventoriFilters,
  size = PAGE_SIZE,
): Promise<BookingInventoriListResult> {
  return getJson('/api/booking-inventori', {
    page,
    size,
    search: filters.search?.trim() || undefined,
    status: filters.status,
    inventoryId: filters.inventoryId,
    laboratoriumId: filters.laboratoriumId,
    date: filters.date || undefined,
  })
}

export function createBookingInventori(
  payload: CreateBookingInventoriPayload,
): Promise<BookingInventoriItem> {
  return postJsonAuth<BookingInventoriItem>('/api/booking-inventori', payload)
}

export function cancelBookingInventori(id: number): Promise<BookingInventoriItem> {
  return patchJson<BookingInventoriItem>(`/api/booking-inventori/${id}/cancel`, {})
}
