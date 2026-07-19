import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarV2 } from "@/components/layout/sidebar-v2";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-page)" }}>
      <SidebarV2
        role="admin"
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
      />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <DashboardTopbar role="admin" />
        <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
      </div>
    </div>
  );
}
