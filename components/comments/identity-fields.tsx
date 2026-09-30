"use client";

import { Github, Linkedin, Twitter, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CommentAvatar } from "./comment-avatar";
import type { CommenterIdentity } from "@/lib/comments/types";

/**
 * The "who are you?" half of the guest comment flow.
 *
 * PM-Web_V2 has no sign-in, so the commenter is identified by a name, an email
 * and (optionally) one or more social handles. Handles are optional but useful:
 * the server resolves a profile image from the first one that exists.
 *
 * Also used on its own by the "Comment as someone else" affordance, which lets
 * a returning visitor overwrite the identity stored in their cookie.
 */

type IdentityFieldsProps = {
  value: CommenterIdentity;
  onChange: (next: CommenterIdentity) => void;
  errors?: Record<string, string[]>;
  disabled?: boolean;
  /** Hide the email field's helper copy in the compact form. */
  compact?: boolean;
};

const SOCIAL_FIELDS = [
  {
    key: "github",
    label: "GitHub",
    placeholder: "prasad-kmd",
    prefix: "github.com/",
    Icon: Github,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "prasad-kmd",
    prefix: "linkedin.com/in/",
    Icon: Linkedin,
  },
  {
    key: "twitter",
    label: "X / Twitter",
    placeholder: "prasad_kmd",
    prefix: "x.com/",
    Icon: Twitter,
  },
] as const;

export function IdentityFields({
  value,
  onChange,
  errors,
  disabled,
  compact,
}: IdentityFieldsProps) {
  const anyHandle = Boolean(value.github || value.linkedin || value.twitter);

  const update = (patch: Partial<CommenterIdentity>) =>
    onChange({ ...value, ...patch });

  const errorFor = (field: string) => errors?.[field]?.[0];

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-2.5">
        <CommentAvatar name={value.name || "You"} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {value.name.trim() || "New commenter"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {value.email.trim() ||
              (anyHandle
                ? "Add an email to finish setting up"
                : "Shown next to your comment")}
          </p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="commenter-name" className="text-xs font-medium">
          Name
        </Label>
        <Input
          id="commenter-name"
          value={value.name}
          disabled={disabled}
          autoComplete="name"
          maxLength={60}
          placeholder="Your name"
          aria-invalid={Boolean(errorFor("name"))}
          onChange={(event) => update({ name: event.target.value })}
        />
        {errorFor("name") ? (
          <p role="alert" className="text-xs text-destructive">
            {errorFor("name")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="commenter-email" className="text-xs font-medium">
          Email
        </Label>
        <Input
          id="commenter-email"
          type="email"
          inputMode="email"
          value={value.email}
          disabled={disabled}
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errorFor("email"))}
          onChange={(event) => update({ email: event.target.value })}
        />
        {errorFor("email") ? (
          <p role="alert" className="text-xs text-destructive">
            {errorFor("email")}
          </p>
        ) : (
          !compact && (
            <p className="text-xs text-muted-foreground">
              Not published. Disposable addresses are rejected.
            </p>
          )
        )}
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1.5 text-xs font-medium">
          Profile link{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </legend>
        {SOCIAL_FIELDS.map(({ key, label, placeholder, prefix, Icon }) => (
          <div key={key} className="grid gap-1.5">
            <Label
              htmlFor={`commenter-${key}`}
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <Icon className="size-3.5" />
              {label}
            </Label>
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline"
              >
                {prefix}
              </span>
              <Input
                id={`commenter-${key}`}
                value={value[key] ?? ""}
                disabled={disabled}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errorFor(key))}
                onChange={(event) => update({ [key]: event.target.value })}
              />
            </div>
          </div>
        ))}
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <UserRound className="mt-0.5 size-3.5 shrink-0" />
          The first handle we can resolve supplies your avatar.
        </p>
      </fieldset>
    </div>
  );
}
