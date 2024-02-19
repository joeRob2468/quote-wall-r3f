import { Author } from "@prisma/client";
import { SafeUser } from "@/types/user";

export type AuthorWithUser = {
  user: SafeUser | null;
} & Author;
