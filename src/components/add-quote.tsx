"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";

import { FormEvent, useEffect, useState, useTransition } from "react";

import { Author } from "@prisma/client";
import { Command } from "cmdk";
import { createQuickQuote } from "@/actions/quote";
import { format } from "date-fns";
import { getAuthors } from "@/data/author";
import { showQuote } from "@/components/canvas/playground/quoteSelection";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQueryClient } from "@tanstack/react-query";

// An existing author, or a new one created along with the quote
type AuthorChoice = { id: string; name: string } | { id?: undefined; name: string };

const DATE_FORMAT = "yyyy-MM-dd";

// Plain substring match on the name (cmdk's default is fuzzy, and would also
// match the id that's in each item's value)
const matchAuthorName = (_value: string, search: string, keywords?: string[]) =>
  keywords?.some((name) => name.toLowerCase().includes(search.toLowerCase()))
    ? 1
    : 0;

// "+ QUOTE" button and terminal-style dialog over the scene, with the
// dashboard form's fields plus naming a new author inline. The new quote is
// put on the screens once saved. Styles (.term-dialog-*) are in globals.css.
export function AddQuote() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const [authors, setAuthors] = useState<Author[]>([]);
  const [body, setBody] = useState("");
  const [context, setContext] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [author, setAuthor] = useState<AuthorChoice | null>(null);
  // Left empty unless changed, so the default keeps the current time, as
  // the dashboard form's does
  const [date, setDate] = useState("");

  // Fresh list each time it opens, so authors added elsewhere show up
  useEffect(() => {
    if (!open) return;
    let ignore = false;
    getAuthors().then((result) => {
      if (!ignore) setAuthors(result);
    });
    return () => {
      ignore = true;
    };
  }, [open]);

  const reset = () => {
    setBody("");
    setContext("");
    setAuthorSearch("");
    setAuthor(null);
    setDate("");
    setError(undefined);
  };

  const typedName = authorSearch.trim();
  // Offer a new author only when nobody already goes by that name
  const canCreateAuthor =
    !!typedName &&
    !authors.some(
      (existing) => existing.name.toLowerCase() === typedName.toLowerCase()
    );

  const onSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (isPending) return;
    if (!body.trim()) return setError("Quote is empty");
    if (!author) return setError("Pick an author or name a new one");

    // Picked dates are local midnight, as the dashboard calendar gives
    const [year, month, day] = date.split("-").map(Number);
    const quoteDate = date ? new Date(year, month - 1, day) : new Date();

    startTransition(async () => {
      setError(undefined);
      try {
        const response = await createQuickQuote({
          body: body.trim(),
          context: context.trim(),
          date: quoteDate,
          ...(author.id ? { authorId: author.id } : { authorName: author.name }),
        });
        if (response.error || !response.id) {
          setError(response.error ?? "Something went wrong");
          return;
        }
        // Refetch first, so the screens can find the new quote
        await queryClient.invalidateQueries({ queryKey: ["quotes"] });
        showQuote(response.id);
        setOpen(false);
        reset();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  // Saving needs a session
  if (!user) return null;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      <DialogPrimitive.Trigger className="term-menu-trigger" aria-label="Add quote">
        <span aria-hidden>+</span>
        <span>QUOTE</span>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="term-dialog-overlay" />
        <DialogPrimitive.Content className="term-dialog">
          <form onSubmit={onSubmit}>
            <div className="term-dialog-header">
              <DialogPrimitive.Title className="term-dialog-title">
                ADD QUOTE
              </DialogPrimitive.Title>
              <DialogPrimitive.Close className="term-dialog-close">
                [ESC]
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">
              Add a quote to the wall
            </DialogPrimitive.Description>

            <label className="term-field">
              <span className="term-field-label">Quote</span>
              <textarea
                className="term-input"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  // Ctrl/Cmd+Enter saves; plain Enter is a new line
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onSubmit();
                }}
                placeholder="Broke into the wrong goddamn rec room didn't you, you bastard!?"
                autoFocus
              />
            </label>

            <label className="term-field">
              <span className="term-field-label">
                Context <span className="term-dim">(optional)</span>
              </span>
              <input
                className="term-input"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="in the rec room"
              />
            </label>

            <div className="term-field">
              <span className="term-field-label">
                Author
                {author ? (
                  <span className="term-choice">
                    {author.id ? "> " : "+ NEW: "}
                    {author.name}
                  </span>
                ) : null}
              </span>
              <Command
                className="term-combobox"
                label="Author"
                filter={matchAuthorName}
              >
                <Command.Input
                  className="term-input"
                  value={authorSearch}
                  onValueChange={setAuthorSearch}
                  // Enter picks the highlighted author (cmdk also stops it
                  // submitting the form)
                  placeholder="Search or type a new name"
                />
                <Command.List className="term-list">
                  {authors.map((option) => (
                    <Command.Item
                      key={option.id}
                      // cmdk matches on value; the id keeps same-name
                      // authors apart
                      value={`${option.name} ${option.id}`}
                      keywords={[option.name]}
                      className="term-list-item"
                      data-chosen={author?.id === option.id || undefined}
                      onSelect={() => setAuthor(option)}
                    >
                      {option.name}
                    </Command.Item>
                  ))}
                  {canCreateAuthor ? (
                    <Command.Item
                      // Always listed while typing, whatever the filter
                      forceMount
                      value={`__new__ ${typedName}`}
                      className="term-list-item"
                      data-chosen={
                        (!author?.id && author?.name === typedName) || undefined
                      }
                      onSelect={() => setAuthor({ name: typedName })}
                    >
                      + New author: {typedName}
                    </Command.Item>
                  ) : null}
                  <Command.Empty className="term-list-empty">
                    Type a name to add an author
                  </Command.Empty>
                </Command.List>
              </Command>
            </div>

            <label className="term-field">
              <span className="term-field-label">
                Date{" "}
                {!date ? <span className="term-dim">(now)</span> : null}
              </span>
              <input
                className="term-input"
                type="date"
                value={date || format(new Date(), DATE_FORMAT)}
                max={format(new Date(), DATE_FORMAT)}
                min="1900-01-01"
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            {error ? (
              <p className="term-error" role="alert">
                ! {error}
              </p>
            ) : null}

            <div className="term-dialog-actions">
              <DialogPrimitive.Close type="button" className="term-button">
                Cancel
              </DialogPrimitive.Close>
              <button
                type="submit"
                className="term-button is-primary"
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
