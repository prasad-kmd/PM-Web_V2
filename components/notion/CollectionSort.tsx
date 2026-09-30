"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownWideNarrow, ChevronDown, LoaderCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import {
  listingHref,
  type ListingOptions,
  type ListingSort,
} from "@/lib/content-listing";
import type { ContentType } from "@/lib/notion-cms";
import styles from "@/components/notion/content-listing.module.css";

const SORTS: { value: ListingSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "shortest", label: "Shortest read" },
  { value: "title", label: "Title A–Z" },
];

export function CollectionSort({
  type,
  options,
}: {
  type: ContentType;
  options: ListingOptions;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const label =
    SORTS.find((sort) => sort.value === options.sort)?.label ?? "Sort";

  return (
    <div className={styles.sort} aria-busy={pending}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={styles.sortTrigger}
          disabled={pending}
          aria-label={`Sort: ${label}`}
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className={styles.spinner} />
          ) : (
            <ArrowDownWideNarrow aria-hidden="true" />
          )}
          <span>{label}</span>
          <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className={styles.sortMenu}
        >
          <DropdownMenuLabel className={styles.sortLabel}>
            Sort by
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            aria-label="Sort content"
            value={options.sort}
            onValueChange={(value) => {
              const sort = SORTS.find(
                (option) => option.value === value,
              )?.value;
              if (!sort || sort === options.sort) return;
              startTransition(() =>
                router.push(listingHref(type, options, { sort, page: 1 }), {
                  scroll: false,
                }),
              );
            }}
          >
            {SORTS.map((sort) => (
              <DropdownMenuRadioItem
                className={styles.sortItem}
                key={sort.value}
                value={sort.value}
              >
                {sort.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="sr-only" role="status">
        {pending ? "Updating sort order…" : ""}
      </span>
    </div>
  );
}
