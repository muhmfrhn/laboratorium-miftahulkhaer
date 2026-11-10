import { prisma } from "../../../lib/prisma";
import { LaporanValidation } from "../../validation/laporan-validation";
import { Validation } from "../../validation/validation";
import type {
    LaporanPenggunaanLabItem,
    LaporanPenggunaanLabResponse,
    RekapLaboratorium,
} from "./laporan.model";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function pad2(n: number): string {
    return String(n).padStart(2, "0");
}

function wibDate(date: Date): Date {
    return new Date(date.getTime() + WIB_OFFSET_MS);
}

function formatDateWib(date: Date): string {
    const d = wibDate(date);
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function formatTimeWib(date: Date): string {
    const d = wibDate(date);
    return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

function dayNameWib(date: Date): string {
    return HARI[wibDate(date).getUTCDay()] ?? "";
}

function parseBulan(bulan: string): { year: number; month: number } {
    const [year, month] = bulan.split("-").map(Number);
    return { year: year!, month: month! };
}

function labelBulan(bulan: string): string {
    const { year, month } = parseBulan(bulan);
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

function bulanRange(bulan: string): { start: Date; end: Date; startKey: string; endKey: string } {
    const { year, month } = parseBulan(bulan);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;

    const start = new Date(`${bulan}-01T00:00:00+07:00`);
    const end = new Date(`${nextYear}-${pad2(nextMonth)}-01T00:00:00+07:00`);
    const last = new Date(end.getTime() - 1);
    return { start, end, startKey: `${bulan}-01`, endKey: formatDateWib(last) };
}

function csvEscape(value: string | number): string {
    let text = String(value ?? "");
    // Cegah formula injection saat CSV dibuka di Excel.
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
    return text;
}

export class LaporanService {
    static async penggunaanLab(bulan: string): Promise<LaporanPenggunaanLabResponse> {
        const req = Validation.validate(LaporanValidation.BULAN, { bulan });
        const { start, end, startKey, endKey } = bulanRange(req.bulan);

        const slots = await prisma.jadwalSlot.findMany({
            where: {
                status: "DIBOOKING",
                bookedById: { not: null },
                tglmulai: { gte: start, lt: end },
            },
            include: {
                laboratorium: { select: { kode: true, nama: true } },
                bookedBy: { select: { name: true, email: true } },
            },
            orderBy: [{ tglmulai: "asc" }, { laboratoriumId: "asc" }],
        });

        const data: LaporanPenggunaanLabItem[] = slots.map((slot) => {
            const durasiMenit = Math.max(
                0,
                Math.round((slot.tglselesai.getTime() - slot.tglmulai.getTime()) / 60000),
            );
            return {
                tanggal: formatDateWib(slot.tglmulai),
                hari: dayNameWib(slot.tglmulai),
                jamMulai: formatTimeWib(slot.tglmulai),
                jamSelesai: formatTimeWib(slot.tglselesai),
                durasiMenit,
                laboratoriumKode: slot.laboratorium.kode,
                laboratoriumNama: slot.laboratorium.nama,
                guruNama: slot.bookedBy?.name?.trim() || slot.bookedBy?.email || "—",
                guruEmail: slot.bookedBy?.email ?? "—",
                catatan: slot.catatan?.trim() || "—",
            };
        });

        const rekapMap = new Map<string, RekapLaboratorium>();
        for (const item of data) {
            const current = rekapMap.get(item.laboratoriumKode);
            if (current) {
                current.jumlahSesi += 1;
                current.totalMenit += item.durasiMenit;
            } else {
                rekapMap.set(item.laboratoriumKode, {
                    laboratoriumKode: item.laboratoriumKode,
                    laboratoriumNama: item.laboratoriumNama,
                    jumlahSesi: 1,
                    totalMenit: item.durasiMenit,
                });
            }
        }

        const rekap = [...rekapMap.values()].sort((a, b) =>
            a.laboratoriumNama.localeCompare(b.laboratoriumNama, "id"),
        );
        const totalMenit = data.reduce((sum, item) => sum + item.durasiMenit, 0);

        return {
            bulan: req.bulan,
            periode: { mulai: startKey, selesai: endKey },
            totalSesi: data.length,
            totalMenit,
            data,
            rekap,
        };
    }

    static buildCsv(report: LaporanPenggunaanLabResponse): string {
        const rows: (string | number)[][] = [];

        rows.push(["Laporan Penggunaan Laboratorium"]);
        rows.push(["Bulan", labelBulan(report.bulan)]);
        rows.push(["Total Sesi", report.totalSesi]);
        rows.push(["Total Durasi (menit)", report.totalMenit]);
        rows.push([]);

        rows.push([
            "Tanggal",
            "Hari",
            "Jam Mulai",
            "Jam Selesai",
            "Durasi (menit)",
            "Kode Lab",
            "Laboratorium",
            "Guru",
            "Email",
            "Kelas/Catatan",
        ]);
        for (const item of report.data) {
            rows.push([
                item.tanggal,
                item.hari,
                item.jamMulai,
                item.jamSelesai,
                item.durasiMenit,
                item.laboratoriumKode,
                item.laboratoriumNama,
                item.guruNama,
                item.guruEmail,
                item.catatan,
            ]);
        }

        rows.push([]);
        rows.push(["Rekap per Laboratorium"]);
        rows.push([
            "Kode Lab",
            "Laboratorium",
            "Jumlah Sesi",
            "Total Durasi (menit)",
            "Total Durasi (jam)",
        ]);
        for (const item of report.rekap) {
            rows.push([
                item.laboratoriumKode,
                item.laboratoriumNama,
                item.jumlahSesi,
                item.totalMenit,
                (item.totalMenit / 60).toFixed(2),
            ]);
        }

        const lines = rows.map((row) => row.map(csvEscape).join(","));
        return `\uFEFF${lines.join("\r\n")}\r\n`;
    }
}
