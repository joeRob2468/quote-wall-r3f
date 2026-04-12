"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { LoginSchema } from "@/schemas";
import { SignInButton } from "@/components/auth/auth-buttons";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email is already in use with a different provider."
      : "";

  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    startTransition(async () => {
      setError("");

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        form.reset();
        setError("Invalid credentials");
        return;
      }

      router.refresh();
      router.push(callbackUrl || "/");
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormError message={error || urlError} />

            <Button type="submit" className="w-full" disabled={isPending}>
              Sign In
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-6 relative flex items-center justify-center">
        <div className="flex absolute inset-x-0 -z-10">
          <div className="border border-t-white border-opacity-30 w-full"></div>
        </div>
        <div className="inline-flex items-center bg-background px-2">
          Or continue with
        </div>
      </div>

      <div className="mt-6 flex flex-row gap-3 items-center justify-center">
        <SignInButton provider="google" />
        <SignInButton provider="github" />
      </div>

      <p className="mt-10 text-center text-sm">
        Not a member?
        <Link href="/auth/register" className="px-1 font-semibold">
          Create an account
        </Link>
      </p>
    </>
  );
};
