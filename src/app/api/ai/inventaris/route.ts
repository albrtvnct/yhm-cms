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

    const items = await prisma.inventoryItem.findMany({
      where: { churchId }
    });

    const totalCount = items.length;
    const totalPrice = items.reduce((acc, curr) => acc + curr.price, 0);

    const conditionMap: Record<string, number> = {};
    const divisionMap: Record<string, number> = {};
    
    items.forEach(item => {
      conditionMap[item.condition] = (conditionMap[item.condition] || 0) + 1;
      divisionMap[item.division] = (divisionMap[item.division] || 0) + 1;
    });

    const conditionString = Object.keys(conditionMap).map(k => `${k}: ${conditionMap[k]}`).join(', ');
    const divisionString = Object.keys(divisionMap).map(k => `${k}: ${divisionMap[k]}`).join(', ');

    const prompt = `
      Anda adalah AI Asset Manager canggih yang tergabung dalam sistem YeshProduction (Sistem Manajemen Gereja).
      Berikan satu paragraf wawasan cerdas yang singkat dan langsung pada intinya (maksimal 3-4 kalimat) berdasarkan data inventaris gereja saat ini:
      - Total Barang: ${totalCount} item
      - Total Nilai Aset: Rp ${totalPrice.toLocaleString('id-ID')}
      - Kondisi Aset: ${conditionString || 'Tidak ada data'}
      - Distribusi per Divisi: ${divisionString || 'Tidak ada data'}
      
      Fokus pada kesehatan aset (apakah banyak yang rusak berat/ringan) dan beri saran pengelolaan. Jika ada barang rusak, ingatkan pentingnya maintenance atau budgeting untuk pergantian. Gunakan format HTML yang rapi (bold, bullet points) dengan class Tailwind (misal: text-indigo-300 untuk highlight) agar mudah dibaca. Jangan pakai blok markdown, cukup berikan tag HTML murni.
    `;

    let responseText = await generateAIContent(prompt, { provider: 'gemini' });
    responseText = responseText.replace(/\`\`\`html\n?/g, '').replace(/\`\`\`/g, '').trim();
    
    const church = await prisma.church.findUnique({ where: { id: churchId } });
    let currentData: any = {};
    if (church?.aiInventaris) {
      try {
        currentData = JSON.parse(church.aiInventaris);
      } catch (e) {
        currentData = { insight: church.aiInventaris };
      }
    }
    
    currentData.insight = responseText;

    await prisma.church.update({
      where: { id: churchId },
      data: { aiInventaris: JSON.stringify(currentData) }
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
