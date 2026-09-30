"use client";

import type { ComponentProps, ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Adapted from Coss input-group for p-input-group-20 + p-input-group-22.
 * Retains the group/addon/input composition and focus behavior, using the
 * site's existing input primitive and semantic palette instead of replacing
 * every Input/Button or introducing a second Base UI version.
 */
export function InputGroup({
  className,
  ...props
}: ComponentProps<"div">): ReactElement {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "relative inline-flex min-w-0 w-full items-center rounded-lg border border-input bg-card text-foreground transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25 has-[input:disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: ComponentProps<"div"> & {
  align?: "inline-start" | "inline-end";
}): ReactElement {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 items-center justify-center gap-1 text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-4",
        align === "inline-start" ? "order-first pl-2.5" : "order-last pr-1",
        className,
      )}
      onMouseDown={(event) => {
        const target = event.target;
        if (
          !(target instanceof Element) ||
          target.closest("button, a, input, [role=button]")
        )
          return;
        event.preventDefault();
        event.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

export function InputGroupInput({
  className,
  ...props
}: ComponentProps<typeof Input>): ReactElement {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}
