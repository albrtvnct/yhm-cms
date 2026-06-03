"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Super Admin access required");
  }
}

export async function getSuperAdminStats() {
  try {
    await requireSuperAdmin();

    const totalChurches = await prisma.church.count({
      where: { NOT: { slug: "super-admin" } }
    });
    const totalMembers = await prisma.member.count({
      where: { NOT: { church: { slug: "super-admin" } } }
    });
    const totalWorkers = await prisma.worker.count({
      where: { NOT: { church: { slug: "super-admin" } } }
    });
    const totalUsers = await prisma.user.count({
      where: { NOT: { church: { slug: "super-admin" } } }
    });

    return {
      success: true,
      data: {
        totalChurches,
        totalMembers,
        totalWorkers,
        totalUsers
      }
    };
  } catch (error: any) {
    console.error("getSuperAdminStats error:", error);
    return { success: false, error: error.message };
  }
}

export async function getChurchesWithStats() {
  try {
    await requireSuperAdmin();

    const churches = await prisma.church.findMany({
      where: { NOT: { slug: "super-admin" } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
            members: true,
            workers: true
          }
        }
      }
    });

    // Safely parse allowedMenus if it's stored as Json
    const formattedChurches = churches.map(church => {
      let allowedMenus: string[] = [];
      if (church.allowedMenus) {
        try {
          if (Array.isArray(church.allowedMenus)) {
            allowedMenus = church.allowedMenus as string[];
          } else if (typeof church.allowedMenus === 'string') {
            allowedMenus = JSON.parse(church.allowedMenus);
          }
        } catch (e) {
          allowedMenus = [];
        }
      }
      return {
        ...church,
        allowedMenus
      };
    });

    return { success: true, data: formattedChurches };
  } catch (error: any) {
    console.error("getChurchesWithStats error:", error);
    return { success: false, error: error.message };
  }
}

export async function createChurchAction(data: {
  name: string;
  slug: string;
  maxMembers: number;
  maxWorkers: number;
  maxUsers: number;
  allowedMenus: string[];
}) {
  try {
    await requireSuperAdmin();

    const existingSlug = await prisma.church.findUnique({
      where: { slug: data.slug.toLowerCase() }
    });

    if (existingSlug) {
      return { success: false, error: "Slug portal gereja sudah digunakan." };
    }

    const newChurch = await prisma.church.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
        maxMembers: data.maxMembers,
        maxWorkers: data.maxWorkers,
        maxUsers: data.maxUsers,
        allowedMenus: data.allowedMenus,
      }
    });

    revalidatePath("/super-admin");
    return { success: true, data: newChurch };
  } catch (error: any) {
    console.error("createChurchAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateChurchLimitsAction(
  churchId: string,
  limits: {
    maxMembers: number;
    maxWorkers: number;
    maxUsers: number;
    allowedMenus: string[];
  }
) {
  try {
    await requireSuperAdmin();

    await prisma.church.update({
      where: { id: churchId },
      data: {
        maxMembers: limits.maxMembers,
        maxWorkers: limits.maxWorkers,
        maxUsers: limits.maxUsers,
        allowedMenus: limits.allowedMenus,
      }
    });

    revalidatePath("/super-admin");
    return { success: true };
  } catch (error: any) {
    console.error("updateChurchLimitsAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteChurchAction(churchId: string) {
  try {
    await requireSuperAdmin();

    // Check if we are deleting the super admin church (safety check)
    const church = await prisma.church.findUnique({ where: { id: churchId } });
    if (church && church.slug === "super-admin") {
      return { success: false, error: "Tidak dapat menghapus pusat admin utama." };
    }

    await prisma.church.delete({
      where: { id: churchId }
    });

    revalidatePath("/super-admin");
    return { success: true };
  } catch (error: any) {
    console.error("deleteChurchAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function getChurchAdmins(churchId: string) {
  try {
    await requireSuperAdmin();

    const admins = await prisma.user.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, data: admins };
  } catch (error: any) {
    console.error("getChurchAdmins error:", error);
    return { success: false, error: error.message };
  }
}

export async function addChurchAdminAction(
  churchId: string,
  data: {
    name: string;
    email: string;
    passwordRaw: string;
  }
) {
  try {
    await requireSuperAdmin();

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return { success: false, error: "Email sudah digunakan oleh akun lain." };
    }

    // Verify limit before creating (optional fallback for super-admin creations)
    const userCount = await prisma.user.count({ where: { churchId } });
    const church = await prisma.church.findUnique({ where: { id: churchId } });
    if (church && church.maxUsers !== -1 && userCount >= church.maxUsers) {
      return {
        success: false,
        error: `Gereja ini telah mencapai kapasitas maksimum pengguna (${church.maxUsers} pengguna). Silakan tingkatkan limit gereja terlebih dahulu.`
      };
    }

    const hashedPassword = await bcrypt.hash(data.passwordRaw, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "ADMIN",
        churchId: churchId
      }
    });

    revalidatePath("/super-admin");
    return { success: true, data: { id: newUser.id, name: newUser.name, email: newUser.email } };
  } catch (error: any) {
    console.error("addChurchAdminAction error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteChurchAdminAction(churchId: string, userId: string) {
  try {
    await requireSuperAdmin();

    await prisma.user.delete({
      where: { id: userId, churchId }
    });

    revalidatePath("/super-admin");
    return { success: true };
  } catch (error: any) {
    console.error("deleteChurchAdminAction error:", error);
    return { success: false, error: error.message };
  }
}
