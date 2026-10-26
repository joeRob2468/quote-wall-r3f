"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

import Link from "next/link";
import { Menu } from "@/components/icons";
import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/hooks/use-current-user";

// Floating terminal-style menu over the scene, in place of a header bar.
// Styles (.term-menu-*) are in globals.css alongside the boot screen.
export function SiteMenu() {
  const user = useCurrentUser();

  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <DropdownMenuPrimitive.Trigger className="term-menu-trigger">
        <Menu className="h-4 w-4" aria-hidden />
        <span>MENU</span>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className="term-menu"
          align="end"
          sideOffset={8}
        >
          <DropdownMenuPrimitive.Label className="term-menu-label">
            <span>USER</span>
            <span className="term-menu-user">
              {user?.name?.toUpperCase() ?? "GUEST"}
            </span>
          </DropdownMenuPrimitive.Label>
          <DropdownMenuPrimitive.Item className="term-menu-item" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuPrimitive.Item>
          {user ? (
            <>
              <DropdownMenuPrimitive.Item className="term-menu-item" asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Separator className="term-menu-separator" />
              <DropdownMenuPrimitive.Item
                className="term-menu-item"
                onSelect={() => signOut()}
              >
                Sign out
              </DropdownMenuPrimitive.Item>
            </>
          ) : (
            <>
              <DropdownMenuPrimitive.Separator className="term-menu-separator" />
              <DropdownMenuPrimitive.Item className="term-menu-item" asChild>
                <Link href="/auth/login">Sign in</Link>
              </DropdownMenuPrimitive.Item>
            </>
          )}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
