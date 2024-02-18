"use client";

import { Check, ChevronsUpDown } from "@/components/icons";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useTransition } from "react";

import { AuthorSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { Input } from "@/components/ui/input";
import { SafeUser } from "@/types/user";
import { cn } from "@/lib/utils";
import { createAuthor } from "@/actions/author";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export interface AuthorNewFormProps {
  users: SafeUser[];
}

export const AuthorNewForm = ({ users }: AuthorNewFormProps) => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const userOptions = users.map((user) => {
    return {
      value: user.id,
      label: user.name,
    };
  });

  const form = useForm<z.infer<typeof AuthorSchema>>({
    resolver: zodResolver(AuthorSchema),
    defaultValues: {
      name: "",
      userId: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof AuthorSchema>) => {
    startTransition(async () => {
      setError("");
      setSuccess("");

      try {
        const response = await createAuthor(values);
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
              name="userId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>User</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? userOptions.find(
                                (option) => option.value === field.value
                              )?.label
                            : "Select user"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] p-0">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {userOptions.map((option) => (
                            <CommandItem
                              value={option.label || undefined}
                              key={option.value}
                              onSelect={() =>
                                form.setValue("userId", option.value)
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  option.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormError message={error}></FormError>
            <FormSuccess message={success}></FormSuccess>
            <div className="flex flex-row justify-between">
              <Button disabled={isPending} type="submit">
                Create Author
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
};
