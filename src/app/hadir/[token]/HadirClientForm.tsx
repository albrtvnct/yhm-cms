"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { incrementRealtimeAttendance, decrementRealtimeAttendance, getRealtimeAttendanceStats } from "@/app/actions/hadir";

interface SessionData {
  churchId: string;
  recordId: string;
  churchName: string;
  serviceType: string;
  serviceDate: string;
  male: number;
  female: number;
}

interface HadirClientFormProps {
  sessionData: SessionData;
}

export default function HadirClientForm({ sessionData }: HadirClientFormProps) {
  const [male, setMale] = useState(sessionData.male ?? 0);
  const [female, setFemale] = useState(sessionData.female ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "L" | "P" } | null>(null);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll database stats every 100ms to sync multiple clicker phones (10 data per sec)
  const syncStats = useCallback(async () => {
    // Skip updating from DB if the user has tapped in the last 100ms to avoid jitter
    if (Date.now() - lastClickTimeRef.current < 100) return;

    const res = await getRealtimeAttendanceStats(sessionData.recordId);
    if (res.success && res.data) {
      setMale(res.data.male);
      setFemale(res.data.female);
    }
  }, [sessionData.recordId]);

  useEffect(() => {
    const interval = setInterval(syncStats, 100);
    return () => clearInterval(interval);
  }, [syncStats]);

  // Show premium success toast
  const triggerToast = (message: string, type: "L" | "P") => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 1500);
    setToastTimer(timer);
  };

  // Increment Click
  const handleIncrement = async (gender: "Laki-laki" | "Perempuan") => {
    lastClickTimeRef.current = Date.now();
    setError(null);

    // Optimistic UI update
    if (gender === "Laki-laki") {
      setMale((prev) => prev + 1);
      triggerToast("ABSENSI BERHASIL! (+1 Laki-laki)", "L");
    } else {
      setFemale((prev) => prev + 1);
      triggerToast("ABSENSI BERHASIL! (+1 Perempuan)", "P");
    }

    setSubmitting(true);
    try {
      const res = await incrementRealtimeAttendance(sessionData.recordId, gender);
      if (res.success && res.data) {
        // Only apply DB stats if the user hasn't clicked again in the meantime
        if (Date.now() - lastClickTimeRef.current >= 100) {
          setMale(res.data.male);
          setFemale(res.data.female);
        }
      } else {
        setError(res.error || "Gagal memperbarui data di server");
      }
    } catch (err: any) {
      console.error("handleIncrement error:", err);
      setError(err.message || "Kesalahan jaringan. Pastikan terhubung ke Wi-Fi laptop.");
    }
    setSubmitting(false);
  };

  // Decrement Click (Koreksi jika salah klik)
  const handleDecrement = async (gender: "Laki-laki" | "Perempuan") => {
    if (gender === "Laki-laki" && male <= 0) return;
    if (gender === "Perempuan" && female <= 0) return;

    lastClickTimeRef.current = Date.now();
    setError(null);

    // Optimistic UI update
    if (gender === "Laki-laki") {
      setMale((prev) => Math.max(0, prev - 1));
      triggerToast("KOREKSI BERHASIL! (-1 Laki-laki)", "L");
    } else {
      setFemale((prev) => Math.max(0, prev - 1));
      triggerToast("KOREKSI BERHASIL! (-1 Perempuan)", "P");
    }

    setSubmitting(true);
    try {
      const res = await decrementRealtimeAttendance(sessionData.recordId, gender);
      if (res.success && res.data) {
        // Only apply DB stats if the user hasn't clicked again in the meantime
        if (Date.now() - lastClickTimeRef.current >= 100) {
          setMale(res.data.male);
          setFemale(res.data.female);
        }
      } else {
        setError(res.error || "Gagal melakukan koreksi di server");
      }
    } catch (err: any) {
      console.error("handleDecrement error:", err);
      setError(err.message || "Kesalahan jaringan. Pastikan terhubung ke Wi-Fi laptop.");
    }
    setSubmitting(false);
  };

  const fmtDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200/60 p-6 shadow-2xl relative overflow-hidden font-sans">
      {/* Background glow decorator */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />

      {/* Floating success toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce border ${
          toast.type === "L" ? "bg-blue-600 border-blue-500" : "bg-pink-600 border-pink-500"
        }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          {toast.message}
        </div>
      )}

      {/* Top Header */}
      <div className="text-center mb-6 relative z-10">
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Absensi RealTime</h1>
        <p className="text-zinc-400 text-xs font-semibold mt-1 uppercase tracking-wider">{sessionData.churchName}</p>
        <div className="mt-3 inline-block px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/50 text-zinc-600 text-xs font-bold">
          {sessionData.serviceType} · {mounted ? new Date(sessionData.serviceDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "..."}
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-start gap-2 animate-fade-in-up">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <strong>Gagal Mengirim:</strong> {error}
            </div>
          </div>
        )}

        {/* ROW 1: TOTAL KEHADIRAN (Kotak lebar penuh) */}
        <div className="bg-zinc-900 text-white rounded-2xl p-6 text-center relative overflow-hidden shadow-lg border border-zinc-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">TOTAL KEHADIRAN</div>
            <div className="text-5xl font-black tracking-tight">{(male + female).toLocaleString()}</div>
            <div className="text-[10px] text-zinc-500 mt-2 font-medium">terhitung langsung di pintu masuk</div>
          </div>
        </div>

        {/* ROW 2: TOTAL JEMAAT LAKI-LAKI & PEREMPUAN (Dua kolom) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-[9px] font-black text-blue-500 uppercase tracking-wider">TOTAL LAKI-LAKI</div>
            <div className="text-3xl font-black text-blue-700 mt-1">{male.toLocaleString()}</div>
          </div>
          <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-[9px] font-black text-pink-500 uppercase tracking-wider">TOTAL PEREMPUAN</div>
            <div className="text-3xl font-black text-pink-700 mt-1">{female.toLocaleString()}</div>
          </div>
        </div>

        {/* ROW 3: +1 LAKI LAKI & +1 PEREMPUAN (Dua tombol besar clicker) */}
        <div className="grid grid-cols-2 gap-4 h-56">
          <button
            onClick={() => handleIncrement("Laki-laki")}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-3xl p-6 font-black text-lg flex flex-col items-center justify-center gap-3 shadow-lg shadow-blue-600/25 active:scale-95 transition-all cursor-pointer select-none border border-blue-500 focus:outline-none"
          >
            <svg className="w-10 h-10 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm uppercase tracking-wide tracking-wider text-blue-100">Laki-Laki</span>
            <span className="text-xs text-blue-200 font-bold bg-blue-700/50 px-3 py-1 rounded-full">+1 Absen</span>
          </button>
          <button
            onClick={() => handleIncrement("Perempuan")}
            className="bg-pink-500 hover:bg-pink-400 text-white rounded-3xl p-6 font-black text-lg flex flex-col items-center justify-center gap-3 shadow-lg shadow-pink-500/25 active:scale-95 transition-all cursor-pointer select-none border border-pink-400 focus:outline-none"
          >
            <svg className="w-10 h-10 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm uppercase tracking-wide tracking-wider text-pink-100">Perempuan</span>
            <span className="text-xs text-pink-200 font-bold bg-pink-600/50 px-3 py-1 rounded-full">+1 Absen</span>
          </button>
        </div>

        {/* ROW 4: UNDO BUTTONS (koreksi kesalahan jika salah klik) */}
        <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
          <button
            onClick={() => handleDecrement("Laki-laki")}
            disabled={male <= 0}
            className="py-2.5 rounded-xl border border-blue-200 text-blue-600 bg-blue-50/20 text-xs font-bold hover:bg-blue-50 transition-colors disabled:opacity-30 cursor-pointer"
          >
            Koreksi Laki-Laki (-1)
          </button>
          <button
            onClick={() => handleDecrement("Perempuan")}
            disabled={female <= 0}
            className="py-2.5 rounded-xl border border-pink-200 text-pink-600 bg-pink-50/20 text-xs font-bold hover:bg-pink-50 transition-colors disabled:opacity-30 cursor-pointer"
          >
            Koreksi Perempuan (-1)
          </button>
        </div>
      </div>
    </div>
  );
}
