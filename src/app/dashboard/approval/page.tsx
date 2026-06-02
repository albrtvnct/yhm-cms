"use client";

import React, { useEffect, useState, useRef } from 'react';
import Portal from '@/components/Portal';
import { getPrograms, addProgram, addApproval, updateProgramStatus, deleteProgram, editProgram } from '@/app/actions/program';
import { getCurrentUser } from '@/app/actions/user';

export default function ApprovalDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Forms
  const formRef = useRef<HTMLFormElement>(null);

  // User and Voting State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectFiles, setRejectFiles] = useState<File[]>([]);
  const [votingLoading, setVotingLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [progRes, userRes] = await Promise.all([
      getPrograms(),
      getCurrentUser()
    ]);
    if (progRes.success && progRes.data) {
      setData(progRes.data);
    }
    if (userRes.success && userRes.data) {
      setCurrentUser(userRes.data);
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

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const totalBulanIni = data.filter(p => {
    const d = new Date(p.tanggal);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const totalTahunIni = data.filter(p => {
    const d = new Date(p.tanggal);
    return d.getFullYear() === currentYear;
  }).length;

  const programMendatangList = data.filter(p => p.status === 'DISETUJUI' && new Date(p.tanggal) >= currentDate).sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  const upcomingProgram = programMendatangList.length > 0 ? programMendatangList[0] : null;
  const totalProgramMendatang = programMendatangList.length;
  const totalProgramSelesai = data.filter(p => p.status === 'SELESAI').length;

  const handleAddProgram = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setFormLoading(true);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const res = isEditing && selectedProgram 
      ? await editProgram(selectedProgram.id, payload)
      : await addProgram(payload);
      
    if (res.success) {
      form.reset();
      setShowAddModal(false);
      setIsEditing(false);
      setSelectedProgram(null);
      await load();
    } else {
      alert(`Gagal ${isEditing ? 'mengubah' : 'menambahkan'} program: ${res.error}`);
    }
    setFormLoading(false);
  };



  const handleDeleteProgram = async () => {
    if (!selectedProgram) return;
    if (!confirm('Hapus permanen program ini?')) return;
    const res = await deleteProgram(selectedProgram.id);
    if (res.success) {
      setSelectedProgram(null);
      await load();
    } else {
      alert("Gagal menghapus program: " + res.error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedProgram) return;
    const res = await updateProgramStatus(selectedProgram.id, status);
    if (res.success) {
      const updatedPrograms = await getPrograms();
      if (updatedPrograms.success && updatedPrograms.data) {
        setData(updatedPrograms.data);
        const updatedSelected = updatedPrograms.data.find((p: any) => p.id === selectedProgram.id);
        setSelectedProgram(updatedSelected);
      }
    } else {
      alert("Gagal mengupdate status: " + res.error);
    }
  };

  const handleApprove = async () => {
    if (!selectedProgram) return;
    if (!confirm("Setujui program ini?")) return;
    setVotingLoading(true);
    const res = await addApproval(selectedProgram.id, "APPROVED");
    if (res.success) {
      alert("Persetujuan berhasil!");
      await load();
      setSelectedProgram(null);
    } else {
      alert("Gagal menyetujui: " + res.error);
    }
    setVotingLoading(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    if (!rejectReason.trim()) {
      alert("Alasan penolakan wajib diisi!");
      return;
    }

    setVotingLoading(true);
    try {
      const base64Files = await Promise.all(rejectFiles.map(fileToBase64));
      const res = await addApproval(selectedProgram.id, "REJECTED", rejectReason, base64Files);
      if (res.success) {
        alert("Program berhasil ditolak.");
        await load();
        setSelectedProgram(null);
        setShowRejectForm(false);
        setRejectReason("");
        setRejectFiles([]);
      } else {
        alert("Gagal menolak program: " + res.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan saat mengunggah dokumen.");
    }
    setVotingLoading(false);
  };

  const requiredRoles = ['Majelis', 'Diaken', 'Penatua', 'Gembala Sidang'];

  return (
    <div className="space-y-10 animate-fade-in-up pb-12 font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Program Gereja</h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">Persetujuan dan pemantauan program kerja dari berbagai divisi.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setIsEditing(false);
              setSelectedProgram(null);
              setShowAddModal(true);
            }} 
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl transition-all shadow-md group"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Ajukan Program
          </button>
        </div>
      </div>

      <div className="max-w-6xl space-y-10">
        
        {/* STATISTIK APPROVAL */}
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Statistik Program</h2>
          <div className="flex flex-col gap-5">
            
            {/* ROW 1: Program Mendatang (Highlight) */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                Program Mendatang Terdekat (Disetujui)
              </div>
              <div>
                {upcomingProgram ? (
                  <>
                    <div className="text-xl font-extrabold text-zinc-900 tracking-tight leading-snug">
                      {upcomingProgram.nama}
                    </div>
                    <div className="text-sm font-semibold text-zinc-600 mt-1">
                      {new Date(upcomingProgram.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1.5 font-medium flex justify-between">
                      <span>Penanggung Jawab: <span className="font-bold text-zinc-600">{upcomingProgram.penanggungJawab}</span></span>
                    </div>
                  </>
                ) : (
                  <div className="text-xl font-extrabold text-zinc-400 tracking-tight">Tidak ada program terdekat yang sudah disetujui</div>
                )}
              </div>
            </div>

            {/* ROW 2: Statistik Waktu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  Jumlah Program Bulan Ini
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{totalBulanIni}</div>
                  <div className="text-xs text-zinc-400 mt-1 font-medium flex justify-between">
                    <span>Program di bulan berjalan</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  Jumlah Program Tahun Ini
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{totalTahunIni}</div>
                  <div className="text-xs text-zinc-400 mt-1 font-medium flex justify-between">
                    <span>Total program dalam satu tahun</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 3: Status Program */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  Total Program Mendatang
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{totalProgramMendatang}</div>
                  <div className="text-xs text-zinc-400 mt-1 font-medium flex justify-between">
                    <span>Program disetujui yang belum dilaksanakan</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                <div className="text-sm text-zinc-500 font-bold mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  Total Program Selesai
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-zinc-900 tracking-tight">{totalProgramSelesai}</div>
                  <div className="text-xs text-zinc-400 mt-1 font-medium flex justify-between">
                    <span>Program yang sudah selesai</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* DAFTAR PROGRAM (LISTING) */}
        <div>
          <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">Daftar Pengajuan Program</h2>
          <div className="bg-white rounded-3xl border border-zinc-200/60 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-4 font-bold">Nama Program</th>
                  <th className="px-6 py-4 font-bold">Divisi</th>
                  <th className="px-6 py-4 font-bold">Dana & Tanggal</th>
                  <th className="px-6 py-4 font-bold">Penanggung Jawab</th>
                  <th className="px-6 py-4 font-bold text-center">Proposal</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-center">Disetujui Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.map((item, idx) => {
                  const approvedCount = item.approvals?.filter((a: any) => a.status === 'APPROVED').length || 0;
                  
                  return (
                    <tr key={item.id || idx} className="hover:bg-zinc-50/80 transition-colors cursor-pointer group" onClick={() => setSelectedProgram(item)}>
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-zinc-900 text-sm group-hover:text-blue-600 transition-colors">{item.nama}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                          {item.divisi}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-zinc-700">Rp {item.dana.toLocaleString('id-ID')}</div>
                        <div className="text-xs text-zinc-500 mt-1">{new Date(item.tanggal).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-extrabold text-[9px] flex items-center justify-center border border-blue-100">
                            {item.penanggungJawab.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                          </div>
                          <div className="text-sm font-medium text-zinc-600">{item.penanggungJawab}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.proposalFile ? (
                          <a href={item.proposalFile} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            Lihat
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide px-2">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${item.status === 'DISETUJUI' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : item.status === 'DITOLAK' ? 'bg-rose-50 text-rose-600 border border-rose-200' : item.status === 'SELESAI' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                          <svg className={`w-4 h-4 ${approvedCount >= 3 ? 'text-emerald-500' : 'text-zinc-400 group-hover:text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className={`text-xs font-extrabold ${approvedCount >= 3 ? 'text-emerald-700' : 'text-zinc-600 group-hover:text-blue-700'}`}>{approvedCount} Disetujui</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 text-sm">
                      Belum ada data pengajuan program.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: TAMBAH PROGRAM */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60">
              
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-900">{isEditing ? "Edit Program Kerja" : "Ajukan Program Baru"}</h2>
                    <p className="text-sm text-zinc-500 font-medium mt-1">{isEditing ? "Perbarui detail program. Jika program ini ditolak sebelumnya, program akan otomatis dikembalikan ke status Menunggu." : "Lengkapi form berikut untuk mengajukan program kerja."}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowAddModal(false);
                      setIsEditing(false);
                      if (!isEditing) setSelectedProgram(null);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <form ref={formRef} onSubmit={handleAddProgram} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nama Program <span className="text-rose-500">*</span></label>
                      <input name="nama" type="text" required defaultValue={isEditing && selectedProgram ? selectedProgram.nama : ""} placeholder="Contoh: Retreat Pemuda 2026" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">Divisi Pelaksana <span className="text-rose-500">*</span></label>
                      {currentUser?.role === "SEKSI" ? (
                        <input name="divisi" type="text" readOnly value={currentUser.seksi || ""} className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm text-zinc-500 font-bold focus:outline-none cursor-not-allowed" />
                      ) : (
                        <input name="divisi" type="text" required defaultValue={isEditing && selectedProgram ? selectedProgram.divisi : ""} placeholder="Contoh: Komisi Pemuda" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">Penanggung Jawab <span className="text-rose-500">*</span></label>
                      <input name="penanggungJawab" type="text" required defaultValue={isEditing && selectedProgram ? selectedProgram.penanggungJawab : ""} placeholder="Nama lengkap PJ" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">Kebutuhan Dana <span className="text-rose-500">*</span></label>
                      <input name="dana" type="text" required defaultValue={isEditing && selectedProgram ? selectedProgram.dana : ""} placeholder="Contoh: 15000000" className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">Tanggal Pelaksanaan <span className="text-rose-500">*</span></label>
                      <input name="tanggal" type="date" required defaultValue={isEditing && selectedProgram ? new Date(selectedProgram.tanggal).toISOString().split('T')[0] : ""} className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">Tautan Proposal Dokumen</label>
                      <input name="proposalFile" type="url" defaultValue={isEditing && selectedProgram ? selectedProgram.proposalFile : ""} placeholder="https://docs.google.com/..." className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all" />
                      <p className="text-[10px] text-zinc-500 mt-1">Masukkan link ke Google Drive atau penyimpanan lain (opsional)</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowAddModal(false);
                        setIsEditing(false);
                        if (!isEditing) setSelectedProgram(null);
                      }} 
                      className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-bold rounded-xl transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={formLoading} 
                      className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                      {formLoading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Ajukan Program'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DETAIL APPROVAL PROGRAM & VOTING */}
      {/* ------------------------------------------------------------- */}
      {selectedProgram && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60">
              
              <div className="p-8 relative">
                <button 
                  onClick={() => setSelectedProgram(null)}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="mb-8 pr-10">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">{selectedProgram.divisi}</div>
                  <h2 className="text-2xl font-extrabold text-zinc-900 leading-tight">{selectedProgram.nama}</h2>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-md text-xs font-bold tracking-wide">Dana: Rp {selectedProgram.dana.toLocaleString('id-ID')}</span>
                      <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-md text-xs font-bold tracking-wide">PJ: {selectedProgram.penanggungJawab}</span>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${selectedProgram.status === 'DISETUJUI' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : selectedProgram.status === 'DITOLAK' ? 'bg-rose-50 text-rose-600 border border-rose-200' : selectedProgram.status === 'SELESAI' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                        {selectedProgram.status}
                      </span>
                    </div>
                    {/* EDIT BUTTON (Only if status is MENUNGGU or DITOLAK and user has permission) */}
                    {(selectedProgram.status === 'MENUNGGU' || selectedProgram.status === 'DITOLAK') && 
                     (currentUser?.role === 'ADMIN' || (currentUser?.role === 'SEKSI' && currentUser?.seksi === selectedProgram.divisi) || currentUser?.role === 'MAJELIS') && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowAddModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit Program
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase border-b border-zinc-100 pb-2 mb-4">Status Persetujuan</h3>
                    <div className="space-y-3">
                      {(!selectedProgram.approvals || selectedProgram.approvals.length === 0) ? (
                        <div className="text-sm text-zinc-500 italic p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                          Belum ada yang memberikan persetujuan.
                        </div>
                      ) : (
                        selectedProgram.approvals.map((approval: any, idx: number) => (
                          <div key={idx} className={`p-4 rounded-2xl border ${approval.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-extrabold text-sm text-zinc-900">{approval.name} <span className="text-xs font-medium text-zinc-500 font-normal">({approval.role})</span></div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${approval.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {approval.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                              </span>
                            </div>
                            {approval.reason && (
                              <div className="mt-2 text-xs font-semibold text-rose-700 bg-white p-2 rounded-lg border border-rose-100">
                                Alasan: {approval.reason}
                              </div>
                            )}
                            {approval.documents && approval.documents.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {approval.documents.map((doc: string, dIdx: number) => (
                                  <a key={dIdx} href={doc} download={`Dokumen_Penolakan_${dIdx+1}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg hover:bg-rose-200 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Unduh Dokumen {dIdx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Voting Form Section for Non-Admins and Non-Seksi */}
                  {currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'SEKSI' && selectedProgram.status === 'MENUNGGU' && (
                    <div className="pt-6 border-t border-zinc-100">
                      {!showRejectForm ? (
                        <div className="flex gap-3">
                          <button onClick={handleApprove} disabled={votingLoading} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
                            {votingLoading ? 'Memproses...' : 'Setujui Program'}
                          </button>
                          <button onClick={() => setShowRejectForm(true)} disabled={votingLoading} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
                            Tolak Program
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleRejectSubmit} className="bg-rose-50 p-5 rounded-2xl border border-rose-100 space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-rose-900 mb-1.5">Alasan Penolakan <span className="text-rose-600">*</span></label>
                            <textarea
                              required
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                              placeholder="Masukkan alasan mengapa program ini ditolak..."
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-rose-900 mb-1.5">Dokumen Pendukung (Maks. 5 file, Maks. 2MB/file)</label>
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 5) {
                                  alert("Maksimal 5 dokumen!");
                                  e.target.value = "";
                                  setRejectFiles([]);
                                } else {
                                  const oversized = files.find(f => f.size > 2 * 1024 * 1024);
                                  if (oversized) {
                                    alert("Ada file yang ukurannya lebih dari 2MB!");
                                    e.target.value = "";
                                    setRejectFiles([]);
                                  } else {
                                    setRejectFiles(files);
                                  }
                                }
                              }}
                              className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200"
                            />
                          </div>
                          <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowRejectForm(false)} className="px-5 py-2.5 text-rose-600 font-bold hover:bg-rose-100 rounded-xl transition-colors text-sm">Batal</button>
                            <button type="submit" disabled={votingLoading} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md text-sm">
                              {votingLoading ? 'Menyimpan...' : 'Kirim Penolakan'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  <div className="pt-6 border-t border-zinc-100 flex gap-3">
                    {selectedProgram.proposalFile ? (
                      <a href={selectedProgram.proposalFile} target="_blank" rel="noreferrer" className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold rounded-xl transition-colors shadow-sm text-center flex items-center justify-center gap-2 border border-indigo-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        Buka Dokumen Proposal
                      </a>
                    ) : (
                      <div className="flex-1 py-2.5 bg-zinc-50 text-zinc-400 text-sm font-bold rounded-xl text-center border border-zinc-200 flex items-center justify-center">
                        Tidak ada proposal dilampirkan
                      </div>
                    )}
                    
                    {selectedProgram.status === 'DISETUJUI' && (
                      <button onClick={() => handleUpdateStatus('SELESAI')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                        Tandai Selesai
                      </button>
                    )}
                    <button onClick={handleDeleteProgram} className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-bold rounded-xl transition-colors shadow-sm">
                      Hapus
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
