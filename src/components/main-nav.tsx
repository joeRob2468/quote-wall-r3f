"use client";

import Link from "next/link";
import { Logo } from "@/components/icons";
import { NavigationItem } from "@/types/navigation";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { useActivePath } from "@/hooks/use-active-path";

interface MainNavProps {
  items?: NavigationItem[];
}

export function MainNav({ items }: MainNavProps) {
  const checkActivePath = useActivePath();

  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-2">
        <Logo className="h-6 w-6" />
        <span className="inline-block font-bold">{siteConfig.name}</span>
      </Link>
      {items?.length ? (
        <nav className="flex gap-6">
          {items?.map(
            (item, index) =>
              item.href && (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center text-sm font-medium text-muted-foreground hover:text-foreground",
                    item.disabled && "cursor-not-allowed opacity-80",
                    checkActivePath(item.href) && "text-foreground"
                  )}
                >
                  {item.title}
                </Link>
              )
          )}
        </nav>
      ) : null}
    </div>
  );
}
