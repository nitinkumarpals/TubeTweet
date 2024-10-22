import { z } from "zod";

export const signInSchema = z.object({
    userName: z.string().min(3).max(15),
    email: z.string().email(),
    password: z.string().min(8).max(15)
});