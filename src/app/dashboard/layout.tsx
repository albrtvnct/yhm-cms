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

  // Fetch program approval notifications for leadership roles
  const allowedRoles = ["GEMBALA SIDANG", "MAJELIS", "DIAKEN", "PENATUA"];
  let pendingProgramsCount = 0;
  let pendingPrograms: any[] = [];

  if (allowedRoles.includes(user.role.toUpperCase())) {
    try {
      pendingProgramsCount = await prisma.program.count({
        where: {
          churchId: user.churchId,
          status: "MENUNGGU",
        },
      });

      pendingPrograms = await prisma.program.findMany({
        where: {
          churchId: user.churchId,
          status: "MENUNGGU",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          nama: true,
          divisi: true,
          penanggungJawab: true,
          createdAt: true,
        },
      });
    } catch (err) {
      console.error("Error loading notification counts:", err);
    }
  }

  const serializedPrograms = pendingPrograms.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString()
  }));

  return (
    <DashboardLayoutWrapper 
      user={user} 
      pendingProgramsCount={pendingProgramsCount} 
      pendingPrograms={serializedPrograms}
    >
      {children}
    </DashboardLayoutWrapper>
  );
}
