"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAttendanceMode } from "@/app/actions/attendance";

type Mode = "BULK" | "QR" | null;

export default function SetupPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Mode>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    await setAttendanceMode(selected);
    router.push("/dashboard/kehadiran");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px] pointer-events-none opacity-60" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-amber-100 rounded-full blur-[100px] pointer-events-none opacity-50" />

      <div className="relative z-10 w-full max-w-2xl">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">✓</span>
            <span className="text-emerald-500">Buat Akun</span>
          </div>
          <div className="w-8 h-px bg-zinc-200" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black">2</span>
            <span className="text-zinc-900">Setup Kehadiran</span>
          </div>
          <div className="w-8 h-px bg-zinc-200" />
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-widest">
            <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center text-[10px] font-black">3</span>
            <span>Dashboard</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-200/60 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Setup Awal Kehadiran
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight mb-3">
            Bagaimana cara gereja kamu<br className="hidden sm:block" /> mencatat kehadiran?
          </h1>
          <p className="text-zinc-500 text-base max-w-md mx-auto">
            Pilih metode yang paling sesuai. Kamu bisa mengubahnya nanti di <span className="font-semibold text-zinc-700">Pengaturan</span>.
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">

          {/* BULK Card */}
          <button
            id="mode-bulk"
            onClick={() => setSelected("BULK")}
            className={`group relative text-left rounded-3xl p-7 border-2 transition-all duration-300 cursor-pointer focus:outline-none ${
              selected === "BULK"
                ? "border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-900/20 scale-[1.02]"
                : "border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-lg hover:scale-[1.01]"
            }`}
          >
            {/* Selected check */}
            {selected === "BULK" && (
              <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <svg className="w-4 h-4 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
              selected === "BULK" ? "bg-white/15" : "bg-zinc-100 group-hover:bg-zinc-200"
            }`}>
              <svg className={`w-7 h-7 ${selected === "BULK" ? "text-white" : "text-zinc-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>

            <div className={`text-xs font-black uppercase tracking-widest mb-2 ${selected === "BULK" ? "text-white/60" : "text-zinc-400"}`}>
              Metode 1
            </div>
            <h3 className={`text-xl font-extrabold mb-3 leading-tight ${selected === "BULK" ? "text-white" : "text-zinc-900"}`}>
              Absensi Rekap
            </h3>
            <p className={`text-sm leading-relaxed ${selected === "BULK" ? "text-white/70" : "text-zinc-500"}`}>
              Masukkan total jumlah <strong className={selected === "BULK" ? "text-white" : "text-zinc-700"}>laki-laki</strong> dan <strong className={selected === "BULK" ? "text-white" : "text-zinc-700"}>perempuan</strong> setelah ibadah selesai. Cepat dan mudah secara manual.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              {["Cepat", "Manual", "Per ibadah"].map(tag => (
                <span key={tag} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                  selected === "BULK"
                    ? "bg-white/10 text-white/80 border-white/20"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200"
                }`}>
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* QR Card */}
          <button
            id="mode-qr"
            onClick={() => setSelected("QR")}
            className={`group relative text-left rounded-3xl p-7 border-2 transition-all duration-300 cursor-pointer focus:outline-none ${
              selected === "QR"
                ? "border-indigo-600 bg-indigo-600 shadow-2xl shadow-indigo-600/20 scale-[1.02]"
                : "border-zinc-200 bg-white hover:border-indigo-400 hover:shadow-lg hover:scale-[1.01]"
            }`}
          >
            {/* Selected check */}
            {selected === "QR" && (
              <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
              selected === "QR" ? "bg-white/15" : "bg-indigo-50 group-hover:bg-indigo-100"
            }`}>
              <svg className={`w-7 h-7 ${selected === "QR" ? "text-white" : "text-indigo-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>

            <div className={`text-xs font-black uppercase tracking-widest mb-2 ${selected === "QR" ? "text-white/60" : "text-indigo-400"}`}>
              Metode 2
            </div>
            <h3 className={`text-xl font-extrabold mb-3 leading-tight ${selected === "QR" ? "text-white" : "text-zinc-900"}`}>
              Absensi RealTime
            </h3>
            <p className={`text-sm leading-relaxed ${selected === "QR" ? "text-white/70" : "text-zinc-500"}`}>
              Gunakan <strong className={selected === "QR" ? "text-white" : "text-indigo-700"}>aplikasi HP clicker</strong> untuk mencatat kehadiran jemaat masuk secara real-time. Bagikan link/QR sesi untuk ushers penerima tamu pintu masuk.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              {["Otomatis", "Per jemaat", "Real-time"].map(tag => (
                <span key={tag} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                  selected === "QR"
                    ? "bg-white/10 text-white/80 border-white/20"
                    : "bg-indigo-50 text-indigo-600 border-indigo-200/60"
                }`}>
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>

        {/* Comparison table */}
        <div className="bg-zinc-50 rounded-2xl border border-zinc-200/60 p-5 mb-8">
          <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">Perbandingan</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-zinc-500 font-semibold" />
            <div className="text-center font-extrabold text-zinc-900">Absensi Rekap</div>
            <div className="text-center font-extrabold text-indigo-600">Absensi RealTime</div>

            {[
              ["Perangkat tambahan", "Tidak perlu", "Tidak perlu*"],
              ["Akurasi data", "Per total sesi", "Per individu"],
              ["Waktu setup", "Langsung", "1–2 menit/sesi"],
              ["Cocok untuk", "Ibadah besar", "Semua ukuran"],
            ].map(([label, bulk, qr]) => (
              <>
                <div key={label} className="text-zinc-500 py-1.5">{label}</div>
                <div key={`b-${label}`} className="text-center py-1.5 font-semibold text-zinc-700">{bulk}</div>
                <div key={`q-${label}`} className="text-center py-1.5 font-semibold text-indigo-700">{qr}</div>
              </>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-3">* Sesi RealTime dapat dibuka via scan QR Code atau share link langsung ke HP ushers</p>
        </div>

        {/* CTA Button */}
        <button
          id="setup-continue-btn"
          onClick={handleContinue}
          disabled={!selected || loading}
          className={`w-full py-4 rounded-2xl font-extrabold text-base transition-all duration-300 flex items-center justify-center gap-3 ${
            selected
              ? selected === "BULK"
                ? "bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl shadow-zinc-900/20 cursor-pointer"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/25 cursor-pointer"
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyiapkan...
            </>
          ) : selected ? (
            <>
              Lanjutkan dengan {selected === "BULK" ? "Absensi Rekap" : "Absensi RealTime"}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          ) : (
            "Pilih metode terlebih dahulu"
          )}
        </button>

        <p className="text-center text-xs text-zinc-400 mt-4">
          Bisa diubah kapan saja di{" "}
          <span className="font-semibold text-zinc-600">Pengaturan → Kehadiran</span>
        </p>
      </div>
    </div>
  );
}
