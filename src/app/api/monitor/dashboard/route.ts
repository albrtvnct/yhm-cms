import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    // Check auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const session = await decrypt(token);
    if (!session || !session.churchId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Dummy data for now, ideally fetch from DB using session.churchId
    const data = {
      totalJemaat: 1240,
      jemaatBaru: 12,
      hambaTuhan: 15,
      pekerja: 42,
      kasTersedia: "Rp 45.2M",
      statusKas: "Sehat",
      arusKas: [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: -300 },
        { name: 'Mar', value: 500 },
        { name: 'Apr', value: 200 },
        { name: 'Mei', value: -100 },
        { name: 'Jun', value: 600 },
      ]
    };

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Monitor Dashboard API Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
