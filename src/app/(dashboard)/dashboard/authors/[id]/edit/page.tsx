import { AuthorEditForm } from "@/components/dashboard/authors/author-edit-form";
import { ErrorWrapper } from "@/components/error-wrapper";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { getAuthorWithUser } from "@/data/author";
import { getSafeUsers } from "@/data/user";

export const metadata: Metadata = {
  title: "Edit Author",
  description: "Edit an author.",
};

export interface EditAuthorPageProps {
  params: {
    id: string;
  };
}

export default async function EditAuthorPage({ params }: EditAuthorPageProps) {
  const author = await getAuthorWithUser(params.id);

  if (!author) {
    return (
      <ErrorWrapper
        description="No valid author was found - go back and try again."
        buttonHref="/dashboard/authors"
      />
    );
  }

  const users = await getSafeUsers({
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
