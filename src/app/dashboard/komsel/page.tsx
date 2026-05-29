"use client";

import React, { useState } from "react";

// Types
interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  avatar: string;
  weeks: ("hadir" | "absen" | "izin" | "kosong")[];
  isNew?: boolean;
}

interface KomselSnapshot {
  id: string;
  name: string;
  leader: string;
  schedule: string;
  location: string;
  healthStatus: "Sehat" | "Perlu pantauan" | "Siap memuliakan";
  area: string;
  membersCount: number;
  attendancePercent: number;
  meetingsCount: number;
  healthScore: number;
}

export default function KomselDashboard() {
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" | "warning" } | null>(null);
  
  // Empty State Initialization
  const [komsels, setKomsels] = useState<KomselSnapshot[]>([]);
  const [members, setMembers] = useState<AttendanceRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [aiState, setAiState] = useState<'idle' | 'loading' | 'analyzed' | 'error'>('idle');
  const [insightText, setInsightText] = useState<string>('');

  const handleRequestAI = async () => {
    setAiState('loading');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInsightText(
        `<p class="mb-2">Berdasarkan pemantauan aktivitas komsel bulan ini, <strong>pertumbuhan komunitas tergolong sehat</strong>.</p>
         <ul class="list-disc pl-5 mb-2 text-zinc-700">
           <li>Rata-rata tingkat kehadiran komsel stabil di angka yang diharapkan.</li>
           <li>Beberapa area komsel menunjukkan peningkatan partisipasi anggota baru.</li>
         </ul>
         <p><strong>Rekomendasi tindak lanjut:</strong> Lakukan pembinaan tambahan bagi ketua komsel yang memiliki skor kesehatan di bawah rata-rata untuk meningkatkan retensi anggota.</p>`
      );
      setAiState('analyzed');
    } catch (err) {
      console.error(err);
      setAiState('error');
      setInsightText('Gagal mendapatkan analisis AI.');
    }
  };

  const activeKomsel = komsels.find(k => k.id === selectedId);

  const triggerToast = (message: string, type: "success" | "info" | "warning" = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getHealthBadgeStyle = (status: string) => {
    switch(status) {
      case "Sehat": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "Perlu pantauan": return "bg-amber-50 text-amber-600 border-amber-200";
      case "Siap memuliakan": return "bg-indigo-50 text-indigo-600 border-indigo-200";
      default: return "bg-zinc-50 text-zinc-600 border-zinc-200";
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  const handleSaveKomsel = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddModalOpen(false);
    triggerToast("Berhasil menyimpan data komsel baru!", "success");
    // Di sinilah fungsi submit ke database nantinya berjalan
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

      {/* Popup Modal Tambah Komsel */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-sm font-extrabold text-zinc-900">Tambah Komsel Baru</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* Modal Body Form */}
            <div className="p-6 overflow-y-auto">
              <form id="komsel-form" onSubmit={handleSaveKomsel} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Nama Komsel</label>
                  <input type="text" required placeholder="Cth: Komsel Kelapa Gading 3" className="w-full text-sm px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 font-medium" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Pemimpin / Ketua</label>
                  <input type="text" required placeholder="Cth: Sari Rahayu" className="w-full text-sm px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Jadwal (Hari & Jam)</label>
                    <input type="text" required placeholder="Rabu 19.30" className="w-full text-sm px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Area Wilayah</label>
                    <input type="text" required placeholder="Kelapa Gading" className="w-full text-sm px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Lokasi / Tempat</label>
                  <input type="text" required placeholder="Rmh. Sari - Jl. Boulevard" className="w-full text-sm px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-900 font-medium" />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="komsel-form"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mt-4 mb-3 ml-1">
        RINGKASAN KOMSEL SELURUH GEREJA — BULAN INI
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Total komsel aktif
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{komsels.length}</div>
          <div className="text-xs text-zinc-500 font-bold mt-1">Sistem tersinkronisasi</div>
        </div>
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Total anggota
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">0</div>
          <div className="text-xs text-zinc-500 font-bold mt-1">Data belum masuk</div>
        </div>
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Rata-rata kehadiran
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">0%</div>
          <div className="text-xs text-zinc-400 font-medium mt-1">Menunggu laporan</div>
        </div>
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Perlu perhatian
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">0</div>
          <div className="text-xs text-zinc-400 font-medium mt-1">Semua status aman</div>
        </div>
      </div>

      {/* Snapshot Komsel Cards */}
      <div className="mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase ml-1">
            KARTU KOMSEL — SNAPSHOT BULAN INI
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors border border-zinc-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Komsel
          </button>
        </div>
        
        {komsels.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
              <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 mb-2">Belum ada komsel terdaftar</h3>
            <p className="text-xs text-zinc-500 font-medium max-w-sm mx-auto mb-6">
              Data komsel Anda saat ini kosong. Silakan tambahkan komsel baru dengan mengklik tombol "Tambah Komsel" di atas.
            </p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              Mulai Input Komsel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {komsels.map(komsel => {
              const isSelected = selectedId === komsel.id;
              return (
                <div 
                  key={komsel.id} 
                  onClick={() => setSelectedId(komsel.id)}
                  className={`bg-white border rounded-2xl p-6 cursor-pointer transition-all ${
                    isSelected ? 'border-zinc-300 ring-2 ring-indigo-500/20 shadow-md' : 'border-zinc-200/60 shadow-sm hover:shadow-md hover:border-zinc-300'
                  }`}
                >
                  <div className="flex gap-4 items-start mb-5">
                    <div className="w-12 h-12 rounded-full font-black text-sm flex items-center justify-center shrink-0 border shadow-sm bg-zinc-50 text-zinc-700 border-zinc-200">
                      {komsel.name.split(" ").slice(-2, -1)[0].substring(0, 1) + komsel.name.split(" ").slice(-1)[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-900 mb-1">{komsel.name}</h3>
                      <p className="text-[10px] text-zinc-500 font-medium leading-tight">
                        Pemimpin: {komsel.leader} · {komsel.schedule} · {komsel.location}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${getHealthBadgeStyle(komsel.healthStatus)}`}>
                          {komsel.healthStatus}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider bg-zinc-50 text-zinc-600 border-zinc-200">
                          {komsel.area}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-zinc-800">{komsel.membersCount}</div>
                      <div className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Anggota</div>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 text-center">
                      <div className={`text-lg font-black ${komsel.attendancePercent >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {komsel.attendancePercent}%
                      </div>
                      <div className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Kehadiran</div>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 text-center">
                      <div className="text-lg font-black text-zinc-800">{komsel.meetingsCount}</div>
                      <div className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Pertemuan</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Skor kesehatan komsel</span>
                      <span className={`text-xs font-black ${getHealthScoreColor(komsel.healthScore).replace('bg-', 'text-')}`}>
                        {komsel.healthScore}
                      </span>
                    </div>
                    <div className="bg-zinc-100 rounded-full h-1.5 overflow-hidden flex items-center shadow-inner">
                      <div 
                        className={`h-full rounded-full ${getHealthScoreColor(komsel.healthScore)}`} 
                        style={{ width: `${komsel.healthScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance List */}
      {activeKomsel && (
        <div className="mt-10">
          <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
            ANGGOTA {activeKomsel.name.toUpperCase()} — KEHADIRAN 4 MINGGU TERAKHIR
          </div>
          
          <div className="bg-white border border-zinc-200/60 rounded-2xl p-7 shadow-sm">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-5 mb-5">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                {activeKomsel.membersCount} anggota terdaftar
              </h3>
              <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-md border border-emerald-200">
                Kehadiran {activeKomsel.attendancePercent}%
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {members.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs italic bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  Belum ada anggota terdaftar di komsel ini.
                </div>
              ) : (
                <>
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 -mx-2 hover:bg-zinc-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 font-black text-[10px] flex items-center justify-center border border-zinc-200 shrink-0">
                          {member.avatar}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                            {member.name}
                            {member.isNew && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-medium">{member.role}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5">
                        {member.weeks.map((status, idx) => (
                          <div 
                            key={idx} 
                            className={`w-3.5 h-3.5 rounded-sm ${
                              status === "hadir" ? "bg-emerald-500" :
                              status === "absen" ? "bg-rose-500" :
                              status === "izin" ? "bg-amber-500" : "bg-zinc-200"
                            }`}
                            title={`Minggu ${4-idx}: ${status}`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {activeKomsel.membersCount > members.length && (
                    <div className="p-2 -mx-2 text-xs font-semibold text-zinc-400 italic">
                      + {activeKomsel.membersCount - members.length} anggota lainnya
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Legend & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-5 border-t border-zinc-100">
              <div className="flex gap-4 text-[10px] font-bold text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm"></span> Hadir
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-sm"></span> Tidak hadir
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-sm"></span> Izin
                </div>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => triggerToast("Form input kehadiran dibuka.", "info")} className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  Input kehadiran
                </button>
                <button onClick={() => triggerToast("Broadcast WA dikirim ke semua anggota.", "success")} className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03-8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Broadcast WA ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analyst */}
      <div className="mt-10">
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 shadow ${aiState === 'loading' ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500'}`}></div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold text-zinc-900">AI Komsel Analyst</h3>
                {aiState === 'analyzed' && (
                  <button onClick={handleRequestAI} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors">
                    Perbarui Analisis
                  </button>
                )}
              </div>
              
              {aiState === 'idle' && (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-500 mb-4">Sistem AI YeshProduction siap memantau kesehatan komsel, tingkat kehadiran, serta merekomendasikan strategi penggembalaan wilayah.</p>
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
