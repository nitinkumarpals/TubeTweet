import { z } from "zod";

export const signInSchema = z.object({
    userName: z.string().min(3).max(15).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).max(15)
});
