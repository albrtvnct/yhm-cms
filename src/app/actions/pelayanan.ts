"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getServantsList() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Fetch members who have ministries or just get all active members
    const members = await prisma.member.findMany({
      where: {
        churchId: session.churchId,
        status: "AKTIF"
      },
      select: {
        id: true,
        name: true,
        phone: true,
        gender: true,
        ministries: true
      },
      orderBy: { name: "asc" }
    });

    return { success: true, data: members };
  } catch (error: any) {
    console.error("getServantsList error:", error);
    return { success: false, error: error.message };
  }
}
