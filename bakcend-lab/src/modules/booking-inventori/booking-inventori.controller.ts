import type { Context } from "hono";
import type { User } from "../../../generated/prisma/client";
import type { CreateBookingInventoriRequest } from "./booking-inventori.model";
import { BookingInventoriService } from "./booking-inventori.service";

export class BookingInventoriController {
    static async list(c: Context<{ Variables: { user: User } }>) {
        const currentUser = c.get("user");
        const query = c.req.query();
        const response = await BookingInventoriService.list(currentUser, query);
        return c.json(response, 200);
    }

    static async get(c: Context<{ Variables: { user: User } }>) {
        const currentUser = c.get("user");
        const id = Number(c.req.param("id"));
        const response = await BookingInventoriService.get(currentUser, id);
        return c.json({ data: response });
    }

    static async create(c: Context<{ Variables: { user: User } }>) {
        const currentUser = c.get("user");
        const request: CreateBookingInventoriRequest = await c.req.json();
        const response = await BookingInventoriService.create(currentUser, request);
        return c.json({ data: response }, 201);
    }

    static async cancel(c: Context<{ Variables: { user: User } }>) {
        const currentUser = c.get("user");
        const id = Number(c.req.param("id"));
        const response = await BookingInventoriService.cancel(currentUser, id);
        return c.json({ data: response });
    }

    static async finish(c: Context<{ Variables: { user: User } }>) {
        const currentUser = c.get("user");
        const id = Number(c.req.param("id"));
        const response = await BookingInventoriService.finish(currentUser, id);
        return c.json({ data: response });
    }
}
