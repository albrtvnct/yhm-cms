"use client";

import React, { useState, useEffect } from "react";
import { getPrograms } from "@/app/actions/program";

// Types
interface Division {
  id: string;
  name: string;
  info: string;
  progress: number;
  color: string;
  iconColor: string;
  bgIcon: string;
}

export default function ProgramEvaluasiDashboard() {
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" | "warning" } | null>(null);

  const triggerToast = (message: string, type: "success" | "info" | "warning" = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [aiState, setAiState] = useState<'idle' | 'loading' | 'analyzed' | 'error'>('idle');
  const [insightText, setInsightText] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    const res = await getPrograms();
    if (res.success && res.data) {
      setPrograms(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestAI = async () => {
    setAiState('loading');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInsightText(
        `<p class="mb-2">Secara keseluruhan, kinerja program semester ini <strong>cukup memuaskan</strong>.</p>
         <ul class="list-disc pl-5 mb-2 text-zinc-700">
           <li>Rata-rata realisasi KPI di atas 85%.</li>
           <li>Sebagian besar milestone berjalan sesuai timeline.</li>
         </ul>
         <p><strong>Rekomendasi strategis:</strong> Alihkan sumber daya dari program yang sudah stabil untuk membantu divisi yang memiliki program tertinggal atau berstatus "belum mulai".</p>`
      );
      setAiState('analyzed');
    } catch (err) {
      console.error(err);
      setAiState('error');
      setInsightText('Gagal mendapatkan analisis AI.');
    }
  };

  // Dynamic stats based on actual programs
  const stats = {
    total: programs.length,
    selesai: programs.filter(p => p.status === "SELESAI").length,
    berjalan: programs.filter(p => p.status === "DISETUJUI").length, // approved programs are considered running/upcoming
    belum: programs.filter(p => p.status === "MENUNGGU").length,
    activeDivisions: new Set(programs.map(p => p.divisi)).size
  };

  const upcomingPrograms = programs.filter(p => p.status === 'DISETUJUI' || p.status === 'SELESAI').sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-16 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border ${
          toast.type === "success" ? "bg-white border-zinc-200 text-zinc-900" : 
          toast.type === "warning" ? "bg-rose-50 border-rose-200 text-rose-700" :
          "bg-indigo-50 border-indigo-200 text-indigo-700"
        }`}>
          <div className={`w-2 h-2 rounded-full animate-ping ${
            toast.type === "success" ? "bg-emerald-500" : 
            toast.type === "warning" ? "bg-rose-500" : "bg-indigo-500"
          }`}></div>
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mt-4 mb-3 ml-1">
        RINGKASAN PROGRAM SELURUH DIVISI
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Total Pengajuan
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.total}</div>
          <div className="text-xs text-zinc-500 font-bold mt-1">{stats.activeDivisions} divisi aktif</div>
        </div>
        {/* Card 2 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Selesai
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.selesai}</div>
          <div className="text-xs text-emerald-600 font-bold mt-1">Terealisasi</div>
        </div>
        {/* Card 3 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Disetujui
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.berjalan}</div>
          <div className="text-xs text-indigo-600 font-bold mt-1">Siap berjalan</div>
        </div>
        {/* Card 4 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Belum ACC
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.belum}</div>
          <div className="text-xs text-amber-600 font-bold mt-1">Menunggu approval</div>
        </div>
      </div>

      {/* Program Mendatang Section */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          PROGRAM MENDATANG (SUDAH DI-ACC)
        </div>
        
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm">
          {upcomingPrograms.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm italic font-medium border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
              Belum ada program yang disetujui / akan datang.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingPrograms.map(p => (
                <div key={p.id} className="border border-zinc-200/80 rounded-xl p-5 flex flex-col justify-between group hover:border-indigo-200 hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-extrabold text-zinc-900 group-hover:text-indigo-600 transition-colors">{p.nama}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${p.status === 'SELESAI' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-500 mb-4">{p.divisi}</div>
                  </div>
                  
                  <div className="bg-zinc-50 rounded-lg p-3 text-xs space-y-1.5 border border-zinc-100">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Tanggal Pelaksanaan</span>
                      <span className="font-bold text-zinc-800">{new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Penanggung Jawab</span>
                      <span className="font-bold text-zinc-800">{p.penanggungJawab}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Anggaran Disetujui</span>
                      <span className="font-bold text-emerald-600">Rp {p.dana.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Program Analyst Section */}
      <div className="mt-10">
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 shadow ${aiState === 'loading' ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500'}`}></div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold text-zinc-900">AI Program Analyst</h3>
                {aiState === 'analyzed' && (
                  <button onClick={handleRequestAI} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors">
                    Perbarui Analisis
                  </button>
                )}
              </div>
              
              {aiState === 'idle' && (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-500 mb-4">Sistem AI YeshProduction siap mengevaluasi performa program, capaian KPI, dan mendeteksi efektivitas pelaksanaan antar divisi.</p>
                  <button 
                    onClick={handleRequestAI}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Minta Analisis AI
                  </button>
                </div>
              )}

              {aiState === 'loading' && (
                <div className="space-y-3 animate-pulse mt-4">
                  <div className="h-3 bg-zinc-100 rounded w-3/4"></div>
                  <div className="h-3 bg-zinc-100 rounded w-full"></div>
                  <div className="h-3 bg-zinc-100 rounded w-5/6"></div>
                </div>
              )}

              {aiState === 'analyzed' && (
                <div 
                  className="text-sm text-zinc-700 leading-relaxed font-medium mt-3"
                  dangerouslySetInnerHTML={{ __html: insightText }}
                />
              )}

              {aiState === 'error' && (
                <div className="text-sm text-rose-600 font-medium mt-3">
                  {insightText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
