import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const session = await decrypt(token);
    if (!session) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { scannedData } = body;

    if (!scannedData) {
      return NextResponse.json({ error: "Data scan kosong" }, { status: 400 });
    }

    // TODO: Insert scannedData to DB absensi
    // For now we just return success
    
    return NextResponse.json({ success: true, message: "Absensi berhasil dicatat" });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
