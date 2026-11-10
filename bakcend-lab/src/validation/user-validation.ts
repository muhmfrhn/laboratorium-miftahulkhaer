import { ZodType, z } from "zod";
import type { LoginUserRequest, UpdateUserRequest } from "../modules/users/user.model";
import type { CreateUsersRequest, SearchUsersRequest, UpdateUsersRequest } from "../modules/users-management/users.model";
import { Roles, Status } from "../../generated/prisma/enums";

// Foto profil disimpan sebagai data URL di database, bukan URL eksternal.
// Hanya raster yang aman (tanpa SVG) dan ukurannya dibatasi.
const FOTO_DATA_URL = /^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const FOTO_MAX_LENGTH = 400_000;

export class UserValidation {

    static readonly LOGIN: ZodType<LoginUserRequest> = z.object({
        email: z.email(),
        password: z.string().min(8).max(50)
    });

    static readonly UPDATE: ZodType<UpdateUserRequest> = z.object({
        name: z.string().trim().min(1).max(100).optional(),
        password: z.string().min(8).max(50).optional(),
        foto: z
            .string()
            .max(FOTO_MAX_LENGTH, "ukuran foto terlalu besar")
            .regex(FOTO_DATA_URL, "format foto tidak valid")
            .nullable()
            .optional(),
    });

    static readonly CREATE: ZodType<CreateUsersRequest> = z.object({
        email: z.email(),
        name: z.string().min(1).max(100).optional(),
        role: z.enum(Roles),
        status: z.enum(Status),
        password: z.string().min(8).max(100)
    });

    static readonly UPDATEUSERS: ZodType<UpdateUsersRequest> = z.object({
        email: z.email().optional(),
        name: z.string().min(1).max(100).optional(),
        role: z.enum(Roles).optional(),
        status: z.enum(Status).optional(),
        password: z.string().optional()
    });

    static readonly SEARCH: ZodType<SearchUsersRequest> = z.object({
        page: z.coerce.number().min(1).default(1),
        size: z.coerce.number().min(1).max(100).default(10),
        role: z.enum(Roles).optional(),
        status: z.enum(Status).optional(),
        search: z.string().min(1).max(100).optional(),
    });
}