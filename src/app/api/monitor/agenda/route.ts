import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const session = await decrypt(token);
    if (!session) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const agenda = [
      {
        id: 1,
        category: "Ibadah Raya",
        tags: ["Gedung Utama", "Live Streaming"],
        title: "Ibadah Minggu 1",
        status: "100%",
        date: "Jun 10, 2026 08:00 AM"
      },
      {
        id: 2,
        category: "Kegiatan Khusus",
        tags: ["Aula Serbaguna"],
        title: "Doa Semalaman",
        status: "Terkonfirmasi",
        date: "Jun 15, 2026 10:00 PM"
      },
      {
        id: 3,
        category: "Komunitas & Sel",
        tags: ["Zoom Meeting"],
        title: "Komsel Gabungan",
        status: "Persiapan",
        date: "Jun 18, 2026 07:00 PM"
      }
    ];

    return NextResponse.json({ success: true, data: agenda });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
