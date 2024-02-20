import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { QuoteNewForm } from "@/components/dashboard/quotes/quote-new-form";
import { getAuthors } from "@/data/author";

export const metadata: Metadata = {
  title: "New Quote",
  description: "Create a new quote.",
};

export default async function NewQuotePage() {
  return (
    <>
      <PageHeading title="New Quote" description="Create a new quote." />
      <div className="flex flex-col pt-8">
        <QuoteNewForm />
      </div>
    </>
  );
}
