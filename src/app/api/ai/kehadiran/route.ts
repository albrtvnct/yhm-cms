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

    // Get attendance mode
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { attendanceMode: true }
    });

    const mode = church?.attendanceMode ?? 'BULK';

    // Get recent records (last 15 sessions)
    const records = await prisma.attendanceRecord.findMany({
      where: { churchId },
      orderBy: { serviceDate: 'desc' },
      take: 15
    });

    // Stats
    const totalSessions = records.length;
    const totalHadir = records.reduce((a, r) => a + r.male + r.female, 0);
    const avgHadir = totalSessions > 0 ? Math.round(totalHadir / totalSessions) : 0;
    const peakRecord = records.reduce<(typeof records)[0] | null>((best, r) => {
      if (!best) return r;
      return r.male + r.female > best.male + best.female ? r : best;
    }, null);

    const trendsString = records.map(r => 
      `${r.serviceDate.toISOString().split('T')[0]} (${r.serviceType}): L: ${r.male}, P: ${r.female}, Total: ${r.male + r.female}${r.notes ? `, Catatan: ${r.notes}` : ''}`
    ).join('\n');

    // Get member stats for context
    const totalMembers = await prisma.member.count({ where: { churchId } });
    const absenteesCount = await prisma.member.count({ where: { churchId, absentWeeks: { gte: 3 } } });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
      Anda adalah AI Church Attendance Analyst spesialis analisis tingkat kehadiran jemaat gereja.
      Berikut adalah data analitik Kehadiran Jemaat saat ini:
      - Metode pencatatan aktif: ${mode}
      - Total Sesi Tercatat: ${totalSessions} sesi
      - Rata-rata Kehadiran: ${avgHadir} orang per sesi
      - Rekor Tertinggi: ${peakRecord ? `${peakRecord.male + peakRecord.female} orang pada ${peakRecord.serviceDate.toISOString().split('T')[0]} (${peakRecord.serviceType})` : 'Belum ada'}
      - Jumlah Jemaat Terdaftar di Database: ${totalMembers} orang
      - Jemaat yang tidak hadir >= 3 minggu berturut-turut: ${absenteesCount} orang
      
      Data 15 sesi terakhir:
      ${trendsString || 'Tidak ada data sesi ibadah.'}
      
      Tugas:
      Berikan satu paragraf pendek (3-4 kalimat) berisi wawasan tajam mengenai tren kehadiran jemaat (apakah naik, turun, atau stabil), perbandingan gender (laki-laki vs perempuan), keaktifan per jenis ibadah, atau dampak dari catatan khusus (misal: cuaca hujan, libur, event khusus).
      Berikan wawasan yang realistis dan rekomendasi singkat yang relevan bagi pelayanan gereja.
      Gunakan bahasa Indonesia yang profesional dan modern, tanpa salam pembuka/penutup.
      Gunakan format teks biasa atau tag <strong> untuk menyoroti poin/angka penting.
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Save to database
    await prisma.church.update({
      where: { id: churchId },
      data: { aiKehadiran: responseText }
    });

    return NextResponse.json({ insight: responseText });
  } catch (error: unknown) {
    console.error('Gemini API Error Kehadiran:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: `Kesalahan Gemini: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Kesalahan tak dikenal pada Gemini API.' }, { status: 500 });
  }
}
