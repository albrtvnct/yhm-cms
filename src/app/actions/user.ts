"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

async function getChurchId() {
  const session = await getSession();
  return session?.churchId || null;
}

export async function getUsers() {
  try {
    const churchId = await getChurchId();
    if (!churchId) return { success: false, error: "Unauthorized" };

    const users = await prisma.user.findMany({
      where: { churchId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        customPermissions: true,
        createdAt: true,
      }
    });

    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addUser(data: { name: string; email: string; passwordRaw: string; role: string; seksi?: string }) {
  try {
    const churchId = await getChurchId();
    if (!churchId) return { success: false, error: "Unauthorized" };

    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.email !== "admin@gmail.com")) {
      return { success: false, error: "Hanya ADMIN yang dapat menambahkan akun." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return { success: false, error: "Email sudah terdaftar." };
    }

    const hashedPassword = await bcrypt.hash(data.passwordRaw, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        seksi: data.seksi || null,
        churchId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return { success: true, data: newUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: string) {
  try {
    const churchId = await getChurchId();
    if (!churchId) return { success: false, error: "Unauthorized" };

    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.email !== "admin@gmail.com")) {
      return { success: false, error: "Hanya ADMIN yang dapat menghapus akun." };
    }
    
    if (id === session.userId) {
      return { success: false, error: "Tidak dapat menghapus akun sendiri." };
    }

    await prisma.user.delete({
      where: { id, churchId }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, role: true, email: true }
    });

    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserPermissions(userId: string, customPermissions: string[] | null) {
  try {
    const churchId = await getChurchId();
    if (!churchId) return { success: false, error: "Unauthorized" };

    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Hanya ADMIN yang dapat mengatur hak akses spesifik." };
    }

    await prisma.user.update({
      where: { id: userId, churchId },
      data: {
        customPermissions: customPermissions ? JSON.parse(JSON.stringify(customPermissions)) : null,
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
