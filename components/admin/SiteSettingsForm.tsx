"use client";

import { CircleCheck, CircleAlert, Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateSettings, type SettingsFormState } from "@/app/admin/actions";

/**
 * The seat configuration form.
 *
 * Adapted from React Bits Pro `app-ui/settings-form-*`: the labelled field, the
 * switch row, the save bar. What changed is everything behind it — the blocks
 * ship a `console.log` submit handler and local state, and this posts to a server
 * action that validates, writes, records who changed it, and revalidates
 * `/sign-up` so the open/closed state cannot go stale.
 *
 * **No JavaScript required.** `useActionState` degrades to a plain form post:
 * the action runs, returns a state, and the page re-renders with the result. The
 * `isPending` flag is a nicety for people who have JS, not a requirement — which
 * is why the message is rendered from action state rather than from a toast.
 *
 * `defaultValue` rather than a controlled input on purpose: it keeps the fields
 * uncontrolled, so a rejected submission still shows what the operator typed
 * instead of resetting it to what is in the database.
 */

const EMPTY: SettingsFormState = null;

export function SiteSettingsForm({
  maxUsers,
  signupEnabled,
}: {
  maxUsers: number;
  signupEnabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateSettings, EMPTY);

  return (
    <form action={formAction} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="maxUsers">Accounts allowed</Label>
        <Input
          id="maxUsers"
          name="maxUsers"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          required
          defaultValue={maxUsers}
          aria-describedby="maxUsers-help"
          className="max-w-40"
        />
        <p id="maxUsers-help" className="max-w-prose text-sm text-ink-soft">
          How many accounts may ever exist. Lowering it below the current count
          is allowed and is the point: only <em>creation</em> is gated, so
          everybody who already has an account keeps signing in.
        </p>
      </div>

      <div className="flex items-start justify-between gap-6 rounded-xl border border-border/70 bg-card/60 p-4">
        <div>
          <Label htmlFor="signupEnabled">Registration open</Label>
          <p
            id="signupEnabled-help"
            className="mt-1 max-w-prose text-sm text-ink-soft"
          >
            A hard stop, independent of the limit above. Turn it off and no new
            account can be created whatever the numbers say, while every existing
            account still signs in.
          </p>
        </div>
        <Switch
          id="signupEnabled"
          name="signupEnabled"
          value="on"
          defaultChecked={signupEnabled}
          aria-describedby="signupEnabled-help"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {isPending ? "Saving…" : "Save settings"}
        </Button>

        {state ? (
          <p
            role={state.ok ? "status" : "alert"}
            className="flex items-center gap-2 text-sm text-ink-soft"
          >
            {state.ok ? (
              <CircleCheck className="size-4 shrink-0" aria-hidden />
            ) : (
              <CircleAlert
                className="size-4 shrink-0 text-destructive"
                aria-hidden
              />
            )}
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
