"use client";

import React, { useEffect, useState } from "react";
import { getChurchSettings, updateChurchSettings } from "@/app/actions/settings";
import { setAttendanceMode, getKehadiranSetup } from "@/app/actions/attendance";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [nijFormat, setNijFormat] = useState("");
  const [youthThreshold, setYouthThreshold] = useState(25);
  const [elderlyThreshold, setElderlyThreshold] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [attendanceMode, setAttendanceModeState] = useState<"BULK" | "QR" | null>(null);
  const [savingMode, setSavingMode] = useState(false);
  const [modeSuccess, setModeSuccess] = useState(false);
  const [templates, setTemplates] = useState([
    { id: 1, name: "Surat Undangan", ext: "DOCX", size: "45 KB", date: "10 Mei 2026" },
    { id: 2, name: "Surat Keterangan", ext: "DOCX", size: "32 KB", date: "12 Mei 2026" },
    { id: 3, name: "Surat Peminjaman", ext: "PDF", size: "120 KB", date: "15 Mei 2026" },
  ]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);


  const handleDeleteTemplate = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus template ini?")) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const handleEditTemplate = (id: number, currentName: string) => {
    const newName = window.prompt("Ubah nama template:", currentName);
    if (newName && newName.trim() !== "") {
      setTemplates(templates.map(t => t.id === id ? { ...t, name: newName.trim() } : t));
    }
  };

  const handleUploadTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    const newTmpl = {
      id: Date.now(),
      name: newTemplateName.trim(),
      ext: "DOCX", 
      size: "24 KB",
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    };
    setTemplates([newTmpl, ...templates]);
    setIsUploadModalOpen(false);
    setNewTemplateName("");
    setTemplateFile(null);
    setSuccessMsg("Template berhasil diunggah!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  useEffect(() => {
    async function loadSettings() {
      const [settingsRes, modeRes] = await Promise.all([
        getChurchSettings(),
        getKehadiranSetup(),
      ]);
      if (settingsRes.success && settingsRes.data) {
        setChurchName(settingsRes.data.name);
        setNijFormat(settingsRes.data.nijFormat || "[GEREJA]-[TAHUN]-[NOMOR]");
        setYouthThreshold(settingsRes.data.youthThreshold ?? 25);
        setElderlyThreshold(settingsRes.data.elderlyThreshold ?? 50);
      } else {
        setError(settingsRes.error || "Gagal memuat pengaturan.");
      }
      if (modeRes.attendanceMode) {
        setAttendanceModeState(modeRes.attendanceMode as "BULK" | "QR");
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  // Helper to generate preview
  const getPreview = () => {
    if (!nijFormat) return "-";
    const year = new Date().getFullYear();
    const sequence = "00001";
    
    let churchCode = "";
    const nameWords = churchName.trim().split(/\s+/);
    if (nameWords.length > 1) {
      churchCode = nameWords.map(w => w[0]).join("").toUpperCase();
    } else {
      churchCode = churchName.toUpperCase();
    }

    let nij = nijFormat;
    nij = nij.replace(/\[NAMA GEREJA\]/gi, churchCode)
             .replace(/\[GEREJA\]/gi, churchCode)
             .replace(/\[CHURCH\]/gi, churchCode);

    nij = nij.replace(/\[TAHUN\]/gi, String(year))
             .replace(/\[YEAR\]/gi, String(year));

    nij = nij.replace(/\[NOMOR INDUK\]/gi, sequence)
             .replace(/\[NOMOR\]/gi, sequence)
             .replace(/\[NUM\]/gi, sequence)
             .replace(/\[SEQUENCE\]/gi, sequence);

    return nij;
  };

  const handleInsertTag = (tag: string) => {
    setNijFormat(prev => prev + tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    const res = await updateChurchSettings({
      name: churchName,
      nijFormat: nijFormat,
      youthThreshold: youthThreshold,
      elderlyThreshold: elderlyThreshold,
    });

    if (res.success) {
      setSuccessMsg("Pengaturan berhasil disimpan.");
    } else {
      setError(res.error || "Gagal menyimpan pengaturan.");
    }
    setSaving(false);
  };

  const placeholders = [
    "[NOMOR INDUK]",
    "[NOMOR]",
    "[NUM]",
    "[SEQUENCE]"
  ];
  const hasNumberPlaceholder = placeholders.some(p => 
    nijFormat.toUpperCase().includes(p)
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in-up pb-12 font-sans max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Pengaturan</h1>
        <p className="text-zinc-500 text-sm mt-1.5 font-medium">
          Sesuaikan detail organisasi gereja dan sistem penomoran jemaat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-zinc-200/60 p-8 shadow-sm space-y-6">
            
            {/* Status alerts */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold rounded-2xl flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-2xl flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Church Name */}
            <div className="space-y-2">
              <label htmlFor="churchName" className="block text-sm font-bold text-zinc-700">
                Nama Gereja
              </label>
              <input
                id="churchName"
                type="text"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium bg-zinc-50/50"
                placeholder="Contoh: Gereja Bethel Indonesia"
                required
              />
            </div>

            {/* NIJ Format */}
            <div className="space-y-2">
              <label htmlFor="nijFormat" className="block text-sm font-bold text-zinc-700">
                Format Kustom NIJ
              </label>
              <input
                id="nijFormat"
                type="text"
                value={nijFormat}
                onChange={(e) => setNijFormat(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-mono text-sm bg-zinc-50/50 ${
                  !hasNumberPlaceholder && nijFormat ? "border-rose-300 focus:ring-rose-500" : "border-zinc-200"
                }`}
                placeholder="Contoh: [GEREJA]-[TAHUN]-[NOMOR]"
                required
              />
              {!hasNumberPlaceholder && nijFormat && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  ⚠️ Peringatan: Format harus mengandung tag nomor urut (seperti `[NOMOR INDUK]` atau `[NOMOR]`) agar NIJ unik.
                </p>
              )}
            </div>

            {/* Quick Tags Palette */}
            <div className="space-y-3">
              <span className="block text-xs font-black text-zinc-400 uppercase tracking-wider">
                Klik tag di bawah untuk menambahkan ke format:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleInsertTag("[GEREJA]")}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer"
                >
                  [GEREJA]
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag("[TAHUN]")}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer"
                >
                  [TAHUN]
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag("[NOMOR INDUK]")}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer"
                >
                  [NOMOR INDUK]
                </button>
              </div>
            </div>

            {/* Demographic Age Groupings */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider text-xs">
                Pengelompokan Batas Usia Jemaat
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Atur batas pembagian kelompok usia untuk segmentasi demografi di halaman dasbor jemaat.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="youthThreshold" className="block text-xs font-bold text-zinc-700">
                    Maks. Usia Muda (Kids/Teen/Youth)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="youthThreshold"
                      type="number"
                      min="5"
                      max="40"
                      value={youthThreshold}
                      onChange={(e) => setYouthThreshold(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium bg-zinc-50/50"
                      required
                    />
                    <span className="absolute right-4 text-xs font-bold text-zinc-400">tahun</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="elderlyThreshold" className="block text-xs font-bold text-zinc-700">
                    Min. Usia Lansia (Senior)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="elderlyThreshold"
                      type="number"
                      min="41"
                      max="90"
                      value={elderlyThreshold}
                      onChange={(e) => setElderlyThreshold(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium bg-zinc-50/50"
                      required
                    />
                    <span className="absolute right-4 text-xs font-bold text-zinc-400">tahun</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || (!hasNumberPlaceholder && !!nijFormat)}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Pengaturan</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden h-full flex flex-col justify-between sticky top-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="space-y-6 relative z-10">
              <div>
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Preview NIJ
                </h3>
                <p className="text-zinc-500 text-xs mt-1">
                  Contoh NIJ yang akan digenerate otomatis:
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 font-mono text-center overflow-hidden">
                <span className="text-lg font-bold tracking-wide break-all">
                  {getPreview()}
                </span>
              </div>

              <div className="space-y-3 text-xs text-zinc-400">
                <div className="font-bold text-zinc-300 uppercase tracking-wider text-[10px]">Panduan Tag:</div>
                <div className="flex gap-2">
                  <span className="font-mono text-zinc-300 font-bold shrink-0">[GEREJA]</span>
                  <span>Kode/Inisial Gereja (Contoh: {churchName.trim().split(/\s+/).length > 1 ? churchName.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase() : churchName.toUpperCase() || "GBI"})</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-zinc-300 font-bold shrink-0">[TAHUN]</span>
                  <span>Tahun pendaftaran (Contoh: {new Date().getFullYear()})</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-mono text-zinc-300 font-bold shrink-0">[NOMOR INDUK]</span>
                  <span>Nomor urutan jemaat, 5 digit (Contoh: 00001)</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-zinc-500 mt-6 relative z-10">
              * Karakter literal selain tag di atas akan disimpan apa adanya (contoh spasi, tanda strip, atau karakter khusus lainnya).
            </div>
          </div>
        </div>
      </div>

      {/* ── ATTENDANCE MODE SECTION ─────────────────────────────────────── */}
      <div>
        <div className="mb-4">
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase">Metode Pencatatan Kehadiran</h2>
          <p className="text-sm text-zinc-500 mt-1.5 font-medium">
            Ubah cara gereja mencatat kehadiran jemaat. Perubahan berlaku segera.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm p-6">
          {modeSuccess && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-2xl flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Metode kehadiran berhasil diubah.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BULK Card */}
            <button
              id="settings-mode-bulk"
              onClick={async () => {
                if (attendanceMode === "BULK" || savingMode) return;
                setSavingMode(true);
                setModeSuccess(false);
                await setAttendanceMode("BULK");
                setAttendanceModeState("BULK");
                setModeSuccess(true);
                setSavingMode(false);
                setTimeout(() => setModeSuccess(false), 3000);
              }}
              className={`relative text-left rounded-2xl p-5 border-2 transition-all duration-300 cursor-pointer focus:outline-none ${
                attendanceMode === "BULK"
                  ? "border-zinc-900 bg-zinc-900"
                  : "border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-md"
              } ${savingMode ? "opacity-60 pointer-events-none" : ""}`}
            >
              {attendanceMode === "BULK" && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-3 h-3 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                attendanceMode === "BULK" ? "bg-white/15" : "bg-zinc-100"
              }`}>
                <svg className={`w-5 h-5 ${attendanceMode === "BULK" ? "text-white" : "text-zinc-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                attendanceMode === "BULK" ? "text-white/50" : "text-zinc-400"
              }`}>Metode 1</div>
              <div className={`font-extrabold text-base mb-1 ${attendanceMode === "BULK" ? "text-white" : "text-zinc-900"}`}>
                Absensi Rekap
              </div>
              <div className={`text-xs leading-relaxed ${attendanceMode === "BULK" ? "text-white/60" : "text-zinc-500"}`}>
                Catat total jemaat (Laki-laki & Perempuan) per sesi ibadah secara manual (Absensi Rekap).
              </div>
              {attendanceMode === "BULK" && (
                <div className="mt-3 text-[10px] font-black text-emerald-400 uppercase tracking-wider">● Aktif saat ini</div>
              )}
            </button>

            {/* QR Card */}
            <button
              id="settings-mode-qr"
              onClick={async () => {
                if (attendanceMode === "QR" || savingMode) return;
                setSavingMode(true);
                setModeSuccess(false);
                await setAttendanceMode("QR");
                setAttendanceModeState("QR");
                setModeSuccess(true);
                setSavingMode(false);
                setTimeout(() => setModeSuccess(false), 3000);
              }}
              className={`relative text-left rounded-2xl p-5 border-2 transition-all duration-300 cursor-pointer focus:outline-none ${
                attendanceMode === "QR"
                  ? "border-indigo-600 bg-indigo-600"
                  : "border-zinc-200 bg-white hover:border-indigo-400 hover:shadow-md"
              } ${savingMode ? "opacity-60 pointer-events-none" : ""}`}
            >
              {attendanceMode === "QR" && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                attendanceMode === "QR" ? "bg-white/15" : "bg-indigo-50"
              }`}>
                <svg className={`w-5 h-5 ${attendanceMode === "QR" ? "text-white" : "text-indigo-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                attendanceMode === "QR" ? "text-white/50" : "text-indigo-400"
              }`}>Metode 2</div>
              <div className={`font-extrabold text-base mb-1 ${attendanceMode === "QR" ? "text-white" : "text-zinc-900"}`}>
                Absensi RealTime
              </div>
              <div className={`text-xs leading-relaxed ${attendanceMode === "QR" ? "text-white/60" : "text-zinc-500"}`}>
                Gunakan aplikasi HP clicker untuk mencatat kehadiran jemaat masuk secara real-time.
              </div>
              {attendanceMode === "QR" && (
                <div className="mt-3 text-[10px] font-black text-emerald-400 uppercase tracking-wider">● Aktif saat ini</div>
              )}
            </button>
          </div>

          {!attendanceMode && (
            <p className="mt-4 text-xs text-amber-600 font-semibold flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Metode belum dipilih. Klik salah satu kartu di atas untuk mengaktifkan pencatatan kehadiran.
            </p>
          )}

          {savingMode && (
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 font-semibold">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-zinc-500" />
              Menyimpan perubahan...
            </div>
          )}
        </div>
      </div>

      {/* ── TEMPLATE SURAT AI SECTION ─────────────────────────────────────── */}
      <div className="pt-8 mt-8 border-t border-zinc-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
          <div>
            <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase">Template Surat Keluar (AI)</h2>
            <p className="text-sm text-zinc-500 mt-1.5 font-medium">
              Upload template dokumen (DOCX/PDF) untuk digunakan AI saat membuat surat otomatis.
            </p>
          </div>
          <button onClick={() => setIsUploadModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload Template Baru
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm p-6">
          <div className="space-y-3">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50 hover:bg-white hover:shadow-sm hover:border-zinc-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm ${
                    tmpl.ext === 'DOCX' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {tmpl.ext}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{tmpl.name}</h4>
                    <p className="text-[10px] text-zinc-500 font-medium">Diunggah: {tmpl.date} • {tmpl.size}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditTemplate(tmpl.id, tmpl.name)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDeleteTemplate(tmpl.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="text-center py-6 text-zinc-400 text-xs font-medium italic">
                Belum ada template. Silakan upload template baru.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Modal Upload Template --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-zinc-200 animate-slide-up">
            <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-sm font-extrabold text-zinc-900">Upload Template Baru</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5">
              <form id="upload-template-form" onSubmit={handleUploadTemplate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">Nama Template</label>
                  <input type="text" required value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Contoh: Surat Peringatan" className="w-full text-sm px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-zinc-900" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">File Dokumen (DOCX/PDF)</label>
                  <label className="block border-2 border-dashed border-zinc-200 rounded-xl p-4 text-center bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors">
                    <input 
                      type="file" 
                      accept=".docx,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setTemplateFile(e.target.files[0]);
                          if (!newTemplateName) {
                            setNewTemplateName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                          }
                        }
                      }}
                      className="hidden" 
                    />
                    {!templateFile ? (
                      <>
                        <svg className="w-6 h-6 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p className="text-[11px] font-bold text-zinc-600">Pilih file dari komputer</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-emerald-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-[11px] font-bold text-zinc-800">{templateFile.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 hover:text-rose-500">Klik untuk mengganti</p>
                      </>
                    )}
                  </label>
                </div>
              </form>
            </div>
            <div className="px-5 py-4 border-t border-zinc-100 flex justify-end gap-2 bg-zinc-50/50">
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors">Batal</button>
              <button type="submit" form="upload-template-form" className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors">Simpan Template</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
