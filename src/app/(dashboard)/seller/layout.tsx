import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SellerSidebar } from "@/components/layout/seller-sidebar";
import { SellerTopbar } from "@/components/layout/seller-topbar";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "SELLER") redirect("/login");
  if (!session.user.plan) redirect("/onboarding");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SellerTopbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
