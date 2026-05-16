import React, { useState, useEffect } from 'react'

/* ─────────────────────────────────────────────────────────────────────────
   City Rider — selling page
   Dark-themed sales page (matches the cityrider app brand). Targeted at
   independent Indonesian motorcycle couriers considering subscribing.
   Single-file, vanilla CSS in a <style> block, no Tailwind.

   Live-app iframe + CTAs point to the standalone cityriders Next.js
   deployment (cityrider.id in prod, localhost:5186 in dev).
   ───────────────────────────────────────────────────────────────────── */

// Live-app URL resolver — dev vs prod
const CITYRIDER_URL = (() => {
  if (typeof window === 'undefined') return 'https://cityrider.id'
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5186'
    : 'https://cityrider.id'
})()

const STATS = [
  { value: '0%',          label: 'Komisi platform' },
  { value: 'Rp 30K',      label: 'Per bulan flat' },
  { value: '100%',        label: 'Pendapatan rider' },
]

const STEPS = [
  { step: 1, time: '30 detik', icon: '✍️',  title: 'Daftar gratis',
    desc: 'Email + nama + WhatsApp + password. Tidak ada KTP upload, tidak ada training video.' },
  { step: 2, time: '2 menit',  icon: '🛵',  title: 'Set motor + harga',
    desc: 'Merk, model, tahun, warna, plat. Atur sendiri tarif per km (mis. Rp 2.500) dan minimum fee.' },
  { step: 3, time: '1 menit',  icon: '💳',  title: 'Aktifkan Rp 30.000/bulan',
    desc: 'Bayar via QRIS, GoPay, OVO, Dana, atau transfer bank. Auto-renew, bisa cancel kapan saja.' },
  { step: 4, time: 'Selamanya', icon: '🟢',  title: 'Go online → terima quote',
    desc: 'Tap "Go Online" di dashboard. Customer kontak kamu lewat WhatsApp. Kamu yang atur jam kerjamu.' },
]

const FEATURES = [
  { icon: '🌐', title: 'Profile publik dengan URL sendiri',
    desc: 'Dapat link cityrider.id/r/nama-kamu — share di WhatsApp Status, Instagram, Facebook.' },
  { icon: '📍', title: 'Listing di marketplace GPS',
    desc: 'Saat online, otomatis muncul di marketplace untuk customer terdekat. GPS dot kuning berdenyut.' },
  { icon: '💬', title: 'Quote inbox + notifikasi suara',
    desc: 'Setiap kali customer tap WhatsApp, kamu dapat beep + notifikasi. Tidak pernah lewat customer.' },
  { icon: '📒', title: 'Customer Book — database sendiri',
    desc: 'Daftar semua pelanggan, tracker repeat, "Pesan ulang" 1 tap. Customer kamu, bukan platform.' },
  { icon: '🪪', title: 'Kartu nama digital + QR',
    desc: 'Print kartu nama dengan QR code. Tempel di motor, kasih ke customer, sebar di warung.' },
  { icon: '⚡', title: '8 template balasan WhatsApp',
    desc: 'Salam, info kapasitas, COD, ETA, penutup. Tap copy → paste. Terlihat profesional tanpa ribet.' },
  { icon: '📊', title: 'Dashboard ROI bulanan',
    desc: 'Lihat berapa quote diterima, nilai total, ROI vs subscription. Pasti tahu apakah worth it.' },
  { icon: '🔄', title: 'Offline fallback (reciprocal)',
    desc: 'Saat kamu offline, profilemu rekomendasi rider lain → mereka rekomendasi balik. Network growth.' },
]

const COMPARISON = [
  { feature: 'Komisi per order',         gojek: '15-20% per order',          cityrider: '0% — selamanya' },
  { feature: 'Harga ditentukan oleh',     gojek: 'Algoritma platform',         cityrider: 'Kamu sendiri' },
  { feature: 'Kepemilikan customer',      gojek: 'Platform',                   cityrider: 'Kamu (Customer Book)' },
  { feature: 'Jam kerja',                 gojek: 'Random dispatch',            cityrider: 'Kamu pilih sendiri' },
  { feature: 'Risiko suspend',            gojek: 'Tinggi (rating, cancel)',    cityrider: 'Tidak ada' },
  { feature: 'Pembayaran customer',       gojek: 'Lewat platform',             cityrider: 'Langsung COD/QRIS/transfer' },
  { feature: 'Biaya tetap bulanan',       gojek: 'Tidak ada (tapi cut order)',  cityrider: 'Rp 30.000 flat' },
  { feature: 'Bisa luar kota',            gojek: 'Sering ditolak',             cityrider: 'Kamu yang setuju' },
]

const FAQS = [
  ['Apa saya bisa cancel subscription kapan saja?',
   'Ya, kapan saja. Subscription auto-renew bulanan via Midtrans. Tap "Cancel" di dashboard kapanpun — masa aktif berjalan sampai akhir periode yang sudah dibayar, lalu profile otomatis tidak aktif. Tidak ada penalty, tidak ada minimum kontrak.'],
  ['Bagaimana cara bayar Rp 30.000/bulan?',
   'Lewat Midtrans — bisa pakai QRIS (semua bank), GoPay, OVO, Dana, ShopeePay, atau transfer BCA/Mandiri/BRI/BNI Virtual Account. Sekali setup, auto-renew tiap bulan. Kalau gagal bayar, ada 3 hari grace period sebelum profile disembunyikan.'],
  ['Customer bayar ke saya langsung atau ke City Rider?',
   'Langsung ke kamu. City Rider sama sekali tidak terlibat di transaksi customer-rider. Kamu nego sendiri dengan customer di WhatsApp — COD, transfer ke rekeningmu, QRIS ke barcode kamu, terserah. City Rider cuma platform listing — kamu yang jalankan bisnis.'],
  ['Berapa lama setup sampai bisa terima customer?',
   'Sekitar 5 menit total — 30 detik daftar, 2 menit isi profile + motor + harga, 1 menit bayar QRIS, lalu tap "Go Online". Setelah itu profilemu langsung muncul di marketplace untuk customer di area sekitarmu.'],
  ['Bagaimana City Rider beda dari Gojek atau Grab?',
   'Gojek/Grab adalah perusahaan dispatch — mereka ambil 15-20% per order, tentukan harga, dan algoritma mereka yang assign customer. City Rider bukan dispatch — kita cuma platform listing seperti yellow pages digital. Kamu yang muncul di pencarian customer, kamu yang nego, kamu yang antar, kamu yang dibayar. 0% komisi, kamu pemilik bisnis.'],
  ['Apa kalau saya offline (libur, sakit, dsb)?',
   'Profilemu tetap online di marketplace tapi dengan label "offline". Customer yang mampir ke profilemu otomatis dialihkan ke 5 rider terdekat yang sedang aktif. Saat kamu kembali aktif, profilemu otomatis muncul di pencarian lagi. Tidak ada penalty saat offline.'],
  ['Customer bisa rating saya?',
   'Belum di Phase 1 — kami sengaja menunda rating system karena di Gojek/Grab sering disalahgunakan untuk suspend rider tanpa konteks. Kami sedang riset model rating yang adil untuk rider. Untuk sekarang, social proof berdasarkan repeat customer di Customer Book kamu.'],
  ['Bisa antar luar kota / luar daerah?',
   'Bisa — kamu yang setuju. Saat customer kontak via WhatsApp, kamu bebas terima atau tolak job manapun. Beberapa rider kami punya niche "kurir luar kota" (Yogya-Magelang, Yogya-Klaten) dan pasang harga lebih tinggi untuk jarak jauh. City Rider tidak ngatur.'],
]

const TESTIMONIALS = [
  { name: 'Andi Pratama', area: 'Yogyakarta Tengah', bike: 'Honda BeAT 2023',
    quote: 'Setelah 3 tahun di Gojek, City Rider buat saya merasa punya bisnis sendiri. Customer langganan saya sekarang 12 orang yang chat saya langsung — itu yang Gojek tidak pernah kasih.' },
  { name: 'Citra Wulandari', area: 'Bantul', bike: 'Honda Scoopy 2024',
    quote: 'Saya rider perempuan. Di City Rider saya bisa atur jam kerja sendiri (cuma siang) tanpa takut rating turun atau dispatch ke malam. Customer book saya isi 23 langganan dalam 2 bulan.' },
  { name: 'Gilang Saputra', area: 'Yogyakarta Utara', bike: 'Honda CB150R 2024',
    quote: 'Motor sport saya untuk paket urgent — di Gojek harga sama dengan motor matic. Di City Rider saya pasang Rp 3.500/km dan customer yang butuh cepat ya bayar harga itu. Selisih ratusan ribu per bulan.' },
]

export default function CityRiderSellingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function openLiveApp(path = '/') {
    window.open(`${CITYRIDER_URL}${path}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="cr-page">
      <PageStyles />

      {/* ─── NAV ─── */}
      <header className={`cr-nav ${scrolled ? 'cr-nav--scrolled' : ''}`}>
        <div className="cr-nav__inner">
          <a href="/" className="cr-brand">
            <span className="cr-brand__icon">🛵</span>
            <span>City <span className="cr-grad">Rider</span></span>
          </a>
          <nav className="cr-nav__links">
            <a href="#how">Cara kerja</a>
            <a href="#vs">vs Gojek</a>
            <a href="#price">Harga</a>
            <a href="#faq">FAQ</a>
            <button onClick={() => openLiveApp('/signup')} className="cr-btn cr-btn--primary cr-btn--sm">
              Daftar →
            </button>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="cr-hero">
        <div className="cr-hero__bg" />
        <div className="cr-hero__inner">
          <div className="cr-hero__left">
            <h1 className="cr-h1">
              Punya motor?<br />
              Jadi <span className="cr-grad">kurir mandiri</span> dengan City Rider.
            </h1>
            <p className="cr-hero__lede">
              Marketplace untuk rider motor independen. Atur harga sendiri, simpan 100% pendapatan,
              kontak customer langsung lewat WhatsApp. Tanpa komisi dan tanpa dispatch.
            </p>
            <div className="cr-hero__cta">
              <button onClick={() => openLiveApp('/signup')} className="cr-btn cr-btn--primary cr-btn--lg">
                Daftar sebagai rider →
              </button>
              <button onClick={() => openLiveApp('/')} className="cr-btn cr-btn--ghost cr-btn--lg">
                Lihat marketplace
              </button>
            </div>
            <div className="cr-hero__pill">
              <span className="cr-dot" />
              Rp 30.000/bulan · 0% komisi · cancel kapan saja
            </div>
          </div>
          <div className="cr-hero__right">
            <div className="cr-hero__phone-tag">
              <span className="cr-pulse" />
              Aplikasi langsung — tap untuk coba
            </div>
            <div className="cr-phone">
              <div className="cr-phone__notch" />
              <div className="cr-phone__screen">
                <iframe src={CITYRIDER_URL + '/'} title="City Rider live demo" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section className="cr-stats">
        <div className="cr-container">
          <div className="cr-stats__grid">
            {STATS.map(s => (
              <div key={s.label} className="cr-stat">
                <div className="cr-stat__value cr-grad">{s.value}</div>
                <div className="cr-stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TWO COLUMNS: RIDERS vs CUSTOMERS ─── */}
      <section className="cr-section">
        <div className="cr-container">
          <div className="cr-split">
            <div className="cr-split__col">
              <span className="cr-kicker cr-kicker--inline">Untuk rider</span>
              <h3 className="cr-h3">Bangun bisnis kurir sendiri</h3>
              <p className="cr-muted">
                Daftar gratis, set motor + harga, bayar Rp 30K/bulan, go online. Customer kontak kamu langsung
                lewat WhatsApp. Tidak ada algoritma, tidak ada komisi, tidak ada suspend.
              </p>
              <ul className="cr-checklist">
                <li>Atur harga per km dan minimum fee sendiri</li>
                <li>Customer book — pelanggan kamu, bukan platform</li>
                <li>Profile publik dengan QR code untuk marketing offline</li>
              </ul>
            </div>
            <div className="cr-split__col">
              <span className="cr-kicker cr-kicker--inline">Untuk customer</span>
              <h3 className="cr-h3">Cari kurir terdekat, harga jelas</h3>
              <p className="cr-muted">
                Marketplace gratis untuk siapapun yang butuh kurir motor. Set jemput + antar, bandingkan rider
                dan harga total, pilih, kontak langsung lewat WhatsApp.
              </p>
              <ul className="cr-checklist">
                <li>Tidak perlu install app — buka di browser saja</li>
                <li>Lihat harga total sebelum kontak rider</li>
                <li>Bayar langsung ke rider, sesuai kesepakatan</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="cr-section" id="how">
        <div className="cr-container">
          <SectionHead kicker="Cara kerja" title="Dari daftar ke online dalam 5 menit" />
          <div className="cr-steps">
            {STEPS.map(s => (
              <div key={s.step} className="cr-step">
                <div className="cr-step__num">
                  <span className="cr-step__icon">{s.icon}</span>
                  <span className="cr-step__time">{s.time}</span>
                </div>
                <div className="cr-step__title">{s.title}</div>
                <div className="cr-step__desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section className="cr-section cr-section--alt" id="vs">
        <div className="cr-container">
          <SectionHead kicker="Perbandingan" title="Kenapa rider pindah ke City Rider" />
          <div className="cr-compare">
            <div className="cr-compare__head">
              <div></div>
              <div className="cr-compare__col-head cr-compare__col-head--them">Gojek / Grab</div>
              <div className="cr-compare__col-head cr-compare__col-head--us">City Rider</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} className="cr-compare__row">
                <div className="cr-compare__feat">{row.feature}</div>
                <div className="cr-compare__cell cr-compare__cell--them">
                  <span className="cr-cell-x">✕</span>
                  <span>{row.gojek}</span>
                </div>
                <div className="cr-compare__cell cr-compare__cell--us">
                  <span className="cr-cell-check">✓</span>
                  <span>{row.cityrider}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="cr-section">
        <div className="cr-container">
          <SectionHead kicker="Apa kamu dapat" title="Yang termasuk dalam Rp 30.000/bulan" />
          <div className="cr-features">
            {FEATURES.map((f, i) => (
              <div key={i} className="cr-feat">
                <div className="cr-feat__icon">{f.icon}</div>
                <div className="cr-feat__title">{f.title}</div>
                <div className="cr-feat__desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="cr-section cr-section--alt" id="price">
        <div className="cr-container">
          <SectionHead kicker="Harga" title="Satu paket, satu harga, semua termasuk" />
          <div className="cr-price">
            <div className="cr-price__card">
              <div className="cr-price__ribbon">⚡ Aktif sekarang</div>
              <div className="cr-price__name">City Rider — Rider</div>
              <div className="cr-price__amount">
                <span className="cr-price__num cr-grad">Rp 30.000</span>
                <span className="cr-price__period">/bulan</span>
              </div>
              <div className="cr-price__sub">0% komisi · auto-renew · cancel kapan saja</div>
              <ul className="cr-price__list">
                <li>Listing profile di marketplace GPS</li>
                <li>Quote inbox + notifikasi beep + haptic</li>
                <li>Customer Book — database pelanggan sendiri</li>
                <li>Kartu nama digital + QR (printable)</li>
                <li>8 template balasan WhatsApp Bahasa Indonesia</li>
                <li>Dashboard ROI bulanan</li>
                <li>Profile publik URL: cityrider.id/r/nama-kamu</li>
                <li>Offline fallback reciprocal network</li>
              </ul>
              <button onClick={() => openLiveApp('/signup')} className="cr-btn cr-btn--primary cr-btn--lg cr-price__cta">
                Daftar &amp; aktifkan sekarang →
              </button>
              <div className="cr-price__note">
                Bayar via QRIS, GoPay, OVO, Dana, ShopeePay, atau transfer bank.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE DEMO ─── */}
      <section className="cr-section">
        <div className="cr-container">
          <SectionHead kicker="Coba langsung" title="Lihat aplikasinya bekerja sekarang" />
          <div className="cr-demo">
            <div className="cr-demo__frame">
              <iframe src={CITYRIDER_URL + '/cari/rider?pLat=-7.7928&pLng=110.3657&pName=Malioboro&dLat=-7.7700&dLng=110.3782&dName=UGM'}
                title="City Rider — daftar driver"
                loading="lazy" />
            </div>
            <div className="cr-demo__actions">
              <button onClick={() => openLiveApp('/')} className="cr-btn cr-btn--primary cr-btn--lg">
                Buka full di tab baru →
              </button>
              <button onClick={() => openLiveApp('/dashboard')} className="cr-btn cr-btn--ghost cr-btn--lg">
                Lihat rider dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="cr-section cr-section--alt">
        <div className="cr-container">
          <SectionHead kicker="Rider stories" title="Apa kata rider yang sudah pakai" />
          <div className="cr-testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="cr-testi">
                <div className="cr-testi__quote">&ldquo;{t.quote}&rdquo;</div>
                <div className="cr-testi__meta">
                  <div className="cr-testi__avatar">{t.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
                  <div>
                    <div className="cr-testi__name">{t.name}</div>
                    <div className="cr-testi__sub">{t.area} · {t.bike}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="cr-section" id="faq">
        <div className="cr-container cr-container--narrow">
          <SectionHead kicker="FAQ" title="Pertanyaan yang sering ditanyakan rider" />
          <div className="cr-faq">
            {FAQS.map(([q, a], i) => (
              <details key={i} className="cr-faq__item" open={openFaq === i} onToggle={(e) => {
                if ((e.currentTarget).open) setOpenFaq(i)
              }}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="cr-cta">
        <div className="cr-container">
          <div className="cr-cta__inner">
            <span className="cr-emoji-big">🛵</span>
            <h2 className="cr-h2">Siap jadi kurir mandiri?</h2>
            <p className="cr-muted cr-cta__sub">
              5 menit setup. Rp 30.000/bulan. 0% komisi selamanya. Customer kamu, harga kamu, jam kamu.
            </p>
            <div className="cr-cta__btns">
              <button onClick={() => openLiveApp('/signup')} className="cr-btn cr-btn--primary cr-btn--xl">
                Daftar sebagai rider →
              </button>
              <button onClick={() => openLiveApp('/')} className="cr-btn cr-btn--ghost cr-btn--xl">
                Buka marketplace
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="cr-foot">
        <div className="cr-container cr-foot__inner">
          <div>
            <a href="/" className="cr-brand">
              <span className="cr-brand__icon">🛵</span>
              <span>City <span className="cr-grad">Rider</span></span>
            </a>
            <div className="cr-foot__tag">Part of the StreetLocal family of apps</div>
          </div>
          <div className="cr-foot__links">
            <a href="/">StreetLocal home</a>
            <a href="/donut">Donut app</a>
            <a href="/affiliate">Become an agent</a>
            <a href="/faq">FAQ</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
        <div className="cr-foot__legal">
          © {new Date().getFullYear()} StreetLocal · cityrider.id · Yogyakarta, Indonesia
        </div>
      </footer>
    </div>
  )
}

function SectionHead({ kicker, title }) {
  return (
    <div className="cr-section-head">
      <span className="cr-kicker">{kicker}</span>
      <h2 className="cr-h2">{title}</h2>
    </div>
  )
}

function PageStyles() {
  return (
    <style>{`
      .cr-page {
        background: #0A0A0A; color: #FFFFFF;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-font-smoothing: antialiased; line-height: 1.55;
      }
      .cr-page * { box-sizing: border-box; }

      .cr-container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
      .cr-container--narrow { max-width: 820px; }

      .cr-grad {
        background: linear-gradient(135deg, #FACC15 0%, #EAB308 100%);
        -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
      }
      .cr-muted { color: rgba(255,255,255,0.6); font-size: 15px; line-height: 1.7; }

      /* ── NAV ── */
      .cr-nav {
        position: sticky; top: 0; z-index: 50;
        background: rgba(10,10,10,0.7); backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border-bottom: 1px solid rgba(255,255,255,0.04);
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      .cr-nav--scrolled { background: rgba(10,10,10,0.92); border-bottom-color: rgba(255,255,255,0.08); }
      .cr-nav__inner {
        max-width: 1180px; margin: 0 auto; padding: 0 24px;
        height: 64px; display: flex; align-items: center; justify-content: space-between;
      }
      .cr-brand {
        display: inline-flex; align-items: center; gap: 8px;
        text-decoration: none; color: #fff; font-weight: 900; font-size: 17px; letter-spacing: -0.01em;
      }
      .cr-brand__icon {
        width: 30px; height: 30px; border-radius: 9px;
        background: linear-gradient(135deg, #FACC15, #EAB308); color: #0A0A0A;
        display: inline-flex; align-items: center; justify-content: center; font-size: 17px;
        box-shadow: 0 0 16px rgba(250,204,21,0.35);
      }
      .cr-nav__links { display: flex; align-items: center; gap: 6px; }
      .cr-nav__links a {
        color: rgba(255,255,255,0.65); text-decoration: none;
        font-size: 14px; font-weight: 700; padding: 8px 12px; border-radius: 8px;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .cr-nav__links a:hover { color: #FFF; background: rgba(255,255,255,0.05); }
      @media (max-width: 640px) {
        .cr-nav__links a:not(.cr-btn) { display: none; }
      }

      /* ── BUTTONS ── */
      .cr-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        font-family: inherit; font-weight: 800;
        border-radius: 12px; cursor: pointer; border: none;
        transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.15s ease;
        text-decoration: none; white-space: nowrap;
      }
      .cr-btn--primary {
        background: linear-gradient(135deg, #FACC15, #EAB308); color: #0A0A0A;
        box-shadow: 0 8px 22px rgba(250,204,21,0.22);
      }
      .cr-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(250,204,21,0.36); }
      .cr-btn--ghost {
        background: rgba(255,255,255,0.04); color: #fff; border: 1px solid rgba(255,255,255,0.12);
      }
      .cr-btn--ghost:hover { border-color: rgba(250,204,21,0.4); background: rgba(255,255,255,0.06); }
      .cr-btn--sm  { padding: 8px 14px; font-size: 13px; min-height: 36px; }
      .cr-btn--lg  { padding: 14px 22px; font-size: 15px; min-height: 48px; }
      .cr-btn--xl  { padding: 18px 30px; font-size: 17px; min-height: 56px; }

      /* ── KICKER + HEADINGS ── */
      .cr-kicker {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
        color: #FACC15; background: rgba(250,204,21,0.10);
        border: 1px solid rgba(250,204,21,0.22);
        padding: 6px 12px; border-radius: 9999px;
      }
      .cr-kicker--inline { background: transparent; border: none; padding: 0; }
      .cr-pulse {
        width: 8px; height: 8px; border-radius: 50%; background: #22C55E;
        box-shadow: 0 0 0 0 rgba(34,197,94,0.55); animation: crPulse 1.8s ease-in-out infinite;
      }
      @keyframes crPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
        70%      { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
      }
      .cr-h1 {
        font-size: clamp(36px, 6vw, 60px); font-weight: 900; line-height: 1.05;
        letter-spacing: -0.02em; margin: 18px 0 18px;
      }
      .cr-h2 {
        font-size: clamp(28px, 4.2vw, 40px); font-weight: 900; line-height: 1.1;
        letter-spacing: -0.01em; margin: 14px 0 0;
      }
      .cr-h3 { font-size: clamp(22px, 3vw, 28px); font-weight: 900; line-height: 1.15; margin: 12px 0 12px; }
      .cr-dot { width: 8px; height: 8px; border-radius: 50%; background: #FACC15; }

      /* ── HERO ──
         Mobile-first: text left, phone right, side-by-side from the
         smallest screens (matches DonutSellingPage pattern). Text column
         is wider (1.25fr) so H1 has breathing room; phone column
         auto-sizes around its 130-280px width. Reverts to looser
         1.15fr 1fr at desktop. */
      .cr-hero {
        position: relative; padding: 24px 0 56px; overflow: hidden;
      }
      .cr-hero__bg {
        position: absolute; inset: 0; pointer-events: none; z-index: 0;
        background:
          radial-gradient(ellipse 60% 50% at 20% 20%, rgba(250,204,21,0.10), transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 80%, rgba(250,204,21,0.06), transparent 60%);
      }
      .cr-hero__inner {
        position: relative; z-index: 1;
        max-width: 1180px; margin: 0 auto; padding: 0 20px;
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
        gap: 18px; align-items: start;
      }
      .cr-hero__left  { min-width: 0; padding-top: 4px; }
      .cr-hero__right { display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 0; }
      /* Floating tag under the header, sits directly above the phone. */
      .cr-hero__phone-tag {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 12px; font-weight: 800; letter-spacing: 0.02em;
        color: #FACC15;
        background: rgba(250,204,21,0.10);
        border: 1px solid rgba(250,204,21,0.25);
        padding: 5px 11px; border-radius: 9999px;
        white-space: nowrap;
      }
      .cr-h1 {
        font-size: 28px; line-height: 1.05; letter-spacing: -0.02em;
        font-weight: 900; margin: 4px 0 0;
      }
      .cr-hero__lede {
        font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.65);
        max-width: 540px; margin: 12px 0 0;
      }
      .cr-hero__cta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
      .cr-hero__pill {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.7);
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
        padding: 6px 12px; border-radius: 9999px;
        margin-top: 12px;
      }
      .cr-phone {
        position: relative; width: 100%; max-width: 220px;
        aspect-ratio: 9/19;
        background: #1A1A1A; border-radius: 28px;
        border: 2px solid rgba(255,255,255,0.08);
        padding: 6px; overflow: hidden;
        box-shadow: 0 24px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(250,204,21,0.06);
      }
      .cr-phone__notch {
        position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
        width: 68px; height: 18px; background: #0A0A0A; border-radius: 12px; z-index: 2;
      }
      .cr-phone__screen {
        position: absolute; inset: 6px; border-radius: 22px; overflow: hidden;
        background: #0A0A0A;
      }
      .cr-phone__screen iframe {
        width: 100%; height: 100%; border: 0; display: block;
      }
      /* ≥480px: H1 + lede grow back, phone scales up slightly */
      @media (min-width: 480px) {
        .cr-h1        { font-size: 34px; }
        .cr-hero__lede{ font-size: 14px; }
        .cr-phone     { max-width: 240px; border-radius: 30px; }
      }
      /* ≥768px: tablet — more breathing room */
      @media (min-width: 768px) {
        .cr-hero { padding: 36px 0 80px; }
        .cr-hero__inner { gap: 40px; padding: 0 24px; }
        .cr-hero__phone-tag { font-size: 13px; padding: 6px 13px; }
        .cr-h1 { font-size: clamp(38px, 5vw, 52px); }
        .cr-hero__lede { font-size: 16px; line-height: 1.7; }
        .cr-hero__cta { gap: 12px; margin-top: 24px; }
        .cr-hero__pill { font-size: 13px; padding: 8px 14px; margin-top: 18px; }
        .cr-phone { max-width: 280px; border-radius: 34px; padding: 8px; }
        .cr-phone__notch { width: 84px; height: 20px; top: 14px; }
        .cr-phone__screen { inset: 8px; border-radius: 26px; }
      }
      /* ≥1024px: desktop — full hero proportions */
      @media (min-width: 1024px) {
        .cr-hero__inner { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 56px; }
        .cr-h1 { font-size: 60px; line-height: 1.05; }
        .cr-phone { max-width: 320px; }
      }

      /* ── STATS ── */
      .cr-stats {
        padding: 36px 0; border-top: 1px solid rgba(255,255,255,0.05);
        border-bottom: 1px solid rgba(255,255,255,0.05);
        background: rgba(255,255,255,0.015);
      }
      .cr-stats__grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;
      }
      .cr-stat__value { font-size: clamp(28px, 4vw, 40px); font-weight: 900; line-height: 1; }
      .cr-stat__label { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.55); margin-top: 8px; letter-spacing: 0.04em; text-transform: uppercase; }

      /* ── SECTION ── */
      .cr-section { padding: 72px 0; }
      .cr-section--alt { background: rgba(255,255,255,0.015); border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); }
      .cr-section-head { text-align: center; margin-bottom: 44px; }
      .cr-section-head .cr-h2 { margin-top: 14px; }

      /* ── SPLIT (riders / customers) ── */
      .cr-split {
        display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
      }
      .cr-split__col {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 22px; padding: 32px;
      }
      .cr-checklist { list-style: none; padding: 0; margin: 18px 0 0; }
      .cr-checklist li {
        position: relative; padding: 6px 0 6px 30px;
        font-size: 15px; color: rgba(255,255,255,0.78);
      }
      .cr-checklist li::before {
        content: '✓'; position: absolute; left: 0; top: 4px;
        color: #FACC15; font-weight: 900;
        background: rgba(250,204,21,0.10); border-radius: 50%;
        width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
        font-size: 13px;
      }
      @media (max-width: 768px) {
        .cr-split { grid-template-columns: 1fr; }
      }

      /* ── STEPS ── */
      .cr-steps {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px;
      }
      .cr-step {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 22px;
        transition: border-color 0.2s ease, transform 0.2s ease;
      }
      .cr-step:hover { border-color: rgba(250,204,21,0.3); transform: translateY(-2px); }
      .cr-step__num { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
      .cr-step__icon {
        width: 44px; height: 44px; border-radius: 14px;
        background: linear-gradient(135deg, rgba(250,204,21,0.15), rgba(250,204,21,0.04));
        display: inline-flex; align-items: center; justify-content: center; font-size: 22px;
      }
      .cr-step__time { font-size: 13px; font-weight: 800; color: #FACC15; }
      .cr-step__title { font-size: 17px; font-weight: 900; margin-bottom: 6px; }
      .cr-step__desc { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; }
      @media (max-width: 860px) {
        .cr-steps { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 480px) {
        .cr-steps { grid-template-columns: 1fr; }
      }

      /* ── COMPARISON ── */
      .cr-compare {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 22px;
        overflow: hidden;
      }
      .cr-compare__head {
        display: grid; grid-template-columns: 1.4fr 1fr 1fr;
        padding: 16px 22px; gap: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.02);
      }
      .cr-compare__col-head {
        font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; text-align: center;
      }
      .cr-compare__col-head--them { color: rgba(255,255,255,0.5); }
      .cr-compare__col-head--us { color: #FACC15; }
      .cr-compare__row {
        display: grid; grid-template-columns: 1.4fr 1fr 1fr;
        padding: 14px 22px; gap: 16px; align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .cr-compare__row:last-child { border-bottom: none; }
      .cr-compare__feat { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.85); }
      .cr-compare__cell {
        display: flex; align-items: center; gap: 8px;
        font-size: 14px;
        padding: 8px 12px; border-radius: 10px;
      }
      .cr-compare__cell--them { color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.02); }
      .cr-compare__cell--us { color: #FFFFFF; background: rgba(250,204,21,0.08); }
      .cr-cell-x { color: rgba(255,255,255,0.4); font-weight: 900; flex-shrink: 0; }
      .cr-cell-check { color: #22C55E; font-weight: 900; flex-shrink: 0; }
      @media (max-width: 720px) {
        .cr-compare__head, .cr-compare__row { grid-template-columns: 1fr; padding: 16px; gap: 8px; }
        .cr-compare__col-head { text-align: left; }
        .cr-compare__feat { font-weight: 900; color: #FACC15; margin-bottom: 4px; }
      }

      /* ── FEATURES ── */
      .cr-features {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
      }
      .cr-feat {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px;
        transition: border-color 0.2s ease, transform 0.2s ease;
      }
      .cr-feat:hover { border-color: rgba(250,204,21,0.3); transform: translateY(-2px); }
      .cr-feat__icon {
        width: 38px; height: 38px; border-radius: 12px;
        background: linear-gradient(135deg, rgba(250,204,21,0.18), rgba(250,204,21,0.05));
        display: inline-flex; align-items: center; justify-content: center; font-size: 19px;
        margin-bottom: 12px;
      }
      .cr-feat__title { font-size: 15px; font-weight: 900; margin-bottom: 6px; line-height: 1.25; }
      .cr-feat__desc { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.55; }
      @media (max-width: 1024px) { .cr-features { grid-template-columns: repeat(3, 1fr); } }
      @media (max-width: 720px)  { .cr-features { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 460px)  { .cr-features { grid-template-columns: 1fr; } }

      /* ── PRICING ── */
      .cr-price { display: flex; justify-content: center; }
      .cr-price__card {
        position: relative;
        width: 100%; max-width: 480px;
        background: rgba(255,255,255,0.025);
        border: 2px solid rgba(250,204,21,0.32);
        border-radius: 26px; padding: 36px 32px 30px;
        box-shadow: 0 24px 60px rgba(250,204,21,0.10);
      }
      .cr-price__ribbon {
        position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #FACC15, #EAB308); color: #0A0A0A;
        padding: 5px 14px; border-radius: 9999px;
        font-size: 13px; font-weight: 900;
        box-shadow: 0 8px 20px rgba(250,204,21,0.35);
      }
      .cr-price__name { font-size: 15px; font-weight: 900; color: rgba(255,255,255,0.85); margin-bottom: 8px; }
      .cr-price__amount { display: flex; align-items: baseline; gap: 6px; }
      .cr-price__num { font-size: 46px; font-weight: 900; line-height: 1; }
      .cr-price__period { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.55); }
      .cr-price__sub { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.55); margin-top: 6px; }
      .cr-price__list { list-style: none; padding: 0; margin: 22px 0; }
      .cr-price__list li {
        position: relative; padding: 7px 0 7px 30px;
        font-size: 14px; color: rgba(255,255,255,0.85);
      }
      .cr-price__list li::before {
        content: '✓'; position: absolute; left: 0; top: 9px;
        color: #FACC15; font-weight: 900; font-size: 14px;
      }
      .cr-price__cta { width: 100%; }
      .cr-price__note {
        font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 14px; text-align: center;
      }

      /* ── DEMO ── */
      .cr-demo {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 22px;
        padding: 24px; max-width: 980px; margin: 0 auto;
      }
      .cr-demo__frame {
        aspect-ratio: 16/9; max-height: 560px;
        border-radius: 14px; overflow: hidden;
        background: #0A0A0A; border: 1px solid rgba(255,255,255,0.06);
      }
      .cr-demo__frame iframe { width: 100%; height: 100%; border: 0; display: block; }
      .cr-demo__actions {
        display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 22px;
      }
      @media (max-width: 720px) {
        .cr-demo__frame { aspect-ratio: 9/16; max-height: 700px; }
      }

      /* ── TESTIMONIALS ── */
      .cr-testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
      .cr-testi {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 18px; padding: 24px;
      }
      .cr-testi__quote { font-size: 15px; line-height: 1.65; color: rgba(255,255,255,0.85); margin-bottom: 18px; }
      .cr-testi__meta { display: flex; align-items: center; gap: 12px; }
      .cr-testi__avatar {
        width: 42px; height: 42px; border-radius: 14px;
        background: linear-gradient(135deg, rgba(250,204,21,0.25), rgba(250,204,21,0.08));
        border: 1px solid rgba(250,204,21,0.3);
        display: flex; align-items: center; justify-content: center;
        color: #FACC15; font-weight: 900; font-size: 14px;
      }
      .cr-testi__name { font-size: 14px; font-weight: 900; }
      .cr-testi__sub { font-size: 13px; color: rgba(255,255,255,0.5); }
      @media (max-width: 860px) { .cr-testi-grid { grid-template-columns: 1fr; } }

      /* ── FAQ ── */
      .cr-faq { display: flex; flex-direction: column; gap: 8px; }
      .cr-faq__item {
        background: rgba(255,255,255,0.025);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 0;
        overflow: hidden;
      }
      .cr-faq__item summary {
        cursor: pointer; list-style: none;
        padding: 18px 22px;
        font-size: 15px; font-weight: 800;
        display: flex; justify-content: space-between; align-items: center; gap: 12px;
      }
      .cr-faq__item summary::-webkit-details-marker { display: none; }
      .cr-faq__item summary::after {
        content: '+'; color: #FACC15; font-size: 22px; font-weight: 700; transition: transform 0.2s ease;
      }
      .cr-faq__item[open] summary::after { content: '−'; }
      .cr-faq__item p {
        padding: 0 22px 22px; margin: 0;
        font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.7);
      }

      /* ── CTA ── */
      .cr-cta {
        padding: 100px 0; position: relative; overflow: hidden;
        background:
          radial-gradient(ellipse 80% 60% at 50% 50%, rgba(250,204,21,0.10), transparent 60%);
      }
      .cr-cta__inner { text-align: center; max-width: 680px; margin: 0 auto; }
      .cr-emoji-big { font-size: 60px; display: inline-block; margin-bottom: 14px; }
      .cr-cta__sub { font-size: 16px; margin: 14px auto 28px; max-width: 540px; }
      .cr-cta__btns { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }

      /* ── FOOTER ── */
      .cr-foot {
        background: #050505;
        border-top: 1px solid rgba(255,255,255,0.05);
        padding: 40px 0 24px;
      }
      .cr-foot__inner {
        display: flex; flex-wrap: wrap; gap: 24px;
        justify-content: space-between; align-items: flex-start;
      }
      .cr-foot__tag { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 8px; }
      .cr-foot__links {
        display: flex; flex-wrap: wrap; gap: 18px;
      }
      .cr-foot__links a {
        font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.55); text-decoration: none;
        transition: color 0.15s ease;
      }
      .cr-foot__links a:hover { color: #FACC15; }
      .cr-foot__legal {
        max-width: 1180px; margin: 24px auto 0; padding: 16px 24px 0;
        border-top: 1px solid rgba(255,255,255,0.04);
        font-size: 13px; color: rgba(255,255,255,0.35);
      }
    `}</style>
  )
}
