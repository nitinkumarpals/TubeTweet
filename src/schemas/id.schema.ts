import { z } from "zod";

export const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);



