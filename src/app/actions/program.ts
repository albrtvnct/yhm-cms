"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

async function getChurchId() {
  const session = await getSession();
  return session?.churchId || null;
}

export async function getPrograms() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const churchId = session.churchId;
    if (!churchId) return { success: false, error: "Unauthorized" };

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!currentUser) return { success: false, error: "User not found" };

    const whereClause: any = { churchId };

    if (currentUser.role === "SEKSI" && currentUser.seksi) {
      whereClause.divisi = currentUser.seksi;
    }

    const programs = await prisma.program.findMany({
      where: whereClause,
      include: { approvals: true },
      orderBy: { tanggal: 'asc' },
    });

    return { success: true, data: programs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addProgram(data: any) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const churchId = session.churchId;
    if (!churchId) return { success: false, error: "Unauthorized" };

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!currentUser) return { success: false, error: "User not found" };

    let divisi = data.divisi;
    if (currentUser.role === "SEKSI" && currentUser.seksi) {
      divisi = currentUser.seksi;
    }

    const newProgram = await prisma.program.create({
      data: {
        nama: data.nama,
        divisi: divisi,
        dana: parseFloat(data.dana.toString().replace(/[^0-9.-]+/g,"")) || 0,
        penanggungJawab: data.penanggungJawab,
        proposalFile: data.proposalFile || null,
        tanggal: new Date(data.tanggal),
        status: "MENUNGGU",
        churchId,
      },
    });

    return { success: true, data: newProgram };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addApproval(programId: string, status: string, reason?: string, documents: string[] = []) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, error: "Unauthorized" };

    const churchId = session.churchId;
    if (!churchId) return { success: false, error: "Unauthorized" };

    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!currentUser) return { success: false, error: "User not found" };

    const role = currentUser.role;
    const name = currentUser.name;

    if (status === "REJECTED" && (!reason || reason.trim() === "")) {
      return { success: false, error: "Alasan penolakan wajib diisi" };
    }

    // Check if this person already voted
    const existingApproval = await prisma.programApproval.findFirst({
      where: { programId, name }
    });

    if (existingApproval) {
      await prisma.programApproval.update({
        where: { id: existingApproval.id },
        data: { role, status, reason, documents }
      });
    } else {
      await prisma.programApproval.create({
        data: {
          programId,
          role,
          name,
          status,
          reason,
          documents
        }
      });
    }

    // Auto status update logic: 3 approvals = DISETUJUI, 1 reject = DITOLAK
    const allApprovals = await prisma.programApproval.findMany({
      where: { programId }
    });
    
    const approvedCount = allApprovals.filter(a => a.status === 'APPROVED').length;
    const rejectedCount = allApprovals.filter(a => a.status === 'REJECTED').length;

    let newProgramStatus = "MENUNGGU";
    if (rejectedCount > 0) {
      newProgramStatus = "DITOLAK";
    } else if (approvedCount >= 3) {
      newProgramStatus = "DISETUJUI";
    }

    await prisma.program.update({
      where: { id: programId },
      data: { status: newProgramStatus }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProgramStatus(id: string, status: string) {
  try {
    const churchId = await getChurchId();
    if (!churchId) return { success: false, error: "Unauthorized" };

    await prisma.program.update({
      where: { id },
      data: { status }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProgram(id: string) {
  try {
    const churchId = await getChurchId();
    if (!churchId) return { success: false, error: "Unauthorized" };

    await prisma.program.delete({
      where: { id }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
