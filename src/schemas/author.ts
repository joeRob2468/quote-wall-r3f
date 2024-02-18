import { z } from "zod";

const AuthorSchema = z.object({
  name: z.string(),
  userId: z.optional(z.string()),
});

export { AuthorSchema };
