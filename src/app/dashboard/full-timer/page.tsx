"use client";

import React, { useEffect, useState, useRef } from 'react';
import Portal from '@/components/Portal';
import { getFullTimers, addFullTimer, updateFullTimer, deleteFullTimer } from '@/app/actions/fulltimer';
import { getAllMembersBasic } from '@/app/actions/jemaat';

export default function FullTimerDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [membersList, setMembersList] = useState<any[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // States for file uploads in forms
  const [fileBaptisan, setFileBaptisan] = useState<File | null>(null);
  const [fileSuratTugas, setFileSuratTugas] = useState<File | null>(null);
  
  const [baptisanPreview, setBaptisanPreview] = useState<string | null>(null);
  const [suratTugasPreview, setSuratTugasPreview] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await getFullTimers();
    if (res.success && res.data) {
      setData(res.data);
    } else {
      console.error(res.error);
    }
    
    const membersRes = await getAllMembersBasic();
    if (membersRes.success && membersRes.data) {
      setMembersList(membersRes.data);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  const total = data.length;
  const totalPersembahanKasih = data.reduce((sum, item) => sum + (item.persembahanKasih || 0), 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void, previewSetter: (url: string | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setter(file);
      
      // In a real app, you would upload this file to a cloud storage (like S3 or Supabase Storage)
      // and get a public URL back. For this demo, we'll convert it to an object URL or base64 
      // just to simulate a successful upload for the UI.
      const reader = new FileReader();
      reader.onloadend = () => {
        previewSetter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const autoFillForm = (member: any) => {
    if (!formRef.current) return;
    const form = formRef.current as any;
    
    if (member.nij && form.nij) form.nij.value = member.nij;
    if (member.name && form.name) form.name.value = member.name;
    if (member.birthPlace && form.tempatLahir) form.tempatLahir.value = member.birthPlace;
    if (member.birthDate && form.tanggalLahir) {
      try {
        form.tanggalLahir.value = new Date(member.birthDate).toISOString().split('T')[0];
      } catch (e) {}
    }
    if (member.maritalStatus && form.statusPerkawinan) form.statusPerkawinan.value = member.maritalStatus;
    if (member.status && form.statusJemaat) form.statusJemaat.value = member.status;
    if (member.phone && form.phone) form.phone.value = member.phone;
    if (member.email && form.email) form.email.value = member.email;
    if (member.address && form.alamat) form.alamat.value = member.address;
  };

  const handleAddFullTimer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setFormLoading(true);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    
    // Attach simulated file URLs
    if (baptisanPreview) payload.fileBaptisan = baptisanPreview;
    if (suratTugasPreview) payload.fileSuratTugas = suratTugasPreview;

    const res = await addFullTimer(payload);
    if (res.success) {
      form.reset();
      setFileBaptisan(null);
      setFileSuratTugas(null);
      setBaptisanPreview(null);
      setSuratTugasPreview(null);
      setShowAddModal(false);
      await load();
    } else {
      alert("Gagal menambahkan data: " + res.error);
    }
    setFormLoading(false);
  };

  const handleUpdateFullTimer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setFormLoading(true);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (baptisanPreview) payload.fileBaptisan = baptisanPreview;
    if (suratTugasPreview) payload.fileSuratTugas = suratTugasPreview;

    if (!selectedProfile?.id) return;
    const res = await updateFullTimer(selectedProfile.id, payload);
    if (res.success) {
      form.reset();
      setShowEditModal(false);
      setSelectedProfile(null);
      await load();
    } else {
      alert("Gagal memperbarui data: " + res.error);
    }
    setFormLoading(false);
  };

  const handleDeleteFullTimer = async () => {
    if (!selectedProfile?.id) return;
    if (!confirm(`Hapus permanen data ${selectedProfile?.name || 'ini'}?`)) return;
    
    const res = await deleteFullTimer(selectedProfile.id);
    if (res.success) {
      setSelectedProfile(null);
      await load();
    } else {
      alert("Gagal menghapus data: " + res.error);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in-up pb-12 font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Data Full Timer</h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">Kelola data keanggotaan dan administrasi untuk hamba Tuhan Full Timer.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setBaptisanPreview(null);
              setSuratTugasPreview(null);
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tambah Full Timer
          </button>
        </div>
      </div>

      <div className="max-w-6xl space-y-10">
        
        {/* STATISTIK FULL TIMER */}
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Statistik Full Timer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Total Full Timer */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                Jumlah Full Timer
              </div>
              <div>
                <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{total.toLocaleString('id-ID')}</div>
                <div className="text-xs text-zinc-400 mt-1 font-medium">Hamba Tuhan terdaftar</div>
              </div>
            </div>

            {/* Total Persembahan Kasih */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                Total Persembahan Kasih / Bulan
              </div>
              <div>
                <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">Rp {totalPersembahanKasih.toLocaleString('id-ID')}</div>
                <div className="text-xs text-zinc-400 mt-1 font-medium flex justify-between">
                  <span>Estimasi bulanan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DAFTAR FULL TIMER (LISTING) */}
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Katalog Profil Full Timer</h2>
          <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-4 font-bold">Nama Lengkap</th>
                  <th className="px-6 py-4 font-bold">NIJ / TTL</th>
                  <th className="px-6 py-4 font-bold">Kontak & Alamat</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Persembahan</th>
                  <th className="px-6 py-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.map((item: any, idx: number) => {
                  if (!item) return null;
                  return (
                  <tr key={item.id || idx} className="hover:bg-zinc-50/80 transition-colors cursor-pointer group" onClick={() => setSelectedProfile(item)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-extrabold text-[10px] flex items-center justify-center border border-blue-100">
                          {item?.name?.split(' ')?.map((n: string) => n[0])?.join('')?.substring(0,2) || 'NA'}
                        </div>
                        <div>
                          <div className="font-extrabold text-zinc-900 text-sm group-hover:text-blue-600 transition-colors">{item?.name || '-'}</div>
                          <div className="text-xs text-zinc-500">{item?.keterangan || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-600 font-mono">{item?.nij || 'Belum ada NIJ'}</div>
                      <div className="text-xs text-zinc-500 mt-1">{item?.tempatLahir || '-'}, {item?.tanggalLahir ? new Date(item.tanggalLahir).toLocaleDateString('id-ID') : '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-600">{item?.phone || '-'} / {item?.email || '-'}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[200px]" title={item?.alamat || ''}>{item?.alamat || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide w-fit ${item?.statusPekerjaan === 'AKTIF' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'}`}>
                          Kerja: {item?.statusPekerjaan || '-'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide w-fit ${item?.statusJemaat === 'AKTIF' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'}`}>
                          Jemaat: {item?.statusJemaat || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-zinc-700">
                      Rp {item?.persembahanKasih?.toLocaleString('id-ID') || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Lihat Detail &rarr;
                      </button>
                    </td>
                  </tr>
                )})}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 text-sm">
                      Belum ada data Full Timer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DETAIL PROFIL FULL TIMER */}
      {/* ------------------------------------------------------------- */}
      {selectedProfile && !showEditModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60">
              
              <div className="p-8 relative">
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="flex items-center gap-6 mb-8 pr-10">
                  <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 font-extrabold text-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                    {selectedProfile?.name?.split(' ')?.map((n: string) => n[0])?.join('')?.substring(0,2) || 'NA'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-900">{selectedProfile.name}</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wide">NIJ: {selectedProfile.nij || 'Belum diisi'}</span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${selectedProfile.statusPekerjaan === 'AKTIF' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        Pekerjaan: {selectedProfile.statusPekerjaan}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Keterangan / Jabatan</div>
                    <div className="text-sm font-semibold text-zinc-800">{selectedProfile.keterangan || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Persembahan Kasih</div>
                    <div className="text-sm font-bold text-emerald-600">Rp {selectedProfile.persembahanKasih?.toLocaleString('id-ID') || 0} / bln</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Tempat, Tanggal Lahir</div>
                    <div className="text-sm font-semibold text-zinc-800">
                      {selectedProfile.tempatLahir || '-'}, {selectedProfile.tanggalLahir ? new Date(selectedProfile.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Status Perkawinan</div>
                    <div className="text-sm font-semibold text-zinc-800">{selectedProfile.statusPerkawinan || '-'}</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Nomor Handphone</div>
                    <div className="text-sm font-semibold text-zinc-800">{selectedProfile.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">E-Mail</div>
                    <div className="text-sm font-semibold text-zinc-800">{selectedProfile.email || '-'}</div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Alamat Domisili</div>
                    <div className="text-sm font-semibold text-zinc-800">{selectedProfile.alamat || '-'}</div>
                  </div>

                  <div className="md:col-span-2 flex gap-4 pt-4 border-t border-zinc-100">
                    <div className="flex-1 bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">Dokumen Baptisan</div>
                      {selectedProfile.fileBaptisan ? (
                        <a href={selectedProfile.fileBaptisan} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          Lihat File
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500 italic">Belum diunggah</span>
                      )}
                    </div>
                    <div className="flex-1 bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-2">Dokumen Surat Tugas</div>
                      {selectedProfile.fileSuratTugas ? (
                        <a href={selectedProfile.fileSuratTugas} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          Lihat File
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500 italic">Belum diunggah</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100 flex gap-3">
                  <button
                    onClick={() => {
                      setBaptisanPreview(selectedProfile.fileBaptisan || null);
                      setSuratTugasPreview(selectedProfile.fileSuratTugas || null);
                      setShowEditModal(true);
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Edit Data
                  </button>
                  <button
                    onClick={handleDeleteFullTimer}
                    className="px-6 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Hapus
                  </button>
                </div>

              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: TAMBAH / EDIT FULL TIMER */}
      {/* ------------------------------------------------------------- */}
      {(showAddModal || showEditModal) && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60">
              
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-900">{showAddModal ? "Tambah Full Timer" : "Edit Full Timer"}</h2>
                    <p className="text-sm text-zinc-500 font-medium mt-1">Data akan tersinkronisasi dengan tabel Jemaat jika NIJ disamakan.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form ref={formRef} onSubmit={showAddModal ? handleAddFullTimer : handleUpdateFullTimer} className="space-y-6">
                  
                  <datalist id="nij-list">
                    {membersList.filter(m => m.nij).map(m => (
                      <option key={m.id} value={m.nij}>{m.name}</option>
                    ))}
                  </datalist>
                  <datalist id="name-list">
                    {membersList.map(m => (
                      <option key={m.id} value={m.name}>{m.nij || 'Tanpa NIJ'}</option>
                    ))}
                  </datalist>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase border-b border-zinc-100 pb-2">Informasi Pribadi</h3>
                      
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nomor Induk (NIJ)</label>
                        <input name="nij" type="text" list="nij-list" defaultValue={showEditModal ? selectedProfile?.nij : ''} onChange={(e) => {
                          const val = e.target.value;
                          const match = membersList.find(m => m.nij === val);
                          if (match) autoFillForm(match);
                        }} placeholder="Contoh: GBI-2023-0001 (Ketik untuk cari)" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-mono" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nama Lengkap <span className="text-rose-500">*</span></label>
                        <input name="name" type="text" list="name-list" required defaultValue={showEditModal ? selectedProfile?.name : ''} onChange={(e) => {
                          const val = e.target.value;
                          const match = membersList.find(m => m.name === val);
                          if (match) autoFillForm(match);
                        }} placeholder="Ketik nama jemaat untuk auto-fill" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1.5">Tempat Lahir</label>
                          <input name="tempatLahir" type="text" defaultValue={showEditModal ? selectedProfile?.tempatLahir : ''} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1.5">Tanggal Lahir</label>
                          <input name="tanggalLahir" type="date" defaultValue={showEditModal && selectedProfile?.tanggalLahir ? new Date(selectedProfile.tanggalLahir).toISOString().split('T')[0] : ''} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1.5">Status Perkawinan</label>
                          <select name="statusPerkawinan" defaultValue={showEditModal ? selectedProfile?.statusPerkawinan : ''} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all">
                            <option value="">Pilih Status</option>
                            <option value="Lajang">Lajang</option>
                            <option value="Menikah">Menikah</option>
                            <option value="Janda/Duda">Janda/Duda</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1.5">Status Jemaat</label>
                          <select name="statusJemaat" defaultValue={showEditModal ? selectedProfile?.statusJemaat : 'AKTIF'} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all">
                            <option value="AKTIF">Aktif</option>
                            <option value="TIDAK_AKTIF">Tidak Aktif</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Admin */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase border-b border-zinc-100 pb-2">Kontak & Administrasi</h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nomor Handphone</label>
                          <input name="phone" type="text" defaultValue={showEditModal ? selectedProfile?.phone : ''} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1.5">E-Mail</label>
                          <input name="email" type="email" defaultValue={showEditModal ? selectedProfile?.email : ''} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5">Alamat Domisili</label>
                        <textarea name="alamat" rows={2} defaultValue={showEditModal ? selectedProfile?.alamat : ''} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all resize-none"></textarea>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1.5">Status Pekerjaan</label>
                          <select name="statusPekerjaan" defaultValue={showEditModal ? selectedProfile?.statusPekerjaan : 'AKTIF'} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all">
                            <option value="AKTIF">Aktif</option>
                            <option value="TIDAK_AKTIF">Tidak Aktif</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 mb-1.5">Persembahan / Bulan</label>
                          <input name="persembahanKasih" type="number" defaultValue={showEditModal ? selectedProfile?.persembahanKasih : 0} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1.5">Keterangan (Jabatan dll)</label>
                        <input name="keterangan" type="text" defaultValue={showEditModal ? selectedProfile?.keterangan : ''} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Uploads Section */}
                  <div className="pt-4 border-t border-zinc-100">
                    <h3 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4">Dokumen Pendukung (PDF/Image)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Baptisan */}
                      <div className="bg-zinc-50 border border-zinc-200 border-dashed rounded-2xl p-5 text-center relative group">
                        <input 
                          type="file" 
                          accept=".pdf,image/*" 
                          onChange={(e) => handleFileChange(e, setFileBaptisan, setBaptisanPreview)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center pointer-events-none">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${baptisanPreview ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-200 text-zinc-500 group-hover:bg-zinc-300'}`}>
                            {baptisanPreview ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            )}
                          </div>
                          <span className="text-sm font-bold text-zinc-800">Status Baptisan</span>
                          <span className="text-xs text-zinc-500 mt-1">{fileBaptisan ? fileBaptisan.name : (baptisanPreview ? 'File tersimpan' : 'Upload file PDF/Gambar')}</span>
                        </div>
                      </div>

                      {/* Surat Tugas */}
                      <div className="bg-zinc-50 border border-zinc-200 border-dashed rounded-2xl p-5 text-center relative group">
                        <input 
                          type="file" 
                          accept=".pdf,image/*" 
                          onChange={(e) => handleFileChange(e, setFileSuratTugas, setSuratTugasPreview)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center pointer-events-none">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${suratTugasPreview ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-200 text-zinc-500 group-hover:bg-zinc-300'}`}>
                            {suratTugasPreview ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            )}
                          </div>
                          <span className="text-sm font-bold text-zinc-800">Surat Tugas</span>
                          <span className="text-xs text-zinc-500 mt-1">{fileSuratTugas ? fileSuratTugas.name : (suratTugasPreview ? 'File tersimpan' : 'Upload file PDF/Gambar')}</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                      }}
                      className="px-5 py-2.5 text-zinc-500 font-bold hover:bg-zinc-100 rounded-xl transition-colors text-sm"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={formLoading}
                      className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
                    >
                      {formLoading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                      {showAddModal ? "Simpan Data" : "Perbarui Data"}
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
