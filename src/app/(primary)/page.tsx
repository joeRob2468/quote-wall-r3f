import Link from "next/link";
import { PageHeading } from "@/components/layout/page-heading";
import { Playground } from "@/components/canvas/playground/Playground";
import { Three } from "@/components/canvas/Three";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default function IndexPage() {
  return (
    <>
      {/* <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
        <PageHeading
          title="The Quote Wall"
          description="Welcome to the Quote Wall."
        />
        <div className="flex gap-4">
          <Link
            target="_blank"
            rel="noreferrer"
            href={siteConfig.links.github}
            className={buttonVariants({ variant: "outline" })}
          >
            GitHub
          </Link>
        </div>
      </section> */}
      <Playground />
    </>
  );
}
