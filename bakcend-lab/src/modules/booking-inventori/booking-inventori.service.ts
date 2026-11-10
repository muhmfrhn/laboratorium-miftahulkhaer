import type { Prisma, User } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { ResponseError } from "../../error/response-error";
import { BookingInventoriValidation } from "../../validation/booking-inventori-validation";
import { Validation } from "../../validation/validation";
import {
    toBookingInventoriListItem,
    type BookingInventoriListItem,
    type BookingInventoriListResponse,
    type CreateBookingInventoriRequest,
} from "./booking-inventori.model";

const BOOKING_INCLUDE = {
    inventory: {
        select: {
            id: true,
            kode: true,
            nama: true,
            kondisi: true,
            laboratoriumId: true,
            laboratorium: { select: { id: true, kode: true, nama: true } },
        },
    },
    user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.BookingInventoriInclude;

export class BookingInventoriService {
    static async list(currentUser: User, query: unknown): Promise<BookingInventoriListResponse> {
        if (!currentUser) throw new ResponseError(401, "unauthorized");

        const req = Validation.validate(BookingInventoriValidation.SEARCH, query);
        const skip = (req.page - 1) * req.size;

        const where: Prisma.BookingInventoriWhereInput = {};
        if (req.status) where.status = req.status;
        if (req.inventoryId) where.inventoryId = req.inventoryId;
        if (req.laboratoriumId) {
            where.inventory = { is: { laboratoriumId: req.laboratoriumId } };
        }
        if (req.search) {
            where.OR = [
                { keperluan: { contains: req.search } },
                {
                    inventory: {
                        is: {
                            OR: [
                                { nama: { contains: req.search } },
                                { kode: { contains: req.search } },
                            ],
                        },
                    },
                },
            ];
        }
        if (req.date) {
            const dayStart = new Date(`${req.date}T00:00:00+07:00`);
            if (Number.isNaN(dayStart.getTime())) {
                throw new ResponseError(400, "format tanggal harus YYYY-MM-DD");
            }
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            const and = Array.isArray(where.AND) ? where.AND : [];
            where.AND = [...and, { tglmulai: { gte: dayStart, lt: dayEnd } }];
        }

        // Guru hanya boleh melihat booking miliknya; teknisi melihat semua.
        if (currentUser.role === "guru") where.userId = currentUser.id;

        const [bookings, total] = await Promise.all([
            prisma.bookingInventori.findMany({
                where,
                include: BOOKING_INCLUDE,
                orderBy: { tglmulai: "asc" },
                skip,
                take: req.size,
            }),
            prisma.bookingInventori.count({ where }),
        ]);

        return {
            data: bookings.map(toBookingInventoriListItem),
            paging: {
                page: req.page,
                size: req.size,
                total_item: total,
                total_page: Math.ceil(total / req.size),
            },
        };
    }

    static async get(currentUser: User, id: number): Promise<BookingInventoriListItem> {
        if (!currentUser) throw new ResponseError(401, "unauthorized");

        const booking = await prisma.bookingInventori.findUnique({
            where: { id },
            include: BOOKING_INCLUDE,
        });
        if (!booking) throw new ResponseError(404, `Booking inventori dengan id ${id} tidak ditemukan`);

        if (currentUser.role === "guru" && booking.userId !== currentUser.id) {
            throw new ResponseError(403, "hanya pemilik booking yang boleh melihat detail");
        }

        return toBookingInventoriListItem(booking);
    }

    static async create(
        currentUser: User,
        request: CreateBookingInventoriRequest,
    ): Promise<BookingInventoriListItem> {
        if (!currentUser) throw new ResponseError(401, "unauthorized");

        const req = Validation.validate(BookingInventoriValidation.CREATE, request);
        const tglmulai = new Date(req.tglmulai);
        const tglselesai = new Date(req.tglselesai);

        if (tglselesai <= tglmulai) {
            throw new ResponseError(400, "waktu selesai harus lebih besar dari waktu mulai");
        }
        if (tglmulai <= new Date()) {
            throw new ResponseError(400, "waktu mulai tidak boleh waktu yang sudah berlalu");
        }

        const catatan = req.catatan?.trim() ? req.catatan.trim() : null;

        const booking = await prisma.$transaction(async (tx) => {
            const inventory = await tx.inventory.findUnique({ where: { id: req.inventoryId } });
            if (!inventory) {
                throw new ResponseError(404, `Inventory dengan id ${req.inventoryId} tidak ditemukan`);
            }
            if (inventory.kondisi === "rusak") {
                throw new ResponseError(409, "Inventory dalam kondisi rusak tidak bisa dibooking");
            }

            const clash = await tx.bookingInventori.findFirst({
                where: {
                    inventoryId: req.inventoryId,
                    status: "DIBOOKING",
                    tglmulai: { lt: tglselesai },
                    tglselesai: { gt: tglmulai },
                },
                select: { id: true },
            });
            if (clash) {
                throw new ResponseError(
                    409,
                    "Inventory sudah dibooking pada rentang waktu tersebut",
                );
            }

            return tx.bookingInventori.create({
                data: {
                    keperluan: req.keperluan,
                    catatan,
                    tglmulai,
                    tglselesai,
                    inventoryId: req.inventoryId,
                    userId: currentUser.id,
                },
                include: BOOKING_INCLUDE,
            });
        });

        return toBookingInventoriListItem(booking);
    }

    static async cancel(currentUser: User, id: number): Promise<BookingInventoriListItem> {
        if (!currentUser) throw new ResponseError(401, "unauthorized");

        const booking = await prisma.bookingInventori.findUnique({ where: { id } });
        if (!booking) throw new ResponseError(404, `Booking inventori dengan id ${id} tidak ditemukan`);

        if (currentUser.role === "guru" && booking.userId !== currentUser.id) {
            throw new ResponseError(403, "hanya pemilik booking yang boleh membatalkan");
        }
        if (booking.status === "BATAL") throw new ResponseError(409, "Booking sudah dibatalkan");
        if (booking.status === "SELESAI") throw new ResponseError(409, "Booking sudah selesai");
        if (currentUser.role === "guru" && new Date(booking.tglmulai) <= new Date()) {
            throw new ResponseError(
                400,
                "Booking sudah dimulai, hanya teknisi yang bisa membatalkan",
            );
        }

        const updated = await prisma.bookingInventori.update({
            where: { id },
            data: { status: "BATAL" },
            include: BOOKING_INCLUDE,
        });

        return toBookingInventoriListItem(updated);
    }

    static async finish(currentUser: User, id: number): Promise<BookingInventoriListItem> {
        if (!currentUser) throw new ResponseError(401, "unauthorized");

        const booking = await prisma.bookingInventori.findUnique({ where: { id } });
        if (!booking) throw new ResponseError(404, `Booking inventori dengan id ${id} tidak ditemukan`);
        if (booking.status !== "DIBOOKING") {
            throw new ResponseError(409, "Hanya booking yang masih aktif yang bisa diselesaikan");
        }

        const updated = await prisma.bookingInventori.update({
            where: { id },
            data: { status: "SELESAI" },
            include: BOOKING_INCLUDE,
        });

        return toBookingInventoriListItem(updated);
    }
}
