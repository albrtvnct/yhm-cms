"use client";

import React, { useState } from "react";

// Types
interface Milestone {
  id: string;
  title: string;
  status: "selesai" | "berjalan" | "terlambat" | "belum";
  description: string;
  dateStr: string;
}

interface Indicator {
  id: string;
  label: string;
  targetStr: string;
  actualStr: string;
  percentage: number;
  isOverachieved?: boolean;
}

interface ProgramDetail {
  id: string;
  title: string;
  division: string;
  pic: string;
  status: string;
  tags: string[];
  totalProgress: number;
  kpi: {
    target: string;
    targetSub: string;
    realization: string;
    realizationSub: string;
    highlight: string;
    highlightSub: string;
  };
  indicators: Indicator[];
  milestones: Milestone[];
}

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

  // State initialization with empty arrays/null for empty states
  const [programs, setPrograms] = useState<ProgramDetail[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [activeProgram, setActiveProgram] = useState<ProgramDetail | null>(null);

  // Dynamic stats
  const stats = {
    total: programs.length,
    selesai: programs.filter(p => p.status.toLowerCase() === "selesai").length,
    berjalan: programs.filter(p => p.status.toLowerCase() === "berjalan").length,
    belum: programs.filter(p => p.status.toLowerCase() === "belum").length,
    activeDivisions: divisions.length
  };

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
        RINGKASAN PROGRAM SELURUH DIVISI — SEMESTER 1, 2026
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Total program
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
            Berjalan
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.berjalan}</div>
          <div className="text-xs text-indigo-600 font-bold mt-1">Dalam proses</div>
        </div>
        {/* Card 4 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Belum mulai
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.belum}</div>
          <div className="text-xs text-amber-600 font-bold mt-1">Menunggu jadwal</div>
        </div>
      </div>

      {/* Progres Per Divisi */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          PROGRES PER DIVISI
        </div>
        
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-5 mb-5">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
              </svg>
              Semua divisi — capaian output
            </h3>
            <div className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded-md border border-indigo-200">
              Semester 1
            </div>
          </div>

          <div className="space-y-4">
            {divisions.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm font-medium italic border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                Belum ada data progres per divisi untuk periode ini.
              </div>
            ) : (
              divisions.map((div, idx) => (
                <div 
                  key={div.id} 
                  className={`flex items-center gap-4 cursor-pointer p-2 -mx-2 rounded-lg transition-all hover:bg-zinc-50 ${
                    idx === 0 ? "bg-zinc-50 ring-1 ring-zinc-200" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${div.bgIcon} ${div.iconColor} flex items-center justify-center shrink-0 border border-zinc-100`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="w-40 shrink-0">
                    <div className="text-xs font-bold text-zinc-800 truncate">{div.name}</div>
                    <div className="text-[10px] text-zinc-500 font-medium">{div.info}</div>
                  </div>
                  <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden flex items-center shadow-inner">
                    <div 
                      className={`h-full rounded-full ${div.color}`} 
                      style={{ width: `${div.progress}%` }}
                    />
                  </div>
                  <div className={`w-8 text-right text-xs font-black ${div.iconColor}`}>
                    {div.progress}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Program Detail Section */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          DETAIL PROGRAM
        </div>
        
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-7 shadow-sm">
          {!activeProgram ? (
            <div className="text-center py-12 text-zinc-400 text-sm italic font-medium">
              Silakan pilih program dari daftar di atas untuk memantau capaian detail, milestone, dan KPI evaluasinya.
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex justify-between items-start border-b border-zinc-100 pb-6 mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center border border-indigo-100 shrink-0 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-zinc-900 tracking-wide">{activeProgram.title}</h2>
                    <p className="text-[11px] text-zinc-500 mt-1 mb-3 font-medium">
                      Divisi {activeProgram.division} · PIC: {activeProgram.pic}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeProgram.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded text-[10px] font-black border bg-zinc-50 text-zinc-600 border-zinc-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-emerald-600">
                    {activeProgram.totalProgress}%
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">
                    CAPAIAN
                  </div>
                </div>
              </div>

              {/* KPI Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 border-b border-zinc-100 pb-8">
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 text-center">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Target peserta</div>
                  <div className="text-2xl font-black text-zinc-800">{activeProgram.kpi.target}</div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-1">{activeProgram.kpi.targetSub}</div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 text-center">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Realisasi</div>
                  <div className="text-2xl font-black text-emerald-600">{activeProgram.kpi.realization}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">{activeProgram.kpi.realizationSub}</div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 text-center">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Highlight</div>
                  <div className="text-2xl font-black text-indigo-600">{activeProgram.kpi.highlight}</div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-1">{activeProgram.kpi.highlightSub}</div>
                </div>
              </div>

              {/* Indicators Bar Chart */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-zinc-900 mb-5">Output per indikator</h4>
                <div className="space-y-4">
                  {activeProgram.indicators.map((ind) => (
                    <div key={ind.id} className="flex items-center gap-4">
                      <div className="w-28 text-xs font-bold text-zinc-700 truncate shrink-0">
                        {ind.label}
                      </div>
                      <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden flex items-center shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            ind.isOverachieved ? 'bg-indigo-500' : 
                            ind.percentage >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} 
                          style={{ width: `${Math.min(ind.percentage, 100)}%` }}
                        />
                      </div>
                      <div className={`w-8 text-right text-xs font-black ${
                         ind.isOverachieved ? 'text-indigo-600' : 
                         ind.percentage >= 90 ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {ind.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-zinc-900 mb-5">Milestone pelaksanaan</h4>
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-3.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
                  {activeProgram.milestones.map((ms, index) => (
                    <div key={ms.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                        ms.status === 'selesai' ? 'bg-emerald-500' : 
                        ms.status === 'berjalan' ? 'bg-indigo-500' : 'bg-zinc-300'
                      }`}>
                        {ms.status === 'selesai' && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white border border-zinc-200 p-4 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-zinc-900">{ms.title}</h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            ms.status === 'selesai' ? 'text-emerald-600 bg-emerald-50' : 
                            ms.status === 'berjalan' ? 'text-indigo-600 bg-indigo-50' : 'text-zinc-500 bg-zinc-100'
                          }`}>
                            {ms.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-1.5 leading-relaxed">{ms.description}</p>
                        <p className="text-[10px] font-semibold text-zinc-400 mt-2">{ms.dateStr}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-8 border-t border-zinc-100 pt-6">
                <button onClick={() => triggerToast("Membuka form laporan...", "info")} className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Buat laporan ↗
                </button>
                <button onClick={() => triggerToast("Mensimulasikan submit ke gembala.", "success")} className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Submit ke gembala ↗
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Program Analyst Section */}
      <div className="mt-10">
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 animate-pulse shrink-0 shadow"></div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-2">AI Program Analyst — pantauan otomatis</h3>
              
              {programs.length === 0 ? (
                <p className="text-xs text-zinc-500 font-medium italic mb-2">
                  Belum ada data evaluasi program yang cukup untuk menghasilkan rekomendasi AI. Silakan kumpulkan data lebih lanjut.
                </p>
              ) : (
                <>
                  <p className="text-xs text-zinc-600 leading-relaxed font-medium mb-5">
                    Menganalisis matriks indikator dari program yang sedang berjalan...
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => triggerToast("Menjalankan analisis ulang...", "info")} className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 text-[10px] font-bold rounded border border-zinc-200 transition-colors shadow-sm">
                      Jalankan Analisis Performa
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
