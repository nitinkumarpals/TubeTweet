import { z } from "zod";

export const updateAccountDetailSchema = z.object({
    fullName: z
        .string()
        .min(3, "Full name must be at least 3 characters")
        .max(30,"Full name must be at most 30 characters")
        .optional(),
    email: z.string().email("Invalid email format").optional()
});
