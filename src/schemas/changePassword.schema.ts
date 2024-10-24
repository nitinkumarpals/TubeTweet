import { z } from "zod";

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(8, "Current password must be at least 8 characters")
        .max(15, "Current password must be at most 15 characters"),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters")
        .max(15, "New password must be at most 15 characters"),
    confirmNewPassword: z
        .string()
        .min(8, "Confirm new password must be at least 8 characters")
        .max(15, "Confirm new password must be at most 15 characters")
});
