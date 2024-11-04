import { z } from "zod";
export const playlistSchema = z.object({
    name: z.string().min(3).max(50),
    description: z.string().min(3).max(300)
});
