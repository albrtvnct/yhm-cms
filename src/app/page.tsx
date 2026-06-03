"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

const FEATURES = [
  { icon: "💰", color: "#451e03", textCol: "#fcd34d", label: "Keuangan Terpusat", desc: "Pemasukan & pengeluaran per divisi, laporan bendahara otomatis, audit trail, budget vs realisasi." },
  { icon: "👥", color: "#1e1e24", textCol: "#ffffff", label: "Data Jemaat", desc: "Nomor Induk Jemaat (NIJ), profil lengkap, status keaktifan, kategori usia, riwayat pelayanan." },
  { icon: "📊", color: "#062f4f", textCol: "#38bdf8", label: "Kehadiran & Analisis", desc: "Absensi ibadah, tren kehadiran, deteksi jemaat tidak aktif, analisis per kelompok usia." },
  { icon: "📅", color: "#223e36", textCol: "#4ade80", label: "Jadwal Pelayan", desc: "Worship leader, singer, multimedia, kolektan, penjaga — jadwal otomatis dengan notifikasi WA." },
  { icon: "📜", color: "#3b1342", textCol: "#f472b6", label: "Persuratan & Sakramen", desc: "Pengajuan baptisan, pernikahan, surat pindah, surat keterangan — workflow persetujuan gembala." },
  { icon: "🤝", color: "#4f1a29", textCol: "#f43f5e", label: "Visitasi", desc: "Jadwal kunjungan, catatan pastoral, follow-up otomatis, prioritas AI berdasarkan ketidakhadiran." },
  { icon: "🎯", color: "#432808", textCol: "#fb923c", label: "Program & Evaluasi", desc: "Perencanaan program divisi, target output vs realisasi, laporan ke gembala, evaluasi AI." },
  { icon: "✅", color: "#14281b", textCol: "#4ade80", label: "Approval Antar Divisi", desc: "Pengajuan ke gembala, tracking progres, notifikasi real-time, riwayat keputusan per divisi." },
  { icon: "🏠", color: "#1e1b4b", textCol: "#818cf8", label: "Manajemen Komsel", desc: "Data kelompok kecil, pemimpin, anggota, jadwal, absensi, dan laporan per komsel." },
  { icon: "📱", color: "#062f4f", textCol: "#38bdf8", label: "Donasi & Tithe Digital", desc: "QR code persembahan, transfer bank, konfirmasi otomatis via WA, laporan per jemaat." },
  { icon: "📹", color: "#422006", textCol: "#f59e0b", label: "Konten & Live Streaming", desc: "Jadwal siaran, arsip khotbah, renungan harian, publikasi ke YouTube/social media." },
  { icon: "🎓", color: "#1a1a24", textCol: "#e4e4e7", label: "Pengembangan SDM", desc: "Pelatihan pelayan, sertifikasi, riwayat pelayanan, penilaian, dan rencana pengembangan rohani." },
];

const MODULE_CARDS = [
  { title: "Komsel / Cell", subtitle: "KELOMPOK KECIL", bg: "bg-orange-600/90 text-white", label: "CELL", font: "tracking-tighter", desc: "Manajemen data kelompok sel, absensi, materi mingguan, dan laporan perkembangan rohani jemaat." },
  { title: "Misi & Sosial", subtitle: "DIKONIA & OUTREACH", bg: "bg-emerald-800/90 text-white", label: "MISSION", font: "tracking-tight", desc: "Penyaluran bantuan sosial, pengelolaan dana misi, dan koordinasi relawan lapangan." },
  { title: "Yesh Women", subtitle: "IBADAH WANITA", bg: "bg-pink-600/90 text-white", label: "WOMEN", font: "italic font-serif", desc: "Wadah persekutuan wanita, rekaman sharing kelompok, dan kegiatan pengembangan keluarga kristen." },
  { title: "Yesh Kids", subtitle: "SEKOLAH MINGGU", bg: "bg-cyan-600/95 text-white", label: "KIDS", font: "font-mono font-black", desc: "Database anak, absensi barcode/QR, check-in anak demi keamanan, dan pencatatan kelas kurikulum rohani." },
  { title: "Yesh Youth", subtitle: "IBADAH REMAJA & MUDA", bg: "bg-zinc-800 text-white border border-zinc-700", label: "YOUTH", font: "font-black tracking-widest", desc: "Manajemen komunitas anak muda, pelayan ibadah youth, event kreatif, dan mentoring pastoral." },
  { title: "Jadwal Pelayan", subtitle: "TIM ALTAR & MUSIC", bg: "bg-lime-500 text-zinc-950", label: "SERVICE", font: "font-sans font-bold", desc: "Penjadwalan otomatis tim pemusik, singer, worship leader, usher, pendoa, lengkap dengan pengingat WA." },
  { title: "Visitasi & Konseling", subtitle: "ATTENDANCE ALERTS", bg: "bg-purple-800/90 text-white", label: "PASTORAL", font: "font-serif tracking-tight", desc: "Deteksi otomatis jemaat yang absen 3 minggu berturut-turut untuk dijadwalkan kunjungan pastoral." },
  { title: "Keuangan & Donasi", subtitle: "QRIS & TITHE", bg: "bg-zinc-950 text-white border border-brand-orange/30", label: "FINANCE", font: "font-black tracking-tighter", desc: "Integrasi persembahan digital (QRIS), persepuluhan, slip transfer otomatis, dan audit internal bendahara." },
  { title: "Sakramen & Surat", subtitle: "ADMINISTRASI GEREJA", bg: "bg-blue-700 text-white", label: "CHURCH", font: "font-mono", desc: "Layanan pengajuan surat baptis, penyerahan anak, pernikahan, surat pindah, approval gembala." },
];

const ONBOARDING_STEPS = [
  {
    step: "LANGKAH 1",
    title: "Demo Konsultasi (Gratis)",
    date: "Hari 1",
    desc: "Jadwalkan demo langsung dengan tim kami untuk memetakan kebutuhan spesifik gereja Anda dan melihat fitur-fitur utama Yesh CMS secara detail.",
    image: "/event_nbc.png",
  },
  {
    step: "LANGKAH 2",
    title: "Migrasi Data & Setup",
    date: "Hari 2-7",
    desc: "Kirimkan data jemaat lama Anda dalam format Excel. Tim kami akan memigrasikannya secara aman dan mengonfigurasi struktur divisi gereja Anda.",
    image: "/event_youth.png",
  },
  {
    step: "LANGKAH 3",
    title: "Training & Go Live",
    date: "Hari 8-10",
    desc: "Sesi pelatihan komprehensif bagi admin utama, bendahara, koordinator divisi, dan ketua kelompok sel agar sistem siap digunakan 100%.",
    image: "/event_levelup.png",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "Gratis",
    period: "",
    desc: "Cocok untuk eksplorasi atau gereja perintisan.",
    features: ["Hingga 50 jemaat", "Data Jemaat Dasar", "1 admin pengguna", "Dukungan komunitas"],
    cta: "Mulai Gratis",
    featured: false,
  },
  {
    name: "Starter",
    price: "Rp 299rb",
    period: "/ bln",
    desc: "Untuk gereja kecil yang baru memulai digitalisasi.",
    features: ["≤ 200 jemaat", "Data Jemaat & Keuangan", "Jadwal pelayanan", "1 admin pengguna", "Dukungan email"],
    cta: "Berlangganan",
    featured: false,
  },
  {
    name: "Growth",
    price: "Rp 599rb",
    period: "/ bln",
    desc: "Solusi lengkap untuk gereja yang berkembang.",
    features: ["≤ 1.000 jemaat + AI", "Semua fitur Starter", "AI Core (Insight & Analisis)", "Manajemen Komsel", "WhatsApp Bot", "Broadcast & pengumuman", "Prioritas dukungan"],
    cta: "Coba 14 Hari Gratis",
    featured: true,
    badge: "Terpopuler",
  },
  {
    name: "Enterprise",
    price: "Rp 1.299rb",
    period: "/ bln",
    desc: "Untuk denominasi dan jaringan gereja besar.",
    features: ["Unlimited jemaat", "Multi-cabang gereja", "Integrasi API kustom", "Custom Flowise Chatbot", "Admin tak terbatas", "SLA & uptime guarantee"],
    cta: "Hubungi Sales",
    featured: false,
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [form, setForm] = useState({ name: "", church: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  const tabContents = [
    {
      title: "Ibadah Minggu",
      label: "MANAJEMEN TIM ALTAR",
      desc: "Kelola seluruh tim pelayanan altar mulai dari Worship Leader, Singer, Pemusik, Kolektan, Penerima Tamu (Usher), hingga Tim Pendoa. Sistem membagi jadwal secara acak atau berdasarkan giliran, mendeteksi konflik jadwal otomatis, dan mengirim konfirmasi via WhatsApp Bot.",
    },
    {
      title: "Streaming Online",
      label: "INTEGRASI KONTEN DIGITAL",
      desc: "Hubungkan live streaming YouTube/Facebook gereja Anda langsung ke portal jemaat. Simpan arsip video khotbah, bagikan renungan harian digital, dan jadwalkan siaran secara berkala yang bisa diakses oleh seluruh jemaat dari mana saja.",
    },
    {
      title: "Layanan Gereja",
      label: "DONASI & QRIS OTOMATIS",
      desc: "Kelola donasi pembangunan, persepuluhan, persembahan ibadah raya, dan diakonia sosial. Hasilkan QRIS dinamis per divisi untuk memudahkan jemaat memberi persembahan secara aman. Seluruh transaksi tercatat instan dengan slip kuitansi digital otomatis.",
    },
    {
      title: "Tentang Gereja",
      label: "DATA JEMAAT & NIJ",
      desc: "Bangun database jemaat yang terstruktur. Hasilkan Nomor Induk Jemaat (NIJ) otomatis, kelola status keaktifan, keanggotaan komsel, riwayat pelayanan altar, hingga data keluarga lengkap. Mendukung fitur cetak kartu jemaat fisik atau digital.",
    },
    {
      title: "Mari Terhubung",
      label: "INTEGRASI WHATSAPP BOT & BROADCAST",
      desc: "Kirim pengumuman penting, jadwal pelayanan mingguan, ucapan ulang tahun otomatis, dan warta jemaat langsung ke nomor WhatsApp pribadi jemaat Anda tanpa biaya SMS. Jemaat juga bisa mengetik perintah chat bot untuk cek jadwal mereka sendiri.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-orange selection:text-white">
      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/90 backdrop-blur-md py-4 border-b border-white/10" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 text-xl font-extrabold tracking-tighter">
            <span className="text-brand-orange">✝</span> Yesh<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-gold">CMS</span>
          </a>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wider uppercase text-zinc-400">
            <a href="#tentang" className="hover:text-brand-orange transition-colors">Tentang</a>
            <a href="#modul" className="hover:text-brand-orange transition-colors">Modul</a>
            <a href="#fitur" className="hover:text-brand-orange transition-colors">Fitur</a>
            <a href="#harga" className="hover:text-brand-orange transition-colors">Harga</a>
            <a href="#testimoni" className="hover:text-brand-orange transition-colors">Testimoni</a>
            <a href="#kontak" className="hover:text-brand-orange transition-colors">Kontak</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#kontak" className="hidden sm:inline-flex px-5 py-2 bg-gradient-to-r from-brand-orange to-brand-gold hover:from-brand-orange hover:to-brand-orange-light text-zinc-950 font-bold rounded-md transition-all text-xs tracking-wider uppercase shadow-md shadow-brand-orange/20">
              Hubungi Sales
            </a>
            <a href="/portal/yesh-cms" className="px-5 py-2 border border-white/20 hover:border-brand-orange hover:text-brand-orange text-white font-bold rounded-md transition-all text-xs tracking-wider uppercase">
              Portal Admin
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="tentang" className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden bg-gradient-to-b from-brand-dark via-brand-dark to-black">
        {/* Background Grids and Accents */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full py-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="flex flex-col text-left">
              <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 text-brand-gold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-semibold mb-6 w-fit">
                <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" />
                Church Management System
              </div>
              
              {/* Stacked Headline like GSJS */}
              <div className="flex flex-col font-black tracking-tight leading-none mb-6">
                <span className="text-4xl sm:text-5xl text-brand-orange uppercase">WELCOME</span>
                <span className="text-4xl sm:text-5xl text-white uppercase mb-1">TO MODERN</span>
                <span className="text-7xl sm:text-8xl md:text-9xl text-white font-black tracking-tighter leading-none">
                  YESH<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-gold">CMS</span>
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-zinc-300 mb-4">
                Gereja Modern, Manajemen Lebih Mudah.
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-8 max-w-lg">
                Yesh CMS hadir sebagai solusi all-in-one untuk mengelola jemaat, keuangan, jadwal pelayanan, dan komunikasi gereja Anda — semuanya dalam satu platform yang terintegrasi.
              </p>
              
              <div className="flex flex-wrap gap-4 items-center">
                <a href="#harga" className="px-8 py-3.5 bg-gradient-to-r from-brand-orange to-brand-gold text-zinc-950 font-black rounded-md transition-all hover:scale-105 shadow-lg shadow-brand-orange/30 flex items-center gap-2 group">
                  Mulai Sekarang
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </a>
                <a href="#modul" className="px-8 py-3.5 border border-white/20 hover:border-brand-orange hover:bg-brand-orange/10 font-bold rounded-md transition-all">
                  Lihat Modul
                </a>
              </div>

              {/* Trust Metrics */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10 max-w-md">
                <div>
                  <div className="text-2xl md:text-3xl font-black text-brand-orange">500+</div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mt-1">Gereja Aktif</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-white">50K+</div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mt-1">Anggota</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-brand-gold">99.9%</div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mt-1">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right: Dashboard Mockup */}
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-orange/20 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative border border-white/10 rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl">
                {/* Mockup Top Bar */}
                <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-[10px] text-zinc-500 font-mono tracking-widest ml-auto uppercase">YESH CMS DASHBOARD v2</span>
                </div>
                <div className="aspect-[16/10] relative w-full overflow-hidden">
                  <Image
                    src="/dashboard-mockup.png"
                    alt="Tampilan Dashboard Admin Yesh CMS"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: "cover", objectPosition: "top" }}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER (Ribbon) ── */}
      <div className="w-full bg-brand-orange py-4 overflow-hidden border-y border-brand-orange-light/30 shadow-lg shadow-brand-orange/10 relative z-20">
        <div className="flex whitespace-nowrap animate-scroll-ticker">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center text-zinc-950 font-black text-sm md:text-base tracking-widest uppercase select-none">
              <span>CHURCH MANAGEMENT SYSTEM</span>
              <span className="mx-4 text-white">•</span>
              <span>YESH HEAL ME INDONESIA</span>
              <span className="mx-4 text-white">•</span>
              <span>GEREJA MODERN MANAJEMEN LEBIH MUDA</span>
              <span className="mx-4 text-white">•</span>
              <span>INTEGRASI DATA JEMAAT & KEUANGAN GEREJA</span>
              <span className="mx-4 text-white">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CORE FEATURES ACCORDION & SIDE IMAGE ── */}
      <section className="py-24 bg-black border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Accordion list */}
            <div>
              <div className="text-xs uppercase tracking-widest text-brand-orange font-bold mb-3">FITUR UTAMA</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-10">
                Kemudahan Administrasi <br />
                Dalam Satu Genggaman
              </h2>

              <div className="space-y-4">
                {tabContents.map((tab, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`cursor-pointer transition-all duration-300 p-6 rounded-lg border text-left ${activeTab === idx ? "bg-zinc-900 border-brand-orange" : "bg-zinc-950/40 border-white/5 hover:border-white/10 hover:bg-zinc-950/80"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={`text-xl transition-transform duration-300 ${activeTab === idx ? "text-brand-orange scale-110" : "text-zinc-500"}`}>
                          0{idx + 1}
                        </span>
                        <h3 className={`font-bold text-lg md:text-xl ${activeTab === idx ? "text-white" : "text-zinc-400"}`}>
                          {tab.title}
                        </h3>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded font-black tracking-wider uppercase transition-all ${activeTab === idx ? "bg-brand-orange/20 text-brand-gold" : "bg-zinc-900 text-zinc-500"}`}>
                        {idx === 1 ? "ONLINE" : "ACTIVE"}
                      </span>
                    </div>

                    <div className={`mt-4 text-zinc-400 text-sm leading-relaxed overflow-hidden transition-all duration-300 ${activeTab === idx ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="text-xs text-brand-gold/80 font-semibold tracking-wider uppercase mb-1.5">
                        {tab.label}
                      </div>
                      {tab.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Black & White Worship Photo with Outline Text */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
              <Image
                src="/church-worship.png"
                alt="Worship stage"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                className="grayscale contrast-125 brightness-75 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
              
              {/* Stacked transparent texts */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 select-none pointer-events-none">
                <div className="space-y-1 font-black text-5xl md:text-6xl tracking-tighter opacity-15">
                  <div className="text-transparent stroke-text">YESH CMS</div>
                  <div className="text-transparent stroke-text">YESH CMS</div>
                  <div className="text-white">YESH CMS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODUL INTEGRASI GRID ── */}
      <section id="modul" className="py-24 bg-gradient-to-b from-black to-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="text-left">
              <div className="text-xs uppercase tracking-widest text-brand-orange font-bold mb-3">INTEGRASI DIVISI</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Temukan Solusi Modul <br />
                Untuk Setiap Divisi
              </h2>
            </div>
            <a href="#fitur" className="text-xs font-bold uppercase tracking-widest text-brand-gold hover:text-brand-orange mt-4 md:mt-0 transition-colors">
              LIHAT SEMUA FITUR UNGGULAN &rarr;
            </a>
          </div>

          {/* 3x3 Grid cards style */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULE_CARDS.map((card, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-8 flex flex-col justify-between overflow-hidden group shadow-lg min-h-[280px] text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${card.bg}`}
              >
                {/* Background Large Text overlay */}
                <div className="absolute top-4 right-4 text-7xl font-black tracking-tighter opacity-5 select-none pointer-events-none">
                  {card.label}
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-2">
                    {card.subtitle}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-4">
                    {card.title}
                  </h3>
                </div>

                <div>
                  <p className="text-sm leading-relaxed opacity-85 mb-4">
                    {card.desc}
                  </p>
                  <div className="text-xs uppercase font-extrabold tracking-wider border-t border-white/10 pt-4 flex items-center justify-between">
                    <span>Lihat Detail</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONBOARDING / IMPLEMENTATION EVENTS ── */}
      <section className="py-24 bg-zinc-950 border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="text-left">
              <div className="text-xs uppercase tracking-widest text-brand-orange font-bold mb-3">ALUR KERJA</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Proses Implementasi <br />
                Sistem di Gereja Anda
              </h2>
            </div>
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mt-4 md:mt-0">
              Cepat • Aman • Didampingi Full
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {ONBOARDING_STEPS.map((step, idx) => (
              <div key={idx} className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between group text-left">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                    className="brightness-75 group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-brand-orange text-zinc-950 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded">
                    {step.date}
                  </span>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-brand-orange text-xs font-bold tracking-widest uppercase mb-1">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                      {step.desc}
                    </p>
                  </div>
                  <a href="#kontak" className="text-xs font-bold text-brand-gold uppercase tracking-widest hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    Konsultasi Langkah Ini &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISION STATEMENT / SLOGANS ── */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center text-left">
            <div className="border-l-4 border-brand-orange pl-6 py-2">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Membangun Sistem Administrasi Rapi, Transparan & Berbasis Data
              </h2>
            </div>
            <div>
              <p className="text-zinc-400 leading-relaxed text-base md:text-lg">
                Yesh CMS berkomitmen menyederhanakan tugas-tugas administratif gereja Anda. Gembala dan pelayan jemaat dapat lebih berfokus pada pelayanan penggembalaan rohani secara langsung, sementara data, operasional, dan pelaporan keuangan dikerjakan secara sistematis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HIGHLIGHT BANNER: SATU GEREJA SATU JAM SAJA EQUIVALENT ── */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-left">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-4">
              <div className="text-xs uppercase tracking-widest text-brand-orange font-bold mb-3">KONSEP INOVASI</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                Satu Sistem <br />
                Untuk Semua <br />
                Pelayanan
              </h2>
            </div>
            
            <div className="lg:col-span-8 border-l border-white/10 lg:pl-12">
              <div className="text-brand-orange text-lg md:text-xl font-bold tracking-tight uppercase mb-4">
                "Tidakkah Pelayanan Anda Berhak Mendapatkan Manajemen Terbaik?"
              </div>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Yesh CMS dirancang secara khusus untuk meminimalisasi beban kerja administratif di gereja. Kami memahami bahwa administrasi yang kurang rapi dapat memperlambat koordinasi antar divisi pelayanan rohani. Dengan sentralisasi database jemaat, slip persembahan otomatis, dan penjadwalan pelayan altar digital, pelayanan Anda akan berjalan jauh lebih efektif.
              </p>
              <div className="flex gap-8">
                <div>
                  <div className="text-3xl font-extrabold text-white">All-in-One</div>
                  <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-1">Sistem Terintegrasi</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-white">100% Aman</div>
                  <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-1">Enkripsi Data Awan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PASTOR TESTIMONY SECTION ("OUR PASTOR" EQUIVALENT) ── */}
      <section id="testimoni" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left: Couple Photo */}
            <div className="lg:col-span-5 relative aspect-square md:aspect-[4/5] lg:aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="/pastor-couple.png"
                alt="Ps. Michael Gunawan & Ps. Cheline Gani"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                style={{ objectFit: "cover" }}
                className="brightness-90 transition-transform duration-500 hover:scale-105"
              />
            </div>
            
            {/* Right: Biography / Testimonial content */}
            <div className="lg:col-span-7 text-left lg:pl-8">
              <div className="text-xs uppercase tracking-widest text-brand-orange font-bold mb-3">RATING & TESTIMONI</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">
                Dipercaya oleh Para Gembala
              </h2>
              
              <div className="text-brand-orange text-lg font-bold tracking-wider uppercase mb-1">
                TESTIMONI PENGGUNA
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
                Ps. Michael Gunawan & Ps. Cheline Gani
              </h3>
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-6">
                GEMBALA SIDANG - GSJS CHURCH
              </div>
              
              <blockquote className="text-zinc-300 text-lg italic leading-relaxed border-l-4 border-brand-orange pl-6 mb-8">
                "Sejak mengadopsi Yesh CMS, seluruh pelayanan jemaat, penjadwalan tim musik & pendoa, serta pencatatan persepuluhan dan keuangan komsel di GSJS Church berjalan otomatis dan termonitor dengan akurat. Tim pelayan kami tidak lagi menghabiskan waktu berjam-jam untuk administrasi manual. Yesh CMS adalah partner digitalisasi terbaik untuk gereja masa kini."
              </blockquote>

              <div className="flex gap-4">
                <span className="text-yellow-500 text-xl">★</span>
                <span className="text-yellow-500 text-xl">★</span>
                <span className="text-yellow-500 text-xl">★</span>
                <span className="text-yellow-500 text-xl">★</span>
                <span className="text-yellow-500 text-xl">★</span>
                <span className="text-zinc-500 text-sm font-bold ml-2 self-center">5.0 / 5.0 Star Rated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO DEMO PREVIEW SECTION ── */}
      <section className="py-24 bg-zinc-950 border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="text-left">
              <div className="text-xs uppercase tracking-widest text-brand-orange font-bold mb-3">VIDEO WALKTHROUGH</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">
                Tonton Demo <br />
                Cara Kerja Dashboard
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-8 max-w-lg">
                Lihat langsung bagaimana administrator mengelola data jemaat, membuat pengumuman via WhatsApp Bot, mencatat donasi persembahan masuk secara real-time, dan melakukan approval divisi dari gawai mereka.
              </p>
              <button
                onClick={() => setIsVideoOpen(true)}
                className="px-8 py-3.5 bg-gradient-to-r from-brand-orange to-brand-gold text-zinc-950 font-black rounded-md transition-all hover:scale-105 shadow-lg shadow-brand-orange/20 inline-flex items-center gap-3.5"
              >
                {/* Play Icon */}
                <span className="w-5 h-5 bg-zinc-950 text-white rounded-full flex items-center justify-center text-xs font-black pl-0.5">▶</span>
                Tonton Video Demo (5 Menit)
              </button>
            </div>

            {/* Right: Mock Video Player card with generated sermon_thumb image */}
            <div
              className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer"
              onClick={() => setIsVideoOpen(true)}
            >
              <Image
                src="/sermon-thumb.png"
                alt="Sermon thumbnail video demo"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                className="brightness-75 transition-transform duration-500 group-hover:scale-105"
              />
              {/* Pulsing play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all duration-300">
                <div className="w-20 h-20 rounded-full bg-brand-orange text-zinc-950 flex items-center justify-center text-2xl font-black shadow-lg shadow-brand-orange/40 hover:scale-110 transition-transform duration-300 pl-1">
                  ▶
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/80 backdrop-blur-md px-4 py-2 border border-white/10 rounded-lg text-left flex items-center justify-between">
                <div>
                  <span className="text-brand-orange text-[10px] font-black uppercase tracking-wider">DEMO APLIKASI</span>
                  <h4 className="text-white text-xs font-bold tracking-tight">Overview Fitur & Panduan Singkat Staf</h4>
                </div>
                <span className="text-zinc-500 text-[10px] font-mono">05:12 Mins</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO MODAL ── */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl aspect-video">
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/80 text-white font-bold hover:bg-brand-orange hover:text-zinc-950 transition-colors z-10 flex items-center justify-center"
            >
              ✕
            </button>
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="Yesh CMS Video Walkthrough"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* ── ALL FEATURES DETAILED GRID ── */}
      <section id="fitur" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs uppercase tracking-widest text-brand-orange font-bold mb-3">FITUR UNGGULAN LENGKAP</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              Semua Fitur Untuk Kebutuhan Anda
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
              Dari administrasi jemaat hingga laporan keuangan keuangan — Yesh CMS menyatukan semua kebutuhan manajemen gereja Anda dalam satu tempat.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-left">
            {FEATURES.map((feat, idx) => (
              <div key={idx} className="bg-zinc-950/60 border border-white/5 rounded-2xl p-6 hover:border-brand-orange/30 hover:bg-zinc-900/50 transition-all duration-300">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5"
                  style={{ background: feat.color, color: feat.textCol }}
                >
                  {feat.icon}
                </div>
                <h3 className="font-extrabold text-white text-lg mb-2">{feat.label}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PLANS ── */}
      <section id="harga" className="py-24 bg-zinc-950 border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="text-xs uppercase tracking-widest text-brand-orange font-bold mb-3">PAKET BERLANGGANAN</div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              Harga Transparan, Tanpa Biaya Tersembunyi
            </h2>
            <p className="text-zinc-400 text-sm md:text-base">
              Pilih paket yang sesuai dengan ukuran dan kebutuhan jemaat gereja Anda.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-zinc-900 border border-white/10 rounded-2xl p-8 flex flex-col justify-between text-left shadow-2xl transition-all duration-300 hover:-translate-y-2 ${plan.featured ? "border-brand-orange ring-1 ring-brand-orange shadow-brand-orange/5 bg-zinc-900/90" : "hover:border-zinc-700"}`}
              >
                {plan.badge && (
                  <span className="absolute top-4 right-4 bg-brand-orange text-zinc-950 text-[9px] font-black uppercase px-2.5 py-1 rounded">
                    {plan.badge}
                  </span>
                )}
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-500">{plan.name}</span>
                  <div className="my-4 flex items-baseline gap-1 text-white">
                    <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-xs font-semibold text-zinc-500">{plan.period}</span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-6">{plan.desc}</p>
                  <div className="border-t border-white/10 my-6" />
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-normal">
                        <span className="text-brand-orange font-bold text-sm">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="#kontak"
                  className={`w-full py-3 text-center text-xs font-black uppercase tracking-widest rounded transition-all ${plan.featured ? "bg-brand-orange text-zinc-950 hover:bg-brand-orange-light shadow-md shadow-brand-orange/20" : "border border-white/20 hover:border-brand-orange hover:text-brand-orange text-white"}`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <div className="bg-brand-orange/10 border border-brand-orange/20 px-6 py-3 rounded-full flex items-center gap-2 max-w-xl text-center">
              <span className="text-sm">💡</span>
              <p className="text-xs font-semibold text-brand-gold">
                Setup Fee: Rp 1–3 jt untuk paket berbayar (termasuk full onboarding & training staf).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ── */}
      <section id="kontak" className="py-24 bg-black relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-orange/10 border border-brand-orange/30 text-brand-gold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-semibold mb-4">
              ✉ HUBUNGI KAMI
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              Konsultasi Penjualan Gratis
            </h2>
            <p className="text-zinc-400 text-sm md:text-base">
              Isi formulir di bawah ini dan perwakilan tim ahli kami akan menghubungi Anda dalam waktu 24 jam.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 text-left">
            {/* Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              {[
                { icon: "📞", title: "Telepon / WhatsApp", val: "+62 812-3456-7890" },
                { icon: "📧", title: "Alamat Email", val: "sales@yeshcms.id" },
                { icon: "🕐", title: "Jam Operasional", val: "Senin – Jumat, 08.00 – 17.00 WIB" },
                { icon: "📍", title: "Kantor Pusat", val: "Jakarta, Indonesia" },
              ].map((item, idx) => (
                <div key={idx} className="bg-zinc-950/60 border border-white/5 rounded-2xl p-6 flex gap-4 items-start hover:border-brand-orange/20 transition-all duration-300">
                  <span className="text-2xl bg-zinc-900 p-3 rounded-lg border border-white/5">{item.icon}</span>
                  <div>
                    <h4 className="text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">{item.title}</h4>
                    <p className="text-white text-base font-semibold">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form card */}
            <div className="lg:col-span-7 bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl relative">
              {submitted ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-brand-orange/20 text-brand-orange border border-brand-orange/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 animate-bounce">
                    ✓
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Pesan Anda Terkirim!</h3>
                  <p className="text-zinc-400 text-sm">Terima kasih atas minat Anda pada Yesh CMS. Kami akan segera menghubungi Anda.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="form-name" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Nama Lengkap *</label>
                      <input
                        id="form-name"
                        type="text"
                        required
                        className="w-full bg-black/60 border border-white/10 hover:border-brand-orange/30 focus:border-brand-orange text-white text-sm px-4 py-3 rounded outline-none transition-all"
                        placeholder="Contoh: Pdt. John Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="form-church" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Nama Gereja *</label>
                      <input
                        id="form-church"
                        type="text"
                        required
                        className="w-full bg-black/60 border border-white/10 hover:border-brand-orange/30 focus:border-brand-orange text-white text-sm px-4 py-3 rounded outline-none transition-all"
                        placeholder="Contoh: GBI Bethel Raya"
                        value={form.church}
                        onChange={(e) => setForm({ ...form, church: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="form-email" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Alamat Email *</label>
                      <input
                        id="form-email"
                        type="email"
                        required
                        className="w-full bg-black/60 border border-white/10 hover:border-brand-orange/30 focus:border-brand-orange text-white text-sm px-4 py-3 rounded outline-none transition-all"
                        placeholder="Contoh: pastor@gereja.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="form-phone" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Nomor WhatsApp *</label>
                      <input
                        id="form-phone"
                        type="text"
                        required
                        className="w-full bg-black/60 border border-white/10 hover:border-brand-orange/30 focus:border-brand-orange text-white text-sm px-4 py-3 rounded outline-none transition-all"
                        placeholder="Contoh: +62 812-3456-789"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="form-message" className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Ceritakan Kebutuhan Gereja Anda</label>
                    <textarea
                      id="form-message"
                      rows={4}
                      className="w-full bg-black/60 border border-white/10 hover:border-brand-orange/30 focus:border-brand-orange text-white text-sm px-4 py-3 rounded outline-none transition-all resize-none"
                      placeholder="Tuliskan modul apa yang paling Anda butuhkan atau pertanyaan lainnya..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-brand-orange to-brand-gold text-zinc-950 font-black text-xs uppercase tracking-widest rounded-md hover:from-brand-orange hover:to-brand-orange-light shadow-lg shadow-brand-orange/20 hover:scale-[1.01] transition-all"
                  >
                    Kirim Pesan Konsultasi &rarr;
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-zinc-950 border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 text-left mb-12">
            <div className="space-y-4">
              <span className="text-white font-extrabold text-xl tracking-tighter flex items-center gap-1.5">
                <span className="text-brand-orange">✝</span> Yesh<span className="text-brand-gold">CMS</span>
              </span>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Sistem Manajemen Gereja terlengkap dari PT Yesh Heal Me Indonesia untuk digitalisasi administrasi, pelayanan, keuangan, dan komunitas sel jemaat.
              </p>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Navigasi</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li><a href="#tentang" className="hover:text-brand-orange transition-colors">Tentang</a></li>
                <li><a href="#modul" className="hover:text-brand-orange transition-colors">Modul Terintegrasi</a></li>
                <li><a href="#fitur" className="hover:text-brand-orange transition-colors">Semua Fitur</a></li>
                <li><a href="#harga" className="hover:text-brand-orange transition-colors">Paket Harga</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Dukungan</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li><a href="#" className="hover:text-brand-orange transition-colors">Pusat Bantuan</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Syarat & Ketentuan</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-brand-orange transition-colors">Dokumentasi API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Hubungi</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li>Email: sales@yeshcms.id</li>
                <li>WA: +62 812-3456-7890</li>
                <li>Jakarta, Indonesia</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-zinc-600 text-[10px] uppercase font-semibold tracking-wider">
              &copy; {new Date().getFullYear()} Yesh CMS. PT Yesh Heal Me Indonesia. All Rights Reserved.
            </span>
            <div className="flex gap-4">
              <a href="/portal/yesh-cms" className="text-zinc-600 hover:text-brand-orange text-[10px] uppercase font-bold tracking-wider">
                Portal Admin Login
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
