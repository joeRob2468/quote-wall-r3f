import Link from "next/link";
import { NavigationItem } from "@/types/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavigationProps {
  items?: NavigationItem[];
}

export const SidebarNavigation = ({ items }: SidebarNavigationProps) => {
  return (
    <nav className="flex flex-1 flex-col space-y-3">
      {items?.map((item, index) => (
        <Link
          href={item.href}
          key={index}
          className={cn(
            "inline-flex items-center font-medium text-muted-foreground hover:text-white",
            item.disabled && "cursor-not-allowed opacity-80"
          )}
        >
          {item.icon ? <item.icon className="w-4 h-4 mr-2" /> : null}
          {item.title}
        </Link>
      ))}
    </nav>
  );
};
