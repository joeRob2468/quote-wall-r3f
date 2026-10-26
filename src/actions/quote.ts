"use server";

import { Quote, UserRole } from "@prisma/client";

import { FullQuote } from "@/types/quote";
import { QuoteSchema } from "@/schemas/";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAuthor } from "@/data/author";
import { getQuote } from "@/data/quote";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createQuote = async (values: z.infer<typeof QuoteSchema>) => {
  const sessionUser = await currentUser();
  if (!sessionUser) {
    return { error: "Unauthorized" };
  }

  const validatedFields = QuoteSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { body, context, date, authorId } = validatedFields.data;

  if (authorId) {
    const existingAuthor = getAuthor(authorId);
    if (!existingAuthor) {
      return { error: "Author not found" };
    }
  }

  try {
    const newQuote = await db.quote.create({
      data: {
        body,
        context,
        date,
        author: { connect: { id: authorId } },
      },
    });

    revalidatePath("/dashboard/quotes");
    revalidatePath("/");
    return { success: "Quote created" };
  } catch (error) {
    return { error: "Failed to create quote" };
  }
};

const updateQuote = async (
  id: FullQuote["id"],
  values: z.infer<typeof QuoteSchema>
) => {
  const sessionUser = await currentUser();
  if (!sessionUser) {
    return { error: "Unauthorized" };
  }

  const existingQuote = await getQuote(id);
  if (!existingQuote) {
    return { error: "Quote not found" };
  }

  const validatedFields = QuoteSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  const { body, context, date, authorId } = validatedFields.data;

  const existingAuthor = getAuthor(authorId);
  if (!existingAuthor) {
    return { error: "Author not found" };
  }

  try {
    const updatedQuote = await db.quote.update({
      where: { id: existingQuote.id },
      data: {
        body,
        context,
        date,
        author: authorId ? { connect: { id: authorId } } : undefined,
      },
    });

    revalidatePath("/dashboard/quotes");
    revalidatePath("/");
    return { success: "Quote updated" };
  } catch {
    return { error: "Failed to update quote" };
  }
};

const deleteQuote = async (id: Quote["id"]) => {
  const sessionUser = await currentUser();
  if (!sessionUser || sessionUser.role !== UserRole.ADMIN) {
    return { error: "Unauthorized" };
  }

  const existingQuote = await getQuote(id);
  if (!existingQuote) {
    return { error: "Quote not found" };
  }
  try {
    const deletedQuote = await db.quote.delete({
      where: { id: existingQuote.id },
    });

    revalidatePath("/dashboard/quotes");
    revalidatePath("/");
    return { success: "Quote deleted", author: deletedQuote };
  } catch {
    return { error: "Failed to delete quote" };
  }
};

export { createQuote, updateQuote, deleteQuote };
