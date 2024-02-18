import { DataTable } from "@/components/ui/data-table";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { columns } from "./columns";
import { getAuthors } from "@/data/author";

export const metadata: Metadata = {
  title: "Authors",
  description: "Manage authors.",
};

export default async function SettingsPage() {
  const authors = await getAuthors();

  return (
    <>
      <PageHeading title="Authors" description="Manage authors." />
      <div className="flex flex-col py-8">
        <DataTable columns={columns} data={authors} />
      </div>
    </>
  );
}
