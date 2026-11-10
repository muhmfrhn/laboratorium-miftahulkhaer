// Tipe untuk Booking Inventori (guru membooking per item, langsung aktif).
// GET /api/booking-inventori -> { data: [BookingInventoriItem], paging }
// POST /api/booking-inventori { inventoryId, keperluan, tglmulai, tglselesai, catatan? }
// PATCH /api/booking-inventori/:id/cancel -> { data: item }
// PATCH /api/booking-inventori/:id/finish (teknisi) -> { data: item }

import type { Kondisi } from './inventory'

export type StatusBookingInventori = 'DIBOOKING' | 'SELESAI' | 'BATAL'

export const STATUS_BOOKING_INVENTORI: StatusBookingInventori[] = ['DIBOOKING', 'SELESAI', 'BATAL']

export interface BookingInventoriInventoryRef {
  id: number
  kode: string
  nama: string
  kondisi: Kondisi
  laboratoriumId: number
}

export interface BookingInventoriLabRef {
  id: number
  kode: string
  nama: string
}

export interface BookingInventoriUserRef {
  id: number
  name: string | null
  email: string
}

export interface BookingInventoriItem {
  id: number
  keperluan: string
  catatan: string | null
  tglmulai: string
  tglselesai: string
  status: StatusBookingInventori
  bookedAt: string
  inventoryId: number
  userId: number
  inventory?: BookingInventoriInventoryRef
  laboratorium?: BookingInventoriLabRef
  user?: BookingInventoriUserRef
}

export interface BookingInventoriPaging {
  page: number
  size: number
  total_item: number
  total_page: number
}

export interface BookingInventoriListResult {
  data: BookingInventoriItem[]
  paging: BookingInventoriPaging
}

export interface CreateBookingInventoriPayload {
  inventoryId: number
  keperluan: string
  tglmulai: string
  tglselesai: string
  catatan?: string
}
