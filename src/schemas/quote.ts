import { z } from "zod";

const QuoteSchema = z.object({
  body: z.string().min(1),
  context: z.string().min(1).optional().or(z.literal("")),
  date: z.date(),
  authorId: z.string(),
});

export { QuoteSchema };
