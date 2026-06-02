"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getChurchSettings() {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: {
        id: true,
        name: true,
        slug: true,
        nijFormat: true,
        youthThreshold: true,
        elderlyThreshold: true,
        attendanceMode: true,
      },
    });

    if (!church) throw new Error("Gereja tidak ditemukan");

    return { success: true, data: church };
  } catch (error: any) {
    console.error("Error fetching church settings:", error);
    return { success: false, error: error.message };
  }
}

export async function updateChurchSettings(data: { 
  name: string; 
  slug?: string;
  nijFormat: string;
  youthThreshold: number;
  elderlyThreshold: number;
}) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const churchId = session.churchId;

    if (!data.name || data.name.trim() === "") {
      throw new Error("Nama gereja tidak boleh kosong.");
    }

    // Slug formatting and validation
    let validSlug = null;
    if (data.slug) {
      validSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      // Check if slug is taken by another church
      const existingSlug = await prisma.church.findFirst({
        where: { slug: validSlug, id: { not: churchId } }
      });
      if (existingSlug) {
        throw new Error("Link portal (slug) sudah digunakan oleh gereja lain. Silakan pilih yang lain.");
      }
    }

    const youth = Math.round(Number(data.youthThreshold));
    const elderly = Math.round(Number(data.elderlyThreshold));

    if (isNaN(youth) || youth < 5 || youth > 40) {
      throw new Error("Batas usia muda harus berupa angka antara 5 dan 40 tahun.");
    }
    if (isNaN(elderly) || elderly < 41 || elderly > 90) {
      throw new Error("Batas usia lansia harus berupa angka antara 41 dan 90 tahun.");
    }
    if (elderly <= youth) {
      throw new Error("Batas usia lansia harus lebih besar dari batas usia muda.");
    }

    // Validate nijFormat
    const format = data.nijFormat || "";
    const placeholders = [
      "[NOMOR INDUK]",
      "[NOMOR]",
      "[NUM]",
      "[SEQUENCE]"
    ];
    const hasNumberPlaceholder = placeholders.some(p => 
      format.toUpperCase().includes(p)
    );

    if (!hasNumberPlaceholder) {
      throw new Error(
        "Format NIJ harus menyertakan salah satu tag nomor urut: [NOMOR INDUK], [NOMOR], [NUM], atau [SEQUENCE] untuk menjamin keunikan NIJ jemaat."
      );
    }

    // Extract initials or use full name as church code
    let churchCode = "";
    const nameWords = data.name.trim().split(/\s+/);
    if (nameWords.length > 1) {
      churchCode = nameWords.map(w => w[0]).join("").toUpperCase();
    } else {
      churchCode = data.name.toUpperCase();
    }

    let updatedChurch;

    // Use transaction to update settings and regenerate all existing members' NIJ
    await prisma.$transaction(async (tx) => {
      // 1. Update Church settings
      updatedChurch = await tx.church.update({
        where: { id: churchId },
        data: {
          name: data.name,
          slug: validSlug,
          nijFormat: data.nijFormat,
          youthThreshold: youth,
          elderlyThreshold: elderly,
        },
      });

      // 2. Fetch all members
      const members = await tx.member.findMany({
        where: { churchId },
        orderBy: [
          { joinDate: "asc" },
          { createdAt: "asc" }
        ],
        select: { id: true, joinDate: true, createdAt: true }
      });

      // 3. Update to temp NIJs to avoid unique constraint violations
      await Promise.all(
        members.map(member => 
          tx.member.update({
            where: { id: member.id },
            data: { nij: `TEMP-${member.id}` }
          })
        )
      );

      // 4. Update to new custom NIJs
      await Promise.all(
        members.map((member, i) => {
          const sequence = String(i + 1).padStart(5, '0');
          const memberYear = new Date(member.joinDate || member.createdAt || new Date()).getFullYear();

          let newNij = data.nijFormat;
          newNij = newNij.replace(/\[NAMA GEREJA\]/gi, churchCode)
                         .replace(/\[GEREJA\]/gi, churchCode)
                         .replace(/\[CHURCH\]/gi, churchCode);

          newNij = newNij.replace(/\[TAHUN\]/gi, String(memberYear))
                         .replace(/\[YEAR\]/gi, String(memberYear));

          newNij = newNij.replace(/\[NOMOR INDUK\]/gi, sequence)
                         .replace(/\[NOMOR\]/gi, sequence)
                         .replace(/\[NUM\]/gi, sequence)
                         .replace(/\[SEQUENCE\]/gi, sequence);

          return tx.member.update({
            where: { id: member.id },
            data: { nij: newNij }
          });
        })
      );
    }, {
      maxWait: 15000,
      timeout: 60000 // 60 seconds timeout
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pengaturan");
    revalidatePath("/dashboard/jemaat");

    return { success: true, data: updatedChurch };
  } catch (error: any) {
    console.error("Error updating church settings:", error);
    return { success: false, error: error.message };
  }
}
