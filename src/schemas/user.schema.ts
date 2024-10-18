import multer from "multer";
import { z } from "zod";
export const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(15),
    userName: z.string().min(3).max(15),
    fullName: z.string().min(3).max(30)
});
