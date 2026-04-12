import { MainNav } from "@/components/main-nav";
import { UserNav } from "./user-nav";
import { primaryNavigation } from "@/config/navigation";

export function SiteHeader() {
  return (
    <header className="hover:bg-zinc-950 sticky top-0 z-40 w-full transition-all">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={primaryNavigation} />
        <UserNav />
      </div>
    </header>
  );
}
