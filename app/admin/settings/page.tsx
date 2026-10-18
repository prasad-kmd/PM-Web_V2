import type { Metadata } from "next";

import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";
import { getSeatConfig } from "@/lib/admin/queries";
import { MAX_MAX_USERS } from "@/lib/admin/settings";
import { requireAdmin } from "@/lib/auth/server";

/**
 * `/admin/settings` — the seat gate's controls.
 *
 * This is the "the allowable user count should be changeable in the DB" control
 * from item 6, given a form. The SQL equivalent stays documented in
 * `docs/admin-guide.md`, because the tool you reach for when a terminal is
 * already open should not be a web page.
 *
 * Adapted from React Bits Pro `app-ui/settings-form-*`: the field/switch/save-bar
 * composition. Not taken: the blocks' local state and `console.log` submit
 * handlers, and their "unsaved changes" bar — this form has two fields and a
 * server action that reports its own result, so a dirty-state tracker would be
 * machinery for a problem it does not have.
 */

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export default async function AdminSettingsPage() {
  await requireAdmin("/admin/settings");

  const config = await getSeatConfig();

  // What the numbers mean today, before anything is edited. Computed here rather
  // than inside the form because it is a fact about the database, not about the
  // form's state.
  const wouldBeOpen = config.signupEnabled && config.used < config.maxUsers;

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
        Seat gate
      </h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
        The rule behind registration. Both settings live in a single{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-ink">
          site_settings
        </code>{" "}
        row; this page and the gate read the same one.
      </p>

      <dl className="mt-6 grid gap-4 rounded-2xl border border-border/70 bg-card/60 p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-soft">
            Accounts now
          </dt>
          <dd className="mt-1 font-display text-xl font-semibold text-ink">
            {config.used}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-soft">
            Registration
          </dt>
          <dd className="mt-1 font-display text-xl font-semibold text-ink">
            {wouldBeOpen ? "Open" : "Closed"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-soft">
            Last changed
          </dt>
          <dd className="mt-1 text-ink-soft">
            {config.updatedAt
              ? `${DATE_FORMAT.format(config.updatedAt)}${config.updatedBy ? ` · ${config.updatedBy}` : ""}`
              : "never — defaults apply"}
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <SiteSettingsForm
          maxUsers={config.maxUsers}
          signupEnabled={config.signupEnabled}
        />
      </div>

      <p className="mt-8 max-w-prose text-xs leading-relaxed text-ink-soft">
        The limit is capped at {MAX_MAX_USERS} by this form. Nothing is deleted
        when the limit is lowered — accounts above the new number keep signing
        in, they just cannot be added to. Removing an account on the{" "}
        <a
          href="/admin/users"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          accounts page
        </a>{" "}
        is what frees a seat.
      </p>
    </div>
  );
}
