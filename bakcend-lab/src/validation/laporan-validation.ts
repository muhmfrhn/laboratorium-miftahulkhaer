import { z, type ZodType } from "zod";

export type LaporanBulanRequest = {
    bulan: string;
};

const POLA_BULAN = /^\d{4}-(0[1-9]|1[0-2])$/;

export class LaporanValidation {
    static readonly BULAN: ZodType<LaporanBulanRequest> = z.object({
        bulan: z.string().regex(POLA_BULAN, "format bulan harus YYYY-MM"),
    });
}
