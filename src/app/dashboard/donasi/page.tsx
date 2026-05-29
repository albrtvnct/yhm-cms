"use client";

import React, { useState } from "react";

// Types
interface DonationHistory {
  id: string;
  category: string;
  date: string;
  method: "QRIS" | "Transfer" | "Tunai";
  amount: string;
}

export default function DonasiDashboard() {
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" | "warning" } | null>(null);
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'analyzed' | 'error'>('idle');
  const [insightText, setInsightText] = useState<string>('');

  const triggerToast = (message: string, type: "success" | "info" | "warning" = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRequestAI = async () => {
    setAiState('loading');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInsightText(
        `<p class="mb-2">Adopsi QRIS naik <strong>22% dalam 3 bulan</strong> &mdash; didominasi jemaat usia 25-40 tahun. Jemaat yang memberikan persembahan via digital memiliki konsistensi 2,4x lebih tinggi dibanding tunai.</p>
         <p class="mb-2">Terdapat <strong>87 jemaat aktif</strong> yang belum pernah memberikan persembahan digital &mdash; potensi peningkatan jika dilakukan edukasi singkat via WA.</p>
         <p>Persembahan Misi bulan ini terendah dalam 6 bulan &mdash; berkorelasi dengan tidak adanya program misi yang berjalan bulan ini.</p>`
      );
      setAiState('analyzed');
    } catch (err) {
      console.error(err);
      setAiState('error');
      setInsightText('Gagal mendapatkan analisis AI.');
    }
  };

  const historyData: DonationHistory[] = [
    { id: "1", category: "Persepuluhan", date: "25 Mei", method: "QRIS", amount: "Rp 500.000" },
    { id: "2", category: "Persembahan umum", date: "25 Mei", method: "QRIS", amount: "Rp 150.000" },
    { id: "3", category: "Misi", date: "18 Mei", method: "Transfer", amount: "Rp 200.000" },
    { id: "4", category: "Persepuluhan", date: "18 Mei", method: "QRIS", amount: "Rp 500.000" },
    { id: "5", category: "Persembahan umum", date: "11 Mei", method: "Tunai", amount: "Rp 100.000" },
  ];

  const getMethodBadge = (method: string) => {
    if (method === "QRIS") return "bg-emerald-50 text-emerald-600 border-emerald-200";
    if (method === "Transfer") return "bg-indigo-50 text-indigo-600 border-indigo-200";
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-16 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border ${
          toast.type === "success" ? "bg-white border-zinc-200 text-zinc-900" : 
          toast.type === "warning" ? "bg-rose-50 border-rose-200 text-rose-700" :
          "bg-indigo-50 border-indigo-200 text-indigo-700"
        }`}>
          <div className={`w-2 h-2 rounded-full animate-ping ${
            toast.type === "success" ? "bg-emerald-500" : 
            toast.type === "warning" ? "bg-rose-500" : "bg-indigo-500"
          }`}></div>
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mt-4 mb-3 ml-1">
        RINGKASAN DONASI & PERSEMBAHAN &mdash; MEI 2026
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm text-white relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Total persembahan
          </div>
          <div className="mt-3 text-3xl font-extrabold">87,4 jt</div>
          <div className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            12% dari bulan lalu
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm text-white relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Via QRIS
          </div>
          <div className="mt-3 text-3xl font-extrabold">34,2 jt</div>
          <div className="text-xs text-zinc-400 font-medium mt-1">39% dari total</div>
        </div>
        {/* Card 3 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm text-white relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            Via transfer
          </div>
          <div className="mt-3 text-3xl font-extrabold">28,6 jt</div>
          <div className="text-xs text-zinc-400 font-medium mt-1">33% dari total</div>
        </div>
        {/* Card 4 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm text-white relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Tunai (kolekte)
          </div>
          <div className="mt-3 text-3xl font-extrabold">24,6 jt</div>
          <div className="text-xs text-zinc-400 font-medium mt-1">28% dari total</div>
        </div>
      </div>

      {/* Metode Pembayaran Supported */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          METODE PEMBAYARAN YANG DIDUKUNG
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800 border-2 border-indigo-500 rounded-xl p-5 shadow-md relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-1">
            <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500"></div>
            <div className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full inline-block mb-3 uppercase tracking-wider">Direkomendasikan</div>
            <div className="flex flex-col items-center text-center">
              <svg className="w-10 h-10 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              <h3 className="text-sm font-black text-white mb-1">QRIS</h3>
              <p className="text-[10px] text-zinc-400 font-medium">Scan QR di layar atau kertas. Semua e-wallet & bank.</p>
            </div>
          </div>
          <div onClick={() => triggerToast('Metode aktif', 'success')} className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-1 hover:border-zinc-300">
            <div className="flex flex-col items-center text-center mt-6">
              <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              <h3 className="text-sm font-extrabold text-zinc-900 mb-1">Transfer bank</h3>
              <p className="text-[10px] text-zinc-500 font-medium">BCA, BRI, Mandiri, BNI &mdash; konfirmasi otomatis.</p>
            </div>
          </div>
          <div onClick={() => triggerToast('Metode aktif', 'success')} className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-1 hover:border-zinc-300">
            <div className="flex flex-col items-center text-center mt-6">
              <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <h3 className="text-sm font-extrabold text-zinc-900 mb-1">Link WA</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Bot kirim link donasi personal sebelum ibadah.</p>
            </div>
          </div>
          <div onClick={() => triggerToast('Metode manual aktif', 'info')} className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-1 hover:border-zinc-300">
            <div className="flex flex-col items-center text-center mt-6">
              <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <h3 className="text-sm font-extrabold text-zinc-900 mb-1">Tunai kolektan</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Kolektan input total setelah ibadah selesai.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulasi Halaman Donasi Jemaat */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          SIMULASI HALAMAN DONASI JEMAAT
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="shrink-0 flex flex-col items-center bg-white p-4 rounded-xl shadow-inner w-full md:w-auto">
            {/* Fake QR Code */}
            <div className="w-48 h-48 bg-zinc-100 flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 relative overflow-hidden">
              <svg className="w-32 h-32 text-zinc-300 absolute" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-contain bg-center bg-no-repeat opacity-80 mix-blend-multiply"></div>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-4">Scan dengan e-wallet apapun</p>
          </div>
          <div className="flex-1 w-full text-center md:text-left">
            <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Yayasan / Gereja</p>
            <h2 className="text-2xl font-black text-white mt-1 mb-1">GBI Jakarta Pusat</h2>
            <p className="text-xs text-zinc-500 font-mono bg-zinc-800 inline-block px-2 py-1 rounded mb-6">NMID: ID1234567890</p>
            
            <p className="text-sm font-bold text-zinc-300 mb-3">Pilih Kategori persembahan</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
              <button className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 text-xs font-bold transition-colors">Persembahan umum</button>
              <button className="px-4 py-2 rounded-lg border border-indigo-500/50 bg-indigo-500/10 text-indigo-400 text-xs font-bold transition-colors ring-1 ring-indigo-500/50">Persepuluhan</button>
              <button className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 text-xs font-bold transition-colors">Misi & penginjilan</button>
              <button className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 text-xs font-bold transition-colors">Diakonia</button>
              <button className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 text-xs font-bold transition-colors">Pembangunan</button>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium italic border-t border-zinc-800 pt-4 flex items-center justify-center md:justify-start gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Setelah transfer, konfirmasi otomatis masuk ke sistem & WA
            </p>
          </div>
        </div>
      </div>

      {/* Notifikasi Konfirmasi WA */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          NOTIFIKASI KONFIRMASI OTOMATIS VIA WA
        </div>
        <div className="bg-zinc-100 border border-zinc-200/60 rounded-2xl p-6 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              Dikirim otomatis setelah pembayaran
            </h3>
            <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
              Real-time
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jemaat WA */}
            <div className="bg-[#E7F6E7] border border-[#d1e8d1] rounded-2xl p-5 shadow-sm relative before:absolute before:-left-2 before:top-4 before:w-0 before:h-0 before:border-t-8 before:border-t-transparent before:border-r-8 before:border-r-[#E7F6E7] before:border-b-8 before:border-b-transparent">
              <div className="flex justify-between items-center border-b border-[#d1e8d1] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-black text-[#1F2937]">Bot YeshProduction &rarr; Sari Rahayu</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold">Minggu, 10:32</span>
              </div>
              <div className="text-xs text-[#374151] font-medium leading-relaxed space-y-3">
                <p>Halo Sari, terima kasih!</p>
                <p>Persembahan kamu telah kami terima:<br/>
                Kategori: <strong>Persepuluhan</strong><br/>
                Jumlah: <strong>Rp 500.000</strong><br/>
                Tanggal: 25 Mei 2026</p>
                <p className="italic">Tuhan memberkati pelayananmu.</p>
              </div>
            </div>

            {/* Bendahara WA */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm relative before:absolute before:-left-2 before:top-4 before:w-0 before:h-0 before:border-t-8 before:border-t-transparent before:border-r-8 before:border-r-white before:border-b-8 before:border-b-transparent">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-xs font-black text-zinc-800">Bot YeshProduction &rarr; Bendahara</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold">Minggu, 10:32</span>
              </div>
              <div className="text-xs text-zinc-600 font-medium leading-relaxed space-y-3">
                <p className="font-bold text-zinc-800">Pemberitahuan masuk:</p>
                <p>
                Sari Rahayu (NO: 00412)<br/>
                Kategori: <strong>Persepuluhan</strong><br/>
                Metode: QRIS<br/>
                Jumlah: <strong>Rp 500.000</strong>
                </p>
                <p className="pt-2 border-t border-zinc-100 text-indigo-600 font-bold">Saldo hari ini: Rp 23.450.000</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Donasi Per Jemaat */}
      <div className="mt-10 relative">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase ml-1">
            RIWAYAT DONASI PER JEMAAT &mdash; SARI RAHAYU
          </div>
          <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            Hak Akses Terbatas
          </span>
        </div>
        
        <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Table / Member Info */}
          <div className="bg-zinc-900 p-5 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full font-black text-xs flex items-center justify-center shrink-0 bg-white text-zinc-900 shadow-sm">
                SR
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white mb-0.5">Sari Rahayu</h3>
                <p className="text-[10px] text-zinc-400 font-medium">NO: 00412 &bull; Total tahun ini: Rp 6.250.000</p>
              </div>
            </div>
            <button onClick={() => triggerToast("Form kirim pesan ke Sari Rahayu dibuka.", "info")} className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
              Kirim WA
            </button>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-5 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Kategori</th>
                  <th className="px-5 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Tanggal</th>
                  <th className="px-5 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-wider">Metode</th>
                  <th className="px-5 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-wider text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((row, idx) => (
                  <tr key={row.id} className={`border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors ${idx === 0 ? 'bg-indigo-50/20' : ''}`}>
                    <td className="px-5 py-4 text-xs font-bold text-zinc-800">{row.category}</td>
                    <td className="px-5 py-4 text-xs font-medium text-zinc-500">{row.date}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded text-[9px] font-black border tracking-wider ${getMethodBadge(row.method)}`}>
                        {row.method}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-black text-emerald-600 text-right">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rekap Persembahan Per Kategori */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          REKAP PERSEMBAHAN PER KATEGORI &mdash; MEI 2026
        </div>
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-5 mb-5">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
              Distribusi per kategori
            </h3>
            <div className="bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm">
              Total Rp 87,4 jt
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-32 text-xs font-bold text-zinc-700 shrink-0 truncate">Persembahan umum</div>
              <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden flex items-center shadow-inner">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: '52%' }}></div>
              </div>
              <div className="w-16 text-right text-xs font-black text-zinc-900 shrink-0">Rp 45,4 jt</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-xs font-bold text-zinc-700 shrink-0 truncate">Persepuluhan</div>
              <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden flex items-center shadow-inner">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: '23%' }}></div>
              </div>
              <div className="w-16 text-right text-xs font-black text-zinc-900 shrink-0">Rp 20,1 jt</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-xs font-bold text-zinc-700 shrink-0 truncate">Misi & penginjilan</div>
              <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden flex items-center shadow-inner">
                <div className="h-full rounded-full bg-sky-500" style={{ width: '9%' }}></div>
              </div>
              <div className="w-16 text-right text-xs font-black text-zinc-900 shrink-0">Rp 7,9 jt</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-xs font-bold text-zinc-700 shrink-0 truncate">Diakonia</div>
              <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden flex items-center shadow-inner">
                <div className="h-full rounded-full bg-amber-500" style={{ width: '8%' }}></div>
              </div>
              <div className="w-16 text-right text-xs font-black text-zinc-900 shrink-0">Rp 7,0 jt</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-xs font-bold text-zinc-700 shrink-0 truncate">Pembangunan</div>
              <div className="flex-1 bg-zinc-100 rounded-full h-2.5 overflow-hidden flex items-center shadow-inner">
                <div className="h-full rounded-full bg-rose-500" style={{ width: '8%' }}></div>
              </div>
              <div className="w-16 text-right text-xs font-black text-zinc-900 shrink-0">Rp 7,0 jt</div>
            </div>
          </div>
          
          {/* AI Donation Analyst By Request */}
          <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 shadow ${aiState === 'loading' ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500'}`}></div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-zinc-900">AI Donation Analyst &mdash; insight bulan ini</h3>
                  {aiState === 'analyzed' && (
                    <button onClick={handleRequestAI} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors">
                      Perbarui Analisis
                    </button>
                  )}
                </div>
                
                {aiState === 'idle' && (
                  <div className="text-center py-6">
                    <p className="text-xs text-zinc-500 mb-4">Sistem AI YeshProduction siap memantau perilaku persembahan digital, perbandingan demografi, dan korelasi antar kategori donasi.</p>
                    <button 
                      onClick={handleRequestAI}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2 mx-auto"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Minta Analisis AI
                    </button>
                  </div>
                )}

                {aiState === 'loading' && (
                  <div className="space-y-3 animate-pulse mt-4">
                    <div className="h-3 bg-zinc-200 rounded w-full"></div>
                    <div className="h-3 bg-zinc-200 rounded w-5/6"></div>
                    <div className="h-3 bg-zinc-200 rounded w-4/6"></div>
                  </div>
                )}

                {aiState === 'analyzed' && (
                  <div 
                    className="text-xs text-zinc-700 leading-relaxed font-medium mt-3 mb-5"
                    dangerouslySetInnerHTML={{ __html: insightText }}
                  />
                )}

                {aiState === 'error' && (
                  <div className="text-xs text-rose-600 font-medium mt-3 mb-5">
                    {insightText}
                  </div>
                )}

                {/* Actions when Analyzed or not, always keep these buttons accessible as per mockup */}
                {(aiState === 'analyzed' || aiState === 'idle') && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-200">
                    <button onClick={() => triggerToast("Draft pesan sedang disiapkan...", "success")} className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Draft WA edukasi digital
                    </button>
                    <button onClick={() => triggerToast("Laporan Excel sedang diunduh...", "info")} className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Eksport laporan Excel
                    </button>
                    <button onClick={() => triggerToast("Membuka pengaturan donasi rutin...", "info")} className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Setup donasi rutin
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fitur Lengkap Modul Donasi Digital */}
      <div className="mt-10">
        <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-3 ml-1">
          FITUR LENGKAP MODUL DONASI DIGITAL
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-white shadow-sm hover:border-zinc-700 transition-colors">
            <svg className="w-5 h-5 text-zinc-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <h4 className="text-sm font-bold mb-2">QRIS dinamis per kategori</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Scan QR code dengan pilihan kategori jemaat, pilih persembahan umum, persepuluhan, atau misi sebelum bayar.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-white shadow-sm hover:border-zinc-700 transition-colors">
            <svg className="w-5 h-5 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h4 className="text-sm font-bold mb-2">Konfirmasi real-time</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Pembayaran terdeteksi otomatis, jemaat dapat ucapan terima kasih WA, bendahara dapat notifikasi, sistem catat ke keuangan.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-white shadow-sm hover:border-zinc-700 transition-colors">
            <svg className="w-5 h-5 text-indigo-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <h4 className="text-sm font-bold mb-2">Riwayat per jemaat</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Setiap jemaat punya riwayat lengkap semua donasi yang pernah diberikan. Bisa dilihat pengurus khusus atau oleh jemaat sendiri.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-white shadow-sm hover:border-zinc-700 transition-colors">
            <svg className="w-5 h-5 text-amber-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <h4 className="text-sm font-bold mb-2">Donasi rutin</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Jemaat bisa setup auto-transfer bulanan. Sistem kirim reminder sebelum tanggal jika belum ada konfirmasi masuk.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-white shadow-sm hover:border-zinc-700 transition-colors">
            <svg className="w-5 h-5 text-sky-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <h4 className="text-sm font-bold mb-2">Integrasi modul keuangan</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Setiap donasi otomatis masuk ke modul keuangan dengan kategori yang tepat. Tidak ada double-entry oleh bendahara.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-white shadow-sm hover:border-zinc-700 transition-colors">
            <svg className="w-5 h-5 text-rose-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h4 className="text-sm font-bold mb-2">Tanda terima digital</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Jemaat bisa minta tanda terima PDF resmi berlogo gereja untuk keperluan pelaporan atau dokumentasi pribadi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
