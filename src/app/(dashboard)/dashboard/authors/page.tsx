import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { columns, rowHref } from "./columns";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Authors",
  description: "Manage authors.",
};

export default async function SettingsPage() {
  const authors = await await db.author.findMany({
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <>
      <div className="flex flex-row justify-between">
        <PageHeading title="Authors" description="Manage authors." />
        <div className="flex flex-col justify-end">
          <Button variant="default" asChild>
            <Link href="/dashboard/authors/new">New Author</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-col py-8">
        <DataTable columns={columns} rowHref={rowHref} data={authors} />
      </div>
    </>
  );
}
