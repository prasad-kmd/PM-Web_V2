"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { saveSiteSettings } from "@/lib/admin/settings";
import { changeUserRole, parseRole, removeUser } from "@/lib/admin/users";
import { requireAdmin } from "@/lib/auth/server";
import { AUTH_ROUTES } from "@/lib/nav";

/**
 * Server actions for `/admin` — deliberately thin.
 *
 * Every export here does the same four things and nothing else:
 *
 *   1. `requireAdmin()` — **the guard**, and the first line of every action.
 *      A server action is a public HTTP endpoint: the fact that only an admin
 *      is *shown* the button means nothing to somebody posting to it directly.
 *   2. Read the form fields, treating all of them as untrusted strings.
 *   3. Delegate to `lib/admin/**`, where the real rules live.
 *   4. Revalidate, then report.
 *
 * The logic is not here because a `"use server"` module can only run inside a
 * request context — `requireAdmin()` calls `next/headers`. Keeping the rules in
 * `lib/admin/` is what lets the verification harness call them directly and
 * assert what they do, rather than grepping this file for the right words.
 *
 * ## Two ways of reporting, chosen per action rather than by habit
 *
 * - **Settings** uses `useActionState`: one form, one submission, and the values
 *   the operator typed should survive a rejection. Inline state is the natural
 *   fit.
 * - **Row actions** redirect back with `?notice=` or `?error=`. A row action is a
 *   discrete command with nothing to preserve, and a querystring result survives
 *   a submit with JavaScript disabled — which matters because these buttons are
 *   inside plain `<form>`s for exactly that reason.
 *
 * Both carry text written by *us*, never by the request.
 */

export type SettingsFormState = {
  ok: boolean;
  message: string;
} | null;

/**
 * The seat configuration form.
 *
 * `revalidatePath("/sign-up")` is not decoration: `/sign-up` renders the open or
 * closed state on the server, so without it a reader could be shown a
 * "Create your account" button for a seat that was closed a second ago.
 */
export async function updateSettings(
  _previous: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requireAdmin(AUTH_ROUTES.admin);

  const result = await saveSiteSettings(
    {
      maxUsers: formData.get("maxUsers"),
      // An unchecked checkbox submits nothing at all, so "absent" is "off" —
      // which is also what a screen reader user toggling it off will send.
      signupEnabled: formData.get("signupEnabled") === "on",
    },
    session.user.email ?? null,
  );

  if (!result.ok) return { ok: false, message: result.message };

  // The gate changed, so everything that reads it has to be rebuilt.
  revalidatePath(AUTH_ROUTES.admin);
  revalidatePath("/admin/settings");
  revalidatePath(AUTH_ROUTES.signUp);
  revalidatePath(AUTH_ROUTES.signIn);

  return { ok: true, message: result.summary };
}

/**
 * The redirect target for a row action.
 *
 * **Only a code travels, never a sentence.** The query string is part of a URL
 * that anyone can write, so text taken from it and rendered on the admin page
 * would be an attacker's words in this site's styling. `lib/admin/messages.ts`
 * holds the copy; this only decides which parameter carries the code.
 */
function backToUsers(code: string, ok: boolean): never {
  redirect(`/admin/users?${ok ? "notice" : "error"}=${encodeURIComponent(code)}`);
}

/** Promote or demote an account. */
export async function setRole(formData: FormData): Promise<void> {
  const session = await requireAdmin("/admin/users");

  const targetId = formData.get("userId");
  const role = parseRole(formData.get("role"));

  if (typeof targetId !== "string" || targetId === "" || role === null) {
    backToUsers("bad_request", false);
  }

  const result = await changeUserRole({
    actorId: session.user.id,
    targetId,
    role,
  });

  revalidatePath("/admin/users");
  revalidatePath(AUTH_ROUTES.admin);

  backToUsers(result.code, result.ok);
}

/**
 * Remove an account.
 *
 * A `POST`-only action with no idempotency key: submitting twice deletes nothing
 * the second time and reports "That account no longer exists", which is the
 * honest answer and requires no extra machinery to reach.
 */
export async function deleteAccount(formData: FormData): Promise<void> {
  const session = await requireAdmin("/admin/users");

  const targetId = formData.get("userId");

  if (typeof targetId !== "string" || targetId === "") {
    backToUsers("bad_request", false);
  }

  const result = await removeUser({ actorId: session.user.id, targetId });

  revalidatePath("/admin/users");
  revalidatePath(AUTH_ROUTES.admin);
  // A removal frees a seat, so the sign-up page's open/closed state may change.
  revalidatePath(AUTH_ROUTES.signUp);

  backToUsers(result.code, result.ok);
}
