"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getPersuratanMembers() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const members = await prisma.member.findMany({
      where: {
        churchId: session.churchId,
        status: "AKTIF"
      },
      select: {
        id: true,
        nij: true,
        name: true,
        phone: true,
        gender: true,
        cellGroup: true,
        birthDate: true
      },
      orderBy: { name: "asc" }
    });

    return { success: true, data: members };
  } catch (error: any) {
    console.error("getPersuratanMembers error:", error);
    return { success: false, error: error.message };
  }
}
