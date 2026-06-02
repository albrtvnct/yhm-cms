"use client";

import React, { useEffect, useState, useRef } from "react";
import { getChurchSettings, updateChurchSettings } from "@/app/actions/settings";
import { setAttendanceMode, getKehadiranSetup } from "@/app/actions/attendance";
import { getUsers, addUser, deleteUser } from "@/app/actions/user";
import { getRolePermissions, updateRolePermissions } from "@/app/actions/permissions";
import { getSeksis, addSeksi, deleteSeksi } from "@/app/actions/seksi";
import Portal from "@/components/Portal";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [slug, setSlug] = useState("");
  const [nijFormat, setNijFormat] = useState("");
  const [youthThreshold, setYouthThreshold] = useState(25);
  const [elderlyThreshold, setElderlyThreshold] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [attendanceMode, setAttendanceModeState] = useState<"BULK" | "QR" | null>(null);
  const [savingMode, setSavingMode] = useState(false);
  const [modeSuccess, setModeSuccess] = useState(false);

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const userFormRef = useRef<HTMLFormElement>(null);

  // Permissions State
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState("MAJELIS");
  const [savingPerms, setSavingPerms] = useState(false);

  // Seksi State
  const [seksis, setSeksis] = useState<string[]>([]);
  const [newSeksiName, setNewSeksiName] = useState("");
  const [savingSeksi, setSavingSeksi] = useState(false);

  // Add User Form State
  const [selectedRole, setSelectedRole] = useState("PELAYAN");

  const loadData = async () => {
    const [settingsRes, modeRes, usersRes, permsRes, seksisRes] = await Promise.all([
      getChurchSettings(),
      getKehadiranSetup(),
      getUsers(),
      getRolePermissions(),
      getSeksis(),
    ]);
    if (settingsRes.success && settingsRes.data) {
      setChurchName(settingsRes.data.name);
      setSlug(settingsRes.data.slug || "");
      setNijFormat(settingsRes.data.nijFormat || "[GEREJA]-[TAHUN]-[NOMOR]");
      setYouthThreshold(settingsRes.data.youthThreshold ?? 25);
      setElderlyThreshold(settingsRes.data.elderlyThreshold ?? 50);
    } else {
      setError(settingsRes.error || "Gagal memuat pengaturan.");
    }
    if (modeRes.attendanceMode) {
      setAttendanceModeState(modeRes.attendanceMode as "BULK" | "QR");
    }
    if (usersRes.success && usersRes.data) {
      setUsers(usersRes.data);
    }
    if (permsRes.success && permsRes.data) {
      setRolePermissions(permsRes.data as Record<string, string[]>);
    }
    if (seksisRes.success && seksisRes.data) {
      setSeksis(seksisRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
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
      slug: slug,
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

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUserLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      passwordRaw: formData.get("password") as string,
      role: formData.get("role") as string,
      seksi: formData.get("seksiName") as string || undefined,
    };

    const res = await addUser(data);
    if (res.success) {
      form.reset();
      setShowUserModal(false);
      await loadData();
    } else {
      alert("Gagal menambah pengguna: " + res.error);
    }
    setUserLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Hapus pengguna ini secara permanen?")) return;
    const res = await deleteUser(id);
    if (res.success) {
      await loadData();
    } else {
      alert("Gagal menghapus pengguna: " + res.error);
    }
  };

  const handleSavePermissions = async () => {
    setSavingPerms(true);
    const res = await updateRolePermissions(rolePermissions);
    if (res.success) {
      alert("Hak akses berhasil disimpan.");
    } else {
      alert("Gagal menyimpan hak akses: " + res.error);
    }
    setSavingPerms(false);
  };

  const handleAddSeksi = async () => {
    if (!newSeksiName.trim()) return;
    setSavingSeksi(true);
    const res = await addSeksi(newSeksiName.trim());
    if (res.success) {
      setNewSeksiName("");
      await loadData();
    } else {
      alert("Gagal menambah seksi: " + res.error);
    }
    setSavingSeksi(false);
  };

  const handleDeleteSeksi = async (name: string) => {
    if (!confirm(`Hapus seksi ${name}?`)) return;
    setSavingSeksi(true);
    const res = await deleteSeksi(name);
    if (res.success) {
      await loadData();
    } else {
      alert("Gagal menghapus seksi: " + res.error);
    }
    setSavingSeksi(false);
  };

  const togglePermission = (menuName: string) => {
    setRolePermissions(prev => {
      const current = prev[selectedRoleForPerms] || [];
      const updated = current.includes(menuName)
        ? current.filter(m => m !== menuName)
        : [...current, menuName];
      return { ...prev, [selectedRoleForPerms]: updated };
    });
  };

  const availableMenus = [
    "Dashboard", "Persuratan", "Keuangan & Donasi", "Inventaris", 
    "Jemaat", "Kehadiran", "Pelayanan", "Sakramen", "Visitasi", "Komsel", 
    "Program", "Full timer", "Hamba Tuhan", "Program Gereja", "Pengaturan"
  ];
  const permissionRoles = ["MAJELIS", "DIAKEN", "PENATUA", "GEMBALA SIDANG", "PELAYAN", "SEKSI"];

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

            {/* Portal Slug */}
            <div className="space-y-2">
              <label htmlFor="slug" className="block text-sm font-bold text-zinc-700">
                Link Portal Gereja
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400 font-mono text-sm">/portal/</span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full pl-[5.5rem] pr-24 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-mono font-medium bg-zinc-50/50 text-sm"
                  placeholder="gbi-rock"
                />
                {slug && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/portal/${slug}/login`;
                      navigator.clipboard.writeText(url);
                      alert("Link portal disalin: " + url);
                    }}
                    className="absolute right-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Salin Link
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-1">
                Gunakan URL ini khusus untuk jemaat/pengurus gereja login. Hanya huruf kecil, angka, dan tanda hubung (-).
              </p>
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

      {/* ── USER MANAGEMENT SECTION ─────────────────────────────────────── */}
      <div className="pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase">Manajemen Pengguna</h2>
            <p className="text-sm text-zinc-500 mt-1.5 font-medium">
              Kelola akun pelayan jemaat dengan hak akses berbeda (Admin, Diaken, Majelis, Penatua, dll).
            </p>
          </div>
          <button 
            onClick={() => setShowUserModal(true)}
            className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Akun
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-4 font-bold">Nama / Email</th>
                  <th className="px-6 py-4 font-bold">Role (Jabatan)</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-zinc-900 text-sm">{user.name}</div>
                      <div className="text-xs text-zinc-500 font-medium mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                        user.role === 'ADMIN' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' :
                        user.role === 'GEMBALA SIDANG' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                        title="Hapus Pengguna"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 text-sm italic">
                      Belum ada pengguna.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MANAJEMEN SEKSI ────────────────────────────────────────────── */}
      <div className="pt-8 border-t border-zinc-100">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase">Manajemen Seksi / Divisi</h2>
            <p className="text-sm text-zinc-500 mt-1.5 font-medium">
              Atur daftar seksi yang ada di gereja (misal: Seksi KAA, Seksi Pemuda Remaja, dll).
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm p-6">
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newSeksiName}
              onChange={(e) => setNewSeksiName(e.target.value)}
              placeholder="Contoh: Seksi KAA"
              className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
            />
            <button
              onClick={handleAddSeksi}
              disabled={savingSeksi || !newSeksiName.trim()}
              className="px-5 py-2 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-zinc-800 disabled:bg-zinc-400 transition-all shadow-md"
            >
              Tambah Seksi
            </button>
          </div>

          {seksis.length === 0 ? (
            <div className="text-sm text-zinc-500 italic p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
              Belum ada daftar seksi.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {seksis.map((seksi, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                  <span>{seksi}</span>
                  <button 
                    onClick={() => handleDeleteSeksi(seksi)}
                    disabled={savingSeksi}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ROLE PERMISSIONS SECTION ─────────────────────────────────────── */}
      <div className="pt-8 border-t border-zinc-100">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase">Pengaturan Hak Akses (RBAC)</h2>
            <p className="text-sm text-zinc-500 mt-1.5 font-medium">
              Atur menu apa saja yang bisa dilihat oleh setiap jabatan (Role). Role ADMIN mutlak memiliki semua akses.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {permissionRoles.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRoleForPerms(r)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedRoleForPerms === r 
                    ? "bg-zinc-900 text-white shadow-md" 
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold text-zinc-900 mb-4">Akses Menu untuk {selectedRoleForPerms}:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableMenus.map(menu => {
                const isChecked = (rolePermissions[selectedRoleForPerms] || []).includes(menu);
                return (
                  <label key={menu} className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-400 transition-colors">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(menu)}
                        className="peer appearance-none w-5 h-5 border-2 border-zinc-300 rounded focus:ring-2 focus:ring-zinc-900 focus:outline-none checked:border-zinc-900 checked:bg-zinc-900 transition-all cursor-pointer"
                      />
                      <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-zinc-700 select-none">{menu}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSavePermissions}
              disabled={savingPerms}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {savingPerms ? "Menyimpan..." : "Simpan Hak Akses"}
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL TAMBAH USER ─────────────────────────────────────────── */}
      {showUserModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-zinc-200/60">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-zinc-900">Tambah Akun Baru</h2>
                    <p className="text-xs text-zinc-500 font-medium mt-1">Buat kredensial login untuk tim.</p>
                  </div>
                  <button 
                    onClick={() => setShowUserModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form ref={userFormRef} onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nama Lengkap</label>
                    <input name="name" type="text" required placeholder="Contoh: Budi Santoso" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Email</label>
                    <input name="email" type="email" required placeholder="budi@example.com" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Jabatan (Role)</label>
                    <select name="role" required value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-700 font-medium">
                      <option value="">-- Pilih Jabatan --</option>
                      <option value="ADMIN">Admin Utama</option>
                      <option value="MAJELIS">Majelis</option>
                      <option value="DIAKEN">Diaken</option>
                      <option value="PENATUA">Penatua</option>
                      <option value="GEMBALA SIDANG">Gembala Sidang</option>
                      <option value="PELAYAN">Pelayan Divisi / PIC</option>
                      <option value="SEKSI">Seksi</option>
                    </select>
                  </div>
                  {selectedRole === "SEKSI" && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">Pilih Seksi <span className="text-rose-500">*</span></label>
                      {seksis.length === 0 ? (
                        <div className="text-xs text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-100 font-medium">
                          Belum ada seksi terdaftar. Silakan buat di menu Manajemen Seksi terlebih dahulu.
                        </div>
                      ) : (
                        <select name="seksiName" required className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-zinc-700 font-medium">
                          <option value="">-- Pilih Seksi --</option>
                          {seksis.map((s, idx) => (
                            <option key={idx} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Password Sementara</label>
                    <input name="password" type="password" required placeholder="Minimal 6 karakter" minLength={6} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                    <button type="button" onClick={() => setShowUserModal(false)} className="px-5 py-2.5 text-zinc-500 font-bold hover:bg-zinc-100 rounded-xl transition-colors text-sm">Batal</button>
                    <button type="submit" disabled={userLoading} className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
                      {userLoading ? 'Menyimpan...' : 'Buat Akun'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
