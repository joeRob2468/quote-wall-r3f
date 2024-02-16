import { SafeUser } from "@/types/user";
import { User } from "@prisma/client";
import { db } from "@/lib/db";
import { prismaExclude } from "@/lib/utils";

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const user = await db.user.findUnique({ where: { id } });
    return user;
  } catch {
    return null;
  }
};

export const getUsers = async (): Promise<User[] | null> => {
  try {
    const users = await db.user.findMany();
    return users;
  } catch {
    return null;
  }
};

export const getSafeUserByEmail = async (
  email: string
): Promise<SafeUser | null> => {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return user;
  } catch {
    return null;
  }
};

export const getSafeUserById = async (id: string): Promise<SafeUser | null> => {
  try {
    const user = await db.user.findUnique({ where: { id } });
    return user;
  } catch {
    return null;
  }
};

export const getSafeUsers = async (): Promise<SafeUser[]> => {
  try {
    const users = await db.user.findMany({
      select: prismaExclude("User", ["password"]),
    });
    return users;
  } catch {
    return [];
  }
};
