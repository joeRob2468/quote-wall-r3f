"use server";

import { RegisterSchema } from "@/schemas";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import z from "zod";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { email, password, name } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 16);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { ok: false, error: "Email already in use." };
  }

  await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    },
  });

  // TODO: verification email

  return { ok: true, success: "Confirmation email sent." };
};
