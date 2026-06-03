"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import {
  getSuperAdminStats,
  getChurchesWithStats,
  createChurchAction,
  updateChurchLimitsAction,
  deleteChurchAction,
  getChurchAdmins,
  addChurchAdminAction,
  deleteChurchAdminAction,
} from "@/app/actions/super-admin";

const FEATURES_LIST = [
  "Program Gereja",
  "Persuratan",
  "Keuangan & Donasi",
  "Inventaris",
  "Jemaat",
  "Ibadah",
  "Pelayanan",
  "Sakramen",
  "Visitasi",
  "Komsel",
  "Program",
  "Full timer",
  "Hamba Tuhan",
];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"churches" | "create">("churches");

  // Notification states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New Church Form State
  const [newChurch, setNewChurch] = useState({
    name: "",
    slug: "",
    maxMembers: 100,
    maxWorkers: 10,
    maxUsers: 5,
    allowedMenus: [...FEATURES_LIST],
  });
  const [submittingChurch, setSubmittingChurch] = useState(false);

  // Edit Limits Modal State
  const [editingChurch, setEditingChurch] = useState<any>(null);
  const [editLimits, setEditLimits] = useState({
    maxMembers: 100,
    maxWorkers: 10,
    maxUsers: 5,
    allowedMenus: [] as string[],
  });
  const [savingLimits, setSavingLimits] = useState(false);

  // Manage Admins Modal State
  const [managingAdminsChurch, setManagingAdminsChurch] = useState<any>(null);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    passwordRaw: "",
  });
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await getSuperAdminStats();
      const churchesRes = await getChurchesWithStats();

      if (statsRes.success) setStats(statsRes.data);
      if (churchesRes.success) setChurches(churchesRes.data || []);
    } catch (e: any) {
      setErrorMsg("Gagal memuat data: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
  };

  // Register Church
  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmittingChurch(true);

    try {
      const res = await createChurchAction({
        name: newChurch.name,
        slug: newChurch.slug,
        maxMembers: Number(newChurch.maxMembers),
        maxWorkers: Number(newChurch.maxWorkers),
        maxUsers: Number(newChurch.maxUsers),
        allowedMenus: newChurch.allowedMenus,
      });

      if (res.success) {
        setSuccessMsg(`Gereja "${newChurch.name}" berhasil dibuat.`);
        setNewChurch({
          name: "",
          slug: "",
          maxMembers: 100,
          maxWorkers: 10,
          maxUsers: 5,
          allowedMenus: [...FEATURES_LIST],
        });
        setActiveTab("churches");
        loadDashboardData();
      } else {
        setErrorMsg(res.error || "Gagal membuat gereja.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingChurch(false);
    }
  };

  // Toggle feature selection in creation form
  const toggleFeatureInCreation = (feature: string) => {
    setNewChurch((prev) => {
      const exists = prev.allowedMenus.includes(feature);
      const updated = exists
        ? prev.allowedMenus.filter((f) => f !== feature)
        : [...prev.allowedMenus, feature];
      return { ...prev, allowedMenus: updated };
    });
  };

  // Open Limits Editor
  const openLimitsModal = (church: any) => {
    setEditingChurch(church);
    setEditLimits({
      maxMembers: church.maxMembers,
      maxWorkers: church.maxWorkers,
      maxUsers: church.maxUsers,
      allowedMenus: church.allowedMenus || [],
    });
  };

  // Save Limits Edit
  const handleSaveLimits = async () => {
    if (!editingChurch) return;
    setErrorMsg("");
    setSuccessMsg("");
    setSavingLimits(true);

    try {
      const res = await updateChurchLimitsAction(editingChurch.id, {
        maxMembers: Number(editLimits.maxMembers),
        maxWorkers: Number(editLimits.maxWorkers),
        maxUsers: Number(editLimits.maxUsers),
        allowedMenus: editLimits.allowedMenus,
      });

      if (res.success) {
        setSuccessMsg(`Limitasi untuk "${editingChurch.name}" berhasil diperbarui.`);
        setEditingChurch(null);
        loadDashboardData();
      } else {
        setErrorMsg(res.error || "Gagal memperbarui limitasi.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSavingLimits(false);
    }
  };

  const toggleFeatureInEdit = (feature: string) => {
    setEditLimits((prev) => {
      const exists = prev.allowedMenus.includes(feature);
      const updated = exists
        ? prev.allowedMenus.filter((f) => f !== feature)
        : [...prev.allowedMenus, feature];
      return { ...prev, allowedMenus: updated };
    });
  };

  // Delete Church
  const handleDeleteChurch = async (church: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus gereja "${church.name}" beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await deleteChurchAction(church.id);
      if (res.success) {
        setSuccessMsg(`Gereja "${church.name}" telah dihapus.`);
        loadDashboardData();
      } else {
        setErrorMsg(res.error || "Gagal menghapus gereja.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Open User Admins Manager
  const openAdminsModal = async (church: any) => {
    setManagingAdminsChurch(church);
    setLoadingAdmins(true);
    setNewAdmin({ name: "", email: "", passwordRaw: "" });
    try {
      const res = await getChurchAdmins(church.id);
      if (res.success) {
        setAdminsList(res.data || []);
      } else {
        setErrorMsg(res.error || "Gagal mengambil data admin.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Create User Admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingAdminsChurch) return;
    setErrorMsg("");
    setAddingAdmin(true);

    try {
      const res = await addChurchAdminAction(managingAdminsChurch.id, newAdmin);
      if (res.success) {
        setNewAdmin({ name: "", email: "", passwordRaw: "" });
        // Reload list
        const listRes = await getChurchAdmins(managingAdminsChurch.id);
        if (listRes.success) setAdminsList(listRes.data || []);
        loadDashboardData(); // update stats
        alert("Akun Admin berhasil ditambahkan!");
      } else {
        setErrorMsg(res.error || "Gagal menambahkan admin.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setAddingAdmin(false);
    }
  };

  // Delete User Admin
  const handleDeleteAdmin = async (userId: string) => {
    if (!managingAdminsChurch || !confirm("Apakah Anda yakin ingin menghapus akun admin ini?")) return;
    setErrorMsg("");

    try {
      const res = await deleteChurchAdminAction(managingAdminsChurch.id, userId);
      if (res.success) {
        // Reload list
        const listRes = await getChurchAdmins(managingAdminsChurch.id);
        if (listRes.success) setAdminsList(listRes.data || []);
        loadDashboardData();
      } else {
        setErrorMsg(res.error || "Gagal menghapus admin.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background aesthetic glow */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-900/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Premium Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              ✝ Yesh<span className="text-amber-500">CMS</span>
              <span className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 font-medium">SUPER ADMIN</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:text-white transition-all text-xs font-bold tracking-wide flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout container */}
      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">

        {/* Global Notifications */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-800/50 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="flex-1">{errorMsg}</span>
            <button className="text-red-400 hover:text-red-200" onClick={() => setErrorMsg("")}>✕</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl text-emerald-400 text-sm flex items-center gap-3 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="flex-1">{successMsg}</span>
            <button className="text-emerald-400 hover:text-emerald-200" onClick={() => setSuccessMsg("")}>✕</button>
          </div>
        )}

        {/* Metrics Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Churches Card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-sm hover:border-zinc-800 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
              <div className="text-zinc-500 text-xs font-black tracking-widest uppercase mb-1">TOTAL GEREJA</div>
              <div className="text-3xl font-black text-white">{stats?.totalChurches ?? 0}</div>
              <div className="text-[10px] text-zinc-500 mt-2">Gereja aktif terdaftar</div>
            </div>

            {/* Members Card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-sm hover:border-zinc-800 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
              <div className="text-zinc-500 text-xs font-black tracking-widest uppercase mb-1">TOTAL JEMAAT</div>
              <div className="text-3xl font-black text-white">{(stats?.totalMembers ?? 0).toLocaleString()}</div>
              <div className="text-[10px] text-zinc-500 mt-2">Anggota jemaat gabungan</div>
            </div>

            {/* Workers Card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-sm hover:border-zinc-800 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
              <div className="text-zinc-500 text-xs font-black tracking-widest uppercase mb-1">PELAYAN & PEKERJA</div>
              <div className="text-3xl font-black text-white">{stats?.totalWorkers ?? 0}</div>
              <div className="text-[10px] text-zinc-500 mt-2">Hamba tuhan & staff</div>
            </div>

            {/* Admins Card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 relative overflow-hidden group shadow-sm hover:border-zinc-800 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
              <div className="text-zinc-500 text-xs font-black tracking-widest uppercase mb-1">TOTAL PENGGUNA</div>
              <div className="text-3xl font-black text-white">{stats?.totalUsers ?? 0}</div>
              <div className="text-[10px] text-zinc-500 mt-2">Akun administrator terdaftar</div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 mb-8 gap-4">
          <button
            onClick={() => setActiveTab("churches")}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 px-1 cursor-pointer ${
              activeTab === "churches"
                ? "border-amber-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Kelola Gereja
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`pb-4 text-sm font-bold tracking-wide transition-all border-b-2 px-1 cursor-pointer ${
              activeTab === "create"
                ? "border-amber-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Registrasi Gereja Baru
          </button>
        </div>

        {/* TAB 1: CHURCHES LIST */}
        {activeTab === "churches" && (
          <div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-44 bg-zinc-950 border border-zinc-900 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : churches.length === 0 ? (
              <div className="text-center py-16 bg-zinc-950 border border-zinc-900 rounded-3xl">
                <p className="text-zinc-500 text-sm">Belum ada gereja yang didaftarkan.</p>
                <button 
                  onClick={() => setActiveTab("create")}
                  className="mt-4 px-5 py-2.5 bg-amber-500 text-zinc-950 font-bold rounded-2xl hover:bg-amber-400 transition-all text-xs"
                >
                  Tambah Gereja Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {churches.map((church) => {
                  const mUsed = church._count.members;
                  const mMax = church.maxMembers;
                  const mPercent = mMax === -1 ? 0 : Math.min(100, Math.round((mUsed / mMax) * 100));

                  const wUsed = church._count.workers;
                  const wMax = church.maxWorkers;
                  const wPercent = wMax === -1 ? 0 : Math.min(100, Math.round((wUsed / wMax) * 100));

                  const uUsed = church._count.users;
                  const uMax = church.maxUsers;
                  const uPercent = uMax === -1 ? 0 : Math.min(100, Math.round((uUsed / uMax) * 100));

                  return (
                    <div 
                      key={church.id}
                      className="bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg lg:text-xl font-bold text-white tracking-tight">{church.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400">
                            /{church.slug}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Dibuat: {new Date(church.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          <span>•</span>
                          <span>Fitur Aktif: {church.allowedMenus.length} dari {FEATURES_LIST.length}</span>
                        </div>

                        {/* Capacity Utilization Progress Bars */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-4 border-t border-zinc-900/60 max-w-3xl">
                          {/* Member progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-zinc-400">
                              <span>Jemaat</span>
                              <span>{mUsed} / {mMax === -1 ? "∞" : mMax}</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${mPercent >= 90 ? "bg-red-500" : mPercent >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                                style={{ width: mMax === -1 ? "10%" : `${mPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* Worker progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-zinc-400">
                              <span>Pelayan</span>
                              <span>{wUsed} / {wMax === -1 ? "∞" : wMax}</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${wPercent >= 90 ? "bg-red-500" : wPercent >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                                style={{ width: wMax === -1 ? "10%" : `${wPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* User progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-zinc-400">
                              <span>Akun Pengurus</span>
                              <span>{uUsed} / {uMax === -1 ? "∞" : uMax}</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${uPercent >= 90 ? "bg-red-500" : uPercent >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                                style={{ width: uMax === -1 ? "10%" : `${uPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Church Actions Column */}
                      <div className="flex flex-wrap lg:flex-nowrap gap-3 shrink-0 items-center justify-start lg:justify-end mt-4 lg:mt-0">
                        <button
                          onClick={() => openLimitsModal(church)}
                          className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-2xl text-xs font-bold text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          Limit & Fitur
                        </button>
                        <button
                          onClick={() => openAdminsModal(church)}
                          className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-2xl text-xs font-bold text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Kelola Admin
                        </button>
                        <button
                          onClick={() => handleDeleteChurch(church)}
                          className="px-4 py-2.5 bg-red-950/20 border border-red-900/50 hover:bg-red-900/20 hover:text-red-200 rounded-2xl text-xs font-bold text-red-400 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTER NEW CHURCH */}
        {activeTab === "create" && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 lg:p-10 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-2">Registrasi Gereja Baru</h3>
            <p className="text-zinc-500 text-xs mb-8">Daftarkan gereja baru ke dalam platform dan tentukan spesifikasi awal akun.</p>

            <form onSubmit={handleCreateChurch} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Church Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">NAMA GEREJA</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: GBI Revival Center"
                    value={newChurch.name}
                    onChange={(e) => setNewChurch({ ...newChurch, name: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Slug portal */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">SLUG PORTAL URL (Hanya huruf kecil, angka, strip)</label>
                  <div className="flex items-center">
                    <span className="bg-zinc-900 border border-zinc-800 border-r-0 rounded-l-2xl px-4 py-3 text-sm text-zinc-500 font-medium shrink-0">
                      /portal/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="gbi-revival"
                      value={newChurch.slug}
                      onChange={(e) => setNewChurch({ ...newChurch, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-r-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Max Members */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">BATAS MAKSIMAL JEMAAT (-1 = Tanpa Batas)</label>
                  <input
                    type="number"
                    required
                    value={newChurch.maxMembers}
                    onChange={(e) => setNewChurch({ ...newChurch, maxMembers: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Max Workers */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">BATAS MAKSIMAL PELAYAN/PEKERJA (-1 = Tanpa Batas)</label>
                  <input
                    type="number"
                    required
                    value={newChurch.maxWorkers}
                    onChange={(e) => setNewChurch({ ...newChurch, maxWorkers: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Max Users */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">BATAS MAKSIMAL AKUN PENGURUS (-1 = Tanpa Batas)</label>
                  <input
                    type="number"
                    required
                    value={newChurch.maxUsers}
                    onChange={(e) => setNewChurch({ ...newChurch, maxUsers: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Feature selections */}
              <div className="space-y-3 pt-4 border-t border-zinc-900">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">AKSES FITUR & MENU</label>
                <p className="text-zinc-500 text-xs">Pilih fitur yang boleh diakses oleh gereja ini.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  {FEATURES_LIST.map((feature) => {
                    const isChecked = newChurch.allowedMenus.includes(feature);
                    return (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => toggleFeatureInCreation(feature)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all text-xs font-semibold cursor-pointer ${
                          isChecked 
                            ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400" 
                            : "bg-zinc-900/50 border-zinc-800/80 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isChecked ? "bg-indigo-500 border-indigo-500 text-white" : "border-zinc-700 text-transparent"
                        }`}>
                          ✓
                        </span>
                        {feature}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submittingChurch}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold rounded-2xl transition-all tracking-wide text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submittingChurch ? "Mendaftarkan..." : "Daftarkan Gereja"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODAL 1: EDIT LIMITS & FEATURES */}
      {editingChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl p-6 lg:p-8 space-y-6 shadow-2xl relative">
            <button 
              className="absolute top-6 right-6 text-zinc-500 hover:text-white"
              onClick={() => setEditingChurch(null)}
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Kelola Limitasi & Fitur</h3>
              <p className="text-zinc-500 text-xs">Atur limitasi kapasitas dan akses fitur untuk gereja: <span className="font-semibold text-zinc-300">{editingChurch.name}</span></p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">LIMIT JEMAAT</label>
                <input
                  type="number"
                  value={editLimits.maxMembers}
                  onChange={(e) => setEditLimits({ ...editLimits, maxMembers: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">LIMIT PELAYAN</label>
                <input
                  type="number"
                  value={editLimits.maxWorkers}
                  onChange={(e) => setEditLimits({ ...editLimits, maxWorkers: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">LIMIT AKUN PENGURUS</label>
                <input
                  type="number"
                  value={editLimits.maxUsers}
                  onChange={(e) => setEditLimits({ ...editLimits, maxUsers: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block">AKSES FITUR & MENU</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {FEATURES_LIST.map((feature) => {
                  const isChecked = editLimits.allowedMenus.includes(feature);
                  return (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeatureInEdit(feature)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all text-xs font-semibold cursor-pointer ${
                        isChecked 
                          ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400" 
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] font-black transition-all ${
                        isChecked ? "bg-indigo-500 border-indigo-500 text-white" : "border-zinc-700 text-transparent"
                      }`}>
                        ✓
                      </span>
                      {feature}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-900 justify-end">
              <button 
                onClick={() => setEditingChurch(null)}
                className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-xs rounded-xl hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveLimits}
                disabled={savingLimits}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                {savingLimits ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE CHURCH ADMIN ACCOUNTS */}
      {managingAdminsChurch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-3xl p-6 lg:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-6 right-6 text-zinc-500 hover:text-white"
              onClick={() => setManagingAdminsChurch(null)}
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Kelola Akun Administrator</h3>
              <p className="text-zinc-500 text-xs">Tambahkan dan kelola admin untuk gereja: <span className="font-semibold text-zinc-300">{managingAdminsChurch.name}</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Add Admin Form */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-white">Tambah Admin Baru</h4>
                <form onSubmit={handleAddAdmin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">NAMA ADMIN</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">EMAIL LOGIN</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@email.com"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">PASSWORD AKSES</label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 karakter"
                      value={newAdmin.passwordRaw}
                      onChange={(e) => setNewAdmin({ ...newAdmin, passwordRaw: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingAdmin}
                    className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {addingAdmin ? "Mendaftarkan..." : "Registrasi Akun Admin"}
                  </button>
                </form>
              </div>

              {/* Admins List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Akun Admin Terdaftar</h4>
                {loadingAdmins ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-14 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : adminsList.length === 0 ? (
                  <div className="p-6 border border-dashed border-zinc-800 rounded-2xl text-center">
                    <p className="text-zinc-500 text-xs">Belum ada akun admin yang dibuat.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {adminsList.map((admin) => (
                      <div 
                        key={admin.id}
                        className="flex items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl"
                      >
                        <div className="space-y-0.5 overflow-hidden flex-1 pr-3">
                          <p className="text-xs font-bold text-white truncate">{admin.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{admin.email}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-200 border border-red-900/30 rounded-lg transition-all text-[10px] font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-900">
              <button 
                onClick={() => setManagingAdminsChurch(null)}
                className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-xs rounded-xl hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
