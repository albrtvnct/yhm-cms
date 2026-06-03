"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { checkWorkerLimit } from "@/lib/limits";

export async function getHambaTuhan() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    const hambaTuhanList = await prisma.worker.findMany({
      where: { churchId, type: "HAMBATUHAN" },
      orderBy: { name: "asc" },
    });

    return { success: true, data: hambaTuhanList };
  } catch (error: any) {
    console.error("Error fetching hamba tuhan:", error);
    return { success: false, error: error.message };
  }
}

export async function addHambaTuhan(data: any) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    const limit = await checkWorkerLimit(churchId);
    if (!limit.allowed) {
      return { success: false, error: `Batas kapasitas pelayan/pekerja gereja telah tercapai (${limit.max} orang). Silakan hubungi Super Admin.` };
    }

    // 1. Create the Worker
    const newHambaTuhan = await prisma.worker.create({
      data: {
        churchId,
        type: "HAMBATUHAN",
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

    return { success: true, data: newHambaTuhan };
  } catch (error: any) {
    console.error("Error adding hamba tuhan:", error);
    return { success: false, error: error.message };
  }
}

export async function updateHambaTuhan(id: string, data: any) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const updatedHambaTuhan = await prisma.worker.update({
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
            churchId: updatedHambaTuhan.churchId,
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

    return { success: true, data: updatedHambaTuhan };
  } catch (error: any) {
    console.error("Error updating hamba tuhan:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteHambaTuhan(id: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.worker.delete({
      where: { id },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting hamba tuhan:", error);
    return { success: false, error: error.message };
  }
}
