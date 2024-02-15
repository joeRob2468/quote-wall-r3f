"use server";

import { getUserByEmail, getUserById } from "@/data/user";

import { UserSettingsSchema } from "@/schemas";
import bcrypt from "bcryptjs";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { update } from "@/auth";
import { z } from "zod";

export const updateUserSettings = async (
  values: z.infer<typeof UserSettingsSchema>
) => {
  const user = await currentUser();
  if (!user || !user.id) {
    return { error: "Unauthorized" };
  }

  const dbUser = await getUserById(user.id);
  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  const validatedFields = UserSettingsSchema.safeParse(values);
  if (!validatedFields.success) {
    return { ok: false, error: "Invalid fields" };
  }

  let { name, email, role, password, newPassword } = validatedFields.data;

  if (user.isOAuth) {
    email = undefined;
    password = undefined;
    newPassword = undefined;
  }

  if (email && email !== user.email) {
    const existingUser = await getUserByEmail(email);

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email is already in use." };
    }
  }

  if (password && newPassword && dbUser.password) {
    const passwordsMatch = await bcrypt.compare(password, dbUser.password);

    if (!passwordsMatch) {
      return { error: "Incorrect password." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    password = hashedPassword;
    newPassword = undefined;
  } else {
    newPassword = undefined;
    password = undefined;
  }

  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: {
      name,
      email: email?.toLowerCase(),
      role,
      password: password || undefined,
    },
  });

  update({
    user: {
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    },
  });

  return { success: "Settings updated." };
};
