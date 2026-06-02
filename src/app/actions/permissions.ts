"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getRolePermissions() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    
    // Only ADMIN should configure this, but we allow fetching it for UI
    const churchId = session.churchId;

    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { rolePermissions: true }
    });

    if (!church) throw new Error("Gereja tidak ditemukan");

    return { success: true, data: church.rolePermissions || {} };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateRolePermissions(rolePermissions: any) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    
    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.email !== "admin@gmail.com")) {
      throw new Error("Hanya ADMIN yang dapat mengatur hak akses menu.");
    }

    const churchId = session.churchId;

    await prisma.church.update({
      where: { id: churchId },
      data: { rolePermissions }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pengaturan");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
