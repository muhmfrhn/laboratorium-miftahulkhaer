import type { BookingInventori } from "../../../generated/prisma/client";
import type { Kondisi, StatusBookingInventori } from "../../../generated/prisma/enums";

export type CreateBookingInventoriRequest = {
    inventoryId: number;
    keperluan: string;
    catatan?: string;
    tglmulai: Date;
    tglselesai: Date;
};

export type SearchBookingInventori = {
    page: number;
    size: number;
    status?: StatusBookingInventori;
    inventoryId?: number;
    laboratoriumId?: number;
    date?: string;
    search?: string;
};

export type Paging = {
    page: number;
    size: number;
    total_item: number;
    total_page: number;
};

export type BookingInventoriInventoryRef = {
    id: number;
    kode: string;
    nama: string;
    kondisi: Kondisi;
    laboratoriumId: number;
};

export type BookingInventoriLaboratoriumRef = {
    id: number;
    kode: string;
    nama: string;
};

export type BookingInventoriUserRef = {
    id: number;
    name: string | null;
    email: string;
};

export type BookingInventoriListItem = {
    id: number;
    keperluan: string;
    catatan: string | null;
    tglmulai: Date;
    tglselesai: Date;
    status: StatusBookingInventori;
    bookedAt: Date;
    inventoryId: number;
    userId: number;
    inventory?: BookingInventoriInventoryRef;
    laboratorium?: BookingInventoriLaboratoriumRef;
    user?: BookingInventoriUserRef;
};

export type BookingInventoriListResponse = {
    data: BookingInventoriListItem[];
    paging: Paging;
};

type BookingInventoriWithRelations = BookingInventori & {
    inventory?:
        | (BookingInventoriInventoryRef & {
              laboratorium?: BookingInventoriLaboratoriumRef | null;
          })
        | null;
    user?: BookingInventoriUserRef | null;
};

export function toBookingInventoriListItem(
    booking: BookingInventoriWithRelations,
): BookingInventoriListItem {
    return {
        id: booking.id,
        keperluan: booking.keperluan,
        catatan: booking.catatan,
        tglmulai: booking.tglmulai,
        tglselesai: booking.tglselesai,
        status: booking.status,
        bookedAt: booking.bookedAt,
        inventoryId: booking.inventoryId,
        userId: booking.userId,
        ...(booking.inventory
            ? {
                  inventory: {
                      id: booking.inventory.id,
                      kode: booking.inventory.kode,
                      nama: booking.inventory.nama,
                      kondisi: booking.inventory.kondisi,
                      laboratoriumId: booking.inventory.laboratoriumId,
                  },
              }
            : {}),
        ...(booking.inventory?.laboratorium
            ? { laboratorium: booking.inventory.laboratorium }
            : {}),
        ...(booking.user ? { user: booking.user } : {}),
    };
}
