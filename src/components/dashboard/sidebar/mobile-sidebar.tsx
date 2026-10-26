"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { ReactNode, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Menu } from "@/components/icons";
import { usePathname } from "next/navigation";

interface MobileSidebarProps {
  children: ReactNode;
}

export const MobileSidebar = ({ children }: MobileSidebarProps) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer once a link has navigated somewhere
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="outline" size="sm" className="self-start md:hidden">
          <Menu className="w-4 h-4 mr-2" />
          Menu
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r bg-zinc-950 px-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
        >
          <DialogPrimitive.Title className="sr-only">
            Dashboard navigation
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
