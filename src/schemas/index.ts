import { UserRole } from "@prisma/client";
import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().min(1, {
    message: "Email is required.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  email: z.string().min(1, {
    message: "Email is required.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export const UserSettingsSchema = z
  .object({
    name: z.optional(z.string()),
    role: z.optional(z.nativeEnum(UserRole), {
      invalid_type_error: "Invalid role.",
    }),
    email: z.optional(z.string().email()),
    password: z.string().min(6).optional().or(z.literal("")),
    newPassword: z.string().min(6).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.password && !data.newPassword) {
        return false;
      }
      return true;
    },
    {
      message: "New password is required.",
      path: ["newPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && !data.password) {
        return false;
      }
      return true;
    },
    {
      message: "Password is required.",
      path: ["password"],
    }
  );
