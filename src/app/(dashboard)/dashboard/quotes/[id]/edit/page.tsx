import { AuthorEditForm } from "@/components/dashboard/authors/author-edit-form";
import { ErrorWrapper } from "@/components/error-wrapper";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { QuoteEditForm } from "@/components/dashboard/quotes/quote-edit-form";
import { getAuthors } from "@/data/author";
import { getQuote } from "@/data/quote";
import { getSafeUsers } from "@/data/user";

export const metadata: Metadata = {
  title: "Edit Quote",
  description: "Edit a quote.",
};

export interface EditQuotePageProps {
  params: {
    id: string;
  };
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const quote = await getQuote(params.id);

  if (!quote) {
    return (
      <ErrorWrapper
        description="No valid quote was found - go back and try again."
        buttonHref="/dashboard/quotes"
      />
    );
  }

  const authors = await getAuthors();

  return (
    <>
      <PageHeading title="Edit Quote" description="Edit quote settings." />
      <div className="flex flex-col pt-8">
        <QuoteEditForm quote={quote} authors={authors} />
      </div>
    </>
  );
}
