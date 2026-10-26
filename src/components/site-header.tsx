import { MainNav } from "@/components/main-nav";
import { UserNav } from "./user-nav";
import { cn } from "@/lib/utils";
import { primaryNavigation } from "@/config/navigation";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "hover:bg-zinc-950 sticky top-0 z-40 w-full transition-all pointer-events-none",
        className
      )}
    >
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={primaryNavigation} />
        <UserNav />
      </div>
    </header>
  );
}
