"use server";

import { FullQuote } from "@/types/quote";
import { db } from "@/lib/db";

const getQuote = async (id: string): Promise<FullQuote | null> => {
  try {
    const quote = await db.quote.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });
    return quote;
  } catch (error) {
    console.error(`Failed to load quote ${id}:`, error);
    return null;
  }
};

const getQuotes = async (): Promise<FullQuote[] | []> => {
  try {
    const quote = await db.quote.findMany({
      include: {
        author: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return quote;
  } catch (error) {
    console.error("Failed to load quotes:", error);
    return [];
  }
};

export { getQuote, getQuotes };
