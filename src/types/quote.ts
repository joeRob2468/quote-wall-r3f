import { Author, Quote } from "@prisma/client";

export type FullQuote = {
  author: Author;
} & Quote;
