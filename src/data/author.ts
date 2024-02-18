import { Author } from "@prisma/client";
import { db } from "@/lib/db";

export const getAuthorById = async (id: string): Promise<Author | null> => {
  try {
    const author = await db.author.findUnique({ where: { id } });
    return author;
  } catch {
    return null;
  }
};

export const getAuthors = async (): Promise<Author[] | null> => {
  try {
    const authors = await db.author.findMany();
    return authors;
  } catch {
    return null;
  }
};
