import { Layout } from "@/components/canvas/Layout";
import { AddQuote } from "@/components/add-quote";
import { SiteMenu } from "@/components/site-menu";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

export default async function PrimaryLayout({ children }: PrimaryLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Inside the canvas layout so the boot screen covers it until the
        scene is up */}
      <Layout>
        <div className="fixed top-4 right-4 z-40 flex gap-2">
          <AddQuote />
          <SiteMenu />
        </div>
        {children}
      </Layout>
    </div>
  );
}
