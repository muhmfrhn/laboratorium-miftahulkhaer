import type { Context } from "hono";
import type { User } from "../../../generated/prisma/client";
import { LaporanService } from "./laporan.service";

export class LaporanController {
    static async penggunaanLab(c: Context<{ Variables: { user: User } }>) {
        const bulan = c.req.query("bulan") ?? "";
        const response = await LaporanService.penggunaanLab(bulan);
        return c.json(response);
    }

    static async penggunaanLabCsv(c: Context<{ Variables: { user: User } }>) {
        const bulan = c.req.query("bulan") ?? "";
        const report = await LaporanService.penggunaanLab(bulan);
        const csv = LaporanService.buildCsv(report);

        return c.body(csv, 200, {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="laporan-penggunaan-lab-${report.bulan}.csv"`,
        });
    }
}
