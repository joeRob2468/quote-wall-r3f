"use client";

import { LogOut } from "@/components/icons";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({
  ...props
}: React.ComponentPropsWithRef<typeof Button>) {
  return (
    <form action={() => signOut()}>
      <Button variant="ghost" className="w-full p-0" {...props}>
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </form>
  );
}

export function SignOutLink({
  className,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      className={cn("cursor-pointer flex items-center", className)}
      onClick={() => signOut()}
      {...props}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign out
    </a>
  );
}