import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { columns } from "./columns";
import { getQuotes } from "@/data/quote";

export const metadata: Metadata = {
  title: "Quotes",
  description: "Manage quotes.",
};

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <>
      <div className="flex flex-row justify-between">
        <PageHeading title="Quotes" description="Manage quotes." />
        <div className="flex flex-col justify-end">
          <Button variant="default" asChild>
            <Link href="/dashboard/quotes/new">New Quote</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-col py-8">
        <DataTable columns={columns} data={quotes} />
      </div>
    </>
  );
}
