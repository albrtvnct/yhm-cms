"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  getBulkAttendance, 
  addBulkAttendance, 
  deleteBulkAttendance, 
  updateAttendanceRecord, 
  getActiveChurchMembers,
  IbadahMetadata 
} from "@/app/actions/attendance";
import Portal from "@/components/Portal";

interface AttendanceRow {
  id: string;
  serviceDate: string;
  serviceType: string;
  male: number;
  female: number;
  total: number;
  notes: string | null;
  metadata?: IbadahMetadata;
  createdAt: string;
}

interface Stats {
  totalSessions: number;
  avgHadir: number;
  latestTotal: number;
  latestMale: number;
  latestFemale: number;
  peakTotal: number;
  peakDate: string | null;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const fmtShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const today = () => new Date().toISOString().split("T")[0];

const SERVICE_TYPES = [
  "Ibadah Umum",
  "Ibadah Remaja",
  "Ibadah Anak",
  "Ibadah Keluarga",
  "Ibadah Doa",
  "Ibadah Khusus",
];

export default function BulkAttendancePage() {
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Active Church Members for Absensi Checklist
  const [membersList, setMembersList] = useState<{ id: string; name: string; nij: string | null }[]>([]);
  const [searchMemberQuery, setSearchMemberQuery] = useState("");

  // AI Analyst State
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'analyzed' | 'error'>('idle');
  const [insightText, setInsightText] = useState<string>('');

  // Form state
  const [formDate, setFormDate] = useState(today());
  const [formType, setFormType] = useState("Ibadah Umum");
  const [formMale, setFormMale] = useState("");
  const [formFemale, setFormFemale] = useState("");
  const [formError, setFormError] = useState("");
  
  // New Form states (Ibadah metadata)
  const [formJudul, setFormJudul] = useState("");
  const [formTema, setFormTema] = useState("");
  const [formPengkhotbah, setFormPengkhotbah] = useState("");
  const [formAbsensi, setFormAbsensi] = useState<string[]>([]);
  const [formJumlahKehadiran, setFormJumlahKehadiran] = useState("");
  const [formFoto, setFormFoto] = useState(""); // base64 string
  const [formKeterangan, setFormKeterangan] = useState("");

  // Detail & Edit State
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState("Ibadah Umum");
  const [editMale, setEditMale] = useState("");
  const [editFemale, setEditFemale] = useState("");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // New Edit Form states (Ibadah metadata)
  const [editJudul, setEditJudul] = useState("");
  const [editTema, setEditTema] = useState("");
  const [editPengkhotbah, setEditPengkhotbah] = useState("");
  const [editAbsensi, setEditAbsensi] = useState<string[]>([]);
  const [editJumlahKehadiran, setEditJumlahKehadiran] = useState("");
  const [editFoto, setEditFoto] = useState(""); // base64 string
  const [editKeterangan, setEditKeterangan] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getBulkAttendance();
    if (res.success && res.data) {
      setRecords(res.data.records);
      setStats(res.data.stats);
      if (res.data.aiInsight) {
        setInsightText(res.data.aiInsight);
        setAiState('analyzed');
      }
    }
    setLoading(false);
  }, []);

  const fetchMembers = useCallback(async () => {
    const res = await getActiveChurchMembers();
    if (res.success && res.data) {
      setMembersList(res.data);
    }
  }, []);

  const handleRequestAI = async () => {
    setAiState('loading');
    try {
      const res = await fetch('/api/ai/kehadiran', { method: 'POST' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Terjadi kesalahan jaringan.');
      setInsightText(resData.insight);
      setAiState('analyzed');
    } catch (err: any) {
      setInsightText(err.message || 'Gagal mengambil analisis.');
      setAiState('error');
    }
  };

  useEffect(() => { 
    loadData(); 
    fetchMembers();
  }, [loadData, fetchMembers]);

  // Convert uploaded image file to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran berkas terlalu besar. Maksimum adalah 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit) {
        setEditFoto(base64String);
      } else {
        setFormFoto(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Absensi checklist toggle
  const toggleMemberAbsensi = (id: string, isEdit: boolean) => {
    if (isEdit) {
      setEditAbsensi(prev => {
        const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
        setEditJumlahKehadiran(next.length.toString());
        return next;
      });
    } else {
      setFormAbsensi(prev => {
        const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
        setFormJumlahKehadiran(next.length.toString());
        return next;
      });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formDate) { setFormError("Pilih tanggal ibadah."); return; }
    
    let total = parseInt(formJumlahKehadiran) || 0;
    let m = parseInt(formMale) || 0;
    let f = parseInt(formFemale) || 0;

    // Fallbacks to compute totals and genders automatically
    if (total === 0 && formAbsensi.length > 0) {
      total = formAbsensi.length;
    }
    if (total === 0 && (m + f) > 0) {
      total = m + f;
    }
    if (total > 0 && m + f === 0) {
      m = Math.round(total / 2);
      f = total - m;
    }

    setSubmitting(true);
    await addBulkAttendance({
      serviceDate: formDate,
      serviceType: formType,
      male: m,
      female: f,
      metadata: {
        judulIbadah: formJudul || undefined,
        temaKhotbah: formTema || undefined,
        namaPengkhotbah: formPengkhotbah || undefined,
        absensi: formAbsensi.length > 0 ? formAbsensi : undefined,
        jumlahKehadiran: total || undefined,
        foto: formFoto || undefined,
        keterangan: formKeterangan || undefined,
      }
    });
    await loadData();
    setShowModal(false);
    
    // Reset Add states
    setFormMale("");
    setFormFemale("");
    setFormDate(today());
    setFormJudul("");
    setFormTema("");
    setFormPengkhotbah("");
    setFormAbsensi([]);
    setFormJumlahKehadiran("");
    setFormFoto("");
    setFormKeterangan("");
    setSearchMemberQuery("");
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await deleteBulkAttendance(id);
    setDeleteId(null);
    await loadData();
  };

  const handleOpenDetail = (record: AttendanceRow) => {
    setSelectedRecord(record);
    setIsEditing(false);
    setEditDate(record.serviceDate.split("T")[0]);
    setEditType(record.serviceType);
    setEditMale(record.male.toString());
    setEditFemale(record.female.toString());
    
    const meta = record.metadata || {};
    setEditJudul(meta.judulIbadah || "");
    setEditTema(meta.temaKhotbah || "");
    setEditPengkhotbah(meta.namaPengkhotbah || "");
    setEditAbsensi(meta.absensi || []);
    setEditJumlahKehadiran(meta.jumlahKehadiran?.toString() || (record.male + record.female).toString());
    setEditFoto(meta.foto || "");
    setEditKeterangan(meta.keterangan || record.notes || "");
    setEditError("");
    setSearchMemberQuery("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!selectedRecord) return;
    if (!editDate) { setEditError("Pilih tanggal ibadah."); return; }

    let total = parseInt(editJumlahKehadiran) || 0;
    let m = parseInt(editMale) || 0;
    let f = parseInt(editFemale) || 0;

    if (total === 0 && editAbsensi.length > 0) {
      total = editAbsensi.length;
    }
    if (total === 0 && (m + f) > 0) {
      total = m + f;
    }
    if (total > 0 && m + f === 0) {
      m = Math.round(total / 2);
      f = total - m;
    }

    setEditSubmitting(true);
    const res = await updateAttendanceRecord(selectedRecord.id, {
      serviceDate: editDate,
      serviceType: editType,
      male: m,
      female: f,
      metadata: {
        judulIbadah: editJudul || undefined,
        temaKhotbah: editTema || undefined,
        namaPengkhotbah: editPengkhotbah || undefined,
        absensi: editAbsensi.length > 0 ? editAbsensi : undefined,
        jumlahKehadiran: total || undefined,
        foto: editFoto || undefined,
        keterangan: editKeterangan || undefined,
      }
    });
    if (res.success) {
      await loadData();
      setSelectedRecord(null);
      setIsEditing(false);
    } else {
      setEditError(res.error || "Gagal memperbarui data.");
    }
    setEditSubmitting(false);
  };

  const filteredMembers = membersList.filter(m => 
    m.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) || 
    (m.nij && m.nij.toLowerCase().includes(searchMemberQuery.toLowerCase()))
  );

  const calculatedLiveTotal = (parseInt(formJumlahKehadiran) || 0) || (parseInt(formMale) || 0) + (parseInt(formFemale) || 0) || formAbsensi.length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-10 bg-zinc-200 rounded-2xl w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-zinc-100 rounded-3xl" />)}
        </div>
        <div className="h-64 bg-zinc-100 rounded-3xl" />
      </div>
    );
  }

  const lastSunday = records[0];

  return (
    <div className="space-y-8 animate-fade-in-up pb-16 font-sans">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Ibadah</h1>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest border border-zinc-200">Pencatatan Ibadah</span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Catat pelaporan ibadah mingguan, tema khotbah, absensi jemaat, dan dokumentasi secara berkala.</p>
        </div>
        <button
          id="btn-catat-kehadiran"
          onClick={() => { setShowModal(true); setFormDate(today()); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Catat Laporan Ibadah
        </button>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Ibadah terakhir */}
        <div className="col-span-2 bg-zinc-900 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ibadah Terakhir
            </div>
            {lastSunday ? (
              <>
                <div className="text-4xl font-extrabold text-white tracking-tight mb-1">{lastSunday.total.toLocaleString()}</div>
                <div className="text-xs text-zinc-400 font-medium mb-4">
                  {lastSunday.metadata?.judulIbadah ? `"${lastSunday.metadata.judulIbadah}" · ` : ""}
                  {fmtDate(lastSunday.serviceDate)} · {lastSunday.serviceType}
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-xs text-zinc-300 font-semibold">
                      {lastSunday.male.toLocaleString()} L
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                    <span className="text-xs text-zinc-300 font-semibold">
                      {lastSunday.female.toLocaleString()} P
                    </span>
                  </div>
                  {lastSunday.metadata?.absensi && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-xs text-zinc-300 font-semibold">
                        {lastSunday.metadata.absensi.length} Absen Individu
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-zinc-400 text-sm font-medium py-2">Belum ada data. Catat ibadah pertama!</div>
            )}
          </div>
        </div>

        {/* Rata-rata */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
          <div className="text-xs text-zinc-500 font-bold mb-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            Rata-rata hadir
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900">{stats?.avgHadir?.toLocaleString() ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">per sesi ibadah</div>
          </div>
        </div>

        {/* Rekor */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
          <div className="text-xs text-zinc-500 font-bold mb-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            Rekor tertinggi
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-900">{stats?.peakTotal?.toLocaleString() ?? 0}</div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">
              {stats?.peakDate ? fmtShortDate(stats.peakDate) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ── BAR CHART VISUAL ─────────────────────────────────────────────────── */}
      {records.length > 0 && (
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Tren Kehadiran Ibadah</h2>
          <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm p-6">
            <div className="flex items-end gap-2 h-40 overflow-x-auto pb-2">
              {records.slice(0, 20).reverse().map((r) => {
                const maxVal = Math.max(...records.slice(0, 20).map(x => x.total), 1);
                const heightPct = (r.total / maxVal) * 100;
                const malePct = r.total > 0 ? (r.male / r.total) * 100 : 50;
                return (
                  <div key={r.id} className="flex flex-col items-center gap-1 group shrink-0" style={{ minWidth: 28 }}>
                    <div className="relative w-7 flex flex-col justify-end overflow-hidden rounded-t-lg" style={{ height: "8rem" }} title={`${r.metadata?.judulIbadah ? `"${r.metadata.judulIbadah}"\n` : ""}${fmtShortDate(r.serviceDate)}: ${r.total} (L: ${r.male}, P: ${r.female})`}>
                      {/* Total bar */}
                      <div
                        className="w-full rounded-t-lg overflow-hidden relative transition-all duration-500"
                        style={{ height: `${heightPct}%` }}
                      >
                        {/* Female (bottom) */}
                        <div className="absolute bottom-0 w-full bg-pink-400/80" style={{ height: `${100 - malePct}%` }} />
                        {/* Male (top) */}
                        <div className="absolute top-0 w-full bg-blue-500/80" style={{ height: `${malePct}%` }} />
                      </div>
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        {r.total.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-[8px] text-zinc-400 font-semibold text-center truncate w-7">
                      {new Date(r.serviceDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
                <div className="w-3 h-3 rounded-sm bg-blue-500/80" /> Laki-laki
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
                <div className="w-3 h-3 rounded-sm bg-pink-400/80" /> Perempuan
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI ANALYST ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">AI Analyst</h2>
        <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-[90px] rounded-full pointer-events-none transition-all group-hover:bg-purple-500/20"></div>
          
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                Analisis Tren & Statistik Ibadah
              </h3>
              
              <div className="mt-4">
                {aiState === 'idle' ? (
                  <div className="text-sm text-zinc-400 italic border-l-2 border-purple-500/30 pl-4 py-2">
                    Sistem AI YeshProduction siap menganalisis tema khotbah, kehadiran jemaat, perbandingan gender, keaktifan per sesi ibadah, dan wawasan pertumbuhan secara instan.
                  </div>
                ) : aiState === 'loading' ? (
                  <div className="flex items-center gap-3 text-sm text-purple-300 font-medium animate-pulse border-l-2 border-purple-500 pl-4 py-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Menghubungkan ke Gemini Neural Engine...
                  </div>
                ) : (
                  <div className="text-sm text-zinc-200 leading-relaxed max-w-4xl" dangerouslySetInnerHTML={{ __html: insightText }}></div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">Tren kehadiran</button>
                <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">Analisis pembicara</button>
              </div>
              
              <button 
                onClick={handleRequestAI}
                disabled={aiState === 'loading'}
                className="shrink-0 w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {aiState === 'idle' ? 'Minta Analisis AI' : aiState === 'loading' ? 'Menganalisis...' : 'Perbarui Analisis'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIWAYAT IBADAH ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4 ml-1">
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase">Riwayat Sesi Ibadah</h2>
          <span className="text-xs text-zinc-400 font-semibold">{stats?.totalSessions ?? 0} sesi tercatat</span>
        </div>
        <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <div className="font-extrabold text-zinc-900 text-lg">Belum ada data ibadah</div>
                <div className="text-zinc-500 text-sm mt-1">Mulai catat laporan sesi ibadah pertama gereja Anda.</div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                + Catat Laporan Baru
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Tanggal & Judul Ibadah</th>
                    <th className="px-6 py-4">Jenis Ibadah</th>
                    <th className="px-6 py-4">Pengkhotbah / Tema</th>
                    <th className="px-6 py-4">Total Hadir</th>
                    <th className="px-6 py-4">Media</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => handleOpenDetail(r)}
                      className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 text-sm">{fmtShortDate(r.serviceDate)}</div>
                        <div className="text-xs text-zinc-500 font-semibold mt-0.5 max-w-[200px] truncate">
                          {r.metadata?.judulIbadah || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200/60">
                          {r.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-zinc-800">{r.metadata?.namaPengkhotbah || "—"}</div>
                        <div className="text-[10px] text-zinc-400 italic mt-0.5 max-w-[200px] truncate">
                          {r.metadata?.temaKhotbah ? `"${r.metadata.temaKhotbah}"` : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-extrabold text-zinc-900">
                          {r.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.metadata?.foto ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200">
                            <img src={r.metadata.foto} className="w-full h-full object-cover" alt="Media" />
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(r)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 transition-all p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
                            title="Detail"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              handleOpenDetail(r);
                              setIsEditing(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-600 transition-all p-1.5 rounded-lg hover:bg-indigo-50 cursor-pointer"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: TAMBAH DATA ────────────────────────────────────────────────── */}
      {showModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-zinc-200/60 overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-900">Catat Laporan Ibadah</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Input laporan jalannya sesi ibadah gereja</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleAdd} className="flex-1 overflow-y-auto p-6 space-y-5">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-xl">
                    {formError}
                  </div>
                )}

                {/* Judul & Tanggal & Tipe */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Judul Ibadah (Opsional)</label>
                    <input
                      type="text"
                      value={formJudul}
                      onChange={e => setFormJudul(e.target.value)}
                      placeholder="Contoh: Ibadah Raya 1, Kebaktian Remaja, Kebaktian Anak..."
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Tanggal Ibadah</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={e => setFormDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Jenis Ibadah</label>
                      <select
                        value={formType}
                        onChange={e => setFormType(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer"
                      >
                        {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tema Khotbah & Nama Pengkhotbah */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Tema Khotbah (Opsional)</label>
                    <input
                      type="text"
                      value={formTema}
                      onChange={e => setFormTema(e.target.value)}
                      placeholder="Contoh: Hidup yang Berbuah..."
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Nama Pengkhotbah (Opsional)</label>
                    <input
                      type="text"
                      value={formPengkhotbah}
                      onChange={e => setFormPengkhotbah(e.target.value)}
                      placeholder="Contoh: Pdt. Albert Vincent..."
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Absensi Kehadiran checklist */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex justify-between items-center">
                    <span>Absensi Kehadiran Jemaat (Opsional)</span>
                    <span className="text-zinc-500 font-semibold text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full">{formAbsensi.length} Terpilih</span>
                  </label>
                  <input
                    type="text"
                    value={searchMemberQuery}
                    onChange={e => setSearchMemberQuery(e.target.value)}
                    placeholder="Cari nama jemaat..."
                    className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                  <div className="max-h-36 overflow-y-auto border border-zinc-100 rounded-xl p-2 space-y-1.5 bg-zinc-50/30">
                    {filteredMembers.length === 0 ? (
                      <div className="text-[11px] text-zinc-400 text-center py-4">Jemaat tidak ditemukan</div>
                    ) : (
                      filteredMembers.map(member => {
                        const isChecked = formAbsensi.includes(member.id);
                        return (
                          <label key={member.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100/80 rounded-lg cursor-pointer transition-colors text-xs font-medium text-zinc-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMemberAbsensi(member.id, false)}
                              className="rounded text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5"
                            />
                            <div className="flex-1 truncate">
                              {member.name} <span className="text-[10px] text-zinc-400 font-normal">{member.nij ? `(${member.nij})` : ""}</span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Jumlah Kehadiran & Detail Gender (Optional) */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Total Hadir</label>
                      <input
                        type="number"
                        min="0"
                        value={formJumlahKehadiran}
                        onChange={e => setFormJumlahKehadiran(e.target.value)}
                        placeholder={formAbsensi.length > 0 ? formAbsensi.length.toString() : "0"}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-center"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center justify-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Pria
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formMale}
                        onChange={e => setFormMale(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm text-blue-700 bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-xs font-bold text-pink-600 uppercase tracking-wider flex items-center justify-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Wanita
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formFemale}
                        onChange={e => setFormFemale(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-pink-200 rounded-xl text-sm text-pink-700 bg-pink-50/50 focus:outline-none focus:ring-2 focus:ring-pink-400 text-center"
                      />
                    </div>
                  </div>

                  {/* Summary calculated info */}
                  <div className={`rounded-2xl p-4 flex items-center justify-between transition-colors ${calculatedLiveTotal > 0 ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}>
                    <div className={`text-sm font-bold ${calculatedLiveTotal > 0 ? "text-zinc-400" : "text-zinc-500"}`}>Total kehadiran final:</div>
                    <div className={`text-3xl font-extrabold ${calculatedLiveTotal > 0 ? "text-white" : "text-zinc-400"}`}>
                      {calculatedLiveTotal.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Dokumentasi Foto */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Dokumentasi Foto (Opsional)</label>
                  
                  {formFoto ? (
                    <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-video">
                      <img src={formFoto} className="w-full h-full object-cover" alt="Preview" />
                      <button
                        type="button"
                        onClick={() => setFormFoto("")}
                        className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2.5 transition-colors shadow-md cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-2xl p-6 cursor-pointer transition-colors bg-zinc-50/50">
                      <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-zinc-500 font-bold">Pilih foto dokumentasi</span>
                      <span className="text-[10px] text-zinc-400 mt-1">Maks. 2MB (format JPG, PNG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileChange(e, false)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Keterangan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Keterangan (Opsional)</label>
                  <textarea
                    rows={3}
                    value={formKeterangan}
                    onChange={e => setFormKeterangan(e.target.value)}
                    placeholder="Masukkan keterangan ibadah seperti catatan persembahan kustom, kendala di lokasi, dll..."
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>
              </form>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-100 flex gap-3 shrink-0 bg-zinc-50">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-bold bg-white hover:bg-zinc-50 transition-all cursor-pointer">
                  Batal
                </button>
                <button type="submit" onClick={handleAdd} disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                  {submitting ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Menyimpan...</>
                  ) : "Simpan Data Ibadah"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ── MODAL: KONFIRMASI HAPUS ───────────────────────────────────────────── */}
      {deleteId && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-zinc-200/60">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900 mb-2">Hapus data ibadah?</h3>
              <p className="text-sm text-zinc-500 mb-6">Seluruh data laporan ibadah ini akan dihapus permanen dan tidak dapat dikembalikan.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-zinc-700 text-sm font-bold hover:bg-zinc-50 cursor-pointer">Batal</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold cursor-pointer">Hapus</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ── MODAL: DETAIL & EDIT ───────────────────────────────────────────── */}
      {selectedRecord && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-zinc-200/60 overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-900">
                    {isEditing ? "Edit Laporan Ibadah" : "Detail Laporan Ibadah"}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {isEditing ? "Ubah rincian laporan jalannya ibadah" : "Rincian detail data laporan ibadah"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedRecord(null);
                    setIsEditing(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isEditing ? (
                /* EDIT MODE */
                <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                  {editError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-xl">
                      {editError}
                    </div>
                  )}

                  {/* Judul & Tanggal & Tipe */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Judul Ibadah (Opsional)</label>
                      <input
                        type="text"
                        value={editJudul}
                        onChange={e => setEditJudul(e.target.value)}
                        placeholder="Contoh: Ibadah Raya 1..."
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Tanggal Ibadah</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Jenis Ibadah</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all cursor-pointer"
                        >
                          {SERVICE_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Tema & Pengkhotbah */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Tema Khotbah (Opsional)</label>
                      <input
                        type="text"
                        value={editTema}
                        onChange={e => setEditTema(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Nama Pengkhotbah (Opsional)</label>
                      <input
                        type="text"
                        value={editPengkhotbah}
                        onChange={e => setEditPengkhotbah(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Absensi checklist */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex justify-between items-center">
                      <span>Absensi Kehadiran Jemaat (Opsional)</span>
                      <span className="text-zinc-500 font-semibold text-[10px] bg-zinc-100 px-2 py-0.5 rounded-full">{editAbsensi.length} Terpilih</span>
                    </label>
                    <input
                      type="text"
                      value={searchMemberQuery}
                      onChange={e => setSearchMemberQuery(e.target.value)}
                      placeholder="Cari nama jemaat..."
                      className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                    <div className="max-h-36 overflow-y-auto border border-zinc-100 rounded-xl p-2 space-y-1.5 bg-zinc-50/30">
                      {filteredMembers.length === 0 ? (
                        <div className="text-[11px] text-zinc-400 text-center py-4">Jemaat tidak ditemukan</div>
                      ) : (
                        filteredMembers.map(member => {
                          const isChecked = editAbsensi.includes(member.id);
                          return (
                            <label key={member.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100/80 rounded-lg cursor-pointer transition-colors text-xs font-medium text-zinc-700">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleMemberAbsensi(member.id, true)}
                                className="rounded text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5"
                              />
                              <div className="flex-1 truncate">
                                {member.name} <span className="text-[10px] text-zinc-400 font-normal">{member.nij ? `(${member.nij})` : ""}</span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Jumlah Kehadiran & Gender */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5 col-span-1">
                        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Total Hadir</label>
                        <input
                          type="number"
                          min="0"
                          value={editJumlahKehadiran}
                          onChange={e => setEditJumlahKehadiran(e.target.value)}
                          placeholder={editAbsensi.length > 0 ? editAbsensi.length.toString() : "0"}
                          className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-center"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-1">
                        <label className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center justify-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Pria
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editMale}
                          onChange={(e) => setEditMale(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-blue-200 rounded-xl text-sm text-blue-700 bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-1">
                        <label className="text-xs font-bold text-pink-600 uppercase tracking-wider flex items-center justify-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Wanita
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editFemale}
                          onChange={(e) => setEditFemale(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-pink-200 rounded-xl text-sm text-pink-700 bg-pink-50/50 focus:outline-none focus:ring-2 focus:ring-pink-400 text-center"
                        />
                      </div>
                    </div>

                    {/* Calculated live total */}
                    {(() => {
                      const totalLiveEdit = (parseInt(editJumlahKehadiran) || 0) || (parseInt(editMale) || 0) + (parseInt(editFemale) || 0) || editAbsensi.length;
                      return (
                        <div className={`rounded-2xl p-4 flex items-center justify-between transition-colors ${totalLiveEdit > 0 ? "bg-zinc-900 text-white" : "bg-zinc-100"}`}>
                          <div className={`text-sm font-bold ${totalLiveEdit > 0 ? "text-zinc-400" : "text-zinc-500"}`}>Total kehadiran final:</div>
                          <div className={`text-3xl font-extrabold ${totalLiveEdit > 0 ? "text-white" : "text-zinc-400"}`}>
                            {totalLiveEdit.toLocaleString()}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Foto Dokumentasi */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Dokumentasi Foto (Opsional)</label>
                    {editFoto ? (
                      <div className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-video">
                        <img src={editFoto} className="w-full h-full object-cover" alt="Preview" />
                        <button
                          type="button"
                          onClick={() => setEditFoto("")}
                          className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white rounded-full p-2.5 transition-colors shadow-md cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-2xl p-6 cursor-pointer transition-colors bg-zinc-50/50">
                        <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                        <span className="text-xs text-zinc-500 font-bold">Pilih foto dokumentasi</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleFileChange(e, true)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Keterangan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Keterangan (Opsional)</label>
                    <textarea
                      rows={3}
                      value={editKeterangan}
                      onChange={(e) => setEditKeterangan(e.target.value)}
                      placeholder="Masukkan keterangan ibadah..."
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="flex gap-3 pt-2 bg-zinc-50 p-6 -mx-6 -mb-6 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-sm font-bold hover:bg-zinc-50 transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={editSubmitting}
                      className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {editSubmitting ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Menyimpan...</>
                      ) : (
                        "Simpan Perubahan"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* DETAIL MODE (READ ONLY VIEW) */
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Banner / Foto Dokumentasi */}
                  {selectedRecord.metadata?.foto && (
                    <div className="rounded-2xl overflow-hidden border border-zinc-100 aspect-video shadow-md relative group">
                      <img src={selectedRecord.metadata.foto} className="w-full h-full object-cover" alt="Dokumentasi Ibadah" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                        <span className="text-white text-xs font-black tracking-widest uppercase bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">Dokumentasi Foto</span>
                      </div>
                    </div>
                  )}

                  {/* Big stats card */}
                  <div className="bg-zinc-900 text-white rounded-2xl p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">Total Kehadiran Ibadah</div>
                      <div className="text-5xl font-black text-white tracking-tight">
                        {selectedRecord.total.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-400 mt-2 font-semibold">
                        {selectedRecord.serviceType} {selectedRecord.metadata?.judulIbadah ? `· "${selectedRecord.metadata.judulIbadah}"` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Tanggal & Waktu */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Tanggal Ibadah</div>
                      <div className="text-sm font-extrabold text-zinc-900 mt-1">
                        {fmtShortDate(selectedRecord.serviceDate)}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium">
                        {new Date(selectedRecord.serviceDate).toLocaleDateString("id-ID", { weekday: "long" })}
                      </div>
                    </div>
                    <div className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50 flex flex-col justify-center">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Hari Pencatatan</div>
                      <p className="text-sm font-extrabold text-zinc-900 mt-1 truncate" title={fmtShortDate(selectedRecord.createdAt)}>
                        {fmtShortDate(selectedRecord.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Khotbah Card */}
                  {(selectedRecord.metadata?.temaKhotbah || selectedRecord.metadata?.namaPengkhotbah) && (
                    <div className="border border-zinc-100 rounded-2xl p-5 space-y-3 bg-zinc-50/20">
                      <div className="text-xs font-black text-zinc-400 uppercase tracking-wider">Detail Pemberitaan Firman</div>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedRecord.metadata?.namaPengkhotbah && (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Pengkhotbah</div>
                              <div className="text-xs font-bold text-zinc-800 mt-0.5">{selectedRecord.metadata.namaPengkhotbah}</div>
                            </div>
                          </div>
                        )}
                        {selectedRecord.metadata?.temaKhotbah && (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
                            </div>
                            <div>
                              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Tema Khotbah</div>
                              <div className="text-xs font-bold text-zinc-800 mt-0.5">"{selectedRecord.metadata.temaKhotbah}"</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Absensi Kehadiran Jemaat List */}
                  <div className="space-y-2">
                    <div className="text-xs font-black text-zinc-400 uppercase tracking-wider flex justify-between items-center">
                      <span>Absensi Kehadiran Individu</span>
                      <span className="text-[10px] text-zinc-500 font-semibold bg-zinc-100 px-2 py-0.5 rounded-full">
                        {selectedRecord.metadata?.absensi?.length || 0} Jemaat Check-In
                      </span>
                    </div>

                    {selectedRecord.metadata?.absensi && selectedRecord.metadata.absensi.length > 0 ? (
                      <div className="max-h-36 overflow-y-auto border border-zinc-100 bg-zinc-50/10 rounded-2xl p-3 flex flex-wrap gap-1.5">
                        {selectedRecord.metadata.absensi.map((memberId: string) => {
                          const m = membersList.find(x => x.id === memberId);
                          return (
                            <span 
                              key={memberId}
                              className="inline-flex items-center text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/50 px-2.5 py-1 rounded-lg transition-colors cursor-default"
                            >
                              {m ? m.name : "Jemaat"}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 italic bg-zinc-50/50 p-4 border border-zinc-100 rounded-2xl text-center">
                        Tidak ada jemaat yang di-check-in di absensi sesi ini.
                      </div>
                    )}
                  </div>

                  {/* Gender breakdown visual */}
                  <div className="space-y-3">
                    <div className="text-xs font-black text-zinc-400 uppercase tracking-wider">Rincian Gender</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-wider flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Laki-laki
                          </div>
                          <div className="text-2xl font-black text-blue-700 mt-1">
                            {selectedRecord.male.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs font-extrabold text-blue-600 bg-blue-100/50 px-2 py-1 rounded-lg">
                          {selectedRecord.total > 0 ? `${Math.round((selectedRecord.male / selectedRecord.total) * 100)}%` : "0%"}
                        </div>
                      </div>

                      <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black text-pink-500 uppercase tracking-wider flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Perempuan
                          </div>
                          <div className="text-2xl font-black text-pink-700 mt-1">
                            {selectedRecord.female.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs font-extrabold text-pink-600 bg-pink-100/50 px-2 py-1 rounded-lg">
                          {selectedRecord.total > 0 ? `${Math.round((selectedRecord.female / selectedRecord.total) * 100)}%` : "0%"}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {selectedRecord.total > 0 && (
                      <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-100">
                        <div className="bg-blue-500" style={{ width: `${(selectedRecord.male / selectedRecord.total) * 100}%` }} />
                        <div className="bg-pink-400" style={{ width: `${(selectedRecord.female / selectedRecord.total) * 100}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Keterangan Card */}
                  <div className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Keterangan / Catatan</div>
                    <p className="text-xs font-medium text-zinc-650 mt-1.5 whitespace-pre-wrap leading-relaxed">
                      {selectedRecord.metadata?.keterangan || selectedRecord.notes || "Tidak ada keterangan tambahan."}
                    </p>
                  </div>

                  {/* Detail footer buttons */}
                  <div className="flex gap-3 pt-2 bg-zinc-50 p-6 -mx-6 -mb-6 border-t border-zinc-100">
                    <button
                      onClick={() => {
                        setSelectedRecord(null);
                        setIsEditing(false);
                      }}
                      className="flex-1 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-sm font-bold hover:bg-zinc-50 transition-all cursor-pointer text-center"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Laporan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
