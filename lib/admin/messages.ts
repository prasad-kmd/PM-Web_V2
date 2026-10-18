import type { UserActionCode } from "@/lib/admin/users";

/**
 * Display copy for the codes a row action returns.
 *
 * The split exists for one reason: **the result of a row action travels through
 * the query string**, and the query string is supplied by whoever wrote the link.
 * A redirect carrying a finished sentence would let
 * `/admin/users?error=<anything>` render that text on the admin page, styled as
 * the site's own message — a phishing surface pointed at the one account that can
 * do damage.
 *
 * So the URL carries a code from a closed set, and the sentences live here, where
 * nothing from the request can reach them. `parseUserActionCode()` is the only
 * door between the two.
 */

export type Notice = {
  /** `true` when the code came from `?notice=`, i.e. the action succeeded. */
  ok: boolean;
  text: string;
};

const NOTICES: Record<UserActionCode, Notice> = {
  role_changed: {
    ok: true,
    text: "Role updated. It takes effect on the account's next request.",
  },
  role_changed_self: {
    ok: true,
    text: "You have given up administrator access. This page will refuse you from your next request onwards — another administrator can promote you back.",
  },
  account_removed: {
    ok: true,
    text: "Account removed, and its sessions with it. That seat is free again.",
  },
  account_removed_self: {
    ok: true,
    text: "Your account has been removed. Your next request will be refused.",
  },
  role_unchanged: {
    ok: false,
    text: "That account already had that role — nothing changed.",
  },
  account_missing: {
    ok: false,
    text: "That account no longer exists. The list has been refreshed.",
  },
  last_admin_demote: {
    ok: false,
    text: "Refused: that is the only administrator. Demoting the last one would lock you out of this page. Promote somebody else first.",
  },
  last_admin_delete: {
    ok: false,
    text: "Refused: that is the only administrator. Deleting the last one would lock you out of this page. Promote somebody else first.",
  },
  bad_request: {
    ok: false,
    text: "That request was not formed correctly. Nothing was changed.",
  },
};

/**
 * Maps a query-string value to a notice.
 *
 * @param kind which parameter it came from. The value itself is only ever
 *   *looked up*, never rendered, so an unknown code produces `null` rather than
 *   echoing anything back.
 */
export function readNotice(
  value: string | string[] | undefined,
  kind: "notice" | "error",
): Notice | null {
  const code = Array.isArray(value) ? value[0] : value;
  if (!code) return null;

  const notice = NOTICES[code as UserActionCode];
  if (!notice) return null;

  // A success code announced through `?error=` (or the reverse) is somebody
  // hand-editing the URL. Trust the parameter, not the code's own `ok`.
  return { ok: kind === "notice", text: notice.text };
}
