import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { generateAIContent } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const churchId = session.churchId;

    // Ambil data real dari Prisma
    const income = await prisma.financeTransaction.aggregate({
      where: { churchId, type: "INCOME" },
      _sum: { amount: true }
    });
    const expense = await prisma.financeTransaction.aggregate({
      where: { churchId, type: "EXPENSE" },
      _sum: { amount: true }
    });

    const pemasukan = income._sum.amount || 0;
    const pengeluaran = expense._sum.amount || 0;
    const saldo = pemasukan - pengeluaran;

    const divisions = await prisma.financeDivision.findMany({
      where: { churchId }
    });
    
    const divString = divisions.map(d => `${d.label}: Rp ${d.val} (${d.warn ? 'Warning/Overbudget' : 'Aman'})`).join(', ');

    const prompt = `
      Anda adalah AI Financial Analyst canggih yang tergabung dalam sistem ChurchOS (Sistem Manajemen Gereja).
      Berdasarkan data nyata bulan ini:
      - Total Pemasukan: Rp ${pemasukan.toLocaleString('id-ID')}
      - Total Pengeluaran: Rp ${pengeluaran.toLocaleString('id-ID')}
      - Saldo Bersih: ${saldo >= 0 ? 'Surplus' : 'Defisit'} Rp ${Math.abs(saldo).toLocaleString('id-ID')}
      - Status Divisi: ${divString || 'Tidak ada data divisi.'}
      
      Tugas Anda:
      1. Berikan satu paragraf wawasan cerdas yang singkat dan langsung pada intinya (maksimal 3-4 kalimat). Fokus pada perbandingan antara Pemasukan dan Pengeluaran. Apakah gereja mengalami surplus atau defisit bulan ini? Jika terdapat divisi yang "Overbudget", berikan peringatan dan tindakan mitigasi. Jika saldo bersih ("Saldo Kas") menipis atau pengeluaran hampir menyalip pemasukan, BERIKAN SARAN TINDAKAN SELANJUTNYA yang harus dilakukan pengurus. Gunakan format HTML yang rapi (bold, bullet points) dengan class Tailwind (misal: text-purple-300 untuk highlight) agar mudah dibaca.
      2. Berikan analisis tren singkat (maksimal 3-4 kata) untuk masing-masing metrik: Pemasukan, Pengeluaran, Saldo Bersih, dan Rata-rata per Jemaat (Katakan saja "Belum cukup data" jika data 0).

      WAJIB KEMBALIKAN OUTPUT MURNI DALAM FORMAT JSON SEPERTI BERIKUT TANPA MARKDOWN BLOK KODE (NO \`\`\`json):
      {
        "insight": "HTML wawasan cerdas Anda...",
        "trendPemasukan": "Tinggi bulan ini",
        "trendPengeluaran": "Normal",
        "trendSaldo": "Surplus aman",
        "trendRataRata": "Belum ada data"
      }
    `;

    const rawResponse = await generateAIContent(prompt, { provider: 'openrouter' });
    
    // Clean potential markdown blocks
    let cleanedResponse = rawResponse;
    if (cleanedResponse.includes('\`\`\`json')) {
      cleanedResponse = cleanedResponse.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`/g, '');
    } else if (cleanedResponse.includes('\`\`\`')) {
      cleanedResponse = cleanedResponse.replace(/\`\`\`\n?/g, '').replace(/\`\`\`/g, '');
    }
    
    cleanedResponse = cleanedResponse.trim();
    
    // Validate JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(cleanedResponse);
    } catch (e) {
      console.error("Failed to parse OpenRouter JSON:", cleanedResponse);
      // Fallback format if AI fails to return JSON
      parsedJson = {
        insight: cleanedResponse,
        trendPemasukan: "Dianalisis oleh AI",
        trendPengeluaran: "Dianalisis oleh AI",
        trendSaldo: "Dianalisis oleh AI",
        trendRataRata: "Dianalisis oleh AI"
      };
      cleanedResponse = JSON.stringify(parsedJson);
    }

    // Save JSON string to database
    await prisma.church.update({
      where: { id: churchId },
      data: { aiKeuangan: cleanedResponse }
    });

    return NextResponse.json(parsedJson);
  } catch (error: unknown) {
    console.error('AI Error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Kesalahan AI: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Kesalahan tak dikenal pada API AI.' },
      { status: 500 }
    );
  }
}
