"use client";

import { signIn, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

type SignInButtonProps = {
  provider: "github" | "google";
} & React.ComponentPropsWithRef<typeof Button>;

export function SignInButton({ provider, ...props }: SignInButtonProps) {
  return (
    <form action={() => signIn(provider)}>
      {provider === "google" && (
        <Button variant="secondary" {...props}>
          <Icons.google className="h-4 w-4 mr-2" />
          Google
        </Button>
      )}

      {provider === "github" && (
        <Button variant="secondary" {...props}>
          <Icons.gitHub className="h-4 w-4 mr-2" />
          GitHub
        </Button>
      )}
    </form>
  );
}

export function SignOutButton({
  ...props
}: React.ComponentPropsWithRef<typeof Button>) {
  return (
    <form action={() => signOut()}>
      <Button variant="ghost" className="w-full p-0" {...props}>
        <Icons.logOut className="h-4 w-4 mr-2" /> Sign Out
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
      <Icons.logOut className="h-4 w-4 mr-2" />
      Sign out
    </a>
  );
}