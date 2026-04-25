import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin");
    if (session.user.role === "SUPPLIER") redirect("/supplier");
    if (session.user.role === "SELLER") {
      if (!session.user.plan) redirect("/onboarding");
      redirect("/seller");
    }
    redirect("/login");
  }

  return <LandingPage />;
}
