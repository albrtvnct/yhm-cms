import prisma from "@/lib/prisma";

export async function checkMemberLimit(churchId: string): Promise<{ allowed: boolean; max: number; current: number }> {
  try {
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { maxMembers: true }
    });
    
    if (!church) return { allowed: true, max: -1, current: 0 };
    if (church.maxMembers === -1) return { allowed: true, max: -1, current: 0 };

    const current = await prisma.member.count({ where: { churchId } });
    return {
      allowed: current < church.maxMembers,
      max: church.maxMembers,
      current
    };
  } catch (error) {
    console.error("checkMemberLimit error:", error);
    return { allowed: true, max: -1, current: 0 };
  }
}

export async function checkWorkerLimit(churchId: string): Promise<{ allowed: boolean; max: number; current: number }> {
  try {
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { maxWorkers: true }
    });

    if (!church) return { allowed: true, max: -1, current: 0 };
    if (church.maxWorkers === -1) return { allowed: true, max: -1, current: 0 };

    const current = await prisma.worker.count({ where: { churchId } });
    return {
      allowed: current < church.maxWorkers,
      max: church.maxWorkers,
      current
    };
  } catch (error) {
    console.error("checkWorkerLimit error:", error);
    return { allowed: true, max: -1, current: 0 };
  }
}

export async function checkUserLimit(churchId: string): Promise<{ allowed: boolean; max: number; current: number }> {
  try {
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { maxUsers: true }
    });

    if (!church) return { allowed: true, max: -1, current: 0 };
    if (church.maxUsers === -1) return { allowed: true, max: -1, current: 0 };

    const current = await prisma.user.count({ where: { churchId } });
    return {
      allowed: current < church.maxUsers,
      max: church.maxUsers,
      current
    };
  } catch (error) {
    console.error("checkUserLimit error:", error);
    return { allowed: true, max: -1, current: 0 };
  }
}
