"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getInventoryData, addInventoryItem, deleteInventoryItem } from '@/app/actions/inventory';
import Portal from '@/components/Portal';

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  price: number;
  condition: string;
  division: string;
  notes: string | null;
  createdAt: string;
}

interface DivisionStat {
  name: string;
  count: number;
  totalPrice: number;
  percent: number;
}

export default function InventarisDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [divisions, setDivisions] = useState<DivisionStat[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [dbError, setDbError] = useState<string | null>(null);

  const [aiState, setAiState] = useState<'idle' | 'loading' | 'analyzed' | 'error'>('idle');
  const [insightText, setInsightText] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'ALL' | 'DIVISION'>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('Semua');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getInventoryData();
    if (res.success && res.data) {
      // @ts-ignore
      setItems(res.data.items);
      setDivisions(res.data.divisions);
      setTotalCount(res.data.totalCount);
      setTotalPrice(res.data.totalPrice);
      setDbError(null);
      
      // Load AI Insight from church model if it exists
      // Wait, we didn't return aiInsight from getInventoryData yet. Let's fix that in a bit, or just leave it empty on initial load until they click.
      // Actually let's just leave it empty on first load to make it truly 'by request' as requested before: "Sama kaya page lainnya yang request".
    } else {
      setDbError(res.error || "Gagal mengambil data dari database");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    const res = await addInventoryItem(payload);
    if (res.success) {
      setShowAddModal(false);
      await loadData();
    } else {
      alert("Gagal menambahkan barang: " + res.error);
    }
    setFormLoading(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Hapus barang ini dari inventaris?")) return;
    const res = await deleteInventoryItem(id);
    if (res.success) {
      await loadData();
    } else {
      alert("Gagal menghapus: " + res.error);
    }
  };

  const handleRequestAI = async () => {
    setAiState('loading');
    try {
      const res = await fetch('/api/ai/inventaris', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan jaringan.');
      }
      
      setInsightText(data.insight);
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
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(2).replace('.00', '')}M`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace('.0', '')} jt`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
    return val.toString();
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'Baik':
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">Baik</span>;
      case 'Rusak Ringan':
        return <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">Rusak Ringan</span>;
      case 'Rusak Berat':
        return <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md">Rusak Berat</span>;
      default:
        return <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-md">{condition}</span>;
    }
  };

  const allDivisionNames = useMemo(() => {
    return ['Semua', ...Array.from(new Set(items.map(i => i.division)))];
  }, [items]);

  const displayedItems = useMemo(() => {
    if (activeTab === 'ALL' || selectedDivision === 'Semua') return items;
    return items.filter(i => i.division === selectedDivision);
  }, [items, activeTab, selectedDivision]);

  return (
    <div className="space-y-8 animate-fade-in-up pb-12 font-sans relative">
      {dbError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="font-semibold text-sm">{dbError}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Inventaris</h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">Kelola seluruh aset, alat, dan properti gereja di satu tempat.</p>
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
            Tambah Barang
          </button>
        </div>
      </div>

      <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mt-10 mb-3 ml-1">Ringkasan Aset</div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-6 rounded-3xl shadow-sm border border-zinc-200/60 bg-white relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md duration-300">
          <div className="text-sm font-bold text-zinc-500 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            Jumlah Alat Terdaftar
          </div>
          <div className="mt-4">
            {isLoading ? (
              <div className="h-8 w-24 bg-zinc-200/50 rounded-lg animate-pulse"></div>
            ) : (
              <div className="text-4xl font-black tracking-tight text-zinc-900">{totalCount} <span className="text-lg font-bold text-zinc-400">item</span></div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-zinc-800 bg-zinc-900 relative overflow-hidden transition-all hover:-translate-y-1 duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="text-sm font-bold text-zinc-300 flex items-center gap-2 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            Total Nilai Aset
          </div>
          <div className="mt-4 relative z-10">
            {isLoading ? (
              <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse"></div>
            ) : (
              <div className="text-4xl font-black tracking-tight text-white">
                <span className="text-2xl text-zinc-400 mr-1">Rp</span>
                {totalPrice.toLocaleString('id-ID')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* GRAPHIC DIVISIONS */}
        <div className="lg:col-span-1 bg-white rounded-[2rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-zinc-200/60 flex flex-col">
          <h3 className="text-xl font-extrabold text-zinc-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            </div>
            Distribusi Alat
          </h3>
          
          <div className="space-y-5 flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400"></div></div>
            ) : divisions.length === 0 ? (
              <div className="text-center text-zinc-500 font-medium text-sm flex h-full items-center justify-center">Belum ada barang di inventaris.</div>
            ) : (
              divisions.map((div, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-sm font-bold text-zinc-700">{div.name}</span>
                    </div>
                    <span className="text-sm font-black text-zinc-900">{div.count} <span className="text-xs font-semibold text-zinc-400 ml-1">({div.percent}%)</span></span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${div.percent}%` }}></div>
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-400 mt-1.5 text-right">Aset: Rp {formatCurrency(div.totalPrice)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TABLES */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-zinc-200/60 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-100 pb-4">
            <h3 className="text-xl font-extrabold text-zinc-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-600 flex items-center justify-center shadow-inner">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </div>
              Daftar Barang
            </h3>
            
            {/* TABS */}
            <div className="bg-zinc-100 p-1 rounded-xl flex">
              <button 
                onClick={() => setActiveTab('ALL')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'ALL' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setActiveTab('DIVISION')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'DIVISION' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Per Divisi
              </button>
            </div>
          </div>

          {activeTab === 'DIVISION' && (
            <div className="mb-4">
              <select 
                value={selectedDivision} 
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                {allDivisionNames.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80">
                  <th className="py-3 px-4 text-xs font-black text-zinc-400 tracking-wider uppercase whitespace-nowrap">Kode</th>
                  <th className="py-3 px-4 text-xs font-black text-zinc-400 tracking-wider uppercase min-w-[200px]">Nama Barang</th>
                  <th className="py-3 px-4 text-xs font-black text-zinc-400 tracking-wider uppercase whitespace-nowrap">Divisi</th>
                  <th className="py-3 px-4 text-xs font-black text-zinc-400 tracking-wider uppercase whitespace-nowrap">Kondisi</th>
                  <th className="py-3 px-4 text-xs font-black text-zinc-400 tracking-wider uppercase text-right whitespace-nowrap">Harga</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                       <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-400"></div></div>
                    </td>
                  </tr>
                ) : displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium text-sm">Tidak ada barang yang ditemukan.</td>
                  </tr>
                ) : displayedItems.map(item => (
                  <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                    <td className="py-4 px-4 text-xs font-bold text-zinc-500 whitespace-nowrap">{item.code}</td>
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-zinc-900 text-sm">{item.name}</div>
                      {item.notes && <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">{item.notes}</div>}
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-zinc-700 whitespace-nowrap">{item.division}</td>
                    <td className="py-4 px-4 whitespace-nowrap">{getConditionBadge(item.condition)}</td>
                    <td className="py-4 px-4 text-sm font-black text-zinc-900 text-right whitespace-nowrap">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDeleteItem(item.id)} className="w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* AI ANALYST BANNER */}
      <div>
        <h2 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mb-4 ml-1">AI Analyst</h2>
        <div className="bg-zinc-900 rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none transition-all group-hover:bg-indigo-500/20"></div>
          
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  AI Asset Manager
                </h3>
                {lastUpdated && <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md">Update: {lastUpdated}</span>}
              </div>
              
              <div className="mt-4">
                {aiState === 'idle' ? (
                  <div className="text-sm text-zinc-400 italic border-l-2 border-indigo-500/30 pl-4 py-2">
                    Sistem AI YeshProduction siap memonitor kondisi barang, depresiasi nilai, dan kebutuhan maintenance secara otomatis.
                  </div>
                ) : aiState === 'loading' ? (
                  <div className="flex items-center gap-3 text-sm text-indigo-300 font-medium animate-pulse border-l-2 border-indigo-500 pl-4 py-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Gemini AI sedang mengaudit kondisi aset Anda...
                  </div>
                ) : (
                  <div className="text-sm text-zinc-200 leading-relaxed max-w-4xl" dangerouslySetInnerHTML={{ __html: insightText }}></div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">Audit Kondisi</button>
                <button className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors">Prediksi Maintenance</button>
              </div>
              
              <button 
                onClick={handleRequestAI}
                disabled={aiState === 'loading'}
                className="shrink-0 w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.4)] cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {aiState === 'idle' ? 'Minta Audit AI' : aiState === 'loading' ? 'Menganalisis...' : 'Perbarui Audit AI'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: INPUT BARANG */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up border border-zinc-200/60 p-8">
              <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-zinc-900">Input Barang Baru</h3>
                  <p className="text-zinc-500 text-sm mt-1">Lengkapi detail aset inventaris gereja.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nama Barang *</label>
                    <input required name="name" type="text" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm font-medium text-zinc-900" placeholder="Misal: Keyboard Yamaha Motif XF8" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Kode Barang *</label>
                    <input required name="code" type="text" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm font-bold text-zinc-900 uppercase" placeholder="Misal: MUS-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Harga Barang (Rp) *</label>
                    <input required name="price" type="number" min="0" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm font-bold text-zinc-900" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Kondisi *</label>
                    <select required name="condition" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm font-bold text-zinc-700 bg-white">
                      <option value="Baik">Baik</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Berat">Rusak Berat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Kepemilikan (Divisi) *</label>
                    <input required name="division" type="text" list="divisionsList" className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm font-bold text-zinc-900" placeholder="Ketik atau pilih divisi..." />
                    <datalist id="divisionsList">
                      {allDivisionNames.filter(d => d !== 'Semua').map(div => (
                        <option key={div} value={div} />
                      ))}
                    </datalist>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">Keterangan (Opsional)</label>
                    <textarea name="notes" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm font-medium text-zinc-900" placeholder="Catatan tambahan seperti lokasi penyimpanan, tanggal beli, dsb..."></textarea>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-colors">Batal</button>
                  <button type="submit" disabled={formLoading} className="px-5 py-2.5 text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors shadow-md disabled:opacity-50">
                    {formLoading ? 'Menyimpan...' : 'Simpan Barang'}
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
