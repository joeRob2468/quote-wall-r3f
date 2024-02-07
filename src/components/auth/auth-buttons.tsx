"use client";

import { signIn, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

type SignInProps = {
  provider: "github" | "google";
} & React.ComponentPropsWithRef<typeof Button>;

export function SignIn({ provider, ...props }: SignInProps) {
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

type SignOutProps =
  | ({
      type: "button";
    } & React.ComponentPropsWithRef<typeof Button>)
  | {
      type: "link";
    };

export function SignOut({ type, ...props }: SignOutProps) {
  const handleSubmit = () => signOut();

  return type === "button" ? (
    <form action={() => handleSubmit()}>
      <Button variant="ghost" className="w-full p-0" {...props}>
        <Icons.logOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </form>
  ) : (
    <div
      className="cursor-pointer flex items-center"
      onClick={() => handleSubmit()}
    >
      <Icons.logOut className="h-4 w-4 mr-2" />
      Sign out
    </div>
  );
}
