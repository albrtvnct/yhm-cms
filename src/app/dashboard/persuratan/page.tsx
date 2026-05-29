"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";

interface Letter {
  id: string;
  type: "Surat Masuk" | "Surat Keluar";
  number: string;
  date: string;
  senderOrRecipient: string;
  subject: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  isAiGenerated?: boolean;
  isSigned?: boolean;
  aiTemplate?: string;
  aiPrompt?: string;
}

export default function PersuratanDashboard() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" } | null>(null);

  // Form State
  const [formType, setFormType] = useState<"Surat Masuk" | "Surat Keluar">("Surat Masuk");
  const [formNumber, setFormNumber] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formSenderRecipient, setFormSenderRecipient] = useState("");
  const [formSubject, setFormSubject] = useState("");
  
  // AI vs Upload Toggle
  const [creationMethod, setCreationMethod] = useState<"UPLOAD" | "AI">("UPLOAD");
  const [aiTemplate, setAiTemplate] = useState("Surat Undangan");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== "application/pdf") {
      triggerToast("Hanya file berformat PDF yang diizinkan.", "error");
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      triggerToast("Ukuran file maksimal adalah 5MB.", "error");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormNumber("");
    setFormSenderRecipient("");
    setFormSubject("");
    setSelectedFile(null);
    setAiPrompt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formType === "Surat Keluar" && creationMethod === "AI") {
      if (!aiPrompt) {
        triggerToast("Harap masukkan instruksi/poin isi surat untuk AI.", "error");
        return;
      }
      setIsGenerating(true);
      // Simulate AI Generation
      setTimeout(() => {
        const newLetter: Letter = {
          id: `letter-${Date.now()}`,
          type: "Surat Keluar",
          number: formNumber,
          date: formDate,
          senderOrRecipient: formSenderRecipient,
          subject: formSubject,
          fileName: `[AI]_${aiTemplate.replace(/\s+/g, "_")}_Draft.docx`,
          fileSize: 45000, // mock 45KB docx
          uploadDate: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
          isAiGenerated: true,
          isSigned: false,
          aiTemplate: aiTemplate,
          aiPrompt: aiPrompt
        };
        setLetters([newLetter, ...letters]);
        setIsGenerating(false);
        setShowModal(false);
        resetForm();
        triggerToast("Draft Surat Keluar berhasil di-generate oleh AI!", "success");
      }, 2500);
      return;
    }

    // Manual Upload Logic
    if (!selectedFile) {
      triggerToast("Harap unggah file dokumen PDF terlebih dahulu.", "error");
      return;
    }

    const newLetter: Letter = {
      id: `letter-${Date.now()}`,
      type: formType,
      number: formNumber,
      date: formDate,
      senderOrRecipient: formSenderRecipient,
      subject: formSubject,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      uploadDate: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    };

    setLetters([newLetter, ...letters]);
    setShowModal(false);
    resetForm();
    triggerToast(`Data ${formType} berhasil ditambahkan!`, "success");
  };

  const handleSignQR = (id: string) => {
    setLetters(letters.map(l => l.id === id ? { ...l, isSigned: true, fileName: l.fileName.replace("_Draft.docx", "_Signed.pdf") } : l));
    triggerToast("Tanda tangan PIC dan QR Code berhasil dibubuhkan secara digital!", "success");
  };

  const handleDownload = async (fileName: string, letter: Letter) => {
    triggerToast(`Memproses file ${fileName}...`, "info");
    
    try {
      if (fileName.toLowerCase().endsWith('.pdf')) {
        // Generate real PDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(183, 28, 28);
        doc.text("Informasi Dokumen - YeshProduction", 105, 20, { align: "center" });
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Nomor Surat: ${letter.number}`, 20, 40);
        doc.text(`Kategori: ${letter.type}`, 20, 50);
        doc.text(`Perihal: ${letter.subject}`, 20, 60);
        doc.text(`Pengirim/Tujuan: ${letter.senderOrRecipient}`, 20, 70);
        
        if (letter.isSigned) {
          doc.setTextColor(34, 197, 94); // Green
          doc.text("STATUS: Telah Ditandatangani secara Digital (QR)", 20, 90);
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(10);
          doc.text("Dokumen ini valid dan tersertifikasi oleh sistem YeshProduction.", 20, 100);
        }
        
        doc.save(fileName);
        triggerToast(`Berhasil mengunduh ${fileName}`, "success");
        
      } else if (fileName.toLowerCase().endsWith('.docx')) {
        // Generate real DOCX
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                text: "DRAFT SURAT KELUAR - YeshProduction",
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 400 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Nomor Surat: ", bold: true }),
                  new TextRun(letter.number),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Tujuan: ", bold: true }),
                  new TextRun(letter.senderOrRecipient),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Perihal: ", bold: true }),
                  new TextRun(letter.subject),
                ],
                spacing: { after: 400 }
              }),
              new Paragraph({
                text: letter.aiTemplate === "Surat Undangan" 
                  ? `Salam sejahtera,\nMelalui surat ini, kami mengundang Bapak/Ibu untuk hadir dalam acara kami dengan rincian kegiatan sebagai berikut:\n\n${letter.aiPrompt || "-"}\n\nKami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatian dan pelayanannya kami ucapkan terima kasih.` 
                  : letter.aiTemplate === "Surat Keterangan"
                  ? `Salam sejahtera,\nYang bertanda tangan di bawah ini menerangkan dengan sesungguhnya bahwa:\n\n${letter.aiPrompt || "-"}\n\nDemikian surat keterangan ini kami buat agar dapat dipergunakan sebagaimana mestinya.`
                  : `Salam sejahtera,\nBersama dengan surat ini kami ingin menyampaikan perihal berikut:\n\n${letter.aiPrompt || "-"}\n\nDemikian surat ini disampaikan. Terima kasih atas perhatian dan kerja samanya.`,
                spacing: { after: 200 }
              }),
            ],
          }],
        });
        
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        triggerToast(`Berhasil mengunduh ${fileName}`, "success");
      } else {
        // Fallback for other files (uploaded PDFs but we don't have the backend blob yet)
        const content = `Nama File Asli: ${fileName}\n\nIni adalah dokumen simulasi. Karena ini adalah file upload manual tanpa backend, sistem hanya men-download preview ini.`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName.replace(/\.[^/.]+$/, "")}_Preview.txt`; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        triggerToast(`File ${fileName} diunduh sebagai Preview.`, "success");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Gagal memproses dokumen. Pastikan library sudah terinstal.", "error");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = useMemo(() => {
    const masuk = letters.filter(l => l.type === "Surat Masuk").length;
    const keluar = letters.filter(l => l.type === "Surat Keluar").length;
    return { masuk, keluar, total: masuk + keluar };
  }, [letters]);

  return (
    <div className="space-y-8 animate-fade-in-up pb-16 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border ${
          toast.type === "success" ? "bg-zinc-900 border-zinc-800 text-white" : 
          toast.type === "info" ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
          "bg-rose-50 border-rose-200 text-rose-700"
        }`}>
          {toast.type === "success" ? (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          ) : toast.type === "info" ? (
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Manajemen Persuratan</h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">
            Pusat arsip dan pencatatan Surat Masuk & Surat Keluar gereja dengan lampiran digital PDF & AI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Arsip Surat
          </button>
        </div>
      </div>

      <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mt-10 mb-3 ml-1">
        RINGKASAN ARSIP SURAT
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-zinc-200/60 text-zinc-900 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md duration-200">
          <div className="text-sm font-bold text-zinc-500">Total Arsip</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">{stats.total} <span className="text-sm text-zinc-400 font-medium">Dokumen</span></div>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-zinc-200/60 text-zinc-900 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md duration-200">
          <div className="text-sm font-bold text-teal-600">Surat Masuk</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">{stats.masuk} <span className="text-sm text-zinc-400 font-medium">Tercatat</span></div>
        </div>
        <div className="p-6 rounded-3xl bg-white border border-zinc-200/60 text-zinc-900 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md duration-200">
          <div className="text-sm font-bold text-amber-600">Surat Keluar</div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900">{stats.keluar} <span className="text-sm text-zinc-400 font-medium">Tercatat</span></div>
        </div>
      </div>

      {/* Letters List */}
      <div className="bg-white border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm text-zinc-900">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
          DOKUMEN SURAT MENYURAT
        </div>

        <div className="overflow-x-auto">
          {letters.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 italic">
              <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              Belum ada arsip surat. Klik **Tambah Arsip Surat** untuk mulai mencatat.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 text-xs uppercase tracking-wider font-extrabold">
                  <th className="pb-3 pt-1 pl-2">Kategori</th>
                  <th className="pb-3 pt-1">No. Surat & Tanggal</th>
                  <th className="pb-3 pt-1">Pengirim/Tujuan</th>
                  <th className="pb-3 pt-1">Perihal</th>
                  <th className="pb-3 pt-1">Lampiran</th>
                  <th className="pb-3 pt-1 text-right pr-2">Aksi & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {letters.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50/80 transition-all">
                    <td className="py-3.5 pl-2">
                      <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-black tracking-wider uppercase ${
                        l.type === "Surat Masuk" 
                          ? "bg-teal-50 text-teal-600 border border-teal-200" 
                          : "bg-amber-50 text-amber-600 border border-amber-200"
                      }`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-zinc-900 text-sm">{l.number}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{l.date}</div>
                    </td>
                    <td className="py-3.5 text-sm font-semibold text-zinc-700">
                      {l.senderOrRecipient}
                    </td>
                    <td className="py-3.5 text-xs text-zinc-600 font-medium">
                      {l.subject}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 ${l.fileName.endsWith('.docx') ? 'text-blue-500' : 'text-rose-500'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.362 2c4.156 0 2.638 6 2.638 6s6-1.65 6 2.457v11.543h-16v-20h7.362zm.827-2h-10.189v24h20v-14.386c0-2.391-6.648-9.614-9.811-9.614zm-4.321 13.916c-.347-.281-.975-.591-1.428-.591-.581 0-.916.143-.916.482 0 .229.135.326.545.385.748.11 1.705.511 1.705 1.545 0 .976-.841 1.621-1.921 1.621-.614 0-1.282-.189-1.637-.419l.36-.934c.404.281 1.134.469 1.488.469.418 0 .614-.143.614-.419 0-.256-.169-.34-.58-.398-.795-.124-1.67-.533-1.67-1.522 0-1.121 1.05-1.623 2.033-1.623.633 0 1.25.137 1.622.391l-.214.993zm5.006.182v1.543c0 .878-.451 1.693-1.668 1.693-1.391 0-1.803-.895-1.803-1.854 0-.853.336-1.691 1.761-1.691 1.398 0 1.71.742 1.71 1.517v.792zm-2.428-.276c0 .484.095 1.42.753 1.42.592 0 .633-.87.633-1.34v-.567c0-.285-.015-.712-.662-.712-.553 0-.724.498-.724.872v.327zm6.556 1.485c0 .762-.729 1.954-2.189 1.954h-1.503v-4.07h1.442c1.378 0 2.25 1.189 2.25 2.116v.001zm-2.527-1.137v2.093h.423c.892 0 1.011-.933 1.011-1.135 0-1.008-.667-1.049-1.053-1.049h-.381z" />
                        </svg>
                        <div>
                          <span className="block text-[11px] font-bold text-zinc-700 truncate max-w-[120px]" title={l.fileName}>
                            {l.fileName}
                          </span>
                          <span className="block text-[9px] text-zinc-400">{formatBytes(l.fileSize)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <div className="flex items-center justify-end gap-2">
                        {l.isAiGenerated && !l.isSigned && (
                          <button 
                            onClick={() => handleSignQR(l.id)}
                            className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 rounded border border-emerald-200 transition-colors"
                          >
                            Bubuhi TTD QR
                          </button>
                        )}
                        {l.isAiGenerated && l.isSigned && (
                          <Link href={`/verify/${l.id}`} target="_blank" className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded border border-indigo-200 transition-colors flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                            Verifikasi
                          </Link>
                        )}
                        <button onClick={() => handleDownload(l.fileName, l)} className="text-[11px] font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded border border-zinc-200 transition-colors cursor-pointer">
                          Unduh
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- Modal Upload / Generate Surat --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg p-6 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Pencatatan Surat Baru
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Jenis Surat</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      setFormType(e.target.value as "Surat Masuk" | "Surat Keluar");
                      if (e.target.value === "Surat Masuk") setCreationMethod("UPLOAD");
                    }}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                  >
                    <option value="Surat Masuk">Masuk</option>
                    <option value="Surat Keluar">Keluar</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Nomor Surat</label>
                  <input
                    type="text"
                    required
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    placeholder="Contoh: 012/Gereja/X/2026"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
              </div>

              {formType === "Surat Keluar" && (
                <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setCreationMethod("UPLOAD")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${creationMethod === "UPLOAD" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                  >
                    Upload Manual
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCreationMethod("AI")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${creationMethod === "AI" ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Generate AI
                  </button>
                </div>
              )}

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Tanggal Surat</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">
                    {formType === "Surat Masuk" ? "Pengirim" : "Tujuan/Kepada"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formSenderRecipient}
                    onChange={(e) => setFormSenderRecipient(e.target.value)}
                    placeholder={formType === "Surat Masuk" ? "Nama Pengirim..." : "Tujuan Surat..."}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Perihal / Subjek</label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Perihal surat..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors font-medium"
                />
              </div>

              {/* Dynamic Uploader vs AI Generator */}
              {creationMethod === "UPLOAD" ? (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">File Lampiran (PDF)</label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      isDragging ? "border-indigo-500 bg-indigo-50/50" : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input 
                      type="file" 
                      accept=".pdf,application/pdf" 
                      onChange={handleFileChange}
                      className="hidden" 
                      ref={fileInputRef} 
                    />
                    
                    {!selectedFile ? (
                      <>
                        <div className="w-10 h-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-indigo-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-zinc-700 mb-1">Tarik & Lepas File PDF ke sini</p>
                        <p className="text-[11px] text-zinc-400 mb-3">Maksimal ukuran file: 5 MB</p>
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-1.5 bg-white border border-zinc-200 text-xs font-bold text-zinc-600 rounded-lg hover:bg-zinc-50 shadow-sm"
                        >
                          Atau Pilih File Manual
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg className="w-10 h-10 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-bold text-zinc-800">{selectedFile.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">{formatBytes(selectedFile.size)}</p>
                        <button 
                          type="button" 
                          onClick={() => setSelectedFile(null)}
                          className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-700 underline decoration-rose-300"
                        >
                          Hapus & Ganti File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 border-2 border-indigo-100 bg-indigo-50/30 rounded-2xl p-4">
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-700 mb-1.5 uppercase tracking-wider">Gunakan Template</label>
                    <select
                      value={aiTemplate}
                      onChange={(e) => setAiTemplate(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors font-medium shadow-sm"
                    >
                      <option value="Surat Undangan">Surat Undangan</option>
                      <option value="Surat Keterangan">Surat Keterangan</option>
                      <option value="Surat Peminjaman">Surat Peminjaman</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-700 mb-1.5 uppercase tracking-wider">Poin Instruksi (Prompt)</label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={3}
                      placeholder="Contoh: Tolong buatkan surat undangan rapat pengurus untuk tanggal 20 Mei jam 10 pagi, bahas evaluasi KKR."
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors font-medium shadow-sm resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center gap-2 ${
                    creationMethod === "AI" 
                      ? "bg-indigo-600 hover:bg-indigo-700" 
                      : "bg-zinc-900 hover:bg-zinc-800"
                  } disabled:opacity-70 disabled:cursor-wait`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      Sedang Digenerate AI...
                    </>
                  ) : creationMethod === "AI" ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Generate Draft Surat
                    </>
                  ) : (
                    "Simpan & Upload Manual"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
