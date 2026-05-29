"use client";

import React, { useState, useMemo } from "react";

// Interfaces
interface PastoralNote {
  id: string;
  title: string;
  date: string;
  content: string;
  author: string;
  type: "visit" | "wa" | "alert";
}

interface VisitMember {
  id: string;
  name: string;
  score: number;
  urgencyLabel: "Urgensi tinggi" | "Sedang" | "Normal";
  absentDuration: string;
  role: string;
  lastPresent: string;
  phone: string;
  address: string;
  familyStatus: string;
  absenceReason: string;
  lastVisit: string;
  assignedTo: string | null;
  notes: PastoralNote[];
}

interface AssignedOfficer {
  id: string;
  initials: string;
  name: string;
  role: string;
  assignedCount: number;
  area: string;
  colorClass: string;
}

export default function VisitasiDashboard() {
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" } | null>(null);

  const [members, setMembers] = useState<VisitMember[]>([]);
  const [officers, setOfficers] = useState<AssignedOfficer[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [aiState, setAiState] = useState<'idle' | 'loading' | 'analyzed' | 'error'>('idle');
  const [insightText, setInsightText] = useState<string>('');

  const handleRequestAI = async () => {
    setAiState('loading');
    
    try {
      // Simulate API call for now since there's no aiVisitasi in DB
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInsightText(
        `<p class="mb-2">Berdasarkan data minggu ini, <strong>tidak ditemukan anomali kritis</strong> pada pola kehadiran jemaat.</p>
         <ul class="list-disc pl-5 mb-2 text-zinc-700">
           <li>Rata-rata tingkat kehadiran jemaat stabil.</li>
           <li>Petugas visitasi sudah didistribusikan secara merata.</li>
         </ul>
         <p><strong>Saran Tindakan:</strong> Fokuskan visitasi pada jemaat yang telah absen lebih dari 3 minggu berturut-turut untuk mencegah kehilangan anggota.</p>`
      );
      setAiState('analyzed');
    } catch (err) {
      console.error(err);
      setAiState('error');
      setInsightText('Gagal mendapatkan analisis AI.');
    }
  };

  const activeMember = members.find(m => m.id === selectedId);

  const triggerToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-rose-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Dynamic stats
  const stats = useMemo(() => {
    return {
      total: members.length,
      scheduled: members.filter(m => m.assignedTo !== null && m.assignedTo !== "Belum ditugaskan").length,
      done: 0, // In a real app, this would be filtered based on completed visits this month
      urgent: members.filter(m => m.score >= 80).length
    };
  }, [members]);

  return (
    <div className="space-y-8 animate-fade-in-up pb-16 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border ${
          toast.type === "success" ? "bg-white border-zinc-200 text-zinc-900" : "bg-indigo-50 border-indigo-200 text-indigo-700"
        }`}>
          {toast.type === "success" ? (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mt-4 mb-3 ml-1">
        RINGKASAN VISITASI — BULAN INI
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Total perlu visitasi
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.total}</div>
          <div className="text-xs text-amber-600 font-bold mt-1">Rekomendasi AI</div>
        </div>
        {/* Card 2 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Sudah dijadwalkan
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.scheduled}</div>
          <div className="text-xs text-emerald-600 font-bold mt-1">Minggu ini</div>
        </div>
        {/* Card 3 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Selesai bulan ini
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.done}</div>
          <div className="text-xs text-emerald-600 font-bold mt-1">Tindak lanjut tercatat</div>
        </div>
        {/* Card 4 */}
        <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm text-zinc-900 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Urgensi tinggi
          </div>
          <div className="mt-3 text-3xl font-extrabold text-zinc-900">{stats.urgent}</div>
          <div className="text-xs text-rose-600 font-bold mt-1">Perlu segera</div>
        </div>
      </div>

      {/* AI Scoring Section */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          PRIORITAS VISITASI MINGGU INI — AI SCORING
        </div>
        
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start border-b border-zinc-100 pb-5 mb-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                Skor prioritas AI
              </h3>
              <p className="text-xs text-zinc-500 mt-2 font-medium">
                Skor 0–100 berdasarkan: lamanya absen, status pelayanan, kondisi keluarga, riwayat visitasi sebelumnya, dan catatan pastoral.
              </p>
            </div>
            <div className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-indigo-200">
              Diperbarui otomatis
            </div>
          </div>

          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-sm italic border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                Saat ini belum ada data jemaat yang membutuhkan prioritas visitasi.
              </div>
            ) : (
              members.map((member) => {
                const isSelected = selectedId === member.id;
                const barColor = getScoreColor(member.score);
                const textColor = member.score >= 80 ? "text-rose-600" : member.score >= 60 ? "text-amber-600" : "text-emerald-600";
                
                return (
                  <div 
                    key={member.id} 
                    onClick={() => setSelectedId(member.id)}
                    className={`flex items-center gap-4 cursor-pointer p-2 -mx-2 rounded-lg transition-all ${
                      isSelected ? "bg-zinc-100 ring-1 ring-zinc-200 font-bold" : "hover:bg-zinc-50 font-medium"
                    }`}
                  >
                    <div className="w-32 text-xs text-zinc-700 truncate shrink-0">
                      {member.name}
                    </div>
                    <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden flex items-center shadow-inner">
                      <div 
                        className={`h-full rounded-full ${barColor}`} 
                        style={{ width: `${member.score}%` }}
                      />
                    </div>
                    <div className={`w-8 text-right text-xs font-black ${textColor}`}>
                      {member.score}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-6 pt-5 border-t border-zinc-100 text-[10px] font-bold text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-sm"></span> Urgensi tinggi (80+)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-sm"></span> Sedang (60-79)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm"></span> Normal (&lt;60)
            </div>
          </div>
        </div>
      </div>

      {/* Selected Member Details */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          DETAIL KARTU VISITASI
        </div>
        
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-7 shadow-sm">
          {!activeMember ? (
            <div className="text-center py-12 text-zinc-400 text-sm italic font-medium">
              Silakan pilih jemaat dari daftar prioritas AI di atas untuk melihat detail lengkap dan riwayat pastoral.
            </div>
          ) : (
            <>
              {/* Header Details */}
              <div className="flex justify-between items-start border-b border-zinc-100 pb-6 mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-600 font-black text-sm flex items-center justify-center border border-zinc-200 shrink-0">
                    {activeMember.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-zinc-900 tracking-wide">{activeMember.name}</h2>
                    <p className="text-[11px] text-zinc-500 mt-1 mb-2 font-semibold">Data Kependudukan Tersinkronisasi</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black border ${
                        activeMember.score >= 80 ? "bg-rose-50 text-rose-600 border-rose-200" : 
                        activeMember.score >= 60 ? "bg-amber-50 text-amber-600 border-amber-200" : 
                        "bg-emerald-50 text-emerald-600 border-emerald-200"
                      }`}>
                        {activeMember.urgencyLabel}
                      </span>
                      <span className="px-2.5 py-1 rounded text-[10px] font-black border bg-amber-50 text-amber-600 border-amber-200">
                        {activeMember.absentDuration}
                      </span>
                      <span className="px-2.5 py-1 rounded text-[10px] font-black border bg-zinc-100 text-zinc-700 border-zinc-200">
                        {activeMember.role}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-black ${activeMember.score >= 80 ? 'text-rose-600' : activeMember.score >= 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {activeMember.score}
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold mt-1">
                    SKOR AI
                  </div>
                </div>
              </div>

              {/* Demographics Grid */}
              <div className="grid grid-cols-[140px_1fr] gap-y-3 text-xs text-zinc-600 mb-8 border-b border-zinc-100 pb-6">
                <div className="font-semibold text-zinc-400">Terakhir hadir</div>
                <div className="font-bold text-rose-600">{activeMember.lastPresent}</div>
                
                <div className="font-semibold text-zinc-400">No. WA</div>
                <div className="font-bold text-indigo-600">{activeMember.phone}</div>
                
                <div className="font-semibold text-zinc-400">Alamat</div>
                <div className="font-medium text-zinc-800">{activeMember.address}</div>
                
                <div className="font-semibold text-zinc-400">Status keluarga</div>
                <div className="font-medium text-zinc-800">{activeMember.familyStatus}</div>
                
                <div className="font-semibold text-zinc-400">Alasan absen</div>
                <div className="font-medium text-zinc-800">{activeMember.absenceReason}</div>
                
                <div className="font-semibold text-zinc-400">Visitasi terakhir</div>
                <div className="font-medium text-zinc-800">{activeMember.lastVisit}</div>
                
                <div className="font-semibold text-zinc-400">Petugas visitasi</div>
                <div className="font-bold text-zinc-800">{activeMember.assignedTo || "Belum ditugaskan"}</div>
              </div>

              {/* Pastoral Notes Timeline */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-zinc-900 mb-5">Riwayat catatan pastoral</h4>
                
                {activeMember.notes.length === 0 ? (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-center text-xs text-zinc-500 font-medium italic">
                    Belum ada catatan pastoral atau riwayat visitasi untuk jemaat ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeMember.notes.map((note) => (
                      <div key={note.id} className="bg-white border border-zinc-200 rounded-xl p-4 relative overflow-hidden group shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                            {note.title}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-bold">{note.date}</div>
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                          {note.content}
                        </p>
                        <div className="text-[10px] text-zinc-400 italic font-medium">
                          {note.author}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => triggerToast("Fitur penugasan petugas visitasi segera hadir.", "info")} className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Tugaskan petugas ↗
                </button>
                <button onClick={() => triggerToast("Fitur tambah catatan segera hadir.")} className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Tambah catatan
                </button>
                <button onClick={() => triggerToast("Fitur integrasi WA segera hadir.", "info")} className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Kirim WA ↗
                </button>
                <button onClick={() => triggerToast("Visitasi ditandai selesai.")} className="px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Tandai selesai
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Officers Assignment Section */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          PENUGASAN PETUGAS VISITASI MINGGU INI
        </div>

        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm mb-4">
          <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              Petugas aktif — {officers.length} orang ditugaskan
            </h3>
            {officers.length > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Distribusi merata
              </span>
            )}
          </div>

          {officers.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm font-medium italic border border-dashed border-zinc-200 rounded-xl mb-6 bg-zinc-50">
              Belum ada petugas visitasi yang diberikan penugasan aktif minggu ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {officers.map(officer => (
                <div key={officer.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full font-black text-[10px] flex items-center justify-center border ${officer.colorClass}`}>
                    {officer.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      {officer.name}
                      <span className="text-[8px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200 uppercase tracking-widest">{officer.role}</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">{officer.assignedCount} jemaat ditugaskan · area {officer.area}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button onClick={() => triggerToast("Fitur kelola petugas visitasi segera hadir.", "info")} className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-lg transition-colors border border-zinc-200 flex justify-center items-center gap-2 shadow-sm">
            Kelola petugas & penugasan ↗
          </button>
        </div>

        {/* AI Insight Box */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 shadow ${aiState === 'loading' ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500'}`}></div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold text-zinc-900">AI Pastoral Insight</h3>
                {aiState === 'analyzed' && (
                  <button onClick={handleRequestAI} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors">
                    Perbarui Analisis
                  </button>
                )}
              </div>
              
              {aiState === 'idle' && (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-500 mb-4">Sistem AI YeshProduction siap menganalisis pola absen jemaat, kondisi keluarga, dan memberikan rekomendasi visitasi secara instan.</p>
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
