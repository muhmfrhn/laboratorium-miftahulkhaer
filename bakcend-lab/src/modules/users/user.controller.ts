import type { Context } from "hono";
import type { LoginUserRequest, UpdateUserRequest } from "./user.model";
import { UserService } from "./user.service";
import type { User } from "../../../generated/prisma/client";


export class UserConntroller {
    static async login(c: Context) {
        try {
            const request: LoginUserRequest = await c.req.json() ;
            const response = await UserService.login(request)
            return c.json({ data : response })
        }catch(e: any) {
            return c.json({ error: e.message })
        }
    }

    static async update(c: Context<{Variables: {user: User}}>) {
        const currentUser = c.get("user")
        const request: UpdateUserRequest = await c.req.json();
        const response = await UserService.update(currentUser, request)
        return c.json({data: response})
    }

    static async logout(c: Context<{Variables: {user: User}}>) {
        try {
            const currentUser = c.get("user");
            const response = await UserService.logout(currentUser);
            return c.json({ data: response });
        }catch{}
    }
}