import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SellerHeader } from "@/components/layout/seller-header";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "SELLER") redirect("/login");

  const status = (session.user as { accountStatus?: string }).accountStatus;
  if (status && status !== "ACTIVE") redirect("/onboarding");
  if (!session.user.plan && status === undefined) redirect("/onboarding");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <SellerHeader
        plan={session.user.plan ?? undefined}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
      />
      <main className="pt-16">{children}</main>
    </div>
  );
}
