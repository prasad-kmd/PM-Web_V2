import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";

/**
 * Authorize from the canonical Postgres role, not a role copied into the
 * short-lived session cache. Reuse this guard in every future admin action/API.
 */
export async function requireAdmin() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/sign-in?returnTo=${encodeURIComponent("/admin")}`);
  }

  const [currentUser] = await getDb()
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!currentUser || currentUser.role !== "admin") {
    redirect("/access-denied");
  }

  return { session, user: currentUser };
}
