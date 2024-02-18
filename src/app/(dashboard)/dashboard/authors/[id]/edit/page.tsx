import { AuthorEditForm } from "@/components/dashboard/authors/author-edit-form";
import { ErrorWrapper } from "@/components/error-wrapper";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { db } from "@/lib/db";
import { prismaExclude } from "@/lib/utils";

export const metadata: Metadata = {
  title: "New Author",
  description: "Create a new author.",
};

export interface EditAuthorPageProps {
  params: {
    id: string;
  };
}

export default async function EditAuthorPage({ params }: EditAuthorPageProps) {
  const author = await db.author.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!author) {
    return (
      <ErrorWrapper
        description="No valid author was found - go back and try again."
        buttonHref="/dashboard/authors"
      />
    );
  }

  const users = await db.user.findMany({
    select: prismaExclude("User", ["password"]),
    where: {
      author: null,
    },
  });

  return (
    <>
      <PageHeading title="Edit Author" description="Edit author settings." />
      <div className="flex flex-col pt-8">
        <AuthorEditForm author={author} users={users} />
      </div>
    </>
  );
}
