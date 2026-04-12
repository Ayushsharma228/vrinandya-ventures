import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarV2 } from "@/components/layout/sidebar-v2";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "SELLER") redirect("/login");

  // New sellers must complete onboarding and wait for activation
  const status = (session.user as { accountStatus?: string }).accountStatus;
  if (status && status !== "ACTIVE") redirect("/onboarding");

  // Legacy: existing sellers without plan (before signup flow) still work
  if (!session.user.plan && status === undefined) redirect("/onboarding");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-page)" }}>
      <SidebarV2
        role="seller"
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
