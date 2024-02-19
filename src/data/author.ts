"use server";

import { Author } from "@prisma/client";
import { AuthorWithUser } from "@/types/author";
import { db } from "@/lib/db";
import { prismaExclude } from "@/lib/utils";

const getAuthor = async (id: string): Promise<Author | null> => {
  try {
    const author = await db.author.findUnique({ where: { id } });
    return author;
  } catch {
    return null;
  }
};

const getAuthors = async (): Promise<Author[]> => {
  try {
    const authors = await db.author.findMany();
    return authors;
  } catch {
    return [];
  }
};

const getAuthorWithUser = async (
  id: string
): Promise<AuthorWithUser | null> => {
  try {
    const author = await db.author.findUnique({
      where: { id: id },
      include: {
        user: {
          select: prismaExclude("User", ["password"]),
        },
      },
    });

    return author;
  } catch (error) {
    return null;
  }
};

export { getAuthor, getAuthors, getAuthorWithUser };
