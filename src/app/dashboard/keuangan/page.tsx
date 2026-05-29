"use client";

import React, { useState, useEffect } from 'react';
import { getKeuanganData, addTransaction, deleteTransaction, addDivision, deleteDivision } from '@/app/actions/finance';
import Portal from '@/components/Portal';

interface SummaryData {
  pemasukan?: number;
  pengeluaran?: number;
  saldo?: number;
  rataRata?: number;
}

interface DivisionData {
  id: string;
  label: string;
  percent: number;
  val: number;
  warn: boolean;
}

interface TransactionData {
  id: string;
  title: string;
  desc: string;
  amount: number;
  type: string; // "INCOME" or "EXPENSE"
  date: string;
}

export default function KeuanganDashboard() {
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'analyzed' | 'error'>('idle');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [insightText, setInsightText] = useState<string>('');
  const [trends, setTrends] = useState<{ trendPemasukan?: string, trendPengeluaran?: string, trendSaldo?: string, trendRataRata?: string } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [divisions, setDivisions] = useState<DivisionData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormLoading, setAddFormLoading] = useState(false);
  
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetFormLoading, setBudgetFormLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getKeuanganData();
    if (res.success && res.data) {
      setSummaryData(res.data.summary);
      // @ts-ignore
      setDivisions(res.data.divisions);
      // @ts-ignore
      setTransactions(res.data.transactions);
      if (res.data.aiInsight) {
        try {
          const parsed = JSON.parse(res.data.aiInsight);
          setInsightText(parsed.insight || res.data.aiInsight);
          if (parsed.trendPemasukan) {
            setTrends(parsed);
          }
        } catch (e) {
          setInsightText(res.data.aiInsight);
        }
        setAiState('analyzed');
      }
    } else {
      setDbError(res.error || "Gagal mengambil data dari database");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setAddFormLoading(true);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    
    const res = await addTransaction(payload);
    if (res.success) {
      form.reset();
      setShowAddModal(false);
      await loadData();
    } else {
      alert("Gagal menambahkan transaksi: " + res.error);
    }
    setAddFormLoading(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Hapus transaksi ini? Saldo dan grafik akan dikoreksi otomatis.")) return;
    const res = await deleteTransaction(id);
    if (res.success) {
      await loadData();
    } else {
      alert("Gagal menghapus: " + res.error);
    }
  };

  const handleAddDivision = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBudgetFormLoading(true);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    
    const res = await addDivision(payload);
    if (res.success) {
      form.reset();
      await loadData();
    } else {
      alert("Gagal menambah anggaran: " + res.error);
    }
    setBudgetFormLoading(false);
  };

  const handleDeleteDivision = async (id: string) => {
    if (!confirm("Hapus divisi anggaran ini?")) return;
    const res = await deleteDivision(id);
    if (res.success) {
      await loadData();
    } else {
      alert("Gagal menghapus: " + res.error);
    }
  };

  const handleRequestAI = async () => {
    setAiState('loading');
    try {
      const res = await fetch('/api/ai', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan jaringan.');
      }
      
      setInsightText(data.insight);
      setTrends({
        trendPemasukan: data.trendPemasukan,
        trendPengeluaran: data.trendPengeluaran,
        trendSaldo: data.trendSaldo,
        trendRataRata: data.trendRataRata
      });
      setAiState('analyzed');
      setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setInsightText(err.message || 'Gagal mengambil analisis. Pastikan GEMINI_API_KEY sudah diisi.');
      } else {
        setInsightText('Gagal mengambil analisis. Pastikan GEMINI_API_KEY sudah diisi.');
      }
      setAiState('error');
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace('.0', '')} jt`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
    return val.toString();
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-12 font-sans relative">
      {dbError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="font-semibold text-sm">{dbError}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Keuangan</h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">Pantau arus kas, realisasi anggaran, dan dapatkan insight cerdas.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border-2 border-zinc-200/80 text-zinc-700 text-sm font-bold rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Ekspor
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Catat Transaksi
          </button>
        </div>
      </div>

      <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mt-10 mb-3 ml-1">Bulan Ini</div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Pemasukan", val: summaryData?.pemasukan || 0, trend: trends?.trendPemasukan || "Belum ada analisis AI", icon: "M12 4v16m8-8H4", color: "emerald" },
          { label: "Pengeluaran", val: summaryData?.pengeluaran || 0, trend: trends?.trendPengeluaran || "Belum ada analisis AI", icon: "M20 12H4", color: "rose" },
          { 
            label: "Saldo Bersih", 
            val: summaryData?.saldo || 0, 
            trend: trends?.trendSaldo || ((summaryData?.saldo || 0) === 0 ? "Belum ada data / data belum cukup" : ((summaryData?.saldo || 0) > 0 ? "Surplus" : "Defisit")), 
            icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3", 
            color: (summaryData?.saldo || 0) >= 0 ? "emerald" : "rose", 
            highlight: true 
          },
          { label: "Rata/Jemaat", val: summaryData?.rataRata || 0, trend: trends?.trendRataRata || "Belum ada analisis AI", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "emerald" },
        ].map((card, i) => (
          <div key={i} className={`p-6 rounded-3xl shadow-sm flex flex-col justify-between h-40 border relative overflow-hidden transition-all hover:-translate-y-1 duration-300 ${card.highlight ? 'bg-zinc-900 border-zinc-800 text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]' : 'bg-white border-zinc-200/60 text-zinc-900 hover:shadow-md'}`}>
            {card.highlight && <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>}
            
            <div className={`text-sm font-bold flex items-center justify-between relative z-10 ${card.highlight ? 'text-zinc-300' : 'text-zinc-500'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.highlight ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={card.icon} /></svg>
                </div>
                {card.label}
              </div>
            </div>

            <div className="relative z-10 mt-4">
              {isLoading ? (
                <div className="h-8 w-24 bg-zinc-200/50 rounded-lg animate-pulse mb-1"></div>
              ) : (
                <div className="text-3xl font-black tracking-tight">{formatCurrency(card.val)}</div>
              )}
              <div className={`text-xs font-bold mt-2 flex items-center gap-1.5 ${card.color === 'emerald' ? 'text-emerald-500' : 'text-rose-500'} ${card.highlight && card.color === 'emerald' ? 'text-emerald-400' : ''}`}>
                <span className={`flex items-center justify-center w-4 h-4 rounded-full ${card.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'} ${card.highlight && 'bg-white/10 text-emerald-400'}`}>
                  {card.color === 'emerald' ? (
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  ) : (
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
                  )}
                </span>
                {card.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Anggaran vs Realisasi */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-zinc-200/60 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-extrabold text-zinc-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              Anggaran & Realisasi
            </h3>
            <button onClick={() => setShowBudgetModal(true)} className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-200/60 transition-colors">
              Atur Anggaran
            </button>
          </div>
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {isLoading && divisions.length === 0 ? (
               <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400"></div></div>
            ) : divisions.length === 0 ? (
              <div className="text-center text-zinc-500 font-medium text-sm">Belum ada data anggaran divisi. Klik "Atur Anggaran".</div>
            ) : divisions.map((item) => (
              <div key={item.id} className="group">
                <div className="flex justify-between items-end mb-2.5">
                  <span className="text-sm font-bold text-zinc-700">{item.label}</span>
                  <span className={`text-sm font-black ${item.warn ? 'text-rose-600 flex items-center gap-1' : 'text-zinc-900'}`}>
                    {item.warn ? 'Overbudget' : `${item.percent}%`}
                    {item.warn && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    {!item.warn && <span className="text-xs font-semibold text-zinc-400 ml-1.5">(Rp {item.val.toLocaleString('id-ID')})</span>}
                  </span>
                </div>
                <div className={`h-3 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner`}>
                  <div className={`h-full ${item.warn ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(item.percent, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-zinc-200/60 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-extrabold text-zinc-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              Transaksi Terbaru
            </h3>
            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Audit Trail
            </span>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-2">
            {isLoading && transactions.length === 0 ? (
               <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400"></div></div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-zinc-500 font-medium text-sm">Belum ada transaksi.</div>
            ) : transactions.map((trx) => (
              <div key={trx.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors rounded-2xl border border-transparent hover:border-zinc-200/60 group cursor-pointer relative">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${trx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                    {trx.type === 'INCOME' ? (
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    ) : (
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    )}
                  </div>
                  <div>
                    <div className="font-extrabold text-zinc-900 text-sm">{trx.title}</div>
                    <div className="text-xs font-semibold text-zinc-500 mt-1">{trx.desc || 'Tanpa keterangan'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black tracking-tight ${trx.type === 'INCOME' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                    {trx.type === 'INCOME' ? '+' : '-'}Rp {trx.amount.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">{new Date(trx.date).toLocaleDateString('id-ID')}</div>
                </div>

                {/* Hapus Button (Hover) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(trx.id); }}
                  className="absolute -right-2 -top-2 w-8 h-8 bg-rose-500 text-white rounded-full items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex hover:bg-rose-600 z-10"
                  title="Hapus Transaksi"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
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
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                  AI Financial Analyst
                </h3>
                {lastUpdated && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md">Update: {lastUpdated}</span>}
              </div>
              
              <div className="mt-4">
                {aiState === 'idle' ? (
                  <div className="text-sm text-zinc-400 italic border-l-2 border-purple-500/30 pl-4 py-2">
                    Sistem AI ChurchOS siap menganalisis tren keuangan, kebocoran anggaran, dan memberikan wawasan kesehatan kas secara instan.
                  </div>
                ) : aiState === 'loading' ? (
                  <div className="flex items-center gap-3 text-sm text-purple-300 font-medium animate-pulse border-l-2 border-purple-500 pl-4 py-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    OpenRouter AI sedang menganalisis buku kas Anda...
                  </div>
                ) : (
                  <div className="text-sm text-zinc-200 leading-relaxed max-w-4xl" dangerouslySetInnerHTML={{ __html: insightText }}></div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">Tren kas</button>
                <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">Efisiensi divisi</button>
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


      {/* ------------------------------------------------------------- */}
      {/* MODAL: TAMBAH TRANSAKSI BARU */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60 p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-zinc-900">Catat Transaksi</h3>
                  <p className="text-zinc-500 text-sm mt-1">Sistem akan memperbarui total kas gereja otomatis.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="space-y-5">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Jenis Transaksi</label>
                    <div className="flex gap-4">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 transition-all">
                        <input type="radio" name="type" value="INCOME" className="hidden" required />
                        <div className="w-4 h-4 rounded-full border-2 border-zinc-300 flex items-center justify-center peer-checked:border-emerald-500">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 hidden peer-checked:block"></div>
                        </div>
                        <span className="text-sm font-bold text-zinc-700">Pemasukan</span>
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 transition-all">
                        <input type="radio" name="type" value="EXPENSE" className="hidden" required />
                        <div className="w-4 h-4 rounded-full border-2 border-zinc-300 flex items-center justify-center peer-checked:border-rose-500">
                          <div className="w-2 h-2 rounded-full bg-rose-500 hidden peer-checked:block"></div>
                        </div>
                        <span className="text-sm font-bold text-zinc-700">Pengeluaran</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Judul Transaksi *</label>
                    <input required name="title" type="text" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" placeholder="Misal: Persembahan Ibadah Raya 1" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nominal (Rupiah) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-zinc-500 text-sm font-bold">Rp</span>
                      <input required name="amount" type="number" min="0" step="1000" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900 font-medium" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Tanggal *</label>
                    <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Keterangan (Opsional)</label>
                    <textarea name="desc" rows={2} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm text-zinc-900" placeholder="Catatan tambahan..."></textarea>
                  </div>
                </div>
                <div className="pt-6 border-t border-zinc-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-colors">Batal</button>
                  <button type="submit" disabled={addFormLoading} className="px-5 py-2.5 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-md disabled:opacity-50">
                    {addFormLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: MANAJEMEN ANGGARAN (BUDGET) */}
      {/* ------------------------------------------------------------- */}
      {showBudgetModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60 p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-zinc-900">Atur Anggaran & Realisasi</h3>
                  <p className="text-zinc-500 text-sm mt-1">Kelola progres anggaran masing-masing divisi untuk memantau overbudget.</p>
                </div>
                <button onClick={() => setShowBudgetModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4 mb-8">
                {divisions.length === 0 ? (
                  <div className="p-4 bg-zinc-50 rounded-xl text-center text-zinc-500 text-sm font-medium">Belum ada divisi terdaftar.</div>
                ) : (
                  divisions.map(div => (
                    <div key={div.id} className="flex items-center justify-between p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-sm">
                      <div>
                        <div className="font-extrabold text-zinc-900 text-sm">{div.label}</div>
                        <div className="text-xs text-zinc-500 mt-1">Realisasi: Rp {div.val.toLocaleString('id-ID')} ({div.percent}%)</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteDivision(div.id)}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 p-2 rounded-lg transition-colors"
                        title="Hapus Divisi"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddDivision} className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200/80">
                <h4 className="text-sm font-extrabold text-zinc-900 mb-4">Tambah Divisi / Program Baru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nama Divisi / Program</label>
                    <input required name="label" type="text" className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" placeholder="Misal: Operasional, Pembangunan..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nominal Realisasi (Rp)</label>
                    <input required name="val" type="number" min="0" className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Persentase Pemakaian (%)</label>
                    <input required name="percent" type="number" min="0" max="200" step="1" className="w-full px-4 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm" placeholder="Misal: 45" />
                  </div>
                </div>
                <button type="submit" disabled={budgetFormLoading} className="w-full px-5 py-2.5 text-sm font-bold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50">
                  {budgetFormLoading ? 'Menambahkan...' : '+ Tambah Divisi'}
                </button>
              </form>

            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
