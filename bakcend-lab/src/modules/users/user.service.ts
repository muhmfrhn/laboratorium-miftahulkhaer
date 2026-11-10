import type { User } from "../../../generated/prisma/client";
import { prisma } from "../../../lib/prisma";
import { hashPassword, verifyPassword } from "../../../lib/password";
import { randomUUID } from "node:crypto";
import { ResponseError } from "../../error/response-error";
import { UserValidation } from "../../validation/user-validation";
import { Validation } from "../../validation/validation";
import { toUserResponse, type LoginUserRequest, type UpdateUserRequest, type UserResponse } from "./user.model";

export class UserService {

    static async login(request: LoginUserRequest): Promise<UserResponse> {
        const loginRequest = Validation.validate(UserValidation.LOGIN, request);

        let user = await prisma.user.findUnique({
            where: { email : loginRequest.email }
        })

        if(!user) throw new ResponseError(401, "Email or Password is wrong");

        const isPasswordValid = await verifyPassword(loginRequest.password, user.password);
        if(!isPasswordValid) throw new ResponseError(401, "Email or Password is wrong");

        const token = randomUUID()

        user = await prisma.user.update({
            where : {
                email : loginRequest.email
            },
            data: { token }
        });

        return toUserResponse(user);
    }

    static async update(currentUser: User, request: UpdateUserRequest): Promise<UserResponse> {
        const updateRequest = Validation.validate(UserValidation.UPDATE, request);

        const hasChanges =
            updateRequest.name !== undefined ||
            updateRequest.password !== undefined ||
            updateRequest.foto !== undefined;
        if (!hasChanges) throw new ResponseError(400, "tidak ada perubahan");

        const dataToUpdate: { name?: string; password?: string; foto?: string | null } = {};

        if (updateRequest.name !== undefined) dataToUpdate.name = updateRequest.name;
        if (updateRequest.password !== undefined) {
            dataToUpdate.password = await hashPassword(updateRequest.password);
        }
        // null berarti hapus foto; string berarti simpan foto baru.
        if (updateRequest.foto !== undefined) dataToUpdate.foto = updateRequest.foto;

        const updateUser = await prisma.user.update({
            where: { id: currentUser.id },
            data: dataToUpdate
        })
        return toUserResponse(updateUser);
    }

    static async logout(currentUser: User): Promise<string> {
        await prisma.user.update({
            where: { id: currentUser.id },
            data: { token: null }
        })
        return "OK";
    }
}