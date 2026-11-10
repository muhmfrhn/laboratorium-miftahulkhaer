import { ZodType, z } from "zod";
import type {
    CreateBookingInventoriRequest,
    SearchBookingInventori,
} from "../modules/booking-inventori/booking-inventori.model";
import { StatusBookingInventori } from "../../generated/prisma/enums";

export class BookingInventoriValidation {
    static readonly CREATE: ZodType<CreateBookingInventoriRequest> = z.object({
        inventoryId: z.number().int().positive(),
        keperluan: z.string().min(1).max(191),
        catatan: z.string().max(191).optional(),
        tglmulai: z.coerce.date(),
        tglselesai: z.coerce.date(),
    });

    static readonly SEARCH: ZodType<SearchBookingInventori> = z.object({
        page: z.coerce.number().min(1).default(1),
        size: z.coerce.number().min(1).max(100).default(10),
        status: z.enum(StatusBookingInventori).optional(),
        inventoryId: z.coerce.number().int().positive().optional(),
        laboratoriumId: z.coerce.number().int().positive().optional(),
        date: z.string().min(1).optional(),
        search: z.string().min(1).max(100).optional(),
    });
}
