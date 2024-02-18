"use server";

import { Author } from "@prisma/client";
import { AuthorSchema } from "@/schemas/author";
import { db } from "@/lib/db";
import { getAuthorById } from "@/data/author";
import { getUserById } from "@/data/user";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createAuthor = async (values: z.infer<typeof AuthorSchema>) => {
  const validatedFields = AuthorSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { name, userId } = validatedFields.data;

  if (userId) {
    const existingUser = getUserById(userId);
    if (!existingUser) {
      return { error: "User not found" };
    }
  }

  try {
    const newAuthor = db.author.create({
      data: {
        name,
        user: userId ? { connect: { id: userId } } : undefined,
      },
    });

    revalidatePath("/dashboard/authors");
    return { success: "Author created", author: newAuthor };
  } catch {
    return { error: "Failed to create author" };
  }
};

const updateAuthor = async (
  id: Author["id"],
  values: z.infer<typeof AuthorSchema>
) => {
  const existingAuthor = await getAuthorById(id);
  if (!existingAuthor) {
    return { error: "Author not found" };
  }

  const validatedFields = AuthorSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  let { name, userId } = validatedFields.data;
  if (userId) {
    const existingUser = getUserById(userId);
    if (!existingUser) {
      return { error: "User not found" };
    }
  }

  try {
    const updatedAuthor = await db.author.update({
      where: { id: existingAuthor.id },
      data: {
        name,
        userId,
      },
    });

    revalidatePath("/dashboard/authors");
    return { success: "Author updated" };
  } catch {
    return { error: "Failed to update author" };
  }
};

export { createAuthor, updateAuthor };
