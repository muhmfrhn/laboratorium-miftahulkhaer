import { Hono } from "hono";
import { UserConntroller } from "../modules/users/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { InventoryController } from "../modules/inventory/inventory.controller";
import { CategoryController } from "../modules/category/category.controller";
import { LaboratoriumController } from "../modules/laboratorium/laboratorium.controller.ts";
import { JadwalController } from "../modules/jadwal/jadwal.controller.ts";
import { RutinController } from "../modules/rutin/rutin.controller.ts";
import { SlotController } from "../modules/slot/slot.controller.ts";
import { UsersController } from "../modules/users-management/users.controller.ts";
import { BookingInventoriController } from "../modules/booking-inventori/booking-inventori.controller.ts";
import { LaporanController } from "../modules/laporan/laporan.controller.ts";

const privateApi = new Hono();

// User API
privateApi.patch('/api/users/current', authMiddleware, roleMiddleware("teknisi", "guru", "siswa"), UserConntroller.update );
privateApi.delete('/api/users/current', authMiddleware, roleMiddleware("teknisi", "guru", "siswa"), UserConntroller.logout);

// Users Management API
privateApi.get('/api/users', authMiddleware, roleMiddleware("teknisi"), UsersController.list);
privateApi.post('/api/users', authMiddleware, roleMiddleware("teknisi"), UsersController.create);
privateApi.patch('/api/users/:id', authMiddleware, roleMiddleware("teknisi"), UsersController.update);
privateApi.delete('/api/users/:id', authMiddleware, roleMiddleware("teknisi"), UsersController.delete);

// Laboratorium API (list boleh diakses guru untuk dropdown pengajuan jadwal, siswa read-only jadwal hari ini)
privateApi.get('/api/laboratorium', authMiddleware, roleMiddleware("teknisi", "guru", "siswa"), LaboratoriumController.list);
privateApi.post('/api/laboratorium', authMiddleware, roleMiddleware("teknisi"), LaboratoriumController.create);
privateApi.patch('/api/laboratorium/:id', authMiddleware, roleMiddleware("teknisi"), LaboratoriumController.update);
privateApi.delete('/api/laboratorium/:id', authMiddleware, roleMiddleware("teknisi"), LaboratoriumController.delete);

// Inventory API (guru read-only untuk memilih barang yang akan dibooking)
privateApi.get('/api/inventory', authMiddleware, roleMiddleware("teknisi", "guru"), InventoryController.list);
privateApi.post('/api/inventory', authMiddleware, roleMiddleware("teknisi"), InventoryController.create);
privateApi.patch('/api/inventory/:id', authMiddleware, roleMiddleware("teknisi"), InventoryController.update);
privateApi.delete('/api/inventory/:id', authMiddleware, roleMiddleware("teknisi"), InventoryController.delete);

// Booking Inventori API (guru membooking per item, langsung aktif; teknisi memantau & menyelesaikan)
privateApi.get('/api/booking-inventori', authMiddleware, roleMiddleware("teknisi", "guru"), BookingInventoriController.list);
privateApi.get('/api/booking-inventori/:id', authMiddleware, roleMiddleware("teknisi", "guru"), BookingInventoriController.get);
privateApi.post('/api/booking-inventori', authMiddleware, roleMiddleware("guru"), BookingInventoriController.create);
privateApi.patch('/api/booking-inventori/:id/cancel', authMiddleware, roleMiddleware("guru", "teknisi"), BookingInventoriController.cancel);
privateApi.patch('/api/booking-inventori/:id/finish', authMiddleware, roleMiddleware("teknisi"), BookingInventoriController.finish);

// Category API (CRUD penuh, hanya teknisi)
privateApi.get('/api/category', authMiddleware, roleMiddleware("teknisi"), CategoryController.list);
privateApi.post('/api/category', authMiddleware, roleMiddleware("teknisi"), CategoryController.create);
privateApi.patch('/api/category/:id', authMiddleware, roleMiddleware("teknisi"), CategoryController.update);
privateApi.delete('/api/category/:id', authMiddleware, roleMiddleware("teknisi"), CategoryController.delete);

// Jadwal API (siswa: read-only, dipaksa hanya hari ini di service)
privateApi.get('/api/jadwal', authMiddleware, roleMiddleware("teknisi", "guru", "siswa"), JadwalController.list);
privateApi.post('/api/jadwal', authMiddleware, roleMiddleware('guru'), JadwalController.create);
privateApi.patch('/api/jadwal/:id', authMiddleware, roleMiddleware("guru"), JadwalController.update);
privateApi.patch('/api/jadwal/cancel/:id', authMiddleware, roleMiddleware("guru"), JadwalController.cancel);
privateApi.patch('/api/jadwal/undocancel/:id', authMiddleware, roleMiddleware("guru"), JadwalController.undoCancel);

// Slot API (jadwal ditentukan teknisi, direbut guru; siswa: read-only, dipaksa hanya booking hari ini di service)
privateApi.get('/api/slot', authMiddleware, roleMiddleware("teknisi", "guru", "siswa"), SlotController.list);
privateApi.post('/api/slot', authMiddleware, roleMiddleware("teknisi"), SlotController.create);
privateApi.patch('/api/slot/:id', authMiddleware, roleMiddleware("teknisi"), SlotController.update);
privateApi.delete('/api/slot/:id', authMiddleware, roleMiddleware("teknisi"), SlotController.remove);
privateApi.patch('/api/slot/cancel/:id', authMiddleware, roleMiddleware("teknisi"), SlotController.cancel);
privateApi.post('/api/slot/book/:id', authMiddleware, roleMiddleware("guru"), SlotController.book);
privateApi.post('/api/slot/unbook/:id', authMiddleware, roleMiddleware("guru", "teknisi"), SlotController.unbook);

// Rutin API (jadwal harian ditentukan teknisi sekali, berlaku tiap hari)
privateApi.get('/api/rutin', authMiddleware, roleMiddleware("teknisi"), RutinController.list);
privateApi.post('/api/rutin', authMiddleware, roleMiddleware("teknisi"), RutinController.create);
privateApi.patch('/api/rutin/:id', authMiddleware, roleMiddleware("teknisi"), RutinController.update);
privateApi.delete('/api/rutin/:id', authMiddleware, roleMiddleware("teknisi"), RutinController.remove);

// Laporan API (khusus teknisi): rekap penggunaan lab per bulan + export CSV
privateApi.get('/api/laporan/penggunaan-lab', authMiddleware, roleMiddleware("teknisi"), LaporanController.penggunaanLab);
privateApi.get('/api/laporan/penggunaan-lab/csv', authMiddleware, roleMiddleware("teknisi"), LaporanController.penggunaanLabCsv);

export {privateApi}