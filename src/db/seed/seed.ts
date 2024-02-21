import { PrismaClient } from "@prisma/client";
import { authors } from "./author_data"; // temporarily not public
import { quotes } from "./quote_data"; // temporarily not public

const prisma = new PrismaClient();

const main = async () => {
  await prisma.quote.deleteMany();
  console.log("Deleted records in quote table");

  await prisma.author.deleteMany();
  console.log("Deleted records in author table");

  await prisma.author.createMany({
    data: authors,
  });
  console.log("Added author records");

  const authorRecords = await prisma.author.findMany();
  const authorMap = new Map(
    authorRecords.map((author) => [author.name, author.id])
  );
  console.log("Generated author name/id map");

  const quotesWithAuthors = quotes.map((quote) => {
    return {
      authorId: authorMap.get(quote.authorName) || "",
      body: quote.body,
      context: quote.context,
      date: quote.date,
    };
  });

  await prisma.quote.createMany({
    data: quotesWithAuthors,
  });
  console.log("Added quote records");
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
