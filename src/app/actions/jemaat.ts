"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getJemaatData() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    // Check if we need to seed mock data
    // Removed to keep database clean

    // 1. Get Church Settings for Age Thresholds
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { youthThreshold: true, elderlyThreshold: true, aiJemaat: true }
    });

    // 2. Get Stats
    const totalJemaat = await prisma.member.count({ where: { churchId } });
    const aktif = await prisma.member.count({ where: { churchId, status: "AKTIF" } });
    const tidakAktif = await prisma.member.count({ where: { churchId, status: "TIDAK_AKTIF" } });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const baruBulanIni = await prisma.member.count({
      where: { churchId, joinDate: { gte: thirtyDaysAgo } }
    });

    // 3. Get Absentees
    const absentees = await prisma.member.findMany({
      where: { churchId, absentWeeks: { gte: 3 } },
      orderBy: { absentWeeks: "desc" },
      take: 3
    });

    // 4. Get Members with Families
    const members = await prisma.member.findMany({
      where: { churchId },
      include: {
        family: {
          include: { members: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return {
      success: true,
      data: {
        stats: {
          total: totalJemaat,
          aktif,
          tidakAktif,
          baru: baruBulanIni,
          aktifPercent: Math.round((aktif / totalJemaat) * 100) || 0
        },
        absentees,
        members,
        settings: {
          youthThreshold: church?.youthThreshold ?? 25,
          elderlyThreshold: church?.elderlyThreshold ?? 50
        },
        aiInsight: church?.aiJemaat ?? null
      }
    };
  } catch (error: any) {
    console.error("Error fetching jemaat data:", error);
    return { success: false, error: error.message };
  }
}

export async function addMember(data: any) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    // Fetch church settings for NIJ format
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { name: true, nijFormat: true }
    });

    const churchName = church?.name || "Gereja";
    const rawFormat = church?.nijFormat || "[GEREJA]-[TAHUN]-[NOMOR]";

    const year = new Date().getFullYear();
    const count = await prisma.member.count({ where: { churchId } });
    const sequence = String(count + 1).padStart(5, '0');

    // Extract initials or use full name as church code
    let churchCode = "";
    const nameWords = churchName.trim().split(/\s+/);
    if (nameWords.length > 1) {
      churchCode = nameWords.map(w => w[0]).join("").toUpperCase();
    } else {
      churchCode = churchName.toUpperCase();
    }

    // Parse template format
    let nij = rawFormat;
    nij = nij.replace(/\[NAMA GEREJA\]/gi, churchCode)
             .replace(/\[GEREJA\]/gi, churchCode)
             .replace(/\[CHURCH\]/gi, churchCode);

    nij = nij.replace(/\[TAHUN\]/gi, String(year))
             .replace(/\[YEAR\]/gi, String(year));

    nij = nij.replace(/\[NOMOR INDUK\]/gi, sequence)
             .replace(/\[NOMOR\]/gi, sequence)
             .replace(/\[NUM\]/gi, sequence)
             .replace(/\[SEQUENCE\]/gi, sequence);

    const newMember = await prisma.member.create({
      data: {
        churchId,
        nij,
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        maritalStatus: data.maritalStatus || null,
        address: data.address || null,
        city: data.city || null,
        cellGroup: data.cellGroup || null,
        ministries: data.ministries || null,
        isBaptized: data.isBaptized === 'true',
        baptismDate: data.baptismDate ? new Date(data.baptismDate) : null,
        status: "AKTIF",
        joinDate: new Date(),
        attendanceRatio: 1.0, // Default for new member
        absentWeeks: 0
      }
    });

    return { success: true, data: newMember };
  } catch (error: any) {
    console.error("Error adding member:", error);
    return { success: false, error: error.message };
  }
}

async function seedMockData(churchId: string) {
  // Create Family
  const family1 = await prisma.family.create({
    data: { name: "Keluarga Rahayu", churchId }
  });

  // Create Sari Rahayu
  await prisma.member.create({
    data: {
      nij: "GBI-JKT-2019-00412",
      name: "Sari Rahayu, S.Pd.",
      gender: "Perempuan",
      phone: "+62 812-3456-7890",
      birthDate: new Date("1988-03-14"),
      maritalStatus: "Menikah — 2 anak",
      address: "Kelapa Gading",
      city: "Jakarta Utara",
      status: "AKTIF",
      joinDate: new Date("2019-06-12"),
      isBaptized: true,
      baptismDate: new Date("2019-06-12"),
      cellGroup: "Komsel Kelapa Gading 3",
      ministries: "Singer, Pemimpin Komsel",
      attendanceRatio: 0.92,
      lastAttendance: new Date("2026-05-25"),
      absentWeeks: 0,
      familyId: family1.id,
      familyRelation: "Istri",
      churchId
    }
  });

  // Create Budi Rahayu
  await prisma.member.create({
    data: {
      nij: "GBI-JKT-2018-00301",
      name: "Budi Rahayu",
      gender: "Laki-laki",
      status: "AKTIF",
      joinDate: new Date("2018-04-10"),
      familyId: family1.id,
      familyRelation: "Suami",
      churchId
    }
  });

  // Create Kevin Rahayu
  await prisma.member.create({
    data: {
      nij: "GBI-JKT-2015-00189",
      name: "Kevin Rahayu",
      gender: "Laki-laki",
      status: "REMAJA",
      joinDate: new Date("2015-01-01"),
      familyId: family1.id,
      familyRelation: "Anak",
      churchId
    }
  });

  // Create Absentees
  await prisma.member.create({
    data: {
      nij: "GBI-JKT-2017-00088",
      name: "Andreas Tanujaya",
      status: "AKTIF",
      lastAttendance: new Date("2026-04-20"),
      absentWeeks: 5,
      churchId
    }
  });

  await prisma.member.create({
    data: {
      nij: "GBI-JKT-2020-00541",
      name: "Linda Dewi",
      status: "TIDAK_AKTIF",
      lastAttendance: new Date("2026-04-27"),
      absentWeeks: 4,
      churchId
    }
  });

  await prisma.member.create({
    data: {
      nij: "GBI-JKT-2016-00033",
      name: "Petrus Santoso",
      status: "AKTIF",
      lastAttendance: new Date("2026-05-04"),
      absentWeeks: 3,
      churchId
    }
  });
}

export async function deleteMember(id: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.member.delete({
      where: { id }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting member:", error);
    return { success: false, error: error.message };
  }
}

export async function updateMember(id: string, data: any) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        maritalStatus: data.maritalStatus || null,
        address: data.address || null,
        city: data.city || null,
        cellGroup: data.cellGroup || null,
        ministries: data.ministries || null,
        isBaptized: data.isBaptized === 'true',
        baptismDate: data.baptismDate ? new Date(data.baptismDate) : null,
        status: data.status || "AKTIF",
      }
    });

    return { success: true, data: updatedMember };
  } catch (error: any) {
    console.error("Error updating member:", error);
    return { success: false, error: error.message };
  }
}
