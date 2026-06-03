"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { checkWorkerLimit } from "@/lib/limits";

export async function getFullTimers() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    const fullTimers = await prisma.worker.findMany({
      where: { churchId, type: "FULLTIME" },
      orderBy: { name: "asc" },
    });

    return { success: true, data: fullTimers };
  } catch (error: any) {
    console.error("Error fetching full timers:", error);
    return { success: false, error: error.message };
  }
}

export async function addFullTimer(data: any) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    const limit = await checkWorkerLimit(churchId);
    if (!limit.allowed) {
      return { success: false, error: `Batas kapasitas pelayan/pekerja gereja telah tercapai (${limit.max} orang). Silakan hubungi Super Admin.` };
    }

    // 1. Create the Full Timer (Worker)
    const newFullTimer = await prisma.worker.create({
      data: {
        churchId,
        type: "FULLTIME",
        nij: data.nij || null,
        name: data.name,
        keterangan: data.keterangan || null,
        tempatLahir: data.tempatLahir || null,
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
        phone: data.phone || null,
        email: data.email || null,
        alamat: data.alamat || null,
        persembahanKasih: parseFloat(data.persembahanKasih) || 0,
        statusPerkawinan: data.statusPerkawinan || null,
        statusPekerjaan: data.statusPekerjaan || "AKTIF",
        statusJemaat: data.statusJemaat || "AKTIF",
        fileBaptisan: data.fileBaptisan || null,
        fileSuratTugas: data.fileSuratTugas || null,
      },
    });

    // 2. Sync to Member if NIJ is provided
    if (data.nij) {
      const existingMember = await prisma.member.findUnique({
        where: { nij: data.nij },
      });

      if (existingMember) {
        // Update existing member
        await prisma.member.update({
          where: { nij: data.nij },
          data: {
            name: data.name,
            phone: data.phone || existingMember.phone,
            email: data.email || existingMember.email,
            birthPlace: data.tempatLahir || existingMember.birthPlace,
            birthDate: data.tanggalLahir ? new Date(data.tanggalLahir) : existingMember.birthDate,
            maritalStatus: data.statusPerkawinan || existingMember.maritalStatus,
            address: data.alamat || existingMember.address,
            status: data.statusJemaat || existingMember.status,
          },
        });
      } else {
        // Create new member
        await prisma.member.create({
          data: {
            churchId,
            nij: data.nij,
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            birthPlace: data.tempatLahir || null,
            birthDate: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
            maritalStatus: data.statusPerkawinan || null,
            address: data.alamat || null,
            status: data.statusJemaat || "AKTIF",
            joinDate: new Date(),
          },
        });
      }
    }

    return { success: true, data: newFullTimer };
  } catch (error: any) {
    console.error("Error adding full timer:", error);
    return { success: false, error: error.message };
  }
}

export async function updateFullTimer(id: string, data: any) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const updatedFullTimer = await prisma.worker.update({
      where: { id },
      data: {
        nij: data.nij || null,
        name: data.name,
        keterangan: data.keterangan || null,
        tempatLahir: data.tempatLahir || null,
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
        phone: data.phone || null,
        email: data.email || null,
        alamat: data.alamat || null,
        persembahanKasih: parseFloat(data.persembahanKasih) || 0,
        statusPerkawinan: data.statusPerkawinan || null,
        statusPekerjaan: data.statusPekerjaan || "AKTIF",
        statusJemaat: data.statusJemaat || "AKTIF",
        fileBaptisan: data.fileBaptisan || null,
        fileSuratTugas: data.fileSuratTugas || null,
      },
    });

    // Sync to Member
    if (data.nij) {
      const existingMember = await prisma.member.findUnique({
        where: { nij: data.nij },
      });

      if (existingMember) {
        await prisma.member.update({
          where: { nij: data.nij },
          data: {
            name: data.name,
            phone: data.phone || existingMember.phone,
            email: data.email || existingMember.email,
            birthPlace: data.tempatLahir || existingMember.birthPlace,
            birthDate: data.tanggalLahir ? new Date(data.tanggalLahir) : existingMember.birthDate,
            maritalStatus: data.statusPerkawinan || existingMember.maritalStatus,
            address: data.alamat || existingMember.address,
            status: data.statusJemaat || existingMember.status,
          },
        });
      } else {
        await prisma.member.create({
          data: {
            churchId: updatedFullTimer.churchId,
            nij: data.nij,
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            birthPlace: data.tempatLahir || null,
            birthDate: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
            maritalStatus: data.statusPerkawinan || null,
            address: data.alamat || null,
            status: data.statusJemaat || "AKTIF",
            joinDate: new Date(),
          },
        });
      }
    }

    return { success: true, data: updatedFullTimer };
  } catch (error: any) {
    console.error("Error updating full timer:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteFullTimer(id: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.worker.delete({
      where: { id },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting full timer:", error);
    return { success: false, error: error.message };
  }
}
