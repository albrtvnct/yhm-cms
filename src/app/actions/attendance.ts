"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface IbadahMetadata {
  judulIbadah?: string;
  temaKhotbah?: string;
  namaPengkhotbah?: string;
  absensi?: string[]; // array of member IDs
  jumlahKehadiran?: number;
  foto?: string; // base64 string
  keterangan?: string; // notes/remarks
  sessionEnded?: boolean;
  persembahan?: number;
  pukul?: string;
  sesi?: string;
}

/** Set attendance mode (BULK or QR) for the church */
export async function setAttendanceMode(mode: "BULK" | "QR") {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.church.update({
    where: { id: session.churchId },
    data: { attendanceMode: mode },
  });

  revalidatePath("/dashboard/kehadiran");
  return { success: true };
}

/** Get attendance mode + recent records for the kehadiran page */
export async function getKehadiranSetup() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const church = await prisma.church.findUnique({
    where: { id: session.churchId },
    select: { attendanceMode: true, name: true },
  });

  return {
    success: true,
    attendanceMode: church?.attendanceMode ?? null,
    churchName: church?.name ?? "",
  };
}

/** Fetch active church members for check-in checklist */
export async function getActiveChurchMembers() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const members = await prisma.member.findMany({
      where: {
        churchId: session.churchId,
        status: "AKTIF",
      },
      select: {
        id: true,
        name: true,
        nij: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: members };
  } catch (error: any) {
    console.error("getActiveChurchMembers error:", error);
    return { success: false, error: error.message, data: [] };
  }
}

/** Add a bulk attendance entry (Laki-laki + Perempuan per service) with optional metadata */
export async function addBulkAttendance(data: {
  serviceDate: string;
  serviceType: string;
  male: number;
  female: number;
  notes?: string;
  metadata?: IbadahMetadata;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const finalNotes = data.metadata ? JSON.stringify(data.metadata) : (data.notes || null);

  const record = await prisma.attendanceRecord.create({
    data: {
      churchId: session.churchId,
      serviceDate: new Date(data.serviceDate),
      serviceType: data.serviceType || "Ibadah Umum",
      male: Math.max(0, Number(data.male) || 0),
      female: Math.max(0, Number(data.female) || 0),
      notes: finalNotes,
    },
  });

  // Sync member stats if checked-in absensi is present
  if (data.metadata?.absensi && data.metadata.absensi.length > 0) {
    try {
      await prisma.member.updateMany({
        where: {
          id: { in: data.metadata.absensi },
          churchId: session.churchId,
        },
        data: {
          lastAttendance: new Date(data.serviceDate),
          absentWeeks: 0,
        },
      });
    } catch (err) {
      console.error("Error updating checked-in members:", err);
    }
  }

  revalidatePath("/dashboard/kehadiran");
  return { success: true, data: record };
}

/** Delete a bulk attendance record */
export async function deleteBulkAttendance(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.attendanceRecord.delete({ where: { id } });
  revalidatePath("/dashboard/kehadiran");
  return { success: true };
}

/** Get all bulk attendance records for this church */
export async function getBulkAttendance() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const records = await prisma.attendanceRecord.findMany({
    where: { churchId: session.churchId },
    orderBy: { serviceDate: "desc" },
    take: 52, // last ~1 year of weekly services
  });

  const church = await prisma.church.findUnique({
    where: { id: session.churchId },
    select: { aiKehadiran: true }
  });

  // Stats
  const total = records.length;
  const totalHadir = records.reduce((a, r) => a + r.male + r.female, 0);
  const avgHadir = total > 0 ? Math.round(totalHadir / total) : 0;
  const latestRecord = records[0] ?? null;
  const peakRecord = records.reduce<(typeof records)[0] | null>((best, r) => {
    if (!best) return r;
    return r.male + r.female > best.male + best.female ? r : best;
  }, null);

  const parsedRecords = records.map((r) => {
    let metadata: IbadahMetadata = {};
    if (r.notes && r.notes.startsWith("{") && r.notes.endsWith("}")) {
      try {
        metadata = JSON.parse(r.notes);
      } catch (e) {
        metadata = { keterangan: r.notes };
      }
    } else {
      metadata = { keterangan: r.notes || "" };
    }

    return {
      id: r.id,
      serviceDate: r.serviceDate.toISOString(),
      serviceType: r.serviceType,
      male: r.male,
      female: r.female,
      total: r.male + r.female,
      notes: r.notes,
      metadata,
      createdAt: r.createdAt.toISOString(),
    };
  });

  return {
    success: true,
    data: {
      records: parsedRecords,
      stats: {
        totalSessions: total,
        avgHadir,
        latestTotal: latestRecord ? latestRecord.male + latestRecord.female : 0,
        latestMale: latestRecord?.male ?? 0,
        latestFemale: latestRecord?.female ?? 0,
        peakTotal: peakRecord ? peakRecord.male + peakRecord.female : 0,
        peakDate: peakRecord?.serviceDate.toISOString() ?? null,
      },
      aiInsight: church?.aiKehadiran ?? null,
    },
  };
}

/** Generate a QR token for a service session */
export async function generateQrSession(data: {
  serviceDate: string;
  serviceType: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // For the QR approach, we create a placeholder record and return a token
  // The token encodes churchId + recordId for the QR URL
  const record = await prisma.attendanceRecord.create({
    data: {
      churchId: session.churchId,
      serviceDate: new Date(data.serviceDate),
      serviceType: data.serviceType || "Ibadah Umum",
      male: 0,
      female: 0,
    },
  });

  const token = Buffer.from(
    JSON.stringify({ churchId: session.churchId, recordId: record.id })
  ).toString("base64url");

  return { success: true, token, recordId: record.id };
}

/** Get live stats for a specific QR session record */
export async function getQrSessionStats(recordId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId }
    });

    if (!record || record.churchId !== session.churchId) {
      throw new Error("Record not found");
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
    console.error("getQrSessionStats error:", error);
    return { success: false, error: error.message };
  }
}

/** Update an attendance record with optional metadata */
export async function updateAttendanceRecord(
  id: string,
  data: {
    serviceDate: string;
    serviceType: string;
    male: number;
    female: number;
    notes?: string;
    metadata?: IbadahMetadata;
  }
) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const record = await prisma.attendanceRecord.findUnique({
      where: { id }
    });

    if (!record || record.churchId !== session.churchId) {
      throw new Error("Record not found");
    }

    const finalNotes = data.metadata ? JSON.stringify(data.metadata) : (data.notes || null);

    const updated = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        serviceDate: new Date(data.serviceDate),
        serviceType: data.serviceType || "Ibadah Umum",
        male: Math.max(0, Number(data.male) || 0),
        female: Math.max(0, Number(data.female) || 0),
        notes: finalNotes,
      },
    });

    // Sync member stats if checked-in absensi is present
    if (data.metadata?.absensi && data.metadata.absensi.length > 0) {
      try {
        await prisma.member.updateMany({
          where: {
            id: { in: data.metadata.absensi },
            churchId: session.churchId,
          },
          data: {
            lastAttendance: new Date(data.serviceDate),
            absentWeeks: 0,
          },
        });
      } catch (err) {
        console.error("Error updating checked-in members:", err);
      }
    }

    revalidatePath("/dashboard/kehadiran");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("updateAttendanceRecord error:", error);
    return { success: false, error: error.message };
  }
}

/** Get the active session created in the last 12 hours to persist across page reloads */
export async function getActiveSession() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Find records created in the last 12 hours for this church
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const records = await prisma.attendanceRecord.findMany({
      where: {
        churchId: session.churchId,
        createdAt: { gte: twelveHoursAgo }
      },
      orderBy: { createdAt: "desc" }
    });

    // Find the first record that is not marked as ended
    const activeRecord = records.find(r => {
      if (r.notes) {
        try {
          const metadata = JSON.parse(r.notes);
          if (metadata && metadata.sessionEnded) {
            return false;
          }
        } catch {}
      }
      return true;
    });

    if (!activeRecord) {
      return { success: true, data: null };
    }

    const token = Buffer.from(
      JSON.stringify({ churchId: session.churchId, recordId: activeRecord.id })
    ).toString("base64url");

    return {
      success: true,
      data: {
        token,
        recordId: activeRecord.id,
        date: activeRecord.serviceDate.toISOString().split("T")[0],
        type: activeRecord.serviceType,
      }
    };
  } catch (error: any) {
    console.error("getActiveSession error:", error);
    return { success: false, error: error.message };
  }
}

/** Mark an active session as ended (offline) immediately */
export async function endQrSession(recordId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId }
    });

    if (!record || record.churchId !== session.churchId) {
      throw new Error("Record not found");
    }

    let metadata: IbadahMetadata = {};
    if (record.notes) {
      try {
        metadata = JSON.parse(record.notes);
      } catch {
        metadata = { keterangan: record.notes };
      }
    }

    metadata.sessionEnded = true;

    await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        notes: JSON.stringify(metadata)
      }
    });

    revalidatePath("/dashboard/kehadiran");
    return { success: true };
  } catch (error: any) {
    console.error("endQrSession error:", error);
    return { success: false, error: error.message };
  }
}
