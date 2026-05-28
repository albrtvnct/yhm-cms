import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const churchId = session.churchId;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key belum dikonfigurasi. Masukkan GEMINI_API_KEY di file .env' },
        { status: 500 }
      );
    }

    // Ambil data dari Prisma
    const totalJemaat = await prisma.member.count({ where: { churchId } });
    const aktif = await prisma.member.count({ where: { churchId, status: "AKTIF" } });
    
    const absentees = await prisma.member.findMany({
      where: { churchId, absentWeeks: { gte: 3 } },
      orderBy: { absentWeeks: "desc" },
      take: 5
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const baruBulanIni = await prisma.member.count({
      where: { churchId, joinDate: { gte: thirtyDaysAgo } }
    });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
      Anda adalah AI Data Analyst spesialis manajemen komunitas gereja.
      Berikut adalah data analitik Jemaat saat ini:
      - Total Terdaftar: ${totalJemaat} orang
      - Aktif: ${aktif} orang (${totalJemaat > 0 ? Math.round((aktif/totalJemaat)*100) : 0}% retention rate)
      - Jemaat Baru bulan ini: ${baruBulanIni} orang
      - Daftar prioritas visitasi (absen > 3 minggu): ${absentees.length > 0 ? absentees.map(a => `${a.name} (${a.absentWeeks} minggu)`).join(', ') : 'Tidak ada'}
      
      Tugas: 
      Berikan satu paragraf pendek (3-4 kalimat) berisi insight tajam mengenai retensi atau pertumbuhan jemaat.
      Sebutkan nama-nama jemaat yang sangat butuh visitasi pastoral jika ada.
      Gunakan tata bahasa profesional modern tanpa salam pembuka. Gunakan format teks biasa atau strong tags HTML jika perlu.
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    // Bersihkan markdown markdown ** menjadi <strong> agar sesuai dengan UI yang mendukung HTML dasar
    responseText = responseText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Save to database
    await prisma.church.update({
      where: { id: churchId },
      data: { aiJemaat: responseText }
    });

    return NextResponse.json({ insight: responseText });
  } catch (error: unknown) {
    console.error('Gemini API Error Jemaat:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: `Kesalahan Gemini: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Kesalahan tak dikenal pada Gemini API.' }, { status: 500 });
  }
}
