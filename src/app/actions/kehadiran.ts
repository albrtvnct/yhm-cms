"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function getKehadiranData() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    const allMembers = await prisma.member.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
        nij: true,
        status: true,
        attendanceRatio: true,
        lastAttendance: true,
        absentWeeks: true,
        gender: true,
        birthDate: true,
        cellGroup: true,
        joinDate: true,
      },
      orderBy: { name: "asc" },
    });

    const total = allMembers.length;
    if (total === 0) {
      return {
        success: true,
        data: {
          summary: {
            rataRataHadir: 0,
            tingkatKehadiran: 0,
            absen3Minggu: 0,
            pengunjungBaru: 0,
          },
          absentees: [],
          members: [],
          ageTrend: [],
          heatmap: [],
          cellGroupStats: [],
        },
      };
    }

    // --- Summary Stats ---
    const hadirAnggota = allMembers.filter(m => (m.attendanceRatio ?? 0) >= 0.5);
    const tingkatKehadiran = Math.round((hadirAnggota.length / total) * 100);

    const absen3Minggu = allMembers.filter(m => (m.absentWeeks ?? 0) >= 3);

    const sebulanLalu = new Date();
    sebulanLalu.setDate(sebulanLalu.getDate() - 30);
    const pengunjungBaru = allMembers.filter(m => m.joinDate && m.joinDate >= sebulanLalu);

    // Avg attendance ratio
    const avgRatio = total > 0
      ? allMembers.reduce((acc, m) => acc + (m.attendanceRatio ?? 0), 0) / total
      : 0;
    const rataRataHadir = Math.round(avgRatio * total);

    // --- Absentees (3+ weeks) ---
    const absentees = allMembers
      .filter(m => (m.absentWeeks ?? 0) >= 3)
      .sort((a, b) => (b.absentWeeks ?? 0) - (a.absentWeeks ?? 0))
      .slice(0, 10)
      .map(m => ({
        id: m.id,
        name: m.name,
        nij: m.nij,
        absentWeeks: m.absentWeeks ?? 0,
        lastAttendance: m.lastAttendance?.toISOString() ?? null,
        cellGroup: m.cellGroup ?? null,
      }));

    // --- Heatmap (last 12 months simulated from attendanceRatio) ---
    const now = new Date();
    const heatmap = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      // Simulate monthly kehadiran based on overall ratio with slight variance
      const base = Math.round(avgRatio * 100);
      const variance = Math.round((Math.random() - 0.5) * 15);
      const pct = Math.max(0, Math.min(100, base + variance));
      heatmap.push({ label, pct });
    }

    // --- Age segment kehadiran (based on birthdate groupings) ---
    const now2 = new Date();
    const getAge = (bd: Date | null) => bd ? Math.floor((now2.getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

    const segments = [
      { label: "Dewasa (36+)", key: "dewasa", filter: (age: number | null) => age !== null && age >= 36 },
      { label: "Dewasa muda (25–35)", key: "muda", filter: (age: number | null) => age !== null && age >= 25 && age < 36 },
      { label: "Remaja (13–24)", key: "remaja", filter: (age: number | null) => age !== null && age >= 13 && age < 25 },
      { label: "Anak-anak (<12)", key: "anak", filter: (age: number | null) => age !== null && age < 13 },
      { label: "Lansia (60+)", key: "lansia", filter: (age: number | null) => age !== null && age >= 60 },
    ];

    const ageTrend = segments.map(seg => {
      const segMembers = allMembers.filter(m => seg.filter(getAge(m.birthDate)));
      const segCount = segMembers.length;
      const segAvg = segCount > 0
        ? Math.round(segMembers.reduce((acc, m) => acc + (m.attendanceRatio ?? 0.5), 0) / segCount * 100)
        : 0;
      return { label: seg.label, pct: segAvg, count: segCount };
    });

    // --- Cell group stats ---
    const cgMap: Record<string, { count: number; totalRatio: number }> = {};
    for (const m of allMembers) {
      const cg = m.cellGroup ?? "Tanpa Komsel";
      if (!cgMap[cg]) cgMap[cg] = { count: 0, totalRatio: 0 };
      cgMap[cg].count++;
      cgMap[cg].totalRatio += m.attendanceRatio ?? 0.5;
    }
    const cellGroupStats = Object.entries(cgMap)
      .map(([name, { count, totalRatio }]) => ({
        name,
        count,
        avgRatio: Math.round((totalRatio / count) * 100),
      }))
      .sort((a, b) => b.avgRatio - a.avgRatio)
      .slice(0, 8);

    // --- All members for table ---
    const members = allMembers.map(m => ({
      id: m.id,
      name: m.name,
      nij: m.nij,
      status: m.status,
      attendanceRatio: m.attendanceRatio ?? null,
      lastAttendance: m.lastAttendance?.toISOString() ?? null,
      absentWeeks: m.absentWeeks ?? 0,
      cellGroup: m.cellGroup ?? null,
    }));

    return {
      success: true,
      data: {
        summary: {
          rataRataHadir,
          tingkatKehadiran,
          absen3Minggu: absen3Minggu.length,
          pengunjungBaru: pengunjungBaru.length,
        },
        absentees,
        members,
        ageTrend,
        heatmap,
        cellGroupStats,
      },
    };
  } catch (error: any) {
    console.error("Error fetching kehadiran data:", error);
    return { success: false, error: error.message };
  }
}

export async function recordAttendance(memberId: string, weekLabel: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.member.update({
      where: { id: memberId },
      data: {
        lastAttendance: new Date(),
        absentWeeks: 0,
        attendanceRatio: { increment: 0.05 },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error recording attendance:", error);
    return { success: false, error: error.message };
  }
}

export async function markAbsent(memberId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.member.update({
      where: { id: memberId },
      data: {
        absentWeeks: { increment: 1 },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error marking absent:", error);
    return { success: false, error: error.message };
  }
}
