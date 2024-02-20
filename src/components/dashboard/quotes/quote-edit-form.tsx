"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Author, UserRole } from "@prisma/client";
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
import { deleteQuote, updateQuote } from "@/actions/quote";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { FullQuote } from "@/types/quote";
import { Input } from "@/components/ui/input";
import { QuoteSchema } from "@/schemas";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getAuthors } from "@/data/author";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export interface QuoteEditFormProps {
  quote: FullQuote;
}

export const QuoteEditForm = ({ quote }: QuoteEditFormProps) => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const sessionRole = useCurrentRole();

  const [authors, setAuthors] = useState<Author[]>([]);
  useEffect(() => {
    let ignore = false;
    startTransition(async () => {
      const result = await getAuthors();
      if (!ignore) {
        setAuthors(result);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const showDestructiveActions = sessionRole === UserRole.ADMIN;

  const authorOptions = authors.map((author) => {
    return {
      value: author.id,
      label: author.name,
    };
  });

  const form = useForm<z.infer<typeof QuoteSchema>>({
    resolver: zodResolver(QuoteSchema),
    defaultValues: {
      body: quote.body,
      context: quote.context || "",
      date: quote.date,
      authorId: quote.authorId,
    },
  });

  const onSubmit = async (values: z.infer<typeof QuoteSchema>) => {
    startTransition(async () => {
      setError("");
      setSuccess("");

      try {
        const response = await updateQuote(quote.id, values);
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
        const response = await deleteQuote(quote.id);
        if (response.success) {
          router.push("/dashboard/quotes");
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
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quote</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Broke into the wrong goddamn rec room didn't you, you bastard!?"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="context"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Context</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="in the rec room" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="authorId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Author</FormLabel>
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
                          disabled={!authorOptions.length}
                        >
                          {field.value && !!authorOptions.length
                            ? authorOptions.find(
                                (option) => option.value === field.value
                              )?.label
                            : "Select author"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] p-0">
                      <Command>
                        <CommandInput placeholder="Search authors..." />
                        <CommandEmpty>No authors found.</CommandEmpty>
                        <CommandGroup>
                          {authorOptions.map((option) => (
                            <CommandItem
                              value={option.label || undefined}
                              key={option.value}
                              onSelect={() =>
                                form.setValue("authorId", option.value)
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

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
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
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormError message={error}></FormError>
            <FormSuccess message={success}></FormSuccess>
          </div>
          <div className="flex flex-row justify-between">
            <Button disabled={isPending} type="submit">
              Save Changes
            </Button>

            {showDestructiveActions && (
              <AlertDialog>
                <Button disabled={isPending} variant="outline" asChild>
                  <AlertDialogTrigger>Delete Quote</AlertDialogTrigger>
                </Button>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      this quote.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <Button variant="outline" asChild>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    </Button>
                    <Button onClick={() => onDelete()} asChild>
                      <AlertDialogAction>Delete</AlertDialogAction>
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>
      </Form>
    </>
  );
};
