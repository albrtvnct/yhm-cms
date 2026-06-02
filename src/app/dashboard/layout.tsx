import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import DashboardLayoutWrapper from "./DashboardLayoutWrapper";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  // Fetch real data
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { church: true },
  });

  if (!user) {
    redirect("/");
  }

  return <DashboardLayoutWrapper user={user}>{children}</DashboardLayoutWrapper>;
}
