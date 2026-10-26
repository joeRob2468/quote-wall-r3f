import { z } from "zod";

const QuoteSchema = z.object({
  body: z.string().min(1),
  context: z.string().min(1).optional().or(z.literal("")),
  date: z.date(),
  authorId: z.string(),
});

// Quick add from the scene: an existing author by id, or a new one by name
const QuickQuoteSchema = QuoteSchema.omit({ authorId: true })
  .extend({
    authorId: z.string().optional(),
    authorName: z.string().trim().min(1).optional(),
  })
  .refine((values) => !values.authorId !== !values.authorName, {
    message: "Pick an author or name a new one",
  });

export { QuoteSchema, QuickQuoteSchema };
