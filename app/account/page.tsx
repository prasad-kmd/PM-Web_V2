import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { safeReturnTo } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

type AccountGatewayProps = {
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

/**
 * Resolve the account icon without fetching session state on every page view.
 * Session lookup occurs only when a visitor explicitly opens this page.
 */
export default async function AccountGatewayPage({
  searchParams,
}: AccountGatewayProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const session = await getAuth().api.getSession({ headers: await headers() });

  if (session) redirect("/dashboard");
  redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
}
