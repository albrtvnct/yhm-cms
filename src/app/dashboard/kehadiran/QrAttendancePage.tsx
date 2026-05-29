"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import { generateQrSession, getBulkAttendance, getQrSessionStats, deleteBulkAttendance, updateAttendanceRecord, getActiveSession } from "@/app/actions/attendance";
import Portal from "@/components/Portal";

const SERVICE_TYPES = [
  "Ibadah Umum",
  "Ibadah Remaja",
  "Ibadah Anak",
  "Ibadah Keluarga",
  "Ibadah Doa",
  "Ibadah Khusus",
];

const today = () => new Date().toISOString().split("T")[0];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const fmtShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function QrAttendancePage() {
  const [showModal, setShowModal] = useState(false);
  const [formDate, setFormDate] = useState(today());
  const [formType, setFormType] = useState("Ibadah Umum");
  const [generating, setGenerating] = useState(false);
  const [activeQr, setActiveQr] = useState<{ token: string; recordId: string; date: string; type: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalSessions: number; avgHadir: number; latestTotal: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // AI Analyst State
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'analyzed' | 'error'>('idle');
  const [insightText, setInsightText] = useState<string>('');

  // Live Stats State for Active QR
  const [activeStats, setActiveStats] = useState<{ male: number; female: number; total: number } | null>(null);

  // Past Sessions Records
  const [records, setRecords] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Detail & Edit State
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState("Ibadah Umum");
  const [editMale, setEditMale] = useState("");
  const [editFemale, setEditFemale] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const refreshActiveStats = useCallback(async (recordId: string) => {
    const res = await getQrSessionStats(recordId);
    if (res.success && res.data) {
      setActiveStats(res.data);
    }
  }, []);

  const loadData = useCallback(async () => {
    const res = await getBulkAttendance();
    if (res.success && res.data) {
      setStats(res.data.stats);
      setRecords(res.data.records);
      if (res.data.aiInsight) {
        setInsightText(res.data.aiInsight);
        setAiState('analyzed');
      }
    }
  }, []);

  // Poll overall attendance data and history every 4 seconds to keep the admin panel auto-updated
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Load active session on page mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await getActiveSession();
        if (res.success && res.data) {
          const { token, recordId, date, type } = res.data;
          const qrUrl = `${window.location.origin}/hadir/${token}`;
          const dataUrl = await QRCode.toDataURL(qrUrl, {
            width: 400,
            margin: 2,
            color: { dark: "#09090b", light: "#ffffff" },
          });
          setQrDataUrl(dataUrl);
          setActiveQr({ token, recordId, date, type });
          setActiveStats({ male: 0, female: 0, total: 0 });
        }
      } catch (err) {
        console.error("restoreSession error:", err);
      }
    }
    restoreSession();
  }, []);

  // Polling for live session check-in count
  useEffect(() => {
    if (!activeQr) {
      setActiveStats(null);
      return;
    }

    refreshActiveStats(activeQr.recordId);

    const interval = setInterval(() => {
      refreshActiveStats(activeQr.recordId);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeQr, refreshActiveStats]);

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

  const handleDelete = async (id: string) => {
    await deleteBulkAttendance(id);
    setDeleteId(null);
    await loadData();
  };

  const handleOpenDetail = (record: any) => {
    setSelectedRecord(record);
    setIsEditing(false);
    setEditDate(record.serviceDate.split("T")[0]);
    setEditType(record.serviceType);
    setEditMale(record.male.toString());
    setEditFemale(record.female.toString());
    setEditNotes(record.notes ?? "");
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!selectedRecord) return;
    if (!editDate) { setEditError("Pilih tanggal ibadah."); return; }
    const m = parseInt(editMale) || 0;
    const f = parseInt(editFemale) || 0;
    if (m + f === 0) { setEditError("Total kehadiran tidak boleh nol."); return; }

    setEditSubmitting(true);
    const res = await updateAttendanceRecord(selectedRecord.id, {
      serviceDate: editDate,
      serviceType: editType,
      male: m,
      female: f,
      notes: editNotes || undefined,
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    const res = await generateQrSession({ serviceDate: formDate, serviceType: formType });
    if (res.success && res.token) {
      const qrUrl = `${window.location.origin}/hadir/${res.token}`;
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#09090b", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setActiveQr({ token: res.token, recordId: res.recordId!, date: formDate, type: formType });
      setActiveStats({ male: 0, female: 0, total: 0 }); // Reset stats
      await loadData(); // Reload records list
      setShowModal(false);
    }
    setGenerating(false);
  };

  const handlePrint = () => {
    if (!qrDataUrl || !activeQr) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Kehadiran — ${activeQr.type}</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; }
            .card { border: 2px solid #000; border-radius: 24px; padding: 40px; text-align: center; max-width: 420px; }
            h1 { font-size: 28px; font-weight: 900; margin: 0 0 6px; }
            p { color: #666; font-size: 14px; margin: 0 0 24px; }
            img { width: 280px; height: 280px; border-radius: 12px; }
            .date { font-size: 13px; color: #888; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Scan untuk Absen</h1>
            <p>${activeQr.type} · ${fmtDate(activeQr.date)}</p>
            <img src="${qrDataUrl}" />
            <div class="date">Scan QR ini untuk mencatat kehadiran Anda</div>
          </div>
          <script>window.onload = () => window.print();<\/script>
        </body>
      </html>
    `);
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-16 font-sans">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Kehadiran</h1>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest border border-indigo-200/60">Absensi RealTime</span>
          </div>
          <p className="text-zinc-500 text-sm font-medium">Gunakan aplikasi HP Clicker per sesi ibadah untuk mencatat kehadiran secara real-time.</p>
        </div>
        <button
          id="btn-generate-qr"
          onClick={() => { setShowModal(true); setFormDate(today()); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Mulai Sesi RealTime
        </button>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="text-xs font-bold text-zinc-500 mb-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            Total Sesi
          </div>
          <div className="text-3xl font-extrabold text-zinc-900">{stats?.totalSessions ?? 0}</div>
          <div className="text-xs text-zinc-400 mt-1">sesi QR tercatat</div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="text-xs font-bold text-zinc-500 mb-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            Ibadah Terakhir
          </div>
          <div className="text-3xl font-extrabold text-zinc-900">{stats?.latestTotal ?? 0}</div>
          <div className="text-xs text-zinc-400 mt-1">hadir sesi terakhir</div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <div className="text-xs font-bold text-zinc-500 mb-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            Rata-rata
          </div>
          <div className="text-3xl font-extrabold text-zinc-900">{stats?.avgHadir ?? 0}</div>
          <div className="text-xs text-zinc-400 mt-1">per sesi ibadah</div>
        </div>
      </div>

      {/* ── ACTIVE QR DISPLAY ───────────────────────────────────────────────── */}
      {activeQr && qrDataUrl ? (
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">QR Aktif — Siap Ditampilkan</h2>
          <div className="bg-zinc-900 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">

              {/* QR Image */}
              <div className="shrink-0">
                <div className="bg-white p-4 rounded-2xl shadow-2xl">
                  <img src={qrDataUrl} alt="QR Code Kehadiran" className="w-48 h-48 rounded-xl" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center justify-center lg:justify-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  QR Aktif
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">{activeQr.type}</h3>
                <div className="text-zinc-400 text-sm font-medium mb-6">{fmtDate(activeQr.date)}</div>

                <div className="bg-white/10 rounded-2xl p-4 mb-6 font-mono text-xs text-zinc-300 break-all">
                  {`${typeof window !== "undefined" ? window.location.origin : ""}/hadir/${activeQr.token}`}
                </div>

                {activeStats && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 flex justify-around items-center">
                    <div className="text-center">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Total Check-In</div>
                      <div className="text-3xl font-extrabold text-white mt-1.5 animate-fade-in-up">{activeStats.total.toLocaleString()}</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Laki-laki</div>
                      <div className="text-2xl font-bold text-blue-400 mt-2 flex items-center justify-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        {activeStats.male.toLocaleString()}
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Perempuan</div>
                      <div className="text-2xl font-bold text-pink-400 mt-2 flex items-center justify-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                        {activeStats.female.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <button
                    onClick={handlePrint}
                    className="px-5 py-2.5 bg-white text-zinc-900 text-sm font-bold rounded-xl hover:bg-zinc-100 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Download
                  </button>
                  <button
                    onClick={() => { setShowModal(true); setFormDate(today()); }}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat QR Baru
                  </button>
                </div>

                {typeof window !== "undefined" && window.location.hostname === "localhost" && (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left text-xs text-amber-200 leading-relaxed max-w-lg">
                    <strong>⚠️ Tips Akses di HP:</strong> Karena Anda membuka dasbor ini via <code>localhost</code>, QR Code & link di atas menggunakan alamat <code>localhost</code>. Agar HP ushers bisa terhubung, pastikan laptop dan HP terhubung ke Wi-Fi yang sama, lalu buka dasbor ini menggunakan alamat IP laptop Anda (contoh: <code>http://192.168.1.X:3000/dashboard/kehadiran</code>) sebelum men-scan atau membagikan link/QR.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Sesi Absensi RealTime</h2>
          <div className="bg-white rounded-3xl border-2 border-dashed border-zinc-200 p-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <div className="font-extrabold text-zinc-900 text-lg mb-1">Belum ada sesi aktif</div>
              <div className="text-zinc-500 text-sm max-w-sm">
                Generate link/QR Code untuk sesi ibadah hari ini. Ushers dapat mengakses link clicker di HP untuk input kehadiran secara real-time.
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Generate Sesi Baru
            </button>
          </div>
        </div>
      )}

      {/* ── AI ANALYST ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">AI Analyst</h2>
        <div className="bg-zinc-900 rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-[90px] rounded-full pointer-events-none transition-all group-hover:bg-purple-500/20"></div>
          
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                Analisis Tren & Statistik Kehadiran Ibadah
              </h3>
              
              <div className="mt-4">
                {aiState === 'idle' ? (
                  <div className="text-sm text-zinc-400 italic border-l-2 border-purple-500/30 pl-4 py-2">
                    Sistem AI YeshProduction siap menganalisis tren kehadiran, perbandingan gender, keaktifan per sesi ibadah, dan wawasan pertumbuhan secara instan.
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
                <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">Analisis gender</button>
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
              <div className="text-center animate-fade-in-up">
                <div className="font-extrabold text-zinc-900 text-lg">Belum ada data kehadiran</div>
                <div className="text-zinc-500 text-sm mt-1">Generate QR pertama Anda untuk mencatat kehadiran.</div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Tanggal Ibadah</th>
                    <th className="px-6 py-4">Jenis Ibadah</th>
                    <th className="px-6 py-4">Laki-laki</th>
                    <th className="px-6 py-4">Perempuan</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Catatan</th>
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
                      <td className="px-6 py-4 font-bold text-zinc-900 text-sm">{fmtDate(r.serviceDate)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200/60">
                          {r.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-sm font-extrabold text-blue-600">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          {r.male.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-sm font-extrabold text-pink-600">
                          <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                          {r.female.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-extrabold text-zinc-900">{r.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{r.notes ?? "—"}</td>
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

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Cara Kerja</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              icon: "M12 4v16m8-8H4",
              title: "Buat Sesi",
              desc: "Klik tombol 'Mulai Sesi RealTime' di atas, lalu tentukan jenis ibadah dan tanggalnya.",
              color: "bg-indigo-50 text-indigo-600 border-indigo-200/60",
            },
            {
              step: "2",
              icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
              title: "Bagikan Link / QR",
              desc: "Buka QR Code sesi aktif atau salin linknya, lalu minta para usher memindai/membuka di HP mereka.",
              color: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
            },
            {
              step: "3",
              icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
              title: "Mulai Menghitung",
              desc: "Ushers di setiap pintu masuk menekan tombol +1 Laki-laki / Perempuan di HP. Dashboard admin akan terupdate secara real-time.",
              color: "bg-amber-50 text-amber-600 border-amber-200/60",
            },
          ].map((s) => (
            <div key={s.step} className="bg-white rounded-2xl border border-zinc-200/60 p-5 hover:-translate-y-0.5 transition-transform duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${s.color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
              </div>
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Langkah {s.step}</div>
              <div className="font-extrabold text-zinc-900 text-sm mb-2">{s.title}</div>
              <div className="text-xs text-zinc-500 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL: GENERATE QR ───────────────────────────────────────────────── */}
      {showModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-zinc-200/60 overflow-hidden animate-fade-in-up">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-900">Buat QR Baru</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Generate QR untuk sesi ibadah</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleGenerate} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Tanggal Ibadah</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-3 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Jenis Ibadah</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full px-3.5 py-3 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-zinc-200 rounded-xl text-zinc-700 text-sm font-bold hover:bg-zinc-50 transition-all cursor-pointer">Batal</button>
                  <button type="submit" disabled={generating}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20">
                    {generating ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Membuat...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>Generate QR</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
      {/* ── MODAL: KONFIRMASI HAPUS ───────────────────────────────────────────── */}
      {deleteId && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-zinc-200/60 animate-fade-in-up">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900 mb-2">Hapus data ini?</h3>
              <p className="text-sm text-zinc-500 mb-6">Data kehadiran sesi ini akan dihapus permanen dan tidak dapat dikembalikan.</p>
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200/60 overflow-hidden animate-fade-in-up">
              
              {/* Header */}
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-900">
                    {isEditing ? "Edit Sesi Ibadah" : "Detail Sesi Ibadah"}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {isEditing ? "Ubah rincian kehadiran jemaat" : "Rincian data kehadiran jemaat"}
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
                <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
                  {editError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-xl">
                      {editError}
                    </div>
                  )}

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

                  {/* Male / Female input */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Laki-laki
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editMale}
                        onChange={(e) => setEditMale(e.target.value)}
                        placeholder="0"
                        className="w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-2xl font-extrabold text-blue-700 bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-pink-600 uppercase tracking-wider flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-pink-400" /> Perempuan
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editFemale}
                        onChange={(e) => setEditFemale(e.target.value)}
                        placeholder="0"
                        className="w-full px-3.5 py-2.5 border border-pink-200 rounded-xl text-2xl font-extrabold text-pink-700 bg-pink-50/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all text-center"
                      />
                    </div>
                  </div>

                  {/* Live total */}
                  {(() => {
                    const totalLiveEdit = (parseInt(editMale) || 0) + (parseInt(editFemale) || 0);
                    return (
                      <div className={`rounded-2xl p-4 flex items-center justify-between transition-colors ${totalLiveEdit > 0 ? "bg-zinc-900" : "bg-zinc-100"}`}>
                        <div className={`text-sm font-bold ${totalLiveEdit > 0 ? "text-zinc-400" : "text-zinc-500"}`}>Total jemaat hadir</div>
                        <div className={`text-3xl font-extrabold ${totalLiveEdit > 0 ? "text-white" : "text-zinc-400"}`}>
                          {totalLiveEdit.toLocaleString()}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Catatan (opsional)</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Contoh: Ibadah Natal, hari hujan..."
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-bold hover:bg-zinc-50 transition-all cursor-pointer"
                    >
                      Kembali ke Detail
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
                /* DETAIL MODE (READ ONLY WITH CHARTS / STATS) */
                <div className="p-6 space-y-6">
                  {/* Big stats card */}
                  <div className="bg-zinc-900 rounded-2xl p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">Total Kehadiran</div>
                      <div className="text-5xl font-black text-white tracking-tight">
                        {selectedRecord.total.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-400 mt-2 font-semibold">
                        {selectedRecord.serviceType}
                      </div>
                    </div>
                  </div>

                  {/* Date & Note Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-zinc-100 rounded-2xl p-4">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Tanggal Ibadah</div>
                      <div className="text-sm font-extrabold text-zinc-900 mt-1">
                        {fmtShortDate(selectedRecord.serviceDate)}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium">
                        {new Date(selectedRecord.serviceDate).toLocaleDateString("id-ID", { weekday: "long" })}
                      </div>
                    </div>
                    <div className="border border-zinc-100 rounded-2xl p-4">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Catatan Sesi</div>
                      <p className="text-sm font-semibold text-zinc-700 mt-1 truncate" title={selectedRecord.notes ?? ""}>
                        {selectedRecord.notes || "Tidak ada catatan"}
                      </p>
                    </div>
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
                      <div className="h-3 w-full rounded-full overflow-hidden flex bg-zinc-100">
                        <div className="bg-blue-500" style={{ width: `${(selectedRecord.male / selectedRecord.total) * 100}%` }} />
                        <div className="bg-pink-400" style={{ width: `${(selectedRecord.female / selectedRecord.total) * 100}%` }} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSelectedRecord(null);
                        setIsEditing(false);
                      }}
                      className="flex-1 py-3 rounded-xl border border-zinc-200 text-zinc-700 text-sm font-bold hover:bg-zinc-50 transition-all cursor-pointer text-center"
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
                      Edit Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
