import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function DashboardOverview() {
  const session = await getSession();
  if (!session) redirect("/");

  const churchId = session.churchId;

  // Fetch real data concurrently
  const [church, members, totalHambaTuhan, totalPekerja, events, financeRecords] = await Promise.all([
    prisma.church.findUnique({ where: { id: churchId } }),
    prisma.member.findMany({
      where: { churchId },
      select: {
        id: true,
        joinDate: true,
        createdAt: true,
        gender: true,
        isBaptized: true,
        cellGroup: true,
        ministries: true
      }
    }),
    prisma.worker.count({ where: { churchId, type: "FULLTIME" } }), 
    prisma.worker.count({ where: { churchId } }), 
    prisma.event.findMany({ 
      where: { 
        churchId,
        date: { gte: new Date() } 
      }, 
      orderBy: { date: "asc" }, 
      take: 5 
    }),
    prisma.financeRecord.findMany({ where: { churchId, year: 2026 } })
  ]);

  const totalJemaat = members.length;

  // Calculate Growth Data over last 6 months (server-side)
  const today = new Date();
  const growthData: { label: string; count: number }[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    const count = members.filter(m => {
      const joinDate = new Date(m.joinDate || m.createdAt);
      return joinDate <= endDate;
    }).length;
    
    growthData.push({ label, count });
  }

  const maxGrowthCount = Math.max(...growthData.map(d => d.count), 1);

  // Demographic stats for overview card
  const maleCount = members.filter(m => m.gender?.toLowerCase() === "laki-laki" || m.gender?.toLowerCase() === "pria").length;
  const femaleCount = members.filter(m => m.gender?.toLowerCase() === "perempuan" || m.gender?.toLowerCase() === "wanita").length;
  const baptizedCount = members.filter(m => m.isBaptized).length;
  const inKomselCount = members.filter(m => m.cellGroup && m.cellGroup.trim() !== "").length;
  const inMinistryCount = members.filter(m => m.ministries && m.ministries.trim() !== "").length;

  // Hitung arus kas (Pemasukan - Pengeluaran) per bulan (0-11)
  const monthlyFlow = new Array(12).fill(0);
  financeRecords.forEach(record => {
    // month is 1-12
    const mIndex = record.month - 1;
    if (mIndex >= 0 && mIndex < 12) {
      if (record.type === "INCOME") {
        monthlyFlow[mIndex] += record.amount;
      } else if (record.type === "EXPENSE") {
        monthlyFlow[mIndex] -= record.amount;
      }
    }
  });

  const maxFlow = Math.max(...monthlyFlow.map(Math.abs), 1); // Avoid div by 0

  if (!church) redirect("/");

  const formattedCash = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(church.cash);

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Pantau perkembangan operasional {church.name} hari ini.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-xl hover:bg-zinc-50 transition-colors shadow-sm">
            Unduh Laporan
          </button>
          <button className="px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors shadow-sm">
            + Transaksi Baru
          </button>
        </div>
      </div>

      {/* Stats Cards (Bento Grid Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Jemaat */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-36 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="text-sm font-semibold text-zinc-500">Total Jemaat</div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-900 tracking-tight">{totalJemaat}</div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              <span>Diperbarui</span>
            </div>
          </div>
        </div>

        {/* Card 2: Hamba Tuhan */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-36 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="text-sm font-semibold text-zinc-500">Hamba Tuhan</div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-900 tracking-tight">{totalHambaTuhan}</div>
            <div className="text-xs text-zinc-400 font-medium mt-1">Full-time</div>
          </div>
        </div>

        {/* Card 3: Pekerja */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-36 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="text-sm font-semibold text-zinc-500">Total Pekerja</div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-zinc-900 tracking-tight">{totalPekerja}</div>
            <div className="text-xs text-zinc-400 font-medium mt-1">Termasuk Pelayan</div>
          </div>
        </div>

        {/* Card 4: Kas / Uang (Highlight Card) */}
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col justify-between h-36 relative overflow-hidden group text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="text-sm font-semibold text-zinc-300">Kas Tersedia</div>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center backdrop-blur-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold tracking-tight">{formattedCash}</div>
            <div className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              <span>Sehat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Chart Area */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/60 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Arus Kas</h3>
              <p className="text-sm text-zinc-500">Statistik penerimaan dan pengeluaran</p>
            </div>
            <select className="text-sm border border-zinc-200 rounded-xl px-4 py-2 bg-zinc-50 text-zinc-700 outline-none focus:ring-2 focus:ring-zinc-900 font-medium transition-shadow cursor-pointer">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          
          {/* Aesthetic Bar Chart Mockup */}
          <div className="h-64 flex items-end justify-between gap-3 pb-6 border-b border-zinc-100 relative mt-4">
            {/* Grid Lines */}
            <div className="absolute left-0 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-zinc-100 h-0"></div>
              <div className="w-full border-t border-zinc-100 h-0"></div>
              <div className="w-full border-t border-zinc-100 h-0"></div>
              <div className="w-full border-t border-zinc-100 h-0"></div>
            </div>
            
            {/* Bars */}
            <div className="w-full flex items-end justify-between h-full gap-2 relative z-10">
              {monthlyFlow.map((val, i) => {
                const heightPercent = Math.max(Math.min((Math.abs(val) / maxFlow) * 100, 100), 5); // min 5% height so it's visible
                const isDeficit = val < 0;
                return (
                  <div key={i} className="w-full flex flex-col justify-end group h-full items-center relative">
                    <div 
                      className={`w-full max-w-[24px] rounded-md transition-all relative ${isDeficit ? 'bg-rose-500 group-hover:bg-rose-400' : 'bg-zinc-900 group-hover:bg-amber-500'}`} 
                      style={{ height: `${val === 0 ? 0 : heightPercent}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-lg whitespace-nowrap z-20">
                        Rp {(val / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* X-Axis labels */}
          <div className="w-full flex justify-between mt-4 text-xs font-semibold text-zinc-400">
            {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'].map(m => (
              <span key={m} className="w-full text-center">{m}</span>
            ))}
          </div>
        </div>

        {/* Calendar / Events Area */}
        <div className="bg-white border border-zinc-200/60 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-zinc-900">Agenda</h3>
            <button className="text-sm font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors">
              Lihat Semua
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {events.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-zinc-500 text-sm">Tidak ada agenda terdekat.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {events.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-sm">
                        {new Date(event.date).getDate()}
                      </div>
                      {index !== events.length - 1 && (
                        <div className="w-px h-full bg-zinc-100 my-1"></div>
                      )}
                    </div>
                    <div className="pb-1">
                      <div className="font-semibold text-zinc-900">{event.title}</div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{event.time}</span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button className="w-full mt-auto py-3 border-2 border-dashed border-zinc-200 rounded-xl text-sm font-semibold text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 transition-all">
              + Tambah Agenda Baru
            </button>
          </div>

        </div>

      </div>

      {/* Jemaat Growth & Demography Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/60 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Pertumbuhan Jemaat</h3>
              <p className="text-sm text-zinc-500">Tren penambahan jemaat secara kumulatif</p>
            </div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider bg-zinc-50 border border-zinc-200/60 px-3 py-1.5 rounded-lg">
              6 Bulan Terakhir
            </span>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pb-6 border-b border-zinc-100 relative mt-4">
            {/* Grid Lines */}
            <div className="absolute left-0 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-zinc-100 h-0"></div>
              <div className="w-full border-t border-zinc-100 h-0"></div>
              <div className="w-full border-t border-zinc-100 h-0"></div>
              <div className="w-full border-t border-zinc-100 h-0"></div>
            </div>

            {/* Bars */}
            <div className="w-full flex items-end justify-between h-full gap-2 relative z-10">
              {growthData.map((val, i) => {
                const heightPercent = Math.max(Math.min((val.count / maxGrowthCount) * 100, 100), 8);
                return (
                  <div key={i} className="w-full flex flex-col justify-end group h-full items-center relative">
                    <div 
                      className="w-full max-w-[32px] rounded-t-lg bg-zinc-900 group-hover:bg-blue-600 transition-all duration-300 relative flex items-end justify-center cursor-pointer"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-lg whitespace-nowrap z-20">
                        {val.count} Jemaat
                      </div>
                      <span className="text-[10px] font-bold text-white mb-2 opacity-80 group-hover:opacity-100 hidden sm:inline">
                        {val.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-Axis labels */}
          <div className="w-full flex justify-between mt-4 text-xs font-semibold text-zinc-400">
            {growthData.map(d => (
              <span key={d.label} className="w-full text-center">{d.label}</span>
            ))}
          </div>
        </div>

        {/* Ringkasan Jemaat Card */}
        <div className="bg-white border border-zinc-200/60 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-6">Ringkasan Jemaat</h3>
            
            <div className="space-y-6">
              {/* Gender Split */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Gender</span>
                  <span className="text-zinc-900">{maleCount} Pria / {femaleCount} Wanita</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-zinc-100">
                  <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${totalJemaat > 0 ? (maleCount / totalJemaat) * 100 : 50}%` }}></div>
                  <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${totalJemaat > 0 ? (femaleCount / totalJemaat) * 100 : 50}%` }}></div>
                </div>
              </div>

              {/* Status Baptis */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Baptis Air</span>
                  <span className="text-zinc-900">{baptizedCount} / {totalJemaat}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${totalJemaat > 0 ? (baptizedCount / totalJemaat) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Komsel */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Gabung Komsel</span>
                  <span className="text-zinc-900">{inKomselCount} / {totalJemaat}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${totalJemaat > 0 ? (inKomselCount / totalJemaat) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Pelayanan */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Aktif Melayani</span>
                  <span className="text-zinc-900">{inMinistryCount} / {totalJemaat}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalJemaat > 0 ? (inMinistryCount / totalJemaat) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-100 mt-6">
            <a 
              href="/dashboard/jemaat" 
              className="w-full py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              Kelola Data Jemaat Selengkapnya &rarr;
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
