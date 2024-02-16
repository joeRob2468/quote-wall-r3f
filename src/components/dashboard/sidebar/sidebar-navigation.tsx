"use client";

import Link from "next/link";
import { NavigationItem } from "@/types/navigation";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useActivePath } from "@/hooks/use-active-path";
import { useCurrentRole } from "@/hooks/use-current-role";

interface SidebarNavigationProps {
  items?: NavigationItem[];
}

export const SidebarNavigation = ({ items }: SidebarNavigationProps) => {
  const checkActivePath = useActivePath();
  const role = useCurrentRole();

  items = items?.filter(
    (item) =>
      !item.requiresAdminRole ||
      (item.requiresAdminRole && role === UserRole.ADMIN)
  );

  return (
    <nav className="flex flex-1 flex-col space-y-3">
      {items?.map((item, index) => (
        <Link
          href={item.href}
          key={index}
          className={cn(
            "inline-flex items-center font-medium text-muted-foreground hover:text-white",
            item.disabled && "cursor-not-allowed opacity-80",
            checkActivePath(item.href) && "text-foreground"
          )}
        >
          {item.icon ? <item.icon className="w-4 h-4 mr-2" /> : null}
          {item.title}
        </Link>
      ))}
    </nav>
  );
};
