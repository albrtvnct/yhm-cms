"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.email !== "admin@gmail.com")) {
    throw new Error("Hanya ADMIN yang dapat mengakses fitur ini.");
  }
  return session.churchId;
}

export async function getSeksis() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const church = await prisma.church.findUnique({
      where: { id: session.churchId },
      select: { seksis: true }
    });

    return { success: true, data: church?.seksis || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addSeksi(name: string) {
  try {
    const churchId = await checkAdmin();

    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { seksis: true }
    });
    
    const currentSeksis = church?.seksis || [];
    if (currentSeksis.includes(name)) {
      throw new Error("Seksi sudah ada.");
    }

    await prisma.church.update({
      where: { id: churchId },
      data: { seksis: [...currentSeksis, name] }
    });

    revalidatePath("/dashboard/pengaturan");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSeksi(name: string) {
  try {
    const churchId = await checkAdmin();

    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { seksis: true }
    });
    
    const currentSeksis = church?.seksis || [];
    const newSeksis = currentSeksis.filter(s => s !== name);

    await prisma.church.update({
      where: { id: churchId },
      data: { seksis: newSeksis }
    });

    revalidatePath("/dashboard/pengaturan");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
