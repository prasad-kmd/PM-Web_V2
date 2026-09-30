"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon, LoaderCircle } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/coss/input-group";
import { Button } from "@/components/ui/button";
import { listingHref, type ListingOptions } from "@/lib/content-listing";
import type { ContentType } from "@/lib/notion-cms";
import styles from "@/components/notion/content-listing.module.css";

/** Coss p-input-group-20's search icon + p-input-group-22's clear action. */
export function CollectionSearch({
  type,
  label,
  options,
}: {
  type: ContentType;
  label: string;
  options: ListingOptions;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState({ applied: options.q, text: options.q });
  // Sync back/forward or a server-side clear without remounting the focused input.
  if (draft.applied !== options.q)
    setDraft({ applied: options.q, text: options.q });
  const value = draft.applied === options.q ? draft.text : options.q;

  function search(q: string) {
    const query = q.trim().slice(0, 300);
    startTransition(() =>
      router.push(listingHref(type, options, { q: query, page: 1 }), {
        scroll: false,
      }),
    );
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) search(value);
  }

  return (
    <form
      className={styles.search}
      action={`/${type}`}
      method="get"
      role="search"
      onSubmit={submit}
      aria-busy={pending}
    >
      <input type="hidden" name="view" value={options.view} />
      <input type="hidden" name="sort" value={options.sort} />
      {options.category ? (
        <input type="hidden" name="category" value={options.category} />
      ) : null}
      {options.letter ? (
        <input type="hidden" name="letter" value={options.letter} />
      ) : null}
      <label htmlFor="collection-search" className="sr-only">
        Search {label.toLowerCase()}
      </label>
      <InputGroup className={styles.searchGroup}>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          className={styles.searchInput}
          id="collection-search"
          name="q"
          type="search"
          placeholder="Search title, tag, author…"
          value={value}
          onChange={(event) =>
            setDraft({ applied: options.q, text: event.target.value })
          }
          maxLength={300}
          autoComplete="off"
          readOnly={pending}
        />
        <InputGroupAddon align="inline-end">
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className={styles.searchAction}
              disabled={pending}
              aria-label="Clear search"
              onClick={() => {
                setDraft({ applied: options.q, text: "" });
                inputRef.current?.focus();
                if (options.q) search("");
              }}
            >
              <XIcon aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            type="submit"
            variant="ghost"
            size="xs"
            className={styles.searchSubmit}
            disabled={pending}
            aria-label={`Search ${label.toLowerCase()}`}
          >
            {pending ? (
              <LoaderCircle aria-hidden="true" className={styles.spinner} />
            ) : (
              "Search"
            )}
          </Button>
        </InputGroupAddon>
      </InputGroup>
      <span className="sr-only" role="status">
        {pending ? "Searching…" : ""}
      </span>
    </form>
  );
}
