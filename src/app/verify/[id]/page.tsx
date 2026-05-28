"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function VerifyDocumentPage({ params }: { params: { id: string } }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch on mobile views

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-red-200">
      {/* Container simulating a mobile view layout as requested */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative pb-10">
        
        {/* Logos Header */}
        <div className="flex items-center justify-between px-6 py-5">
          {/* Left Logo (Persekutuan & Pelayanan...) */}
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 20 L20 40 L30 80 L70 80 L80 40 Z" fill="#ECA225" />
                <path d="M50 80 C20 80 20 50 50 50 C80 50 80 80 50 80" fill="#E53935" />
                <circle cx="20" cy="40" r="8" fill="#ECA225" />
                <circle cx="50" cy="20" r="8" fill="#ECA225" />
                <circle cx="80" cy="40" r="8" fill="#ECA225" />
              </svg>
            </div>
            <div className="text-[9px] font-bold text-red-700 leading-tight">
              <span className="text-[#D4AF37]">Persekutuan & Pelayanan</span><br/>
              Hamba Tuhan <span className="text-red-700">Garis Depan</span>
            </div>
          </div>
          
          {/* Right Logo (LevelUP) */}
          <div className="bg-[#B71C1C] text-white px-3 py-2 text-right">
            <div className="font-black italic text-xl tracking-tighter leading-none">
              Level<span className="text-[#ECA225]">UP</span>
            </div>
            <div className="text-[5px] uppercase tracking-[0.2em] mt-0.5 opacity-90">
              THE JEREMIAH GENERATION
            </div>
          </div>
        </div>

        {/* Big Red Header */}
        <div className="bg-[#B71C1C] text-white text-center py-6 mx-4 mt-2 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">Informasi Dokumen</h1>
          <p className="text-xl font-light italic mt-1 opacity-90">Document Information</p>
        </div>

        {/* Document Meta Info Grid */}
        <div className="grid grid-cols-2 gap-y-6 px-8 mt-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <h2 className="text-[15px] font-bold text-black mb-2">Nomor Surat :</h2>
              <p className="text-[13px] font-bold font-mono">182/LUP-NAS/SU/V-2026</p>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-black mb-2">Surat :</h2>
              <p className="text-[13px] font-bold">Surat Undangan</p>
            </div>
            <div>
              <p className="text-[13px] text-gray-800 leading-snug">
                Dibuat oleh,<br/>
                LEVELUP
              </p>
            </div>
            <div>
              <p className="text-[13px] italic text-gray-800 leading-snug">
                Produced by,<br/>
                LEVELUP
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 text-right">
            <div>
              <h2 className="text-[17px] font-bold text-black mb-2 leading-tight">Tanggal<br/>buat :</h2>
              <p className="text-[14px] text-gray-800">17/05/20251</p>
              <p className="text-[14px] text-gray-800">10.30 WIB</p>
            </div>
            <div className="pt-8">
              <h2 className="text-[17px] font-bold italic text-black mb-2 leading-tight">Produced<br/>date:</h2>
              <p className="text-[14px] text-gray-800">17/05/2025</p>
              <p className="text-[14px] text-gray-800">10.30 WIB</p>
            </div>
          </div>
        </div>

        {/* Grey Divider Header */}
        <div className="bg-[#E0E0E0] mx-4 mt-8 py-3 px-4 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-[#9E9E9E]">Rincian</h3>
            <p className="text-lg italic text-[#9E9E9E] -mt-1">Details</p>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-bold text-[#9E9E9E]">Status</h3>
            <p className="text-lg italic text-[#9E9E9E] -mt-1">Status</p>
          </div>
        </div>

        {/* Signatures List */}
        <div className="px-6 mt-6 space-y-8">
          
          {/* Signer 1 */}
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-6 h-6 shrink-0 mt-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="text-black">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-medium text-black leading-tight">Pieter Martino Purnama</p>
                <p className="text-[14px] text-black leading-tight">Sekretaris PIC</p>
                <p className="text-[14px] text-black leading-tight">LevelUP</p>
                <p className="text-[13px] italic text-gray-800 mt-1 leading-tight">17/05/2025</p>
                <p className="text-[13px] italic text-gray-800 leading-tight">10.30 WIB</p>
              </div>
            </div>
            <div className="text-right pl-4">
              <p className="text-[14px] font-medium text-black leading-tight">Telah</p>
              <p className="text-[14px] font-medium text-black leading-tight">ditandatangani</p>
              <p className="text-[14px] italic text-black leading-tight">signed</p>
            </div>
          </div>

          {/* Signer 2 */}
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-6 h-6 shrink-0 mt-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="text-black">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-medium text-black leading-tight">Stefanus Kusuma</p>
                <p className="text-[14px] text-black leading-tight">PIC</p>
                <p className="text-[14px] text-black leading-tight">LevelUP</p>
                <p className="text-[13px] italic text-gray-800 mt-1 leading-tight">17/05/2025</p>
                <p className="text-[13px] italic text-gray-800 leading-tight">10.30 WIB</p>
              </div>
            </div>
            <div className="text-right pl-4">
              <p className="text-[14px] font-medium text-black leading-tight">Telah</p>
              <p className="text-[14px] font-medium text-black leading-tight">ditandatangani</p>
              <p className="text-[14px] italic text-black leading-tight">signed</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
