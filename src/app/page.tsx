"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

const FEATURES = [
  { icon: "💰", color: "#dcfce7", label: "Keuangan Terpusat", desc: "Pemasukan & pengeluaran per divisi, laporan bendahara otomatis, audit trail, budget vs realisasi." },
  { icon: "👥", color: "#dbeafe", label: "Data Jemaat", desc: "Nomor Induk Jemaat (NIJ), profil lengkap, status keaktifan, kategori usia, riwayat pelayanan." },
  { icon: "📊", color: "#ede9fe", label: "Kehadiran & Analisis", desc: "Absensi ibadah, tren kehadiran, deteksi jemaat tidak aktif, analisis per kelompok usia." },
  { icon: "📅", color: "#fef3c7", label: "Jadwal Pelayan", desc: "Worship leader, singer, multimedia, kolektan, penjaga — jadwal otomatis dengan notifikasi WA." },
  { icon: "📜", color: "#e0f2fe", label: "Persuratan & Sakramen", desc: "Pengajuan baptisan, pernikahan, surat pindah, surat keterangan — workflow persetujuan gembala." },
  { icon: "🤝", color: "#fce7f3", label: "Visitasi", desc: "Jadwal kunjungan, catatan pastoral, follow-up otomatis, prioritas AI berdasarkan ketidakhadiran." },
  { icon: "🎯", color: "#ffedd5", label: "Program & Evaluasi", desc: "Perencanaan program divisi, target output vs realisasi, laporan ke gembala, evaluasi AI." },
  { icon: "✅", color: "#dcfce7", label: "Approval Antar Divisi", desc: "Pengajuan ke gembala, tracking progres, notifikasi real-time, riwayat keputusan per divisi." },
  { icon: "🏠", color: "#dbeafe", label: "Manajemen Komsel", desc: "Data kelompok kecil, pemimpin, anggota, jadwal, absensi, dan laporan per komsel." },
  { icon: "📱", color: "#ede9fe", label: "Donasi & Tithe Digital", desc: "QR code persembahan, transfer bank, konfirmasi otomatis via WA, laporan per jemaat." },
  { icon: "📹", color: "#fef3c7", label: "Konten & Live Streaming", desc: "Jadwal siaran, arsip khotbah, renungan harian, publikasi ke YouTube/social media." },
  { icon: "🎓", color: "#e0f2fe", label: "Pengembangan SDM", desc: "Pelatihan pelayan, sertifikasi, riwayat pelayanan, penilaian, dan rencana pengembangan rohani." },
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
  const [form, setForm] = useState({ name: "", church: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── NAVBAR ── */}
      <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <div className="container-landing flex items-center justify-between">
          <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            ✝ Yesh<span className="text-gradient-gold">CMS</span>
          </span>
          <div className="hidden md:flex items-center gap-8">
            {["Tentang", "Fitur", "Harga", "Kontak"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="nav-link">{item}</a>
            ))}
          </div>
          <a href="#kontak" className="btn-primary" style={{ padding: "0.625rem 1.5rem", fontSize: "0.875rem" }}>
            Hubungi Sales
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="tentang" className="hero-section">
        <div className="container-landing" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}
            className="flex flex-col md:grid">
            {/* Left */}
            <div>
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                Church Management System by. Yesh Heal Me Indonesia
              </div>
              <h1 className="heading-display" style={{ color: "#ffffff", marginBottom: "1.5rem" }}>
                Gereja Modern,{" "}
                <span className="text-gradient-gold">Manajemen</span>{" "}
                Lebih Mudah
              </h1>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.125rem", lineHeight: 1.75, marginBottom: "2.5rem", maxWidth: "480px" }}>
                Yesh CMS hadir sebagai solusi all-in-one untuk mengelola jemaat, keuangan, jadwal pelayanan, dan komunikasi gereja Anda — semuanya dalam satu platform yang terintegrasi.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <a href="#harga" className="btn-primary">Mulai Sekarang →</a>
                <a href="#fitur" className="btn-outline">Lihat Fitur</a>
              </div>
              {/* Trust */}
              <div style={{ marginTop: "3rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                {[["500+", "Gereja Aktif"], ["50K+", "Anggota Terdaftar"], ["99.9%", "Uptime"]].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ color: "#fbbf24", fontWeight: 800, fontSize: "1.5rem", lineHeight: 1 }}>{n}</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginTop: "0.25rem" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right — dashboard placeholder */}
            <div className="animate-float" style={{ display: "flex", justifyContent: "center" }}>
              <div className="dashboard-placeholder">
                <div className="dashboard-placeholder-bar">
                  <span className="dot-red" /><span className="dot-yellow" /><span className="dot-green" />
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", marginLeft: "auto" }}>YeshCMS Dashboard</span>
                </div>
                <Image
                  src="/dashboard-mockup.png"
                  alt="Tampilan dashboard Yesh CMS — sistem manajemen gereja"
                  fill
                  style={{ objectFit: "cover", objectPosition: "top" }}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-bar">
        <div className="container-landing">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {[["500+", "Gereja Aktif"], ["50.000+", "Anggota Terdaftar"], ["Rp 2M+", "Transaksi Dikelola"], ["99.9%", "Uptime Dijamin"]].map(([n, l]) => (
              <div key={l} className="stat-item">
                <div className="stat-number">{n}</div>
                <div className="stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="fitur" style={{ padding: "6rem 0", background: "#f8f9ff" }}>
        <div className="container-landing">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div className="section-label">Fitur Unggulan</div>
            <h2 className="heading-section" style={{ color: "var(--brand-navy)", marginBottom: "1rem" }}>
              Semua yang Gereja Anda Butuhkan
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "560px", margin: "0 auto", lineHeight: 1.75 }}>
              Dari administrasi jemaat hingga laporan keuangan — Yesh CMS menyatukan semua kebutuhan manajemen gereja dalam satu tempat.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {FEATURES.map((f) => (
              <div key={f.label} className="feature-card">
                <div className="feature-icon-wrap" style={{ background: f.color }}>
                  {f.icon}
                </div>
                <h3 className="heading-card" style={{ color: "var(--brand-navy)", marginBottom: "0.75rem" }}>{f.label}</h3>
                <p style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: "0.95rem" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="harga" style={{ padding: "6rem 0", background: "#ffffff" }}>
        <div className="container-landing">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div className="section-label">Paket Harga</div>
            <h2 className="heading-section" style={{ color: "var(--brand-navy)", marginBottom: "1rem" }}>
              Harga Transparan, Tanpa Biaya Tersembunyi
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto" }}>
              Pilih paket yang sesuai dengan ukuran dan kebutuhan gereja Anda.
            </p>
          </div>
          <div className="pricing-grid" style={{ alignItems: "stretch", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
            {PLANS.map((plan) => (
              <div key={plan.name} className={`pricing-card ${plan.featured ? "pricing-card-featured" : ""}`}>
                {plan.badge && <span className="pricing-badge">{plan.badge}</span>}
                <p style={{ color: plan.featured ? "rgba(255,255,255,0.6)" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {plan.name}
                </p>
                <div className="pricing-price" style={{ color: plan.featured ? "#fbbf24" : "var(--brand-navy)" }}>
                  {plan.price}<span style={{ fontSize: plan.price === "Gratis" ? "0" : "1rem", fontWeight: 500, color: plan.featured ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>{plan.period}</span>
                </div>
                <p style={{ color: plan.featured ? "rgba(255,255,255,0.65)" : "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{plan.desc}</p>
                <hr className="pricing-divider" />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
                  {plan.features.map((feat) => (
                    <li key={feat} className="pricing-feature-item" style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.9rem", color: plan.featured ? "rgba(255,255,255,0.85)" : "var(--foreground)" }}>
                      <span className="pricing-feature-check" style={{ color: plan.featured ? "#fbbf24" : "#6d28d9", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <a href="#kontak" className={plan.featured ? "btn-cta" : "btn-outline"} style={!plan.featured ? { color: "var(--brand-navy)", borderColor: "var(--border-soft)" } : {}}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
          
          {/* Note Setup Fee */}
          <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
            <div style={{ display: "inline-block", background: "rgba(109, 40, 217, 0.05)", border: "1px solid rgba(109, 40, 217, 0.1)", borderRadius: "100px", padding: "0.5rem 1.5rem" }}>
              <p style={{ color: "var(--brand-navy)", fontSize: "0.9rem", margin: 0, fontWeight: 500 }}>
                💡 <strong style={{ color: "#6d28d9" }}>Setup Fee: Rp 1–3 jt</strong> untuk paket berbayar (termasuk full onboarding & training staf).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="kontak" className="contact-section" style={{ padding: "6rem 0" }}>
        <div className="container-landing" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div className="hero-badge" style={{ display: "inline-flex" }}>✉ Tim Sales Siap Membantu</div>
            <h2 className="heading-section" style={{ color: "#ffffff", marginBottom: "1rem" }}>
              Hubungi Tim Penjualan Kami
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
              Ingin demo langsung atau konsultasi gratis? Isi formulir di bawah dan kami akan menghubungi Anda dalam 1×24 jam.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" }}>
            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {[
                { icon: "📞", title: "Telepon / WhatsApp", desc: "+62 812-3456-7890" },
                { icon: "📧", title: "Email", desc: "sales@yeshcms.id" },
                { icon: "🕐", title: "Jam Operasional", desc: "Senin–Jumat, 08.00–17.00 WIB" },
                { icon: "📍", title: "Alamat", desc: "Jakarta, Indonesia" },
              ].map((c) => (
                <div key={c.title} className="contact-card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.5rem" }}>{c.icon}</span>
                  <div>
                    <div style={{ color: "#fbbf24", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>{c.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem" }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Form */}
            <div className="contact-card">
              {submitted ? (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                  <h3 style={{ color: "#fbbf24", fontWeight: 700, fontSize: "1.25rem", marginBottom: "0.75rem" }}>Pesan Terkirim!</h3>
                  <p style={{ color: "rgba(255,255,255,0.7)" }}>Tim kami akan menghubungi Anda dalam 1×24 jam kerja.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label className="contact-label">Nama Lengkap *</label>
                      <input id="contact-name" className="contact-input" required placeholder="Pdt. John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="contact-label">Nama Gereja *</label>
                      <input id="contact-church" className="contact-input" required placeholder="GBI Bethel" value={form.church} onChange={(e) => setForm({ ...form, church: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="contact-label">Email *</label>
                    <input id="contact-email" type="email" className="contact-input" required placeholder="pastor@gereja.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="contact-label">Nomor WhatsApp</label>
                    <input id="contact-phone" className="contact-input" placeholder="+62 8xx-xxxx-xxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="contact-label">Pesan / Pertanyaan</label>
                    <textarea id="contact-message" className="contact-input" rows={4} placeholder="Ceritakan kebutuhan gereja Anda..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ resize: "vertical" }} />
                  </div>
                  <button id="contact-submit" type="submit" className="btn-cta" style={{ width: "100%", justifyContent: "center" }}>
                    Kirim Pesan →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer" style={{ padding: "3rem 0" }}>
        <div className="container-landing">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>✝ Yesh<span className="text-gradient-gold">CMS</span></span>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", marginTop: "0.5rem" }}>© 2025 Yesh CMS. Semua hak dilindungi.</p>
            </div>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {["Kebijakan Privasi", "Syarat & Ketentuan", "Bantuan", "Blog"].map((l) => (
                <a key={l} href="#" className="footer-link">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
