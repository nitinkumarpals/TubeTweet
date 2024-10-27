import { z } from "zod";

const tweetSchema = z.object({
    content: z
        .string()
        .min(1, "Tweet cannot be empty")
        .max(280, "Tweet is too long")
});

export default tweetSchema;
