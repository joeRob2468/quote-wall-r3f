"use server";

import { getUserByEmail, getUserById } from "@/data/user";

import { User } from "@prisma/client";
import { UserUpdateSchema } from "@/schemas";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const updateUser = async (
  id: User["id"],
  values: z.infer<typeof UserUpdateSchema>
) => {
  const dbUser = await getUserById(id);

  if (!dbUser) {
    return { error: "User not found" };
  }

  const validatedFields = UserUpdateSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields" };
  }

  let { name, email, role, password, emailVerified, image } =
    validatedFields.data;

  if (!dbUser.email) {
    email = undefined;
    password = undefined;
  }

  if (email && email.toLowerCase() !== dbUser.email) {
    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== dbUser.id) {
      return { error: "Email is already in use" };
    }
  }

  if (password) {
    password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: {
      name,
      email: email?.toLowerCase(),
      role,
      password,
      emailVerified,
      image,
    },
  });

  revalidatePath("/dashboard/users");
  return { success: "User updated" };
};

export const deleteUser = async (id: User["id"]) => {
  const dbUser = await getUserById(id);

  if (!dbUser) {
    return { error: "User not found" };
  }

  const deletedUser = await db.user.delete({ where: { id: dbUser.id } });

  revalidatePath("/dashboard/users");
  return { success: "User deleted" };
};
