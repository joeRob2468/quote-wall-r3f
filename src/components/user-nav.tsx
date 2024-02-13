"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Icons } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import { SignOutLink } from "@/components/auth/auth-buttons";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

export function UserNav() {
  const user = useCurrentUser();

  return (
    <div className="flex flex-1 items-center justify-end space-x-4">
      <div className="flex items-center space-x-1">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                {!!user.image ? (
                  <Image src={user.image} alt={user.name || ""} />
                ) : (
                  <AvatarFallback>
                    {user.name
                      ?.split(" ")
                      .map((phrase: string) => phrase.charAt(0).toUpperCase())}
                  </AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Icons.settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SignOutLink />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/auth/login"
            className={buttonVariants({ variant: "ghost" })}
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
