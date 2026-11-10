import type { Prisma, User } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { ResponseError } from "../../error/response-error";
import { InventoryValidation } from "../../validation/inventory-validation";
import { Validation } from "../../validation/validation";
import { toInventoryListItem, toInventoryResponse, toUpdateInventoryResponse, type CreateInventoryRequest, type DeleteInventoryResponse, type InventoryListResponse, type InventoryResponse, type UpdateInventoryResponse, type UpdateInvetoryRequest } from "./inventory.model";

export class InventoryService {

    static async list(currentUser: User, query: unknown): Promise<InventoryListResponse> {
        if(!currentUser) throw new ResponseError(401, "Unauthorized");

        const req = Validation.validate(InventoryValidation.SEARCH, query);

        const skip = (req.page - 1) * req.size;

        const where: Prisma.InventoryWhereInput = {};
        if(req.kode) where.kode = req.kode;
        if(req.nama) where.nama = { contains: req.nama };
        if(req.kondisi) where.kondisi = req.kondisi;
        if(req.tanggalbeli) where.tanggalbeli = req.tanggalbeli;
        if(req.laboratoriumId) where.laboratoriumId = req.laboratoriumId;
        if(req.categoryId) where.categoryId = req.categoryId;
        if(req.search) {
            where.OR = [
                { kode : { contains: req.search } },
                { nama: { contains: req.search } },
            ]
        }

        const [inventories, total] = await Promise.all([
            prisma.inventory.findMany({
                where,
                include: {
                    laboratorium: { select: { id: true, kode: true, nama: true } },
                    category: { select: { id: true, nama: true, jumlah: true } },
                },
                orderBy: { id: "desc" },
                skip: skip,
                take: req.size
            }),
            prisma.inventory.count({ where })
        ]);

        return {
            data: inventories.map(toInventoryListItem),
            paging: {
                page: req.page,
                size: req.size,
                total_item: total,
                total_page: Math.ceil(total / req.size)
            }
        }
    }

    static async create(currentUser: User, request: CreateInventoryRequest): Promise<InventoryResponse> {
        if(!currentUser) throw new ResponseError(401, "Unauthorized");
        const inventoryRequest = Validation.validate(InventoryValidation.CREATE, request);

        const existingKode = await prisma.inventory.findUnique({
            where: { kode : inventoryRequest.kode }
        });

        if(existingKode) throw new ResponseError(409, `kode inventory ${inventoryRequest.kode} sudah terdaftar`);

        const [laboratorium, category] = await Promise.all([
            prisma.laboratorium.findUnique({ where: { id: inventoryRequest.laboratoriumId } }),
            prisma.category.findUnique({ where: { id: inventoryRequest.categoryId } })
        ]);

        if(!laboratorium) throw new ResponseError(404, `Laboratorium dengan id ${inventoryRequest.laboratoriumId} tidak ditemukan`);
        if(!category) throw new ResponseError(404, `Category dengan id ${inventoryRequest.categoryId} tidak ditemukan`);

        // Inventory baru otomatis menambah jumlah kategorinya (+1).
        const inventory = await prisma.$transaction(async (tx) => {
            const created = await tx.inventory.create({ data: inventoryRequest });
            await tx.category.update({
                where: { id: inventoryRequest.categoryId },
                data: { jumlah: { increment: 1 } }
            });
            return created;
        });

        return toInventoryResponse(inventory);
    }

    static async update(currentUser: User, request: UpdateInvetoryRequest): Promise<UpdateInventoryResponse> {
        if(!currentUser) throw new ResponseError(401, "Unauthorized");

        const updateRequest = Validation.validate(InventoryValidation.UPDATE, request);

        const inventory = await prisma.inventory.findUnique({
            where: { id : updateRequest.id }
        });

        if(!inventory) throw new ResponseError(404, `Inventory dengan id ${updateRequest.id} tidak ditemukan`);

        if(updateRequest.kode && updateRequest.kode !== inventory.kode) {
            const existingKode = await prisma.inventory.findUnique({
                where: { kode: updateRequest.kode }
            });
            if(existingKode) throw new ResponseError(409, `kode inventory ${updateRequest.kode} sudah terdaftar`);
        }

        if(updateRequest.laboratoriumId) {
            const laboratorium = await prisma.laboratorium.findUnique({
                where: { id: updateRequest.laboratoriumId }
            });
            if(!laboratorium) throw new ResponseError(404, `Laboratorium dengan id ${updateRequest.laboratoriumId} tidak ditemukan`);
        }

        if(updateRequest.categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: updateRequest.categoryId }
            });
            if(!category) throw new ResponseError(404, `Category dengan id ${updateRequest.categoryId} tidak ditemukan`);
        }

        const { id, ...data } = updateRequest;

        // Pindah kategori: kurangi jumlah kategori lama, tambah kategori baru.
        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.inventory.update({
                where: { id },
                data
            });
            if(updateRequest.categoryId && updateRequest.categoryId !== inventory.categoryId) {
                await tx.category.update({
                    where: { id: inventory.categoryId },
                    data: { jumlah: { decrement: 1 } }
                });
                await tx.category.update({
                    where: { id: updateRequest.categoryId },
                    data: { jumlah: { increment: 1 } }
                });
            }
            return result;
        });

        return toUpdateInventoryResponse(updated);
    }

    static async delete(currentUser: User, id: number): Promise<DeleteInventoryResponse> {
        if(!currentUser) throw new ResponseError(401, "unauthorized");

        const existingInventory = await prisma.inventory.findUnique({
            where: { id }
        });

        if(!existingInventory) throw new ResponseError(404, `Inventory dengan id ${id} tidak ditemukan`);

        // Inventory yang punya riwayat booking tidak boleh dihapus (relasi Restrict).
        const bookingCount = await prisma.bookingInventori.count({
            where: { inventoryId: id }
        });
        if(bookingCount > 0) {
            throw new ResponseError(409, `Inventory dengan id ${id} masih punya ${bookingCount} riwayat booking`);
        }

        // Hapus inventory otomatis mengurangi jumlah kategorinya (-1).
        await prisma.$transaction(async (tx) => {
            await tx.inventory.delete({ where: { id } });
            await tx.category.update({
                where: { id: existingInventory.categoryId },
                data: { jumlah: { decrement: 1 } }
            });
        });

        return "ok";
    }
}
