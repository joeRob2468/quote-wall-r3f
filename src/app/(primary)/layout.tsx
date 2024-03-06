import { Layout } from "@/components/canvas/Layout";
import { SiteHeader } from "@/components/site-header";

interface PrimaryLayoutProps {
  children: React.ReactNode;
}

export default async function PrimaryLayout({ children }: PrimaryLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <Layout>{children}</Layout>
    </div>
  );
}
