import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SupplierSidebar } from "@/components/layout/supplier-sidebar";
import { SupplierTopbar } from "@/components/layout/supplier-topbar";

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "SUPPLIER") redirect("/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SupplierSidebar
        userName={session.user.name ?? "Supplier"}
        userEmail={session.user.email ?? ""}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <SupplierTopbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
