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
      Anda adalah AI Financial Analyst canggih yang tergabung dalam sistem YeshProduction (Sistem Manajemen Gereja).
      Berikan satu paragraf wawasan cerdas yang singkat dan langsung pada intinya (maksimal 3-4 kalimat) berdasarkan data nyata bulan ini:
      - Total Pemasukan: Rp ${pemasukan.toLocaleString('id-ID')}
      - Total Pengeluaran: Rp ${pengeluaran.toLocaleString('id-ID')}
      - Saldo Bersih: ${saldo >= 0 ? 'Surplus' : 'Defisit'} Rp ${Math.abs(saldo).toLocaleString('id-ID')}
      - Status Divisi: ${divString || 'Tidak ada data divisi.'}
      
      Fokus pada perbandingan antara Pemasukan dan Pengeluaran. Apakah gereja mengalami surplus atau defisit bulan ini? Jika terdapat divisi yang "Overbudget", berikan peringatan dan tindakan mitigasi. Jika saldo bersih ("Saldo Kas") menipis atau pengeluaran hampir menyalip pemasukan, BERIKAN SARAN TINDAKAN SELANJUTNYA yang harus dilakukan pengurus. Gunakan format HTML yang rapi (bold, bullet points) dengan class Tailwind (misal: text-purple-300 untuk highlight) agar mudah dibaca. Jangan pakai blok markdown, cukup berikan tag HTML murni.
    `;

    let responseText = await generateAIContent(prompt, { provider: 'gemini' });
    responseText = responseText.replace(/\`\`\`html\n?/g, '').replace(/\`\`\`/g, '').trim();
    
    const church = await prisma.church.findUnique({ where: { id: churchId } });
    let currentData: any = {};
    if (church?.aiKeuangan) {
      try {
        currentData = JSON.parse(church.aiKeuangan);
      } catch (e) {
        currentData = { insight: church.aiKeuangan };
      }
    }
    
    currentData.insight = responseText;

    // Save JSON string to database
    await prisma.church.update({
      where: { id: churchId },
      data: { aiKeuangan: JSON.stringify(currentData) }
    });

    return NextResponse.json(currentData);
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
