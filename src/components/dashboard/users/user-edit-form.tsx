"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RedirectType, redirect, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteUser, updateUser } from "@/actions/user";
import { useState, useTransition } from "react";

import { AlertDialogCancel } from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { Input } from "@/components/ui/input";
import { SafeUser } from "@/types/user";
import { UserRole } from "@prisma/client";
import { UserUpdateSchema } from "@/schemas";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface UserEditFormProps {
  user: SafeUser;
}
export const UserEditForm = ({ user }: UserEditFormProps) => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof UserUpdateSchema>>({
    resolver: zodResolver(UserUpdateSchema),
    defaultValues: {
      name: user.name || undefined,
      email: user.email || undefined,
      role: user.role || undefined,
      image: user.image || undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof UserUpdateSchema>) => {
    startTransition(async () => {
      setError("");
      setSuccess("");

      try {
        const response = await updateUser(user.id, values);
        setError(response.error);
        setSuccess(response.success);
      } catch (error) {
        setError("Something went wrong");
      }
    });
  };
  const onDelete = async () => {
    startTransition(async () => {
      setError("");
      setSuccess("");

      try {
        const response = await deleteUser(user.id);
        if (response.success) {
          router.push("/dashboard/users");
        }

        setError(response.error);
        setSuccess(response.success);
      } catch (error) {
        setError("Something went wrong");
      }
    });
  };

  return (
    <>
      <Form {...form}>
        <form
          className="space-y-6 w-full max-w-[25rem]"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John Doe"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="john.doe@example.com"
                      type="email"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    disabled={isPending}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.ADMIN}>
                        Administrator
                      </SelectItem>
                      <SelectItem value={UserRole.USER}>User</SelectItem>
                      <SelectItem value={UserRole.PENDING}>
                        Pending Approval
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://cdn.example.com/image.jpg"
                      type="url"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />

          <div className="flex flex-row justify-between">
            <Button disabled={isPending} type="submit">
              Save Changes
            </Button>
            <div>
              <AlertDialog>
                <Button disabled={isPending} variant="outline" asChild>
                  <AlertDialogTrigger>Delete User</AlertDialogTrigger>
                </Button>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this user and remove their data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <Button variant="outline" asChild>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </Button>
                    <Button onClick={() => onDelete()} asChild>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
};
