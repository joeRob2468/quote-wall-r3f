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
import { FormSuccess } from "@/components/form-success";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { LoginSchema } from "@/schemas";
import { SignInButton } from "@/components/auth/auth-buttons";
import { login } from "@/actions/login";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email is already in use with a different provider."
      : "";

  const [success, setSuccess] = useState<string | undefined>("");
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
      setSuccess("");

      const response = await login(values, callbackUrl);
      if (response?.error) {
        form.reset();
        setError(response.error);
      }

      if (response?.ok) {
        form.reset();
        //setSuccess(response.success);
      }
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
            <FormSuccess message={success} />

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
