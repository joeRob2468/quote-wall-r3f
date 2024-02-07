import { UserRole } from "@prisma/client";
import NextAuth from "next-auth";
import type { DefaultSession } from "@auth/core/types";

export type ExtendedUser = {
  role: UserRole;
  isOAuth: boolean;
} & DefaultSession["user"];

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}
