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
        families: await prisma.family.findMany({ where: { churchId }, include: { members: true }, orderBy: { name: 'asc' } }),
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

export async function getAllMembersBasic() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    const members = await prisma.member.findMany({
      where: { churchId },
      select: {
        id: true,
        nij: true,
        name: true,
        phone: true,
        email: true,
        birthPlace: true,
        birthDate: true,
        maritalStatus: true,
        address: true,
        status: true
      },
      orderBy: { name: "asc" }
    });

    return { success: true, data: members };
  } catch (error: any) {
    console.error("Error fetching members basic:", error);
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
    const lastMember = await prisma.member.findFirst({
      where: { churchId },
      orderBy: { createdAt: 'desc' },
      select: { nij: true }
    });
    let nextSeq = 1;
    if (lastMember?.nij) {
      const match = lastMember.nij.match(/\d+$/);
      if (match) {
        nextSeq = parseInt(match[0], 10) + 1;
      } else {
        const count = await prisma.member.count({ where: { churchId } });
        nextSeq = count + 1;
      }
    } else {
      const count = await prisma.member.count({ where: { churchId } });
      nextSeq = count + 1;
    }
    const sequence = String(nextSeq).padStart(5, '0');

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

    // Handle newFamilyMembers
    let finalFamilyId = data.familyId && data.familyId !== '-' ? data.familyId : null;
    let newFamilyMembers: any[] = [];
    if (data.newFamilyMembers) {
      try {
        newFamilyMembers = JSON.parse(data.newFamilyMembers);
      } catch (e) {}
    }

    if (newFamilyMembers.length > 0 && !finalFamilyId) {
      const family = await prisma.family.create({
        data: { name: `Keluarga ${data.name.split(' ')[0]}`, churchId }
      });
      finalFamilyId = family.id;
    }

    const newMember = await prisma.member.create({
      data: {
        churchId,
        nij,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        job: data.job || null,
        gender: data.gender || null,
        birthPlace: data.birthPlace || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        maritalStatus: data.maritalStatus || null,
        address: data.address || null,
        city: data.city || null,
        cellGroup: data.cellGroup || null,
        ministries: data.ministries || null,
        isBaptized: data.isBaptized === 'true',
        baptismDate: data.baptismDate ? new Date(data.baptismDate) : null,
        familyId: finalFamilyId,
        familyRelation: data.familyRelation || null,
        status: "AKTIF",
        joinDate: new Date(),
        attendanceRatio: 1.0, // Default for new member
        absentWeeks: 0
      }
    });

    // Create or update the new family members
    for (const relative of newFamilyMembers) {
      if (!relative.name) continue;
      
      if (relative.existingId) {
        await prisma.member.update({
          where: { id: relative.existingId },
          data: {
            familyId: finalFamilyId,
            familyRelation: relative.relation || null,
            ...(relative.phone ? { phone: relative.phone } : {})
          }
        });
      } else {
        const lastRel = await prisma.member.findFirst({
          where: { churchId },
          orderBy: { createdAt: 'desc' },
          select: { nij: true }
        });
        let nextRelSeq = 1;
        if (lastRel?.nij) {
          const match = lastRel.nij.match(/\d+$/);
          if (match) {
            nextRelSeq = parseInt(match[0], 10) + 1;
          } else {
            const countRel = await prisma.member.count({ where: { churchId } });
            nextRelSeq = countRel + 1;
          }
        } else {
          const countRel = await prisma.member.count({ where: { churchId } });
          nextRelSeq = countRel + 1;
        }
        const sequenceRel = String(nextRelSeq).padStart(5, '0');
        
        let relativeNij = rawFormat;
        relativeNij = relativeNij.replace(/\[NAMA GEREJA\]|\[GEREJA\]|\[CHURCH\]/gi, churchCode);
        relativeNij = relativeNij.replace(/\[TAHUN\]|\[YEAR\]/gi, String(year));
        relativeNij = relativeNij.replace(/\[NOMOR INDUK\]|\[NOMOR\]|\[NUM\]|\[SEQUENCE\]/gi, sequenceRel);

        await prisma.member.create({
          data: {
            churchId,
            nij: relativeNij,
            name: relative.name,
            phone: relative.phone || null,
            familyId: finalFamilyId,
            familyRelation: relative.relation || null,
            status: "AKTIF",
            joinDate: new Date(),
            attendanceRatio: 1.0,
            absentWeeks: 0
          }
        });
      }
    }

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
    const churchId = session.churchId;

    let finalFamilyId = data.familyId && data.familyId !== '-' ? data.familyId : null;
    let newFamilyMembers: any[] = [];
    if (data.newFamilyMembers) {
      try {
        newFamilyMembers = JSON.parse(data.newFamilyMembers);
      } catch (e) {}
    }

    if (newFamilyMembers.length > 0 && !finalFamilyId) {
      const family = await prisma.family.create({
        data: { name: `Keluarga ${data.name.split(' ')[0]}`, churchId }
      });
      finalFamilyId = family.id;
    }

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        job: data.job || null,
        gender: data.gender || null,
        birthPlace: data.birthPlace || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        maritalStatus: data.maritalStatus || null,
        address: data.address || null,
        city: data.city || null,
        cellGroup: data.cellGroup || null,
        ministries: data.ministries || null,
        isBaptized: data.isBaptized === 'true',
        baptismDate: data.baptismDate ? new Date(data.baptismDate) : null,
        familyId: finalFamilyId,
        familyRelation: data.familyRelation || null,
        status: data.status || "AKTIF",
      }
    });

    // Create the new family members
    if (newFamilyMembers.length > 0) {
      const church = await prisma.church.findUnique({ where: { id: churchId }, select: { name: true, nijFormat: true } });
      const churchName = church?.name || "Gereja";
      const rawFormat = church?.nijFormat || "[GEREJA]-[TAHUN]-[NOMOR]";
      const year = new Date().getFullYear();
      let churchCode = "";
      const nameWords = churchName.trim().split(/\s+/);
      if (nameWords.length > 1) {
        churchCode = nameWords.map(w => w[0]).join("").toUpperCase();
      } else {
        churchCode = churchName.toUpperCase();
      }

      for (const relative of newFamilyMembers) {
        if (!relative.name) continue;
        
        if (relative.existingId) {
          await prisma.member.update({
            where: { id: relative.existingId },
            data: {
              familyId: finalFamilyId,
              familyRelation: relative.relation || null,
              ...(relative.phone ? { phone: relative.phone } : {})
            }
          });
        } else {
          const lastRel = await prisma.member.findFirst({
            where: { churchId },
            orderBy: { createdAt: 'desc' },
            select: { nij: true }
          });
          let nextRelSeq = 1;
          if (lastRel?.nij) {
            const match = lastRel.nij.match(/\d+$/);
            if (match) {
              nextRelSeq = parseInt(match[0], 10) + 1;
            } else {
              const countRel = await prisma.member.count({ where: { churchId } });
              nextRelSeq = countRel + 1;
            }
          } else {
            const countRel = await prisma.member.count({ where: { churchId } });
            nextRelSeq = countRel + 1;
          }
          const sequenceRel = String(nextRelSeq).padStart(5, '0');
          
          let relativeNij = rawFormat;
          relativeNij = relativeNij.replace(/\[NAMA GEREJA\]|\[GEREJA\]|\[CHURCH\]/gi, churchCode);
          relativeNij = relativeNij.replace(/\[TAHUN\]|\[YEAR\]/gi, String(year));
          relativeNij = relativeNij.replace(/\[NOMOR INDUK\]|\[NOMOR\]|\[NUM\]|\[SEQUENCE\]/gi, sequenceRel);

          await prisma.member.create({
            data: {
              churchId,
              nij: relativeNij,
              name: relative.name,
              phone: relative.phone || null,
              familyId: finalFamilyId,
              familyRelation: relative.relation || null,
              status: "AKTIF",
              joinDate: new Date(),
              attendanceRatio: 1.0,
              absentWeeks: 0
            }
          });
        }
      }
    }

    // Sync to Worker if exists
    if (updatedMember.nij) {
      const existingWorker = await prisma.worker.findUnique({
        where: { nij: updatedMember.nij }
      });
      if (existingWorker) {
        await prisma.worker.update({
          where: { nij: updatedMember.nij },
          data: {
            name: updatedMember.name,
            phone: updatedMember.phone || existingWorker.phone,
            tanggalLahir: updatedMember.birthDate || existingWorker.tanggalLahir,
            statusPerkawinan: updatedMember.maritalStatus || existingWorker.statusPerkawinan,
            alamat: updatedMember.address || existingWorker.alamat,
            statusJemaat: updatedMember.status || existingWorker.statusJemaat,
          }
        });
      }
    }

    return { success: true, data: updatedMember };
  } catch (error: any) {
    console.error("Error updating member:", error);
    return { success: false, error: error.message };
  }
}
