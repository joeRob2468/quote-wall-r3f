import { AuthorNewForm } from "@/components/dashboard/authors/author-new-form";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { db } from "@/lib/db";
import { prismaExclude } from "@/lib/utils";

export const metadata: Metadata = {
  title: "New Author",
  description: "Create a new author.",
};

export default async function NewAuthorPage() {
  const users = await db.user.findMany({
    select: prismaExclude("User", ["password"]),
    where: {
      author: null,
    },
  });

  return (
    <>
      <PageHeading title="New Author" description="Create a new author." />
      <div className="flex flex-col pt-8">
        <AuthorNewForm users={users} />
      </div>
    </>
  );
}
