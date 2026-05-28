"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

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

/** Add a bulk attendance entry (Laki-laki + Perempuan per service) */
export async function addBulkAttendance(data: {
  serviceDate: string;
  serviceType: string;
  male: number;
  female: number;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const record = await prisma.attendanceRecord.create({
    data: {
      churchId: session.churchId,
      serviceDate: new Date(data.serviceDate),
      serviceType: data.serviceType || "Ibadah Umum",
      male: Math.max(0, Number(data.male) || 0),
      female: Math.max(0, Number(data.female) || 0),
      notes: data.notes || null,
    },
  });

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

  return {
    success: true,
    data: {
      records: records.map((r) => ({
        id: r.id,
        serviceDate: r.serviceDate.toISOString(),
        serviceType: r.serviceType,
        male: r.male,
        female: r.female,
        total: r.male + r.female,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
      })),
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

/** Update an attendance record (date, type, male, female, notes) */
export async function updateAttendanceRecord(
  id: string,
  data: {
    serviceDate: string;
    serviceType: string;
    male: number;
    female: number;
    notes?: string;
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

    const updated = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        serviceDate: new Date(data.serviceDate),
        serviceType: data.serviceType || "Ibadah Umum",
        male: Math.max(0, Number(data.male) || 0),
        female: Math.max(0, Number(data.female) || 0),
        notes: data.notes || null,
      },
    });

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

    // Find the most recent record created in the last 12 hours for this church
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const record = await prisma.attendanceRecord.findFirst({
      where: {
        churchId: session.churchId,
        createdAt: { gte: twelveHoursAgo }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!record) {
      return { success: true, data: null };
    }

    const token = Buffer.from(
      JSON.stringify({ churchId: session.churchId, recordId: record.id })
    ).toString("base64url");

    return {
      success: true,
      data: {
        token,
        recordId: record.id,
        date: record.serviceDate.toISOString().split("T")[0],
        type: record.serviceType,
      }
    };
  } catch (error: any) {
    console.error("getActiveSession error:", error);
    return { success: false, error: error.message };
  }
}
