"use server";

import prisma from "@/lib/prisma";

export async function verifyHadirToken(token: string) {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const { churchId, recordId } = JSON.parse(raw);

    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { name: true }
    });

    if (!church) {
      return { success: false, error: "Gereja tidak ditemukan" };
    }

    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId }
    });

    if (!record) {
      return { success: false, error: "Sesi ibadah tidak ditemukan" };
    }

    // Check if session has been marked ended
    if (record.notes) {
      try {
        const metadata = JSON.parse(record.notes);
        if (metadata && metadata.sessionEnded) {
          return { success: false, error: "Sesi ibadah ini telah selesai / offline." };
        }
      } catch {}
    }

    return {
      success: true,
      data: {
        churchId,
        recordId,
        churchName: church.name,
        serviceType: record.serviceType,
        serviceDate: record.serviceDate.toISOString(),
        male: record.male,
        female: record.female
      }
    };
  } catch (error: any) {
    console.error("verifyHadirToken error:", error);
    return { success: false, error: "Token tidak valid" };
  }
}

export async function searchMembersForCheckin(churchId: string, query: string) {
  try {
    if (!query || query.trim().length < 2) return { success: true, data: [] };
    const members = await prisma.member.findMany({
      where: {
        churchId,
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        gender: true
      },
      take: 5
    });
    return { success: true, data: members };
  } catch (error: any) {
    console.error("searchMembersForCheckin error:", error);
    return { success: false, error: error.message };
  }
}

export async function checkinHadirMember(data: {
  churchId: string;
  recordId: string;
  memberId?: string;
  name?: string;
  gender?: "Laki-laki" | "Perempuan";
}) {
  try {
    const { churchId, recordId, memberId, name, gender } = data;

    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId }
    });
    if (!record || record.churchId !== churchId) {
      return { success: false, error: "Sesi ibadah tidak ditemukan" };
    }
    if (record.notes) {
      try {
        const metadata = JSON.parse(record.notes);
        if (metadata && metadata.sessionEnded) {
          return { success: false, error: "Sesi ibadah ini telah selesai / offline." };
        }
      } catch {}
    }

    let targetGender: "Laki-laki" | "Perempuan" = "Laki-laki";

    if (memberId) {
      // Existing member
      const member = await prisma.member.findUnique({
        where: { id: memberId }
      });
      if (!member || member.churchId !== churchId) {
        return { success: false, error: "Jemaat tidak ditemukan" };
      }

      targetGender = (member.gender === "Perempuan" ? "Perempuan" : "Laki-laki");

      // Update member attendance stats
      await prisma.member.update({
        where: { id: memberId },
        data: {
          lastAttendance: new Date(),
          absentWeeks: 0,
          attendanceRatio: Math.min(1.0, (member.attendanceRatio ?? 0.5) + 0.05)
        }
      });
    } else {
      // New member
      if (!name || !gender) {
        return { success: false, error: "Nama lengkap dan jenis kelamin harus diisi" };
      }

      // Check if a member with same name and gender already exists in this church
      const existingMember = await prisma.member.findFirst({
        where: {
          churchId,
          name: {
            equals: name.trim(),
            mode: "insensitive"
          },
          gender: gender
        }
      });

      if (existingMember) {
        return {
          success: false,
          error: `Jemaat dengan nama "${name.trim()}" dan jenis kelamin "${gender}" sudah terdaftar. Silakan pilih dari saran pencarian nama atau gunakan nama lengkap yang berbeda.`
        };
      }

      targetGender = gender;

      // Create new member
      await prisma.member.create({
        data: {
          churchId,
          name: name.trim(),
          gender,
          status: "AKTIF",
          joinDate: new Date(),
          lastAttendance: new Date(),
          absentWeeks: 0,
          attendanceRatio: 1.0
        }
      });
    }

    // Increment count in AttendanceRecord
    if (targetGender === "Perempuan") {
      await prisma.attendanceRecord.update({
        where: { id: recordId },
        data: { female: { increment: 1 } }
      });
    } else {
      await prisma.attendanceRecord.update({
        where: { id: recordId },
        data: { male: { increment: 1 } }
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("checkinHadirMember error:", error);
    return { success: false, error: error.message };
  }
}

/** Increment realtime clicker attendance by +1 for male or female */
export async function incrementRealtimeAttendance(recordId: string, gender: "Laki-laki" | "Perempuan") {
  try {
    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        male: gender === "Laki-laki" ? { increment: 1 } : undefined,
        female: gender === "Perempuan" ? { increment: 1 } : undefined,
      },
    });

    return {
      success: true,
      data: {
        male: updated.male,
        female: updated.female,
        total: updated.male + updated.female,
      }
    };
  } catch (error: any) {
    console.error("incrementRealtimeAttendance error:", error);
    return { success: false, error: error.message };
  }
}

/** Decrement realtime clicker attendance by -1 for male or female (in case of mistake) */
export async function decrementRealtimeAttendance(recordId: string, gender: "Laki-laki" | "Perempuan") {
  try {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId }
    });

    if (!record) {
      return { success: false, error: "Sesi ibadah tidak ditemukan" };
    }

    const currentCount = gender === "Laki-laki" ? record.male : record.female;
    if (currentCount <= 0) {
      return { success: false, error: "Jumlah sudah bernilai nol" };
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        male: gender === "Laki-laki" ? { decrement: 1 } : undefined,
        female: gender === "Perempuan" ? { decrement: 1 } : undefined,
      },
    });

    return {
      success: true,
      data: {
        male: updated.male,
        female: updated.female,
        total: updated.male + updated.female,
      }
    };
  } catch (error: any) {
    console.error("decrementRealtimeAttendance error:", error);
    return { success: false, error: error.message };
  }
}

/** Get realtime clicker stats without requiring admin session */
export async function getRealtimeAttendanceStats(recordId: string) {
  try {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      select: { male: true, female: true }
    });

    if (!record) {
      return { success: false, error: "Sesi tidak ditemukan" };
    }

    return {
      success: true,
      data: {
        male: record.male,
        female: record.female,
        total: record.male + record.female
      }
    };
  } catch (error: any) {
    console.error("getRealtimeAttendanceStats error:", error);
    return { success: false, error: error.message };
  }
}
