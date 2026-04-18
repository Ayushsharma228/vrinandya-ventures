import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarV2 } from "@/components/layout/sidebar-v2";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "SALES") redirect("/login");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-page)" }}>
      <SidebarV2
        role="sales"
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
