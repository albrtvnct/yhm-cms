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

    const feedback = [
      {
        id: 1,
        rating: 5,
        date: "Mei 24 09:56 AM",
        text: "Ibadah hari Minggu sangat diberkati, tapi mungkin AC di sayap kanan gedung bisa agak dikecilkan sedikit karena terlalu dingin. Terima kasih pelayanannya!"
      },
      {
        id: 2,
        rating: 5,
        date: "Mei 3 07:00 PM",
        text: "Selamat bertumbuh dan selamat melayani Tuhan."
      },
      {
        id: 3,
        rating: 4,
        date: "Apr 28 12:47 PM",
        text: "YESH CMS SANGAT MEMBANTU PELAYANAN 🔥",
        repliedAt: "Apr 28 04:29 PM"
      }
    ];

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
