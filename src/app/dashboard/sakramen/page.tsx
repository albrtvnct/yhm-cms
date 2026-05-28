"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getPersuratanMembers } from "@/app/actions/persuratan";

// Interfaces
interface DbMember {
  id: string;
  nij: string | null;
  name: string;
  phone: string | null;
  gender: string | null;
  cellGroup: string | null;
  birthDate: string | Date | null;
}

interface Step {
  id: number;
  title: string;
  desc: string;
  operator: string;
  date: string | null;
  time: string | null;
  status: "completed" | "active" | "waiting";
}

interface SacramentSubmission {
  id: string;
  memberId: string;
  memberName: string;
  memberNij: string;
  memberAge: number;
  memberBirthDate: string;
  memberCellGroup: string;
  memberLeader: string;
  parents: string;
  classStatus: string;
  proposedDate: string;
  type: "Baptisan Air" | "Pernikahan Kudus" | "Surat Keterangan Aktif" | "Surat Pindah" | "Baptisan Anak" | "Surat Misi";
  typeColor: "indigo" | "teal" | "amber" | "blue" | "emerald" | "rose";
  status: "Dalam proses" | "Selesai" | "Ditolak";
  steps: Step[];
  createdAt: string;
  notes?: string;
}

interface DocumentType {
  title: string;
  desc: string;
  countLabel: string;
  colorType: "indigo" | "teal" | "amber" | "blue" | "emerald" | "rose";
}

export default function SakramenDashboard() {
  const [dbMembers, setDbMembers] = useState<DbMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Core sacrament requests list (persisted in localStorage)
  const [submissions, setSubmissions] = useState<SacramentSubmission[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<SacramentSubmission | null>(null);

  // New Request Form States
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedDocType, setSelectedDocType] = useState<SacramentSubmission["type"]>("Baptisan Air");
  const [reqProposedDate, setReqProposedDate] = useState("2026-06-15");
  const [reqParents, setReqParents] = useState("");
  const [reqClassStatus, setReqClassStatus] = useState("Sudah selesai (3 sesi)");
  const [reqNotes, setReqNotes] = useState("");

  // Edit Form States
  const [editProposedDate, setEditProposedDate] = useState("");
  const [editParents, setEditParents] = useState("");
  const [editClassStatus, setEditClassStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Toast Notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" } | null>(null);

  // Available document types
  const documentTypes: DocumentType[] = [
    { title: "Pernikahan kudus", desc: "Pengajuan, konseling pra-nikah, koordinasi liturgi, buku nikah gereja.", countLabel: "Pernikahan Kudus", colorType: "indigo" },
    { title: "Baptisan air", desc: "Kelas baptisan, verifikasi, penjadwalan, sertifikat digital PDF.", countLabel: "Baptisan Air", colorType: "teal" },
    { title: "Surat pindah", desc: "Pindah gereja, verifikasi status aktif, riwayat pelayanan terlampir.", countLabel: "Surat Pindah", colorType: "rose" },
    { title: "Surat keterangan", desc: "Keterangan aktif jemaat, keterangan belum menikah, rekomendasi pelayanan.", countLabel: "Surat Keterangan Aktif", colorType: "amber" },
    { title: "Baptisan anak", desc: "Pengajuan oleh orang tua, sertifikat digital, tersimpan di profil keluarga.", countLabel: "Baptisan Anak", colorType: "emerald" },
    { title: "Surat misi / penugasan", desc: "Penugasan pelayan ke luar kota, rekomendasi penginjil, surat pengantar resmi.", countLabel: "Surat Misi", colorType: "blue" }
  ];

  // Load database members & localStorage submissions on mount
  useEffect(() => {
    setMounted(true);
    async function loadData() {
      setIsLoading(true);
      
      // 1. Fetch active members from db
      const res = await getPersuratanMembers();
      let activeMembers: DbMember[] = [];
      if (res.success && res.data && res.data.length > 0) {
        activeMembers = res.data;
        setDbMembers(activeMembers);
        setSelectedMemberId(activeMembers[0]?.id || "");
      } else {
        setDbMembers([]);
      }

      // 2. Load submissions from localStorage
      const localData = localStorage.getItem("yesh_sacraments");
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setSubmissions(parsed);
          if (parsed.length > 0) {
            setSelectedSubId(parsed[0].id);
          }
        } catch (e) {
          console.error("Error parsing sacraments data:", e);
          setSubmissions([]);
        }
      } else {
        setSubmissions([]);
      }

      setIsLoading(false);
    }
    loadData();
  }, []);

  // Save to localStorage helper
  const saveSubmissions = (newSubs: SacramentSubmission[]) => {
    setSubmissions(newSubs);
    localStorage.setItem("yesh_sacraments", JSON.stringify(newSubs));
  };

  // Show a toast
  const triggerToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  // Active selected submission object
  const activeSubmission = useMemo(() => {
    return submissions.find(s => s.id === selectedSubId) || null;
  }, [submissions, selectedSubId]);

  // Handle step approval
  const handleApproveStep = () => {
    if (!activeSubmission) return;

    const currentActiveStep = activeSubmission.steps.find(s => s.status === "active");
    if (!currentActiveStep) {
      triggerToast("Pengajuan ini sudah selesai diproses sepenuhnya!", "info");
      return;
    }

    const updatedSteps = activeSubmission.steps.map(step => {
      if (step.id === currentActiveStep.id) {
        const today = new Date();
        const dateStr = today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        const timeStr = today.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
        return {
          ...step,
          status: "completed" as const,
          date: dateStr,
          time: timeStr
        };
      }
      if (step.id === currentActiveStep.id + 1) {
        return {
          ...step,
          status: "active" as const
        };
      }
      return step;
    });

    const isFullyApproved = !updatedSteps.some(s => s.status === "active" || s.status === "waiting");
    const newStatus = isFullyApproved ? ("Selesai" as const) : ("Dalam proses" as const);

    const newSubsList = submissions.map(sub =>
      sub.id === activeSubmission.id
        ? {
            ...sub,
            status: newStatus,
            steps: updatedSteps
          }
        : sub
    );

    saveSubmissions(newSubsList);

    if (isFullyApproved) {
      triggerToast(`Pengajuan ${activeSubmission.type} ${activeSubmission.memberName} telah selesai dan disetujui!`, "success");
      setTimeout(() => {
        setShowCertModal(true);
      }, 800);
    } else {
      const nextStep = updatedSteps.find(s => s.status === "active");
      triggerToast(`Tahap "${currentActiveStep.title}" disetujui. Langkah selanjutnya: "${nextStep?.title}".`);
    }
  };

  // Simulating WA reminder
  const handleSendReminder = () => {
    if (!activeSubmission) return;
    const activeStep = activeSubmission.steps.find(s => s.status === "active");
    if (!activeStep) return;

    triggerToast(`Notifikasi WhatsApp pengingat berhasil dikirim ke: ${activeStep.operator}!`, "info");
  };

  // Create new request
  const handleCreateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMember = dbMembers.find(m => m.id === selectedMemberId);
    if (!selectedMember) {
      alert("Pilih jemaat terlebih dahulu. Jika kosong, tambahkan jemaat aktif di menu Jemaat.");
      return;
    }

    let steps: Step[] = [];
    let colorType: SacramentSubmission["typeColor"] = "indigo";

    if (selectedDocType === "Baptisan Air") {
      colorType = "teal";
      steps = [
        { id: 1, title: "Formulir diajukan jemaat", desc: "Jemaat mendaftarkan baptisan secara mandiri", operator: "Jemaat", date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"), status: "completed" },
        { id: 2, title: "Verifikasi data oleh admin", desc: "Data kependudukan jemaat diverifikasi oleh sekretariat", operator: "Admin", date: null, time: null, status: "active" },
        { id: 3, title: "Rekomendasi gembala komsel", desc: "Meminta rekomendasi kelayakan jemaat untuk sakramen baptisan", operator: "Gembala Komsel", date: null, time: null, status: "waiting" },
        { id: 4, title: "Approval gembala jemaat", desc: "Persetujuan akhir oleh Gembala Sidang", operator: "Gembala Sidang", date: null, time: null, status: "waiting" },
        { id: 5, title: "Penjadwalan & konfirmasi", desc: "Konfirmasi tanggal upacara baptisan air", operator: "Pastoral", date: null, time: null, status: "waiting" },
        { id: 6, title: "Sertifikat baptis diterbitkan", desc: "PDF Sertifikat baptisan kudus diterbitkan dan terarsip", operator: "System", date: null, time: null, status: "waiting" }
      ];
    } else if (selectedDocType === "Pernikahan Kudus") {
      colorType = "indigo";
      steps = [
        { id: 1, title: "Pengajuan dokumen nikah", desc: "Jemaat mendaftarkan akta lahir, KTP, dan surat pranikah", operator: "Jemaat", date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"), status: "completed" },
        { id: 2, title: "Konseling Pra-Nikah", desc: "Mengikuti bimbingan pranikah pastoral (5 sesi)", operator: "Pastoral", date: null, time: null, status: "active" },
        { id: 3, title: "Verifikasi kependudukan", desc: "Pengecekan kecocokan berkas catatan sipil dan gereja", operator: "Admin", date: null, time: null, status: "waiting" },
        { id: 4, title: "Pemberkatan pernikahan", desc: "Upacara sakramen pernikahan kudus oleh pendeta", operator: "Gembala Sidang", date: null, time: null, status: "waiting" },
        { id: 5, title: "Penerbitan akta nikah", desc: "Dokumen buku nikah gereja resmi diterbitkan", operator: "System", date: null, time: null, status: "waiting" }
      ];
    } else if (selectedDocType === "Surat Keterangan Aktif") {
      colorType = "amber";
      steps = [
        { id: 1, title: "Pengajuan surat aktif jemaat", desc: "Meminta surat keterangan jemaat aktif", operator: "Jemaat", date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"), status: "completed" },
        { id: 2, title: "Verifikasi keaktifan jemaat", desc: "Pengecekan data absensi kehadiran dan keanggotaan aktif", operator: "Admin", date: null, time: null, status: "active" },
        { id: 3, title: "Approval gembala komsel", desc: "Konfirmasi keaktifan di kelompok sel/komsel jemaat", operator: "Gembala Komsel", date: null, time: null, status: "waiting" },
        { id: 4, title: "Cetak & tanda tangan surat", desc: "Surat diterbitkan resmi dalam bentuk PDF bertanda tangan", operator: "System", date: null, time: null, status: "waiting" }
      ];
    } else if (selectedDocType === "Surat Pindah") {
      colorType = "rose";
      steps = [
        { id: 1, title: "Pengajuan surat pindah", desc: "Memohon surat pengantar pindah keanggotaan gereja baru", operator: "Jemaat", date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"), status: "completed" },
        { id: 2, title: "Wawancara pastoral", desc: "Pertemuan pastoral untuk mendiskusikan kepindahan", operator: "Pastor", date: null, time: null, status: "active" },
        { id: 3, title: "Surat pengantar dikeluarkan", desc: "Surat keterangan pindah resmi diterbitkan", operator: "System", date: null, time: null, status: "waiting" }
      ];
    } else if (selectedDocType === "Baptisan Anak") {
      colorType = "emerald";
      steps = [
        { id: 1, title: "Pengajuan orang tua", desc: "Mendaftarkan anak untuk diserahkan/baptis anak", operator: "Orang Tua", date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"), status: "completed" },
        { id: 2, title: "Verifikasi akta lahir", desc: "Verifikasi akta lahir anak dan surat baptisan orang tua", operator: "Admin", date: null, time: null, status: "active" },
        { id: 3, title: "Penyerahan anak & doa", desc: "Upacara doa penyerahan/baptisan anak di gereja", operator: "Gembala Sidang", date: null, time: null, status: "waiting" },
        { id: 4, title: "Sertifikat diterbitkan", desc: "Sertifikat penyerahan anak resmi diterbitkan", operator: "System", date: null, time: null, status: "waiting" }
      ];
    } else {
      colorType = "blue";
      steps = [
        { id: 1, title: "Permohonan surat jalan", desc: "Mengajukan surat pengantar resmi pelayanan luar kota", operator: "Pelayan", date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"), status: "completed" },
        { id: 2, title: "Rekomendasi kepala divisi", desc: "Rekomendasi tertulis dari ketua pelayanan", operator: "Kadiv Pelayanan", date: null, time: null, status: "active" },
        { id: 3, title: "Approval gembala jemaat", desc: "Persetujuan resmi dari Gembala Sidang", operator: "Pastor", date: null, time: null, status: "waiting" },
        { id: 4, title: "Surat penugasan resmi terbit", desc: "Surat tugas resmi diterbitkan PDF", operator: "System", date: null, time: null, status: "waiting" }
      ];
    }

    let age = 18;
    let bdateStr = "3 Agustus 2007";
    if (selectedMember.birthDate) {
      const birth = new Date(selectedMember.birthDate);
      bdateStr = birth.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const ageDifMs = Date.now() - birth.getTime();
      const ageDate = new Date(ageDifMs);
      age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    const proposedDateFormatted = new Date(reqProposedDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const newSub: SacramentSubmission = {
      id: `sub-${Date.now()}`,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberNij: selectedMember.nij || "Belum ada NIJ",
      memberAge: age,
      memberBirthDate: bdateStr,
      memberCellGroup: selectedMember.cellGroup || "Belum ada komsel",
      memberLeader: "Pdt. Tono Santoso",
      parents: reqParents || "Tidak ada data",
      classStatus: reqClassStatus,
      proposedDate: proposedDateFormatted,
      type: selectedDocType,
      typeColor: colorType,
      status: "Dalam proses",
      createdAt: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      steps,
      notes: reqNotes
    };

    const updated = [newSub, ...submissions];
    saveSubmissions(updated);
    setSelectedSubId(newSub.id);
    setShowAddModal(false);
    
    // Reset fields
    setReqParents("");
    setReqClassStatus("Sudah selesai (3 sesi)");
    setReqNotes("");
    
    triggerToast(`Pengajuan ${selectedDocType} untuk ${selectedMember.name} berhasil diajukan!`);
  };

  // Delete submission
  const handleDeleteSubmission = (id: string, name: string, type: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengajuan ${type} untuk ${name}?`)) return;

    const filtered = submissions.filter(s => s.id !== id);
    saveSubmissions(filtered);

    if (selectedSubId === id) {
      if (filtered.length > 0) {
        setSelectedSubId(filtered[0].id);
      } else {
        setSelectedSubId("");
      }
    }
    triggerToast(`Pengajuan ${type} berhasil dihapus.`);
  };

  // Open Edit Modal
  const handleOpenEdit = (sub: SacramentSubmission) => {
    setEditingSubmission(sub);
    setEditProposedDate(sub.proposedDate);
    setEditParents(sub.parents);
    setEditClassStatus(sub.classStatus);
    setEditNotes(sub.notes || "");
    setShowEditModal(true);
  };

  // Save Edits
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;

    const updated = submissions.map(sub => {
      if (sub.id === editingSubmission.id) {
        return {
          ...sub,
          proposedDate: editProposedDate,
          parents: editParents,
          classStatus: editClassStatus,
          notes: editNotes
        };
      }
      return sub;
    });

    saveSubmissions(updated);
    setShowEditModal(false);
    setEditingSubmission(null);
    triggerToast("Pengajuan berhasil diperbarui!");
  };

  // Get Badge color classes
  const getDocColorTypeClasses = (color: string) => {
    switch (color) {
      case "indigo":
        return "bg-indigo-50 text-indigo-750 border border-indigo-150";
      case "teal":
        return "bg-teal-50 text-teal-750 border border-teal-150";
      case "amber":
        return "bg-amber-50 text-amber-750 border border-amber-150";
      case "blue":
        return "bg-blue-50 text-blue-750 border border-blue-150";
      case "emerald":
        return "bg-emerald-50 text-emerald-750 border border-emerald-150";
      case "rose":
        return "bg-rose-50 text-rose-750 border border-rose-150";
      default:
        return "bg-zinc-50 text-zinc-750 border border-zinc-150";
    }
  };

  // Compute stats dynamically from submissions
  const stats = useMemo(() => {
    const baptisCount = submissions.filter(s => s.type === "Baptisan Air").length;
    const nikahCount = submissions.filter(s => s.type === "Pernikahan Kudus").length;
    const ketCount = submissions.filter(s => s.type === "Surat Keterangan Aktif").length;
    const pindahCount = submissions.filter(s => s.type === "Surat Pindah").length;

    const baptisProc = submissions.filter(s => s.type === "Baptisan Air" && s.status === "Dalam proses").length;
    const nikahProc = submissions.filter(s => s.type === "Pernikahan Kudus" && s.status === "Dalam proses").length;
    const ketProc = submissions.filter(s => s.type === "Surat Keterangan Aktif" && s.status === "Dalam proses").length;
    const pindahProc = submissions.filter(s => s.type === "Surat Pindah" && s.status === "Dalam proses").length;

    return {
      baptis: { total: baptisCount, sub: `${baptisProc} dalam proses` },
      nikah: { total: nikahCount, sub: `${nikahProc} dalam proses` },
      keterangan: { total: ketCount, sub: `${ketProc} pending approval` },
      pindah: { total: pindahCount, sub: `${pindahProc} proses verifikasi` }
    };
  }, [submissions]);

  return (
    <div className="space-y-8 animate-fade-in-up pb-16 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></div>
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Pengajuan Sakramen</h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">
            Kelola pendaftaran sakramen baptisan air/pernikahan, multi-step approval, dan penerbitan sertifikat digital otomatis.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Buat Pengajuan
          </button>
        </div>
      </div>

      <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mt-10 mb-3 ml-1">
        RINGKASAN PENGAJUAN SAKRAMEN
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Baptisan air", value: stats.baptis.total.toString(), sub: stats.baptis.sub, color: "text-zinc-500" },
          { label: "Pernikahan", value: stats.nikah.total.toString(), sub: stats.nikah.sub, color: "text-zinc-500" },
          { label: "Surat keterangan", value: stats.keterangan.total.toString(), sub: stats.keterangan.sub, color: "text-amber-600 font-bold" },
          { label: "Surat pindah", value: stats.pindah.total.toString(), sub: stats.pindah.sub, color: "text-zinc-500" },
        ].map((card, i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-white border border-zinc-200/60 text-zinc-900 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md duration-200"
          >
            <div className="text-sm font-bold text-zinc-500 flex items-center justify-between">
              {card.label}
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-zinc-900">{card.value}</div>
              <div className={`text-xs mt-1 ${card.color}`}>
                {card.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Master List of Letter Submissions */}
      <div className="bg-white border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm text-zinc-900">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
          DAFTAR PENGAJUAN SAKRAMEN GEREJA
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8 text-zinc-450 italic">
              Belum ada data pengajuan surat atau sakramen. Silakan klik **Buat Pengajuan** untuk mendaftarkan permohonan baru.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 text-xs uppercase tracking-wider font-extrabold">
                  <th className="pb-3 pt-1 pl-2">Pemohon (Jemaat)</th>
                  <th className="pb-3 pt-1">Jenis Dokumen</th>
                  <th className="pb-3 pt-1">Tgl Diajukan</th>
                  <th className="pb-3 pt-1">Tahap Approval Aktif</th>
                  <th className="pb-3 pt-1 text-center">Status</th>
                  <th className="pb-3 pt-1 text-right pr-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {submissions.map((sub) => {
                  const isSelected = selectedSubId === sub.id;
                  const colors = getDocColorTypeClasses(sub.typeColor);
                  const activeStep = sub.steps.find(s => s.status === "active");

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSubId(sub.id)}
                      className={`group cursor-pointer hover:bg-zinc-50/80 transition-all rounded-xl ${
                        isSelected ? "bg-zinc-150/70 font-semibold" : ""
                      }`}
                    >
                      {/* Member Applicant */}
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-650 font-black text-xs flex items-center justify-center shrink-0 border border-zinc-200">
                            {sub.memberName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm text-zinc-800 font-bold group-hover:text-zinc-950 transition-colors">
                              {sub.memberName}
                            </span>
                            <span className="block text-[10px] text-zinc-400 mt-0.5">NIJ: {sub.memberNij}</span>
                          </div>
                        </div>
                      </td>
                      {/* Document Type Badge */}
                      <td className="py-3.5">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors}`}>
                          {sub.type}
                        </span>
                      </td>
                      {/* Created Date */}
                      <td className="py-3.5 text-xs text-zinc-500">
                        {sub.createdAt}
                      </td>
                      {/* Current stage description */}
                      <td className="py-3.5 text-xs text-zinc-700">
                        {activeStep ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                            {activeStep.title} ({activeStep.operator})
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                            ✔ Selesai disetujui
                          </span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                          sub.status === "Selesai" 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                            : "bg-purple-50 text-purple-600 border border-purple-200"
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      {/* Action buttons */}
                      <td className="py-3.5 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => setSelectedSubId(sub.id)}
                            className="text-[11px] font-bold text-zinc-600 bg-zinc-50 hover:bg-zinc-200 px-2 py-1.5 rounded border border-zinc-200 transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded border border-indigo-200 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSubmission(sub.id, sub.memberName, sub.type)}
                            className="text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded border border-rose-200 transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail View Section & Stepper approval (Visible when submission is selected) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Left 2 Columns: Selected Pengajuan Detail & Stepper */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm text-zinc-900">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
              ALUR PERSETUJUAN & DETAIL SAKRAMEN
            </div>

            {!activeSubmission ? (
              <div className="text-center py-12 text-zinc-400 italic">
                Pilih salah satu surat atau pengajuan pada tabel di atas untuk memeriksa riwayat langkah approval atau menerbitkan sertifikat.
              </div>
            ) : (
              <>
                {/* Header detail */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-100 pb-5">
                  <div>
                    <h3 className="font-extrabold text-zinc-950 text-lg flex items-center gap-2">
                      Pengajuan {activeSubmission.type} &mdash; {activeSubmission.memberName}
                    </h3>
                    <p className="text-zinc-400 text-xs mt-1">
                      NIJ: {activeSubmission.memberNij} · Diajukan {activeSubmission.createdAt}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      activeSubmission.status === "Selesai" 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : "bg-purple-50 text-purple-600 border border-purple-100"
                    }`}>
                      {activeSubmission.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDocColorTypeClasses(activeSubmission.typeColor)}`}>
                      {activeSubmission.type}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm bg-zinc-50/50 p-5 rounded-2xl border border-zinc-150/60">
                  <div>
                    <span className="block text-xs font-semibold text-zinc-400 mb-0.5">TANGGAL LAHIR</span>
                    <span className="font-extrabold text-zinc-800">{activeSubmission.memberBirthDate} ({activeSubmission.memberAge} thn)</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-zinc-400 mb-0.5">ORANG TUA / WALI</span>
                    <span className="font-extrabold text-zinc-800">{activeSubmission.parents}</span>
                  </div>
                  <div className="mt-2">
                    <span className="block text-xs font-semibold text-zinc-400 mb-0.5">KOMSEL</span>
                    <span className="font-extrabold text-indigo-600">{activeSubmission.memberCellGroup}</span>
                  </div>
                  <div className="mt-2">
                    <span className="block text-xs font-semibold text-zinc-400 mb-0.5">PEMBIMBING ROHANI / PJ</span>
                    <span className="font-extrabold text-zinc-800">{activeSubmission.memberLeader}</span>
                  </div>
                  <div className="mt-2">
                    <span className="block text-xs font-semibold text-zinc-400 mb-0.5">KELAS PERSSIAPAN / STATUS</span>
                    <span className="font-extrabold text-zinc-800">{activeSubmission.classStatus}</span>
                  </div>
                  <div className="mt-2">
                    <span className="block text-xs font-semibold text-zinc-400 mb-0.5">TANGGAL USULAN UPACARA</span>
                    <span className="font-extrabold text-zinc-800">{activeSubmission.proposedDate}</span>
                  </div>
                  {activeSubmission.notes && (
                    <div className="sm:col-span-2 mt-2 pt-2 border-t border-zinc-200/60">
                      <span className="block text-xs font-semibold text-zinc-400 mb-0.5">CATATAN KHUSUS</span>
                      <p className="text-zinc-600 text-xs italic leading-relaxed">{activeSubmission.notes}</p>
                    </div>
                  )}
                </div>

                {/* Stepper Approval */}
                <div className="mb-8">
                  <div className="text-xs font-bold text-zinc-400 tracking-wider mb-6">PROGRESS PENGAJUAN APPROVAL</div>
                  <div className="relative border-l-2 border-zinc-150 ml-4 pl-8 space-y-6">
                    {activeSubmission.steps.map((step) => {
                      const isCompleted = step.status === "completed";
                      const isActive = step.status === "active";

                      return (
                        <div key={step.id} className="relative">
                          {/* Stepper Node Indicator */}
                          <div className={`absolute -left-12 top-0.5 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                            isCompleted 
                              ? "bg-emerald-50 border-emerald-300 text-emerald-500 shadow-sm"
                              : isActive
                              ? "bg-purple-50 border-purple-300 text-purple-600 shadow-sm animate-pulse ring-4 ring-purple-100"
                              : "bg-white border-zinc-200 text-zinc-300"
                          }`}>
                            {isCompleted ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : isActive ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                            ) : (
                              <span className="text-[10px] font-bold">{step.id}</span>
                            )}
                          </div>

                          {/* Stepper Content */}
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className={`text-sm font-black ${
                                isCompleted ? "text-zinc-400 line-through" : isActive ? "text-purple-700 font-extrabold" : "text-zinc-400"
                              }`}>
                                {step.title}
                              </h4>
                              {step.date && (
                                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                                  {step.date} - {step.time}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{step.desc}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-[10px] text-zinc-400 font-semibold">Tanggung Jawab:</span>
                              <span className={`text-[10px] font-bold ${isActive ? "text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100" : "text-zinc-500"}`}>
                                {step.operator}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div className="flex flex-wrap gap-2.5 pt-4 border-t border-zinc-150">
                  <button
                    onClick={handleApproveStep}
                    disabled={activeSubmission.status === "Selesai"}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve ↗
                  </button>
                  <button
                    onClick={handleSendReminder}
                    disabled={activeSubmission.status === "Selesai"}
                    className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current text-zinc-500" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.198 1.451 4.839 1.452 5.393 0 9.778-4.383 9.78-9.775.002-2.612-1.012-5.068-2.857-6.914C16.565 2.07 14.113 1.056 11.5 1.055 6.109 1.055 1.727 5.437 1.725 10.829c-.001 1.693.447 3.344 1.298 4.795l-.973 3.553 3.642-.953c1.436.786 2.972 1.196 4.955 1.196z" />
                    </svg>
                    Kirim reminder
                  </button>
                  <button
                    onClick={() => setShowCertModal(true)}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Pratinjau sertifikat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right 1 Column: Types Checklist */}
        <div>
          <div className="bg-white border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm text-zinc-900 sticky top-6">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-5">
              LAYANAN SAKRAMEN & PASTORAL
            </div>

            {/* List document types in sidebar */}
            <div className="space-y-3.5">
              {documentTypes.map((doc, idx) => {
                const colors = getDocColorTypeClasses(doc.colorType);
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDocType(doc.title.includes("Pernikahan") ? "Pernikahan Kudus" : doc.title.includes("keterangan") ? "Surat Keterangan Aktif" : doc.title.includes("pindah") ? "Surat Pindah" : doc.title.includes("misi") ? "Surat Misi" : doc.title.includes("anak") ? "Baptisan Anak" : "Baptisan Air");
                      setShowAddModal(true);
                    }}
                    className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl hover:bg-zinc-100 hover:border-zinc-300 transition-all cursor-pointer group flex items-start gap-3.5"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${colors}`}>
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-zinc-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-normal mt-1 font-medium">{doc.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Modal Buat Pengajuan Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Buat Pengajuan Surat/Sakramen Baru
            </h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed font-medium">
              Daftarkan sakramen atau ajukan surat atas nama jemaat aktif dari database gereja.
            </p>

            <form onSubmit={handleCreateSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">PILIH JEMAAT (PEMOHON)</label>
                {dbMembers.length === 0 ? (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded border border-rose-100 font-bold">
                    Tidak ada jemaat aktif di database. Tambahkan anggota baru di menu **Jemaat** terlebih dahulu.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Anggota --</option>
                    {dbMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.nij || "Belum ada NIJ"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">JENIS SURAT / SAKRAMEN</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as SacramentSubmission["type"])}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="Baptisan Air">Baptisan Air</option>
                  <option value="Pernikahan Kudus">Pernikahan Kudus</option>
                  <option value="Surat Keterangan Aktif">Surat Keterangan Aktif</option>
                  <option value="Surat Pindah">Surat Pindah</option>
                  <option value="Baptisan Anak">Baptisan Anak</option>
                  <option value="Surat Misi">Surat Misi / Penugasan</option>
                </select>
              </div>

              {selectedDocType.includes("Baptisan") && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1.5">KELAS PERSIPAN / BIMBINGAN</label>
                  <input
                    type="text"
                    value={reqClassStatus}
                    onChange={(e) => setReqClassStatus(e.target.value)}
                    placeholder="Contoh: Sudah selesai (3 sesi)"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}

              {selectedDocType === "Pernikahan Kudus" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1.5">NAMA ORANG TUA / WALI KEDUA PIHAK</label>
                  <input
                    type="text"
                    required
                    value={reqParents}
                    onChange={(e) => setReqParents(e.target.value)}
                    placeholder="Contoh: Herman & Linda Olivia"
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">TANGGAL USULAN UPACARA / PEMBERLAKUAN</label>
                <input
                  type="date"
                  required
                  value={reqProposedDate}
                  onChange={(e) => setReqProposedDate(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">CATATAN KHUSUS (OPSIONAL)</label>
                <textarea
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={2}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={dbMembers.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Ajukan Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Edit Pengajuan */}
      {showEditModal && editingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Pengajuan {editingSubmission.type}
            </h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed font-medium">
              Perbarui rincian usulan pengajuan surat/sakramen untuk pemohon <span className="font-bold text-zinc-900">{editingSubmission.memberName}</span>.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">TANGGAL USULAN UPACARA / PEMBERLAKUAN</label>
                <input
                  type="text"
                  required
                  value={editProposedDate}
                  onChange={(e) => setEditProposedDate(e.target.value)}
                  placeholder="Contoh: 15 Juni 2026 atau Asap"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">NAMA ORANG TUA / WALI KEDUA PIHAK</label>
                <input
                  type="text"
                  required
                  value={editParents}
                  onChange={(e) => setEditParents(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">KELAS PERSIAPAN / STATUS KELAS</label>
                <input
                  type="text"
                  required
                  value={editClassStatus}
                  onChange={(e) => setEditClassStatus(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">CATATAN KHUSUS</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  rows={2.5}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSubmission(null);
                  }}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Pratinjau Sertifikat */}
      {showCertModal && activeSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl p-8 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            
            {/* Certificate border frame */}
            <div className="border-[12px] border-double border-zinc-200 p-6 bg-zinc-50/20 text-center relative overflow-hidden rounded-2xl">
              {/* Ornaments */}
              <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-zinc-400"></div>
              <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-zinc-400"></div>
              <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-zinc-400"></div>
              <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-zinc-400"></div>

              <div className="text-zinc-600 text-3xl mb-3 font-serif">✝</div>
              
              <h2 className="text-zinc-500 font-serif text-sm tracking-[0.2em] font-extrabold">SERTIFIKAT RESMI GEREJA</h2>
              
              <h1 className="text-zinc-800 text-2xl font-serif font-black tracking-wide my-4 border-b border-zinc-200 pb-3 max-w-lg mx-auto uppercase">
                {activeSubmission.type === "Baptisan Air" ? "Baptisan Kudus" : activeSubmission.type === "Pernikahan Kudus" ? "Pemberkatan Pernikahan" : "Keterangan Jemaat Aktif"}
              </h1>

              <p className="text-zinc-500 text-xs italic font-serif my-4">Dengan ini menyatakan secara resmi di hadapan saksi bahwa:</p>
              
              <h3 className="text-indigo-700 text-2xl font-extrabold tracking-wide font-sans my-4">
                {activeSubmission.memberName}
              </h3>
              
              <p className="text-zinc-400 text-xs font-semibold mb-2">NIJ: {activeSubmission.memberNij}</p>

              <p className="text-zinc-650 text-xs leading-relaxed max-w-lg mx-auto font-serif mt-5">
                {activeSubmission.type === "Baptisan Air" && (
                  `telah menerima Sakramen Baptisan Air Kudus pada tanggal ${activeSubmission.proposedDate} sebagai lambang pertobatan resmi dan pengakuan iman yang kudus di dalam nama Allah Bapa, Anak, dan Roh Kudus.`
                )}
                {activeSubmission.type === "Pernikahan Kudus" && (
                  `telah dipersatukan secara kudus dalam ikatan pernikahan kudus gereja di hadapan altar Tuhan pada tanggal ${activeSubmission.proposedDate}. Apa yang telah dipersatukan Allah tidak boleh diceraikan manusia.`
                )}
                {activeSubmission.type !== "Baptisan Air" && activeSubmission.type !== "Pernikahan Kudus" && (
                  `adalah benar-benar jemaat aktif terdaftar yang ikut ambil bagian dalam kegiatan ibadah kelompok sel komsel ${activeSubmission.memberCellGroup} serta penugasan pelayanan lainnya secara aktif.`
                )}
              </p>

              {/* Signatures Panel */}
              <div className="grid grid-cols-2 gap-4 mt-12 pt-6 border-t border-zinc-100 max-w-md mx-auto">
                <div className="text-center">
                  <span className="block text-[10px] text-zinc-400 font-bold mb-6">DISETUJUI OLEH PASTORAL</span>
                  <span className="block text-xs font-bold text-zinc-800 border-b border-zinc-200 pb-1 max-w-[120px] mx-auto">
                    Pdt. Tono Santoso
                  </span>
                  <span className="block text-[9px] text-zinc-400 mt-1 font-semibold">Gembala Komsel</span>
                </div>
                <div className="text-center relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border border-dashed border-indigo-400/40 rounded-full flex items-center justify-center rotate-12 text-[7px] text-indigo-500/50 font-black pointer-events-none uppercase">
                    CHURCHOS SEAL
                  </div>
                  <span className="block text-[10px] text-zinc-400 font-bold mb-6">GEMBALA SIDANG</span>
                  <span className="block text-xs font-bold text-zinc-800 border-b border-zinc-200 pb-1 max-w-[120px] mx-auto italic font-serif">
                    Pdt. Bimo M.Th.
                  </span>
                  <span className="block text-[9px] text-zinc-400 mt-1 font-semibold">Gembala Jemaat</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2.5 bg-zinc-150 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tutup Pratinjau
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
