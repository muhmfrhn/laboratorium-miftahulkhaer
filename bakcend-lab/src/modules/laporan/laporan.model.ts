export type LaporanPenggunaanLabItem = {
    tanggal: string;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    durasiMenit: number;
    laboratoriumKode: string;
    laboratoriumNama: string;
    guruNama: string;
    guruEmail: string;
    catatan: string;
};

export type RekapLaboratorium = {
    laboratoriumKode: string;
    laboratoriumNama: string;
    jumlahSesi: number;
    totalMenit: number;
};

export type LaporanPenggunaanLabResponse = {
    bulan: string;
    periode: {
        mulai: string;
        selesai: string;
    };
    totalSesi: number;
    totalMenit: number;
    data: LaporanPenggunaanLabItem[];
    rekap: RekapLaboratorium[];
};
