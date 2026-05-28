"use client";

import React, { useEffect, useState } from 'react';
import { getJemaatData, addMember, updateMember, deleteMember } from '@/app/actions/jemaat';
import Portal from '@/components/Portal';

export default function JemaatDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'analyzed' | 'error'>('idle');
  const [insightText, setInsightText] = useState<string>('');

  // Modals state
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Age grouping thresholds & expand states
  const [youthThreshold, setYouthThreshold] = useState(25);
  const [elderlyThreshold, setElderlyThreshold] = useState(50);
  const [youthOpen, setYouthOpen] = useState(false);
  const [adultOpen, setAdultOpen] = useState(false);
  const [elderlyOpen, setElderlyOpen] = useState(false);

  const handleYouthChange = (val: number) => {
    setYouthThreshold(val);
  };

  const handleElderlyChange = (val: number) => {
    setElderlyThreshold(val);
  };

  const getAge = (birthDateStr: string | Date | null) => {
    if (!birthDateStr) return null;
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const load = async () => {
    setLoading(true);
    const res = await getJemaatData();
    if (res.success && res.data) {
      setData(res.data);
      if (res.data.settings) {
        setYouthThreshold(res.data.settings.youthThreshold);
        setElderlyThreshold(res.data.settings.elderlyThreshold);
      }
      if (res.data.aiInsight) {
        setInsightText(res.data.aiInsight);
        setAiState('analyzed');
      }
    } else {
      console.error(res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  // Calculate statistics
  const members = data.members || [];
  const total = members.length;

  // 1. Baptis
  const baptizedCount = members.filter((m: any) => m.isBaptized).length;
  const unbaptizedCount = total - baptizedCount;
  const baptizedPercent = total > 0 ? Math.round((baptizedCount / total) * 100) : 0;

  // 2. Pernikahan
  const marriedCount = members.filter((m: any) => m.maritalStatus?.toLowerCase().startsWith("menikah")).length;
  const singleCount = total - marriedCount;
  const marriedPercent = total > 0 ? Math.round((marriedCount / total) * 100) : 0;

  // 3. Komsel
  const inKomselCount = members.filter((m: any) => m.cellGroup && m.cellGroup.trim() !== "").length;
  const notInKomselCount = total - inKomselCount;
  const komselPercent = total > 0 ? Math.round((inKomselCount / total) * 100) : 0;

  // 4. Pelayanan
  const inMinistryCount = members.filter((m: any) => m.ministries && m.ministries.trim() !== "").length;
  const notInMinistryCount = total - inMinistryCount;
  const ministryPercent = total > 0 ? Math.round((inMinistryCount / total) * 100) : 0;

  // Gender
  const maleCount = members.filter((m: any) => m.gender?.toLowerCase() === "laki-laki" || m.gender?.toLowerCase() === "pria").length;
  const femaleCount = members.filter((m: any) => m.gender?.toLowerCase() === "perempuan" || m.gender?.toLowerCase() === "wanita").length;
  const unknownGenderCount = total - (maleCount + femaleCount);
  const malePercent = total > 0 ? Math.round((maleCount / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 0;

  // Age Groups
  const youthGroup: any[] = [];
  const adultGroup: any[] = [];
  const elderlyGroup: any[] = [];
  const unknownAgeGroup: any[] = [];

  members.forEach((member: any) => {
    const age = getAge(member.birthDate);
    if (age === null) {
      unknownAgeGroup.push(member);
    } else if (age <= youthThreshold) {
      youthGroup.push({ ...member, age });
    } else if (age >= elderlyThreshold) {
      elderlyGroup.push({ ...member, age });
    } else {
      adultGroup.push({ ...member, age });
    }
  });

  // Calculate Growth Data over last 6 months
  const getGrowthData = () => {
    const today = new Date();
    const monthsData: { label: string; count: number; date: Date }[] = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      monthsData.push({ label, count: 0, date: new Date(d.getFullYear(), d.getMonth() + 1, 0) });
    }

    // Calculate cumulative count for each month
    monthsData.forEach(month => {
      const count = members.filter((m: any) => {
        const joinDate = new Date(m.joinDate || m.createdAt);
        return joinDate <= month.date;
      }).length;
      month.count = count;
    });

    return monthsData;
  };

  const growthData = getGrowthData();
  const maxGrowthCount = Math.max(...growthData.map(d => d.count), 1);

  const handleRequestAI = async () => {
    setAiState('loading');
    try {
      const res = await fetch('/api/ai/jemaat', { method: 'POST' });
      const resData = await res.json();
      
      if (!res.ok) throw new Error(resData.error || 'Terjadi kesalahan jaringan.');
      
      setInsightText(resData.insight);
      setAiState('analyzed');
    } catch (err: any) {
      setInsightText(err.message || 'Gagal mengambil analisis.');
      setAiState('error');
    }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setFormLoading(true);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    
    const res = await addMember(payload);
    if (res.success) {
      form.reset();
      setShowAddModal(false);
      await load();
    } else {
      alert("Gagal menambahkan jemaat: " + res.error);
    }
    setFormLoading(false);
  };

  const handleUpdateMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setFormLoading(true);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    
    const res = await updateMember(selectedProfile.id, payload);
    if (res.success) {
      form.reset();
      setShowEditModal(false);
      setSelectedProfile(null); // Close detail modal to refresh selection
      await load();
    } else {
      alert("Gagal memperbarui jemaat: " + res.error);
    }
    setFormLoading(false);
  };

  const handleDeleteMember = async () => {
    if (!confirm(`Hapus permanen jemaat ${selectedProfile.name}?`)) return;
    
    const res = await deleteMember(selectedProfile.id);
    if (res.success) {
      setSelectedProfile(null);
      await load();
    } else {
      alert("Gagal menghapus jemaat: " + res.error);
    }
  };

  const handleSendWA = (phone: string | null, name: string) => {
    if (!phone) {
      alert("Nomor WhatsApp tidak tersedia untuk jemaat ini.");
      return;
    }
    // Bersihkan nomor dari spasi, plus, atau strip
    let cleanPhone = phone.replace(/[\+\-\s]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }
    const message = encodeURIComponent(`Shalom ${name}, \n\nKami dari tim admin gereja ingin menyapa Anda...`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-10 animate-fade-in-up pb-12 font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Data Jemaat</h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">Kelola data keanggotaan, histori pelayanan, dan analisis jemaat.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border-2 border-zinc-200/80 text-zinc-700 text-sm font-bold rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Impor/Ekspor
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Jemaat Baru
          </button>
        </div>
      </div>

      <div className="max-w-6xl space-y-10">
        
        {/* STATISTIK JEMAAT TERDAFTAR */}
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Statistik Jemaat Terdaftar</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {/* Total Jemaat */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                Total Jemaat
              </div>
              <div>
                <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{total.toLocaleString('id-ID')}</div>
                <div className="text-xs text-zinc-400 mt-1 font-medium">Jemaat terdaftar resmi</div>
              </div>
            </div>

            {/* Status Baptis */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 21.5c-4.142 0-7.5-3.358-7.5-7.5C4.5 9.4 12 2.5 12 2.5S19.5 9.4 19.5 14c0 4.142-3.358 7.5-7.5 7.5z" /></svg>
                </div>
                Status Baptis
              </div>
              <div>
                <div className="text-xl font-extrabold text-zinc-900 tracking-tight">Sudah: {baptizedCount}</div>
                <div className="text-xs text-zinc-400 mt-1 font-medium flex justify-between">
                  <span>Belum: {unbaptizedCount}</span>
                  <span className="text-purple-600 font-bold">{baptizedPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-purple-600 h-full" style={{ width: `${baptizedPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Status Pernikahan */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                Status Pernikahan
              </div>
              <div>
                <div className="text-xl font-extrabold text-zinc-900 tracking-tight">Menikah: {marriedCount}</div>
                <div className="text-xs text-zinc-400 mt-1 font-medium flex justify-between">
                  <span>Belum: {singleCount}</span>
                  <span className="text-rose-600 font-bold">{marriedPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-rose-50 h-full" style={{ width: `${marriedPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Keanggotaan Komsel */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
                Keanggotaan Komsel
              </div>
              <div>
                <div className="text-xl font-extrabold text-zinc-900 tracking-tight">Join: {inKomselCount}</div>
                <div className="text-xs text-zinc-400 mt-1 font-medium flex justify-between">
                  <span>Belum: {notInKomselCount}</span>
                  <span className="text-blue-600 font-bold">{komselPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${komselPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Aktif Melayani */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
                Aktif Melayani
              </div>
              <div>
                <div className="text-xl font-extrabold text-zinc-900 tracking-tight">Melayani: {inMinistryCount}</div>
                <div className="text-xs text-zinc-400 mt-1 font-medium flex justify-between">
                  <span>Belum: {notInMinistryCount}</span>
                  <span className="text-amber-600 font-bold">{ministryPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${ministryPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GENDER & PERTUMBUHAN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jumlah Per Gender */}
          <div className="lg:col-span-1">
            <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Distribusi Gender</h2>
            <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm p-6 flex flex-col justify-between h-full min-h-[340px]">
              <div>
                <div className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Jumlah Per Gender
                </div>

                <div className="space-y-6">
                  {/* Laki-laki */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-zinc-700 flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        Laki-laki (Pria)
                      </span>
                      <span className="font-extrabold text-zinc-900">{maleCount} ({malePercent}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${malePercent}%` }}></div>
                    </div>
                  </div>

                  {/* Perempuan */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-zinc-700 flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                        Perempuan (Wanita)
                      </span>
                      <span className="font-extrabold text-zinc-900">{femaleCount} ({femalePercent}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-rose-50 h-full rounded-full transition-all duration-500" style={{ width: `${femalePercent}%` }}></div>
                    </div>
                  </div>

                  {/* Unknown */}
                  {unknownGenderCount > 0 && (
                    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl flex justify-between items-center text-xs text-zinc-500 font-semibold">
                      <span>Belum diisi</span>
                      <span>{unknownGenderCount} jemaat</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Split Bar */}
              <div className="pt-6 border-t border-zinc-100 mt-6">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">Visual Perbandingan</div>
                <div className="w-full h-4 rounded-xl overflow-hidden flex bg-zinc-100">
                  <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${total > 0 ? (maleCount / total) * 100 : 50}%` }} title={`Laki-laki: ${malePercent}%`}></div>
                  <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${total > 0 ? (femaleCount / total) * 100 : 50}%` }} title={`Perempuan: ${femalePercent}%`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Pertumbuhan Jemaat */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Pertumbuhan</h2>
            <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm p-6 flex flex-col justify-between h-full min-h-[340px]">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Tren Pertumbuhan Jemaat
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">6 Bulan Terakhir</span>
                </div>

                {/* Growth Bar Chart */}
                <div className="h-44 flex items-end justify-between gap-4 pb-4 border-b border-zinc-100 relative mt-4">
                  {/* Grid Lines */}
                  <div className="absolute left-0 right-0 top-0 bottom-4 flex flex-col justify-between pointer-events-none">
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
                            {/* Cumulative Count Tooltip */}
                            <div className="absolute -top-8 bg-zinc-900 text-white text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-md whitespace-nowrap z-20">
                              {val.count} Jemaat
                            </div>
                            <span className="text-[9px] font-black text-white mb-1 opacity-80 group-hover:opacity-100 hidden sm:inline">{val.count}</span>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 mt-2">{val.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 font-semibold mt-4">
                * Angka menunjukkan total jemaat terdaftar secara kumulatif pada akhir tiap bulan.
              </div>
            </div>
          </div>
        </div>

        {/* AI ANALYST BANNER (FULL WIDTH) */}
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">AI Analyst</h2>
          <div className="bg-zinc-900 rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-[90px] rounded-full pointer-events-none transition-all group-hover:bg-purple-500/20"></div>
            
            <div className="relative z-10 flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                  Analisis Demografi & Kehadiran Jemaat
                </h3>
                
                <div className="mt-4">
                  {aiState === 'idle' ? (
                    <div className="text-sm text-zinc-400 italic border-l-2 border-purple-500/30 pl-4 py-2">
                      Sistem AI ChurchOS siap menganalisis pola kehadiran, data kelompok usia, dan memberikan rekomendasi penjangkauan jemaat secara instan.
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
                  <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">Program retensi</button>
                  <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">Segmentasi usia</button>
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

        {/* PENGELOMPOKAN USIA (AGE GROUPINGS) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 ml-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase">Pengelompokan Demografi Usia</h2>
              <a href="/dashboard/pengaturan" className="text-zinc-400 hover:text-zinc-900 transition-colors" title="Ubah Batas Usia di Pengaturan">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </a>
            </div>
            
            {/* Interactive Threshold Set Controls */}
            <div className="flex items-center gap-4 bg-white border border-zinc-200/60 px-4 py-2 rounded-2xl shadow-sm text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Maks. Muda:</span>
                <input
                  type="number"
                  min="5"
                  max="40"
                  value={youthThreshold}
                  onChange={(e) => handleYouthChange(Math.max(5, Math.min(40, Number(e.target.value))))}
                  className="w-10 text-center font-extrabold border border-zinc-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-zinc-50 cursor-pointer"
                />
                <span className="text-zinc-400">th</span>
              </div>
              <div className="w-px h-4 bg-zinc-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Min. Lansia:</span>
                <input
                  type="number"
                  min="41"
                  max="90"
                  value={elderlyThreshold}
                  onChange={(e) => handleElderlyChange(Math.max(41, Math.min(90, Number(e.target.value))))}
                  className="w-10 text-center font-extrabold border border-zinc-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-zinc-50 cursor-pointer"
                />
                <span className="text-zinc-400">th</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Youth Group Card */}
            <div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Kids, Teen, Youth</h3>
                    <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Usia ≤ {youthThreshold} tahun</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Muda</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-zinc-900">{youthGroup.length}</span>
                  <span className="text-xs font-bold text-zinc-400">jemaat ({total > 0 ? Math.round((youthGroup.length / total) * 100) : 0}%)</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setYouthOpen(!youthOpen)}
                  className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{youthOpen ? "Tutup Daftar" : "Lihat Daftar Anggota"}</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${youthOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Adult Group Card */}
            <div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Dewasa (Produktif)</h3>
                    <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Usia {youthThreshold + 1} - {elderlyThreshold - 1} tahun</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Produktif</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-zinc-900">{adultGroup.length}</span>
                  <span className="text-xs font-bold text-zinc-400">jemaat ({total > 0 ? Math.round((adultGroup.length / total) * 100) : 0}%)</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setAdultOpen(!adultOpen)}
                  className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{adultOpen ? "Tutup Daftar" : "Lihat Daftar Anggota"}</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${adultOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Elderly Group Card */}
            <div className="bg-white border border-zinc-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Lansia (Senior)</h3>
                    <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">Usia ≥ {elderlyThreshold} tahun</p>
                  </div>
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Senior</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-zinc-900">{elderlyGroup.length}</span>
                  <span className="text-xs font-bold text-zinc-400">jemaat ({total > 0 ? Math.round((elderlyGroup.length / total) * 100) : 0}%)</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setElderlyOpen(!elderlyOpen)}
                  className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{elderlyOpen ? "Tutup Daftar" : "Lihat Daftar Anggota"}</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${elderlyOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Lists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
            {/* Youth List */}
            <div className="h-auto">
              {youthOpen && (
                <div className="bg-zinc-50 rounded-2xl border border-zinc-200/50 p-4 max-h-60 overflow-y-auto animate-fade-in">
                  {youthGroup.length > 0 ? (
                    <ul className="divide-y divide-zinc-200/60">
                      {youthGroup.map(m => (
                        <li key={m.id} className="py-2 flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-800">{m.name}</span>
                          <span className="font-mono text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded">{m.age} th</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-400 italic text-center py-4">Tidak ada anggota.</p>
                  )}
                </div>
              )}
            </div>

            {/* Adult List */}
            <div className="h-auto">
              {adultOpen && (
                <div className="bg-zinc-50 rounded-2xl border border-zinc-200/50 p-4 max-h-60 overflow-y-auto animate-fade-in">
                  {adultGroup.length > 0 ? (
                    <ul className="divide-y divide-zinc-200/60">
                      {adultGroup.map(m => (
                        <li key={m.id} className="py-2 flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-800">{m.name}</span>
                          <span className="font-mono text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded">{m.age} th</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-400 italic text-center py-4">Tidak ada anggota.</p>
                  )}
                </div>
              )}
            </div>

            {/* Elderly List */}
            <div className="h-auto">
              {elderlyOpen && (
                <div className="bg-zinc-50 rounded-2xl border border-zinc-200/50 p-4 max-h-60 overflow-y-auto animate-fade-in">
                  {elderlyGroup.length > 0 ? (
                    <ul className="divide-y divide-zinc-200/60">
                      {elderlyGroup.map(m => (
                        <li key={m.id} className="py-2 flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-800">{m.name}</span>
                          <span className="font-mono text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded">{m.age} th</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-400 italic text-center py-4">Tidak ada anggota.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {unknownAgeGroup.length > 0 && (
            <p className="text-xs text-zinc-400 italic mt-3 ml-1">
              * Terdapat {unknownAgeGroup.length} jemaat dengan data tanggal lahir kosong.
            </p>
          )}
        </div>

        {/* DAFTAR SELURUH JEMAAT (LISTING) */}
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Katalog Profil Jemaat</h2>
          <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase tracking-wider font-bold">
                    <th className="px-6 py-4 font-bold">Nama Lengkap</th>
                    <th className="px-6 py-4 font-bold">Nomor Induk (NIJ)</th>
                    <th className="px-6 py-4 font-bold">Komsel / Pelayanan</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.members.map((member: any) => (
                    <tr key={member.id} className="hover:bg-zinc-50/80 transition-colors cursor-pointer group" onClick={() => setSelectedProfile(member)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-extrabold text-[10px] flex items-center justify-center border border-blue-100">
                            {member.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                          </div>
                          <div>
                            <div className="font-extrabold text-zinc-900 text-sm group-hover:text-blue-600 transition-colors">{member.name}</div>
                            <div className="text-xs text-zinc-500">{member.phone || 'Tidak ada no. HP'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 font-mono">{member.nij}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600">
                        {member.cellGroup || member.ministries || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${member.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          Lihat Detail &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.members.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 text-sm">
                        Belum ada jemaat terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DETAIL PROFIL JEMAAT */}
      {/* ------------------------------------------------------------- */}
      {selectedProfile && !showEditModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60">
              
              <div className="p-8 relative">
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pr-10">
                  <div className="flex gap-5 items-center">
                    <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 font-extrabold text-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                      {selectedProfile.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight">{selectedProfile.name}</h3>
                      <div className="text-sm text-zinc-500 font-mono mt-0.5">{selectedProfile.nij}</div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${selectedProfile.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'}`}>
                          {selectedProfile.status}
                        </span>
                        {selectedProfile.cellGroup && <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-600 text-[10px] font-extrabold uppercase tracking-wide">Komsel</span>}
                        {selectedProfile.ministries && <span className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200/60 text-purple-600 text-[10px] font-extrabold uppercase tracking-wide">Pelayan</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-center">
                    <button onClick={handleDeleteMember} className="w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all shadow-sm" title="Hapus Jemaat">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <button onClick={() => handleSendWA(selectedProfile.phone, selectedProfile.name)} className="px-4 py-2 h-10 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Kirim WA
                    </button>
                    <button onClick={() => setShowEditModal(true)} className="px-4 py-2 h-10 bg-white hover:bg-zinc-50 border border-zinc-200/80 text-zinc-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Edit Profil
                    </button>
                  </div>
                </div>

                <div className="h-px bg-zinc-100 w-full mb-8"></div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 text-sm">
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Tanggal lahir</div>
                    <div className="font-bold text-zinc-900">
                      {selectedProfile.birthDate ? new Date(selectedProfile.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} 
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Jenis kelamin</div>
                    <div className="font-bold text-zinc-900">{selectedProfile.gender || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Status pernikahan</div>
                    <div className="font-bold text-zinc-900">{selectedProfile.maritalStatus || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">No. WA</div>
                    <div className="font-bold text-blue-600">{selectedProfile.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Alamat domisili</div>
                    <div className="font-bold text-zinc-900">
                      {[selectedProfile.address, selectedProfile.city].filter(Boolean).join(', ') || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Komsel</div>
                    <div className="font-bold text-zinc-900">{selectedProfile.cellGroup || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Baptis air</div>
                    <div className="font-bold text-zinc-900">
                      {selectedProfile.isBaptized ? 'Sudah' : 'Belum'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Pelayanan</div>
                    <div className="font-bold text-zinc-900">{selectedProfile.ministries || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Rasio Kehadiran</div>
                    <div className="font-bold text-zinc-900">{selectedProfile.attendanceRatio ? `${Math.round(selectedProfile.attendanceRatio * 100)}%` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium mb-1">Terakhir hadir</div>
                    <div className="font-bold text-zinc-900">{selectedProfile.lastAttendance ? new Date(selectedProfile.lastAttendance).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
                  </div>
                </div>

                {selectedProfile.family?.members?.filter((m: any) => m.id !== selectedProfile.id).length > 0 && (
                  <>
                    <div className="h-px bg-zinc-100 w-full my-8"></div>
                    <div>
                      <h4 className="text-sm font-extrabold text-zinc-900 mb-4">Anggota keluarga terhubung</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProfile.family.members.filter((m: any) => m.id !== selectedProfile.id).map((relative: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200/60 bg-zinc-50">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white text-zinc-600 font-extrabold text-xs flex items-center justify-center shrink-0 border border-zinc-200 shadow-sm">
                                {relative.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                              </div>
                              <div>
                                <div className="font-extrabold text-zinc-900 text-sm">{relative.name}</div>
                                <div className="text-xs text-zinc-500 font-medium">{relative.familyRelation} · {relative.nij}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: TAMBAH JEMAAT BARU */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60 p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-zinc-900">Jemaat Baru</h3>
                  <p className="text-zinc-500 text-sm mt-1">Tambahkan profil jemaat baru. NIJ akan digenerate otomatis.</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nama Lengkap *</label>
                    <input required name="name" type="text" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" placeholder="Misal: Budi Santoso" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">No. WhatsApp</label>
                    <input name="phone" type="text" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" placeholder="Misal: +62 812..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Jenis Kelamin</label>
                    <select name="gender" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900 bg-white">
                      <option value="">Pilih...</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Tanggal Lahir</label>
                    <input name="birthDate" type="date" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Alamat Domisili</label>
                    <input name="address" type="text" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" placeholder="Misal: Jl. Sudirman No. 12" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Komunitas Sel (Komsel)</label>
                    <input name="cellGroup" type="text" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" placeholder="Nama Komsel" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Sudah Dibaptis?</label>
                    <select name="isBaptized" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900 bg-white">
                      <option value="false">Belum</option>
                      <option value="true">Sudah</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={formLoading} className="px-5 py-2.5 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-md disabled:opacity-50">
                    {formLoading ? 'Menyimpan...' : 'Simpan Jemaat'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </Portal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT JEMAAT */}
      {/* ------------------------------------------------------------- */}
      {showEditModal && selectedProfile && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60 p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-zinc-900">Edit Profil</h3>
                  <p className="text-zinc-500 text-sm mt-1">Perbarui data diri untuk {selectedProfile.name}.</p>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleUpdateMember} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nama Lengkap *</label>
                    <input required name="name" type="text" defaultValue={selectedProfile.name} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Status Keaktifan</label>
                    <select name="status" defaultValue={selectedProfile.status} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900 bg-white">
                      <option value="AKTIF">Aktif</option>
                      <option value="TIDAK_AKTIF">Tidak Aktif</option>
                      <option value="REMAJA">Remaja/Anak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">No. WhatsApp</label>
                    <input name="phone" type="text" defaultValue={selectedProfile.phone} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Jenis Kelamin</label>
                    <select name="gender" defaultValue={selectedProfile.gender} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900 bg-white">
                      <option value="">Pilih...</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Tanggal Lahir</label>
                    <input name="birthDate" type="date" defaultValue={selectedProfile.birthDate ? new Date(selectedProfile.birthDate).toISOString().split('T')[0] : ''} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Komunitas Sel (Komsel)</label>
                    <input name="cellGroup" type="text" defaultValue={selectedProfile.cellGroup} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Alamat Domisili</label>
                    <input name="address" type="text" defaultValue={selectedProfile.address} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Sudah Dibaptis?</label>
                    <select name="isBaptized" defaultValue={selectedProfile.isBaptized ? "true" : "false"} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900 bg-white">
                      <option value="false">Belum</option>
                      <option value="true">Sudah</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-sm font-bold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={formLoading} className="px-5 py-2.5 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-md disabled:opacity-50">
                    {formLoading ? 'Menyimpan...' : 'Perbarui Profil'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
