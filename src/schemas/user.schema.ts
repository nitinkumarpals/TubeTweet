import { z } from "zod";
export const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(10),
    userName: z.string().min(3).max(10),
    fullName: z.string().min(3).max(10),
    avatar: z.string().url().optional(),
    coverImage: z.string().url().optional()
});
