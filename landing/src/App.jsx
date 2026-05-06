import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import Admin from './Admin'
import { getTranslation, COUNTRY_TO_LANG } from './translations'

/* ─── Translations ─── */
const TRANSLATIONS = {
  en: {
    heroTitle: 'Street Local',
    heroSub: 'Software built for local businesses.',
    heroSub2: 'Simple. Powerful. Mobile-first.',
    navAbout: 'About Us',
    navFaq: 'FAQ',
    navServices: 'Terms',
    aboutTitle: 'About Us',
    aboutBody: 'StreetLocal is redefining how local businesses operate in a digital world.\n\nWe empower street food vendors, restaurants, property businesses, laundries, hair salons, and more with their own fully branded mobile apps — giving them the same power as big brands, without the high costs or complicated systems.\n\nAt the price of a coffee, your business can go fully digital.\n\nNo middlemen. No commissions. Just a direct connection between you and your customers.\n\nWe believe every local business deserves to own its customers, its data, and its future. That\'s why StreetLocal is built to be simple, powerful, and accessible — whether you\'re running a small warung or scaling a growing brand.\n\nOur platforms don\'t just look good — they work hard. Taking orders, managing bookings, connecting with customers, and driving growth 24/7… even while you sleep.\n\nThis isn\'t just about technology.\nIt\'s about freedom.\n\nFreedom to grow your business your way.\nFreedom to keep more of what you earn.\nFreedom to compete with anyone — no matter your size.\n\nOur mission is simple: to help local businesses thrive in the digital age with tools that are affordable, reliable, and built for real-world success.\n\nStreetLocal isn\'t just a service.\nIt\'s a smarter, simpler, more powerful way to do business.',
    faqTitle: 'FAQ',
    faqs: [
      { q: 'How does it work?', a: 'Choose your plan, subscribe, and we set up your branded food app within 24 hours. You get a link to share with customers.' },
      { q: 'Do I need technical skills?', a: 'No! Everything is managed through a simple dashboard. If you can use WhatsApp, you can manage your app.' },
      { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no lock-in. Cancel anytime from your dashboard.' },
      { q: 'How do customers order?', a: 'Customers open your app link, browse your menu, and checkout via WhatsApp or direct payment.' },
      { q: 'Do you take commission on orders?', a: 'Never. You keep 100% of your revenue. We only charge the monthly subscription.' },
      { q: 'Can I customize my app?', a: 'Yes — your brand name, menu, prices, photos, and promotions are all under your control.' },
    ],
    termsTitle: 'Terms & Conditions',
    termsLastUpdated: 'Last updated: 5 May 2026',
    termsSections: [
      {
        title: '1. Definitions & Interpretation',
        body: '"StreetLocal" (also referred to as "we", "us", "our", or "the Company") refers to StreetLocal, a software technology company that develops and licenses mobile application software on a subscription basis. "User" (also referred to as "you", "your", or "Subscriber") refers to any individual, sole proprietor, business entity, or organization that subscribes to, accesses, or uses any StreetLocal software product. "Software" refers to any and all mobile applications, web applications, dashboards, tools, APIs, and digital products developed, owned, and licensed by StreetLocal. "Subscription" refers to the paid license granted to the User to access and use the Software for a defined period (monthly or yearly). "Content" refers to all data, text, images, menus, pricing, business information, and any other material uploaded or entered into the Software by the User.'
      },
      {
        title: '2. Nature of Service — Software License Only',
        body: 'StreetLocal is exclusively a software technology company. We develop, maintain, and license mobile application software to businesses and individuals on a subscription basis. We are NOT a food business, restaurant, delivery service, ride-hailing company, transportation provider, logistics company, food handler, food processor, employment agency, partnership, joint venture, franchise, or any other type of operating business beyond software development and licensing.\n\nThe Software is provided "as-is" as a digital tool. StreetLocal does not participate in, control, manage, direct, or have any involvement whatsoever in the day-to-day operations, business decisions, hiring practices, pricing strategies, food preparation, delivery operations, customer service, or any other aspect of the User\'s business.\n\nUsers are independent business operators. There is no employer-employee relationship, partnership, joint venture, franchise, agency, or any other legal relationship between StreetLocal and the User beyond a standard software license agreement. Users are not agents, representatives, employees, contractors, partners, or affiliates of StreetLocal under any circumstances.'
      },
      {
        title: '3. User Responsibilities & Legal Compliance',
        body: 'By subscribing to and using StreetLocal Software, the User acknowledges and agrees that they are solely and entirely responsible for:\n\n• Complying with ALL applicable local, regional, national, and international laws, regulations, ordinances, permits, licenses, and legal requirements in the jurisdiction(s) where they operate their business, including but not limited to: business registration and licensing, food safety and hygiene regulations, health department permits, tax registration and reporting (including income tax, VAT/PPN, and any other applicable taxes), employment and labor laws, consumer protection laws, data protection and privacy laws, transportation and ride-hailing regulations, insurance requirements, zoning and operating permits, and any industry-specific regulations.\n\n• Obtaining and maintaining all necessary business permits, food handling certificates, health inspections, trade licenses, and any other regulatory approvals required to legally operate their business.\n\n• Collecting, reporting, and remitting all applicable taxes, duties, and government fees. StreetLocal does not collect, withhold, report, or remit any taxes on behalf of Users.\n\n• Ensuring their business operations, products, services, pricing, advertising, and customer interactions comply with all applicable consumer protection, advertising standards, and fair trading laws.\n\n• Understanding that laws regarding food businesses, delivery services, ride-hailing, transportation, e-commerce, and digital services vary significantly between countries, states, provinces, cities, and municipalities. It is the User\'s sole responsibility to research, understand, and comply with the specific laws that apply to their business in their specific location(s).\n\nStreetLocal provides software tools only. We do not provide legal, tax, financial, regulatory, or business advice. Users should consult qualified local legal and financial professionals regarding their obligations.'
      },
      {
        title: '4. Subscription Terms & Payment',
        body: 'Subscriptions are available on a monthly or yearly basis at the prices displayed at the time of purchase. All prices are in Indonesian Rupiah (IDR) unless otherwise stated. Payment is made via bank transfer. Subscription activation occurs after payment verification, which may take up to 24 hours.\n\nSubscriptions auto-renew at the end of each billing cycle unless cancelled. No refunds are provided for partial months, partial years, or unused subscription periods. StreetLocal reserves the right to modify pricing with 30 days written notice. Continued use of the Software after a price change constitutes acceptance of the new pricing.\n\nLate or non-payment may result in immediate suspension or termination of the Software license without notice. StreetLocal is not liable for any business disruption caused by suspension due to non-payment.'
      },
      {
        title: '5. Intellectual Property & Restrictions',
        body: 'All Software, source code, design, architecture, algorithms, databases, branding, trademarks, documentation, and any associated intellectual property are and remain the exclusive property of StreetLocal. The subscription grants a limited, non-exclusive, non-transferable, revocable license to USE the Software — not to own it.\n\nUsers are strictly prohibited from: copying, reproducing, duplicating, or cloning the Software or any part thereof; reverse engineering, decompiling, disassembling, or attempting to derive the source code; modifying, adapting, translating, or creating derivative works; scraping, crawling, or automated data extraction from the Software; sublicensing, reselling, renting, leasing, or distributing the Software to third parties; removing, altering, or obscuring any proprietary notices, branding, or attributions; using the Software to build a competing product or service; sharing login credentials, access tokens, or API keys with unauthorized parties.\n\nAny violation of these intellectual property restrictions will result in immediate and permanent revocation of the Software license without refund, and StreetLocal reserves the right to pursue all available legal remedies including but not limited to injunctive relief and damages.'
      },
      {
        title: '6. License Revocation & Termination',
        body: 'StreetLocal reserves the absolute right to suspend, terminate, or permanently revoke any User\'s Software license at any time, with or without notice, for any reason including but not limited to: violation of these Terms & Conditions; non-payment or late payment; use of the Software for illegal, fraudulent, or unethical purposes; intellectual property violations; misrepresentation of business information; abusive behavior toward StreetLocal staff or systems; any activity that damages or threatens to damage StreetLocal\'s reputation, infrastructure, or other Users.\n\nUpon termination: all rights granted under the license cease immediately; the User must stop using the Software; StreetLocal may delete User data after 30 days; no refunds will be provided for the remaining subscription period; StreetLocal is not liable for any business disruption, loss of revenue, loss of data, or any other damages resulting from termination.'
      },
      {
        title: '7. Limitation of Liability & Disclaimer of Warranties',
        body: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:\n\nThe Software is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, implied, statutory, or otherwise, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement, reliability, accuracy, or completeness.\n\nStreetLocal does not warrant that the Software will be uninterrupted, error-free, secure, or free from viruses, bugs, or defects. StreetLocal does not warrant that the Software will meet the User\'s specific requirements or expectations.\n\nIN NO EVENT SHALL STREETLOCAL, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, PARTNERS, OR AFFILIATES BE LIABLE FOR: any indirect, incidental, special, consequential, punitive, or exemplary damages; any loss of profits, revenue, business, savings, data, or goodwill; any damages arising from business interruption, system downtime, or data loss; any damages arising from unauthorized access to or alteration of data; any damages arising from the User\'s business operations, products, or services; any damages arising from third-party claims against the User; any damages arising from the User\'s failure to comply with applicable laws.\n\nStreetLocal\'s total aggregate liability for all claims arising from or related to these Terms or the Software shall not exceed the amount paid by the User in subscription fees during the twelve (12) months immediately preceding the claim.\n\nSome jurisdictions do not allow the exclusion of certain warranties or limitation of liability. In such jurisdictions, our liability shall be limited to the maximum extent permitted by law.'
      },
      {
        title: '8. Indemnification',
        body: 'The User agrees to fully indemnify, defend, and hold harmless StreetLocal, its directors, officers, employees, agents, partners, licensors, and affiliates from and against any and all claims, demands, actions, suits, proceedings, liabilities, damages, losses, costs, and expenses (including reasonable legal fees and court costs) arising from or related to: the User\'s use or misuse of the Software; the User\'s violation of these Terms & Conditions; the User\'s violation of any applicable law, regulation, or third-party rights; the User\'s business operations, products, services, or customer interactions; any content uploaded, published, or transmitted through the Software by the User; any tax liability, regulatory fine, or legal penalty incurred by the User; any claims by the User\'s customers, employees, contractors, partners, or any third party; any dispute between the User and their customers or business partners.\n\nThis indemnification obligation survives the termination of these Terms and the User\'s subscription.'
      },
      {
        title: '9. No Partnership, Employment, or Agency',
        body: 'Nothing in these Terms & Conditions shall be construed as creating any partnership, joint venture, employment relationship, franchise, agency, or any other legal relationship between StreetLocal and the User beyond a standard software license.\n\nThe User has no authority to bind, represent, or act on behalf of StreetLocal in any capacity. The User shall not hold themselves out as a partner, employee, agent, representative, or affiliate of StreetLocal.\n\nStreetLocal is not responsible for, and has no control over, the User\'s business decisions, operations, hiring, firing, pricing, service quality, customer relations, or any other aspect of the User\'s business.\n\nAny claims, disputes, lawsuits, regulatory actions, or legal proceedings arising from the User\'s business operations are the sole responsibility of the User. StreetLocal shall not be made a party to, or held liable in, any such proceedings.'
      },
      {
        title: '10. Data & Privacy',
        body: 'Users retain ownership of all Content they upload to the Software. StreetLocal may access User data solely for the purposes of providing and maintaining the Software, troubleshooting technical issues, and improving the service.\n\nStreetLocal will not sell User data to third parties. However, StreetLocal may disclose data when required by law, regulation, legal process, or governmental request.\n\nUsers are solely responsible for complying with all applicable data protection and privacy laws (including but not limited to Indonesia\'s UU PDP, EU GDPR, and any other applicable privacy regulations) with respect to their customers\' personal data.\n\nStreetLocal implements reasonable security measures but does not guarantee absolute security. Users accept the inherent risks of transmitting data over the internet.'
      },
      {
        title: '11. Governing Law & Dispute Resolution',
        body: 'These Terms & Conditions shall be governed by and construed in accordance with the laws of the Republic of Indonesia, without regard to its conflict of law provisions.\n\nAny dispute arising from or relating to these Terms shall first be attempted to be resolved through good faith negotiation. If negotiation fails, the dispute shall be submitted to binding arbitration in accordance with the rules of the Indonesian National Arbitration Board (BANI) in Jakarta, Indonesia.\n\nThe User agrees that any legal proceedings shall be conducted in the Indonesian language and English. The arbitral award shall be final and binding on both parties.\n\nThe User waives any right to participate in class action lawsuits or class-wide arbitration against StreetLocal.'
      },
      {
        title: '12. Modifications to Terms',
        body: 'StreetLocal reserves the right to modify, update, or replace these Terms & Conditions at any time. Material changes will be communicated via the Software interface or email with at least 14 days notice. Continued use of the Software after changes take effect constitutes acceptance of the updated Terms.\n\nIf the User does not agree with any changes, their sole remedy is to cancel the subscription and stop using the Software.'
      },
      {
        title: '13. Severability & Entire Agreement',
        body: 'If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, or if modification is not possible, it shall be severed from these Terms. The remaining provisions shall continue in full force and effect.\n\nThese Terms & Conditions, together with the Privacy Policy and any supplemental terms, constitute the entire agreement between StreetLocal and the User regarding the use of the Software, superseding all prior agreements, representations, warranties, and understandings.\n\nThe failure of StreetLocal to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.'
      },
      {
        title: '14. Contact',
        body: 'For questions regarding these Terms & Conditions, contact us via WhatsApp at +62 813 9200 0050 or visit streetlocal.live.'
      },
    ],
    register: {
      title: 'Set Up Your Business',
      subtitle: 'Fill in your details below. Your app will be activated once we confirm your payment.',
      businessName: 'Business Name',
      businessNamePlaceholder: 'e.g. Warung Sari Rasa',
      urlLabel: 'Choose Your URL',
      urlPrefix: 'streetlocal.live/',
      urlPlaceholder: 'your-business-name',
      whatsapp: 'WhatsApp Number',
      whatsappPlaceholder: '+62 812 3456 7890',
      email: 'Email Address',
      emailPlaceholder: 'you@email.com',
      submitBtn: 'Submit Registration',
      pendingTitle: 'Registration Submitted!',
      pendingMsg: 'We\'re verifying your payment. You\'ll receive a WhatsApp message once your app is activated.',
      backHome: 'Back to Home',
    },
    ourApps: 'Starting Rp 38.000/Month',
    comingSoon: 'Coming Soon',
    back: '← Back',
    viewDetails: 'View Details →',
    features: 'Features',
    openApp: 'Try Free Demo',
    subscribe: 'Subscribe',
    footer: 'Street Local © 2026',
    apps: '{count} software →',
    perMonth: '/month',
    perYear: '/year',
    monthly: 'Monthly',
    yearly: 'Yearly',
    tabDetails: 'App Details',
    payment: {
      title: 'Subscribe to',
      transferTo: 'Transfer to',
      bankName: 'Bank BCA',
      accountNumber: 'XXXX-XXXX-XXXX',
      accountHolder: 'Account Holder Name',
      copyAccount: 'Copy Account Number',
      copied: 'Copied!',
      uploadTitle: 'Upload Payment Proof',
      uploadBtn: 'Tap to upload screenshot',
      changeImage: 'Change image',
      confirmPayment: 'Confirm Payment',
      close: 'Close',
    },
    tabBenefits: 'Why Your Own App?',
    benefitsIntro: 'As a food business owner, having your own app presence is no longer a luxury — it\'s a smart, strategic move.',
    benefitsBody: 'For years, food delivery platforms have steadily increased their commission rates, cutting deeper into your profits. At the same time, your restaurant is buried among hundreds of competitors, all fighting for the same limited customer attention.\n\nWith Street Local, you can finally stand out from the crowd by building your own direct customer base. Imagine your customers having your restaurant app right on their phone — just one tap away from ordering. No distractions, no competing listings. Just your brand, your menu, and your experience.\n\nOrdering becomes seamless, with checkout flowing directly to your WhatsApp, making communication fast and personal.\n\nRestaurant apps are quickly becoming one of the most powerful tools for generating consistent income — and it\'s an opportunity many owners have been missing for years.',
    benefitsWithApp: 'With your own app, you can:',
    benefitsClosing: 'Owning your own app means owning your customer relationships, your data, and your growth. You\'re no longer renting space on someone else\'s platform — you\'re building your own ecosystem where your brand comes first.',
    benefitGroups: [
      {
        icon: '💰',
        title: 'Keep More Money',
        points: [
          'Zero commission — keep 100% of your revenue',
          'Get paid directly, no waiting days for payouts',
          'No platform fees eating into your profits',
        ],
      },
      {
        icon: '📱',
        title: 'Grow Your Brand',
        points: [
          'Your brand name and identity — not a marketplace',
          'Share your app on Instagram, TikTok, Facebook & website',
          'Link directly from Instagram bio and stories',
          'Built-in SEO so customers find you online',
        ],
      },
      {
        icon: '📊',
        title: 'Own Your Business',
        points: [
          'Full analytics — what sells, peak hours, repeat rates',
          'Customer reviews live on YOUR app, not next to competitors',
          'Update menu, prices & photos instantly — no platform approval',
          'Push notifications to customers\' phones — free, no ad spend',
        ],
      },
      {
        icon: '⚡',
        title: 'Better Customer Experience',
        points: [
          'One-tap ordering — no distractions or competitor listings',
          'WhatsApp checkout — fast and personal',
          'Works even when other platforms go down',
          'Build real loyalty and lasting relationships',
        ],
      },
    ],
    categories: {
      food: {
        name: 'Food Ordering Software',
        description: 'Complete food business solutions',
        bannerImage: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%204,%202026,%2004_17_25%20PM.png?updatedAt=1777886267229',
        apps: {
          basic: {
            name: 'Street Vendor',
            tier: 'Basic',
            price: 'Rp 38.000',
            yearlyPrice: 'Rp 456.000',
            tagline: 'Simple menu & ordering for street food stalls',
            description: 'Perfect for warung, kaki lima, and small food stalls. Show your menu, take WhatsApp orders, and manage availability — all from your phone.',
            features: ['Digital menu with photos', 'WhatsApp ordering', 'Open/Close toggle', 'Location & hours page', 'QR code sharing'],
          },
          pro: {
            name: 'Restaurant',
            tier: 'Pro',
            price: 'Rp 100.000',
            yearlyPrice: 'Rp 1.200.000',
            tagline: 'Your brand. Your menu. Unlimited promotion.',
            description: 'Put your restaurant front and centre with your own branded ordering software. Full menu options with estimated delivery bike rates that can be set to suit any market. Set your opening hours, showcase daily deals and promo offers, and offer discounts to drive customers through your doors. Display your seating capacity, live music, entertainment venues, and outside catering services. Promote weekly events, showcase live entertainment, and run unlimited discount campaigns — all under your brand name.',
            features: ['Your own branded restaurant name', 'Full menu with delivery km estimates', 'Daily deals & promo offers', 'Customer discount campaigns', 'Seating & venue showcase', 'Live music & entertainment listings', 'Outside catering promotion', 'Weekly event showcase', 'Opening hours management', 'Adjustable delivery bike rates'],
          },
        },
      },
    },
  },
  id: {
    heroTitle: 'Street Local',
    heroSub: 'Software untuk bisnis lokal.',
    heroSub2: 'Simpel. Kuat. Mobile-first.',
    navAbout: 'Tentang',
    navFaq: 'FAQ',
    navServices: 'S&K',
    aboutTitle: 'Tentang Kami',
    aboutBody: 'StreetLocal mendefinisikan ulang cara bisnis lokal beroperasi di dunia digital.\n\nKami memberdayakan pedagang kaki lima, restoran, bisnis properti, laundry, salon, dan lainnya dengan aplikasi mobile bermerek sendiri — memberikan kekuatan yang sama seperti brand besar, tanpa biaya mahal atau sistem rumit.\n\nDengan harga secangkir kopi, bisnis kamu bisa sepenuhnya digital.\n\nTanpa perantara. Tanpa komisi. Hanya koneksi langsung antara kamu dan pelanggan.\n\nKami percaya setiap bisnis lokal layak memiliki pelanggannya, datanya, dan masa depannya. Itulah mengapa StreetLocal dibangun untuk sederhana, kuat, dan mudah diakses — baik kamu mengelola warung kecil atau mengembangkan brand yang tumbuh.\n\nPlatform kami bukan hanya tampil bagus — tapi bekerja keras. Menerima pesanan, mengelola booking, terhubung dengan pelanggan, dan mendorong pertumbuhan 24/7… bahkan saat kamu tidur.\n\nIni bukan hanya soal teknologi.\nIni soal kebebasan.\n\nKebebasan untuk mengembangkan bisnis dengan caramu.\nKebebasan untuk menyimpan lebih banyak dari yang kamu hasilkan.\nKebebasan untuk bersaing dengan siapa saja — tak peduli seberapa besar ukuranmu.\n\nMisi kami sederhana: membantu bisnis lokal berkembang di era digital dengan alat yang terjangkau, andal, dan dibangun untuk kesuksesan nyata.\n\nStreetLocal bukan hanya layanan.\nIni cara berbisnis yang lebih cerdas, lebih sederhana, dan lebih kuat.',
    faqTitle: 'FAQ',
    faqs: [
      { q: 'Bagaimana cara kerjanya?', a: 'Pilih paket, berlangganan, dan kami siapkan aplikasi makanan bermerek kamu dalam 24 jam. Kamu dapat link untuk dibagikan ke pelanggan.' },
      { q: 'Apakah perlu keahlian teknis?', a: 'Tidak! Semuanya dikelola melalui dashboard sederhana. Kalau bisa pakai WhatsApp, bisa kelola aplikasi.' },
      { q: 'Bisa batal kapan saja?', a: 'Ya. Tanpa kontrak, tanpa ikatan. Batalkan kapan saja dari dashboard.' },
      { q: 'Bagaimana pelanggan memesan?', a: 'Pelanggan buka link aplikasi kamu, jelajahi menu, dan checkout via WhatsApp atau pembayaran langsung.' },
      { q: 'Apakah ada komisi dari pesanan?', a: 'Tidak pernah. Kamu simpan 100% pendapatan. Kami hanya mengenakan biaya langganan bulanan.' },
      { q: 'Bisa kustomisasi aplikasi?', a: 'Ya — nama brand, menu, harga, foto, dan promosi semuanya di bawah kendali kamu.' },
    ],
    termsTitle: 'Syarat & Ketentuan',
    termsLastUpdated: 'Terakhir diperbarui: 5 Mei 2026',
    termsSections: 'same',
    register: {
      title: 'Siapkan Bisnis Kamu',
      subtitle: 'Isi detail di bawah. Aplikasi kamu akan diaktifkan setelah kami konfirmasi pembayaran.',
      businessName: 'Nama Bisnis',
      businessNamePlaceholder: 'contoh: Warung Sari Rasa',
      urlLabel: 'Pilih URL Kamu',
      urlPrefix: 'streetlocal.live/',
      urlPlaceholder: 'nama-bisnis-kamu',
      whatsapp: 'Nomor WhatsApp',
      whatsappPlaceholder: '+62 812 3456 7890',
      email: 'Alamat Email',
      emailPlaceholder: 'kamu@email.com',
      submitBtn: 'Kirim Pendaftaran',
      pendingTitle: 'Pendaftaran Terkirim!',
      pendingMsg: 'Kami sedang memverifikasi pembayaran kamu. Kamu akan menerima pesan WhatsApp setelah aplikasi diaktifkan.',
      backHome: 'Kembali ke Beranda',
    },
    ourApps: 'Mulai Rp 38.000/Bulan',
    comingSoon: 'Segera Hadir',
    back: '← Kembali',
    viewDetails: 'Lihat Detail →',
    features: 'Fitur',
    openApp: 'Coba Demo Gratis',
    subscribe: 'Berlangganan',
    footer: 'Street Local © 2026',
    apps: '{count} software →',
    perMonth: '/bulan',
    perYear: '/tahun',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
    payment: {
      title: 'Berlangganan',
      transferTo: 'Transfer ke',
      bankName: 'Bank BCA',
      accountNumber: 'XXXX-XXXX-XXXX',
      accountHolder: 'Nama Pemilik Rekening',
      copyAccount: 'Salin Nomor Rekening',
      copied: 'Tersalin!',
      uploadTitle: 'Upload Bukti Pembayaran',
      uploadBtn: 'Ketuk untuk upload screenshot',
      changeImage: 'Ganti gambar',
      confirmPayment: 'Konfirmasi Pembayaran',
      close: 'Tutup',
    },
    tabDetails: 'Detail Aplikasi',
    tabBenefits: 'Kenapa Aplikasi Sendiri?',
    benefitsIntro: 'Sebagai pemilik usaha makanan, punya aplikasi sendiri bukan lagi kemewahan — ini langkah strategis yang cerdas.',
    benefitsBody: 'Selama bertahun-tahun, platform pesan antar makanan terus menaikkan komisi mereka, memotong lebih dalam ke keuntungan kamu. Sementara itu, restoran kamu tenggelam di antara ratusan kompetitor, semua bersaing untuk perhatian pelanggan yang terbatas.\n\nDengan Street Local, kamu akhirnya bisa tampil beda dengan membangun basis pelanggan langsung. Bayangkan pelanggan punya aplikasi restoran kamu di HP mereka — cuma satu ketukan untuk pesan. Tanpa gangguan, tanpa daftar kompetitor. Hanya brand kamu, menu kamu, dan pengalaman kamu.\n\nPemesanan jadi mulus, dengan checkout langsung ke WhatsApp kamu, komunikasi jadi cepat dan personal.\n\nAplikasi restoran dengan cepat menjadi salah satu alat paling kuat untuk menghasilkan pendapatan konsisten — dan ini peluang yang sudah dilewatkan banyak pemilik restoran selama bertahun-tahun.',
    benefitsWithApp: 'Dengan aplikasi sendiri, kamu bisa:',
    benefitsClosing: 'Punya aplikasi sendiri berarti memiliki hubungan pelanggan, data, dan pertumbuhan kamu. Kamu tidak lagi menyewa tempat di platform orang lain — kamu membangun ekosistem sendiri di mana brand kamu yang utama.',
    benefitGroups: [
      {
        icon: '💰',
        title: 'Simpan Lebih Banyak Uang',
        points: [
          'Tanpa komisi — simpan 100% pendapatan kamu',
          'Dibayar langsung, tanpa menunggu berhari-hari',
          'Tanpa biaya platform yang memotong keuntungan',
        ],
      },
      {
        icon: '📱',
        title: 'Kembangkan Brand Kamu',
        points: [
          'Nama brand dan identitas kamu — bukan marketplace',
          'Bagikan aplikasi di Instagram, TikTok, Facebook & website',
          'Link langsung dari bio dan story Instagram',
          'SEO bawaan supaya pelanggan menemukan kamu online',
        ],
      },
      {
        icon: '📊',
        title: 'Miliki Bisnis Kamu',
        points: [
          'Analitik lengkap — apa yang laris, jam ramai, pelanggan setia',
          'Ulasan pelanggan ada di aplikasi KAMU, bukan di sebelah kompetitor',
          'Update menu, harga & foto langsung — tanpa persetujuan platform',
          'Notifikasi push ke HP pelanggan — gratis, tanpa biaya iklan',
        ],
      },
      {
        icon: '⚡',
        title: 'Pengalaman Pelanggan Lebih Baik',
        points: [
          'Pesan satu ketukan — tanpa gangguan atau daftar kompetitor',
          'Checkout via WhatsApp — cepat dan personal',
          'Tetap jalan meski platform lain down',
          'Bangun loyalitas nyata dan hubungan langgeng',
        ],
      },
    ],
    categories: {
      food: {
        name: 'Software Pemesanan Makanan',
        description: 'Solusi lengkap bisnis makanan',
        bannerImage: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%204,%202026,%2004_13_42%20PM.png?updatedAt=1777886075863',
        apps: {
          basic: {
            name: 'Pedagang Kaki Lima',
            tier: 'Dasar',
            price: 'Rp 38.000',
            yearlyPrice: 'Rp 456.000',
            tagline: 'Menu & pemesanan simpel untuk warung makan',
            description: 'Cocok untuk warung, kaki lima, dan kedai kecil. Tampilkan menu, terima pesanan via WhatsApp, dan kelola ketersediaan — semua dari HP.',
            features: ['Menu digital dengan foto', 'Pemesanan WhatsApp', 'Toggle Buka/Tutup', 'Halaman lokasi & jam buka', 'Berbagi kode QR'],
          },
          pro: {
            name: 'Restoran',
            tier: 'Pro',
            price: 'Rp 100.000',
            yearlyPrice: 'Rp 1.200.000',
            tagline: 'Brand kamu. Menu kamu. Promosi tanpa batas.',
            description: 'Tampilkan restoran kamu di depan dengan software pemesanan bermerek sendiri. Menu lengkap dengan estimasi tarif pengiriman motor yang bisa disesuaikan untuk pasar mana saja. Atur jam buka, tampilkan promo harian dan penawaran diskon untuk menarik pelanggan. Tampilkan kapasitas tempat duduk, musik live, tempat hiburan, dan layanan katering luar. Promosikan acara mingguan, tampilkan hiburan live, dan jalankan kampanye diskon tanpa batas — semua di bawah nama brand kamu.',
            features: ['Nama restoran bermerek sendiri', 'Menu lengkap dengan estimasi km pengiriman', 'Promo harian & penawaran diskon', 'Kampanye diskon pelanggan', 'Tampilan tempat duduk & venue', 'Daftar musik live & hiburan', 'Promosi katering luar', 'Tampilan acara mingguan', 'Manajemen jam buka', 'Tarif pengiriman motor yang bisa diatur'],
          },
        },
      },
    },
  },
}

/* ─── IP-based locale detection ─── */
function useLocale() {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('sl_locale') || 'en'
  })
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    // Only auto-detect if user hasn't manually chosen
    if (localStorage.getItem('sl_locale')) return
    async function detectLocale() {
      try {
        const res = await fetch('https://ip2c.org/s')
        const text = await res.text()
        const parts = text.split(';')
        const countryCode = parts[1]
        const detectedLang = COUNTRY_TO_LANG[countryCode] || 'en'
        setLocale(detectedLang)
      } catch {
        // fallback to English
      }
      setDetected(true)
    }
    detectLocale()
  }, [])

  const setLocaleAndSave = (l) => {
    localStorage.setItem('sl_locale', l)
    setLocale(l)
  }

  return [locale, setLocaleAndSave]
}

/* ─── Build localized categories from translations ─── */
function getCategories(t, cp) {
  return [
    {
      id: 'food',
      name: t.foodCategory || 'Food Ordering Software',
      icon: '🍜',
      description: t.foodCategoryDesc || 'Complete food business solutions',
      bannerImage: (t.categories?.food?.bannerImage) || 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%204,%202026,%2004_17_25%20PM.png?updatedAt=1777886267229',
      apps: [
        {
          id: 'basic',
          name: t.basicName || 'Street Vendor',
          tier: t.basicTier || 'Software 1',
          price: cp ? `${cp.currency_symbol} ${cp.basic_monthly.toLocaleString()}` : 'Rp 38.000',
          yearlyPrice: cp ? `${cp.currency_symbol} ${cp.basic_yearly.toLocaleString()}` : 'Rp 456.000',
          tagline: t.basicTagline || 'Simple menu & ordering for street food stalls',
          description: t.basicDesc || '',
          features: t.basicFeatures || ['Digital menu with photos', 'WhatsApp ordering', 'Open/Close toggle', 'Location & hours page', 'QR code sharing'],
          screenshots: [
            'https://ik.imagekit.io/nepgaxllc/Untitleddssaaa.png',
            'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%204,%202026,%2004_17_25%20PM.png?updatedAt=1777886267229',
            'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%204,%202026,%2004_13_42%20PM.png?updatedAt=1777886075863',
          ],
          url: '/food/basic/',
          color: '#FF6B35',
        },
        {
          id: 'pro',
          name: t.proName || 'Restaurant',
          tier: t.proTier || 'Software 2',
          price: cp ? `${cp.currency_symbol} ${cp.pro_monthly.toLocaleString()}` : 'Rp 100.000',
          yearlyPrice: cp ? `${cp.currency_symbol} ${cp.pro_yearly.toLocaleString()}` : 'Rp 1.200.000',
          tagline: t.proTagline || 'Your brand. Your menu. Unlimited promotion.',
          description: t.proDesc || '',
          features: t.proFeatures || [],
          screenshots: [
            'https://ik.imagekit.io/nepgaxllc/Untitledfsdfsdfsssss.png',
            'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%205,%202026,%2012_24_25%20PM.png',
            'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%204,%202026,%2004_17_25%20PM.png?updatedAt=1777886267229',
          ],
          url: '/food/pro/',
          color: '#FFD600',
        },
      ],
    },
  ]
}

/* ─── iPhone Mockup Component ─── */
function PhoneMockup({ screenshot, color, small }) {
  const w = small ? 180 : 280
  const h = small ? 360 : 560
  const r = small ? 28 : 44
  const sr = small ? 26 : 40
  const p = small ? 3 : 4
  const diW = small ? 46 : 72
  const diH = small ? 14 : 22
  const diTop = small ? 6 : 10
  const hiW = small ? 50 : 80
  const hiH = small ? 3 : 4
  const hiBot = small ? 4 : 6

  return (
    <div style={{
      width: w,
      height: h,
      borderRadius: r,
      background: '#1a1a1a',
      padding: p,
      position: 'relative',
      boxShadow: `0 20px 60px ${color}22, 0 8px 24px rgba(0,0,0,0.15)`,
      border: '2px solid #333',
    }}>
      {/* Side button — right */}
      <div style={{
        position: 'absolute', right: -3, top: small ? 75 : 120,
        width: 3, height: small ? 26 : 40, borderRadius: '0 2px 2px 0',
        background: '#333',
      }} />
      {/* Volume buttons — left */}
      <div style={{
        position: 'absolute', left: -3, top: small ? 62 : 100,
        width: 3, height: small ? 16 : 24, borderRadius: '2px 0 0 2px',
        background: '#333',
      }} />
      <div style={{
        position: 'absolute', left: -3, top: small ? 82 : 132,
        width: 3, height: small ? 16 : 24, borderRadius: '2px 0 0 2px',
        background: '#333',
      }} />
      {/* Screen */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: sr,
        background: screenshot ? '#000' : `linear-gradient(135deg, ${color}15, ${color}05)`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute',
          top: diTop,
          left: '50%',
          transform: 'translateX(-50%)',
          width: diW,
          height: diH,
          background: '#000',
          borderRadius: 20,
          zIndex: 3,
        }} />
        {screenshot ? (
          <img src={screenshot} alt="App screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        ) : (
          <span style={{ fontSize: small ? 32 : 48, opacity: 0.3 }}>📱</span>
        )}
        {/* Home indicator */}
        <div style={{
          position: 'absolute',
          bottom: hiBot,
          left: '50%',
          transform: 'translateX(-50%)',
          width: hiW,
          height: hiH,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.3)',
          zIndex: 3,
        }} />
      </div>
    </div>
  )
}

/* ─── Animated Section ─── */
/* ─── 3D Phone Carousel ─── */
function Phone3DCarousel({ screenshots, color }) {
  const [active, setActive] = useState(0)
  const touchStart = useRef(0)

  if (!screenshots || screenshots.length === 0) return null
  if (screenshots.length === 1) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
      <PhoneMockup screenshot={screenshots[0]} color={color} small />
    </div>
  )

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (diff > 40) setActive(a => Math.min(screenshots.length - 1, a + 1))
    if (diff < -40) setActive(a => Math.max(0, a - 1))
  }

  return (
    <div
      style={{ perspective: 800, position: 'relative', height: 380, overflow: 'hidden', margin: '0 auto', maxWidth: 400 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {screenshots.map((src, i) => {
          const offset = i - active
          const isActive = offset === 0
          const isPrev = offset < 0
          const isNext = offset > 0
          const absOff = Math.abs(offset)

          if (absOff > 2) return null

          const translateX = offset * 100
          const translateZ = isActive ? 0 : -120 * absOff
          const rotateY = offset * -22
          const scale = isActive ? 1 : Math.max(0.45, 1 - absOff * 0.3)
          const opacity = isActive ? 1 : Math.max(0.25, 1 - absOff * 0.4)
          const zIndex = 10 - absOff

          return (
            <div
              key={i}
              onClick={() => setActive(i)}
              style={{
                position: 'absolute',
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                transition: 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
                cursor: isActive ? 'default' : 'pointer',
                filter: isActive ? 'none' : 'brightness(0.7)',
              }}
            >
              <PhoneMockup screenshot={src} color={color} small />
            </div>
          )
        })}
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: -10, position: 'relative', zIndex: 20 }}>
        {screenshots.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              width: i === active ? 20 : 8,
              height: 8,
              borderRadius: 4,
              border: 'none',
              background: i === active ? color : '#ddd',
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Language Switcher ─── */
function LangSwitcher({ locale, setLocale }) {
  const [open, setOpen] = useState(false)
  const langs = [
    { code: 'en', flag: '🇬🇧', label: 'EN' },
    { code: 'id', flag: '🇮🇩', label: 'ID' },
    { code: 'ms', flag: '🇲🇾', label: 'MY' },
    { code: 'vi', flag: '🇻🇳', label: 'VN' },
    { code: 'th', flag: '🇹🇭', label: 'TH' },
    { code: 'fr', flag: '🇫🇷', label: 'FR' },
    { code: 'de', flag: '🇩🇪', label: 'DE' },
    { code: 'es', flag: '🇪🇸', label: 'ES' },
    { code: 'zh', flag: '🇨🇳', label: 'CN' },
    { code: 'ar', flag: '🇸🇦', label: 'AR' },
  ]
  const current = langs.find(l => l.code === locale) || langs[0]
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ ...styles.langBtn, ...styles.langBtnActive, display: 'flex', alignItems: 'center', gap: 4 }}>
        {current.flag} {current.label}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 999, minWidth: 120, overflow: 'hidden' }}>
            {langs.map(l => (
              <button key={l.code} onClick={() => { setLocale(l.code); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: locale === l.code ? '#f0f0f0' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: locale === l.code ? 800 : 500, color: '#1a1a1a', textAlign: 'left' }}>
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Main App ─── */
export default function App() {
  const [selectedApp, setSelectedApp] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [locale, setLocale] = useLocale()
  const [detailTab, setDetailTab] = useState('details')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentProof, setPaymentProof] = useState(null)
  const [copied, setCopied] = useState(false)
  const [currentPage, setCurrentPage] = useState(null)
  const [regForm, setRegForm] = useState({ name: '', url: '', whatsapp: '', email: '' })
  const [regSubmitted, setRegSubmitted] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [userAccount, setUserAccount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sl_user_account')) || null } catch { return null }
  })
  const [signupOpen, setSignupOpen] = useState(false)
  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', country: '', businessName: '' })
  const [signupError, setSignupError] = useState('')
  const [signupAction, setSignupAction] = useState(null) // 'demo' or 'subscribe'
  const [slugCheck, setSlugCheck] = useState(null) // null | 'checking' | 'available' | 'taken'
  const VENDOR_COUNTRIES = [
    { code: 'ID', flag: '🇮🇩', name: 'Indonesia', prefix: '+62' },
    { code: 'MY', flag: '🇲🇾', name: 'Malaysia', prefix: '+60' },
    { code: 'SG', flag: '🇸🇬', name: 'Singapore', prefix: '+65' },
    { code: 'TH', flag: '🇹🇭', name: 'Thailand', prefix: '+66' },
    { code: 'VN', flag: '🇻🇳', name: 'Vietnam', prefix: '+84' },
    { code: 'PH', flag: '🇵🇭', name: 'Philippines', prefix: '+63' },
    { code: 'IN', flag: '🇮🇳', name: 'India', prefix: '+91' },
    { code: 'AU', flag: '🇦🇺', name: 'Australia', prefix: '+61' },
    { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', prefix: '+44' },
    { code: 'US', flag: '🇺🇸', name: 'United States', prefix: '+1' },
    { code: 'AE', flag: '🇦🇪', name: 'UAE', prefix: '+971' },
    { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia', prefix: '+966' },
    { code: 'JP', flag: '🇯🇵', name: 'Japan', prefix: '+81' },
    { code: 'KR', flag: '🇰🇷', name: 'South Korea', prefix: '+82' },
    { code: 'DE', flag: '🇩🇪', name: 'Germany', prefix: '+49' },
    { code: 'FR', flag: '🇫🇷', name: 'France', prefix: '+33' },
  ]
  const [vendorAuthOpen, setVendorAuthOpen] = useState(false)
  const [vendorAuthMode, setVendorAuthMode] = useState('login') // 'login' or 'signup'
  const [vendorAuthForm, setVendorAuthForm] = useState({ phone: '', password: '', name: '', category: '', country: detectedCountry || '', city: '' })
  const [vendorAuthError, setVendorAuthError] = useState('')
  const [vendorAuthApp, setVendorAuthApp] = useState(null) // which app they're signing into
  const [slugValue, setSlugValue] = useState('')
  const [showNameHelp, setShowNameHelp] = useState(false)
  const slugTimer = useRef(null)
  const [countryPricing, setCountryPricing] = useState(null)
  const [detectedCountry, setDetectedCountry] = useState(null)

  // Detect country from IP for pricing (before account creation)
  useEffect(() => {
    if (countryPricing) return
    async function detectPricing() {
      try {
        const res = await fetch('https://ip2c.org/s')
        const text = await res.text()
        const country = text.split(';')[1]
        setDetectedCountry(country)
        const { data } = await supabase.from('country_pricing').select('*').eq('id', country).single()
        if (data) setCountryPricing(data)
      } catch {}
    }
    detectPricing()
  }, [])

  // Update pricing when user creates account with specific country
  useEffect(() => {
    const country = userAccount?.country_code
    if (!country) return
    supabase.from('country_pricing').select('*').eq('id', country).single().then(({ data }) => {
      if (data) setCountryPricing(data)
    })
  }, [userAccount?.country_code])
  const [adminAuth, setAdminAuth] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [adminFilter, setAdminFilter] = useState('all')

  // Build translations: JSON file for UI strings, inline for category content
  const jsonT = getTranslation(locale)
  const inlineT = TRANSLATIONS[locale] || TRANSLATIONS.en
  // JSON translations override inline for shared keys, but inline keeps category-specific content
  const t = {}
  // Copy all inline keys first (categories, about, FAQ, T&C, benefits, register, etc)
  Object.keys(inlineT).forEach(k => { t[k] = inlineT[k] })
  // Override with JSON translations (UI strings like heroSub, buttons, signup, steps, payment)
  Object.keys(jsonT).forEach(k => {
    if (typeof jsonT[k] === 'object' && jsonT[k] !== null && !Array.isArray(jsonT[k]) && t[k] && typeof t[k] === 'object') {
      t[k] = { ...t[k], ...jsonT[k] }
    } else {
      t[k] = jsonT[k]
    }
  })
  const CATEGORIES = getCategories(t, countryPricing)

  /* Detail page for an app */
  if (selectedApp && !vendorAuthOpen) {
    return (
      <div style={styles.page}>
        <div style={styles.detailHeader}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal</div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddddvv-removebg-preview.png" alt="Home" style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>

        {/* Hero: 3D phone carousel */}
        <Phone3DCarousel screenshots={selectedApp.screenshots} color={selectedApp.color} />

        <div style={styles.detailContent}>
          <img
            src={selectedApp.id === 'basic' ? 'https://ik.imagekit.io/nepgaxllc/eeeee-removebg-preview.png' : 'https://ik.imagekit.io/nepgaxllc/eeeeevvv-removebg-preview.png'}
            alt={selectedApp.tier}
            style={{ width: 100, height: 100, objectFit: 'contain' }}
          />
          <h1 style={styles.detailTitle}>{selectedApp.name}</h1>
          {/* Billing toggle */}
          <div style={{ ...styles.detailToggle, marginBottom: 10, marginTop: 10 }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{ ...styles.detailToggleBtn, ...(billingCycle === 'monthly' ? { background: '#1a1a1a', color: '#FFD600' } : {}) }}
            >
              {t.monthly}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{ ...styles.detailToggleBtn, ...(billingCycle === 'yearly' ? { background: '#1a1a1a', color: '#FFD600' } : {}) }}
            >
              {t.yearly}
            </button>
          </div>
          <p style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 4px' }}>
            {billingCycle === 'monthly' ? selectedApp.price : selectedApp.yearlyPrice}
            <span style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>{billingCycle === 'monthly' ? t.perMonth : t.perYear}</span>
          </p>
          <p style={styles.detailTagline}>{selectedApp.tagline}</p>

          {/* Toggle tabs */}
          <div style={styles.detailToggle}>
            <button
              onClick={() => setDetailTab('details')}
              style={{
                ...styles.detailToggleBtn,
                ...(detailTab === 'details' ? { background: selectedApp.color, color: '#fff' } : {}),
              }}
            >
              {t.tabDetails}
            </button>
            <button
              onClick={() => setDetailTab('benefits')}
              style={{
                ...styles.detailToggleBtn,
                ...(detailTab === 'benefits' ? { background: selectedApp.color, color: '#fff' } : {}),
              }}
            >
              {t.tabBenefits}
            </button>
          </div>

          {/* Tab content: Details */}
          {detailTab === 'details' && (
            <>
              <p style={styles.detailDesc}>{selectedApp.description}</p>

              <h3 style={styles.featuresTitle}>{t.features}</h3>
              <ul style={styles.featuresList}>
                {selectedApp.features.map((f, i) => (
                  <li key={i} style={styles.featureItem}>
                    <span style={{ ...styles.featureCheck, background: '#22c55e', color: '#fff' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {false && selectedApp.screenshots.length > 1 && (
                <div style={styles.screenshotRow}>
                  {selectedApp.screenshots.map((s, i) => (
                    <div key={i} style={styles.screenshotThumb}>
                      <img src={s} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tab content: Benefits */}
          {detailTab === 'benefits' && (
            <div>
              {/* Intro */}
              <p style={styles.benefitsIntro}>{t.benefitsIntro}</p>

              {/* Body paragraphs */}
              {t.benefitsBody.split('\n\n').map((para, i) => (
                <p key={i} style={styles.benefitsBodyText}>{para}</p>
              ))}

              {/* "With your own app" header */}
              <h3 style={styles.benefitsWithApp}>{t.benefitsWithApp}</h3>

              {/* Benefit groups */}
              <div style={styles.benefitsGrid}>
                {(t.benefitGroupTitles || ['Keep More Money', 'Grow Your Brand', 'Own Your Business', 'Better Customer Experience']).map((title, i) => {
                  const icons = ['💰', '📱', '📊', '⚡']
                  const pointsKey = `benefitGroup${i + 1}`
                  const points = t[pointsKey] || (t.benefitGroups && t.benefitGroups[i]?.points) || []
                  return (
                  <div key={i} style={styles.benefitCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={styles.benefitIcon}>{icons[i]}</span>
                      <h4 style={styles.benefitTitle}>{title}</h4>
                    </div>
                    <ul style={styles.benefitPoints}>
                      {points.map((p, j) => (
                        <li key={j} style={styles.benefitPoint}><span style={{ color: '#22c55e', marginRight: 8, fontWeight: 900 }}>&#10003;</span>{p}</li>
                      ))}
                    </ul>
                  </div>)
                })}
              </div>

              {/* Closing */}
              <p style={styles.benefitsClosing}>{t.benefitsClosing}</p>
            </div>
          )}

          {/* Registration form tab */}
          {detailTab === 'register' && !regSubmitted && (
            <FadeIn>
              <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>{t.register.title}</h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.5, marginBottom: 24 }}>{t.register.subtitle}</p>

              <label style={styles.regLabel}>{t.register.businessName}</label>
              <input
                type="text"
                value={regForm.name}
                onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                placeholder={t.register.businessNamePlaceholder}
                style={styles.regInput}
              />

              <label style={styles.regLabel}>{t.register.urlLabel}</label>
              <div style={styles.regUrlRow}>
                <span style={styles.regUrlPrefix}>{t.register.urlPrefix}</span>
                <input
                  type="text"
                  value={regForm.url}
                  onChange={e => setRegForm({ ...regForm, url: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder={t.register.urlPlaceholder}
                  style={{ ...styles.regInput, borderRadius: '0 12px 12px 0', margin: 0 }}
                />
              </div>

              <label style={styles.regLabel}>{t.register.whatsapp}</label>
              <input
                type="tel"
                value={regForm.whatsapp}
                onChange={e => setRegForm({ ...regForm, whatsapp: e.target.value })}
                placeholder={t.register.whatsappPlaceholder}
                style={styles.regInput}
              />

              <label style={styles.regLabel}>{t.register.email}</label>
              <input
                type="email"
                value={regForm.email}
                onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                placeholder={t.register.emailPlaceholder}
                style={styles.regInput}
              />

              <button
                onClick={() => {
                  if (!regForm.name || !regForm.url || !regForm.whatsapp) return
                  const phone = '6281392000050'
                  const msg = encodeURIComponent(
                    `*New Business Registration*\n\n` +
                    `Business: ${regForm.name}\n` +
                    `URL: streetlocal.live/${regForm.url}\n` +
                    `WhatsApp: ${regForm.whatsapp}\n` +
                    `Email: ${regForm.email || 'N/A'}\n` +
                    `App: ${selectedApp?.name || 'N/A'} (${selectedApp?.tier || 'N/A'})`
                  )
                  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
                  setRegSubmitted(true)
                }}
                style={{
                  ...styles.ctaButton,
                  background: regForm.name && regForm.url && regForm.whatsapp ? '#FFD600' : '#e0e0e0',
                  color: regForm.name && regForm.url && regForm.whatsapp ? '#1a1a1a' : '#999',
                  border: 'none',
                  cursor: regForm.name && regForm.url && regForm.whatsapp ? 'pointer' : 'default',
                }}
              >
                {t.register.submitBtn}
              </button>
            </FadeIn>
          )}

          {detailTab === 'register' && regSubmitted && (
            <FadeIn>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>✅</span>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>{t.register.pendingTitle}</h2>
                <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>{t.register.pendingMsg}</p>
                <button
                  onClick={() => { setSelectedApp(null); setCurrentPage(null); setRegSubmitted(false); setRegForm({ name: '', url: '', whatsapp: '', email: '' }); setDetailTab('details') }}
                  style={{ ...styles.ctaButton, background: '#1a1a1a', color: '#fff', border: 'none' }}
                >
                  {t.register.backHome}
                </button>
              </div>
            </FadeIn>
          )}

          {selectedApp.url && detailTab !== 'register' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Try Demo */}
              {userAccount ? (
                <a
                  href={window.location.port === '5173' ? (selectedApp.id === 'basic' ? 'http://localhost:5176/' : 'http://localhost:5174/food/pro/') : selectedApp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...styles.ctaButton, background: 'transparent', color: selectedApp.color, border: `2px solid ${selectedApp.color}` }}
                >
                  {t.openApp}
                </a>
              ) : (
                <button
                  onClick={() => { setSignupAction('demo'); setSignupOpen(true) }}
                  style={{ ...styles.ctaButton, background: 'transparent', color: selectedApp.color, border: `2px solid ${selectedApp.color}` }}
                >
                  {t.openApp}
                </button>
              )}
              {/* Subscribe */}
              <button
                onClick={() => {
                  if (!userAccount) { setSignupAction('subscribe'); setSignupOpen(true) }
                  else { setPaymentOpen(true); setPaymentProof(null); setCopied(false) }
                }}
                style={{ ...styles.ctaButton, background: '#FFD600', color: '#1a1a1a', border: 'none' }}
              >
                {t.subscribe} — {billingCycle === 'monthly' ? selectedApp.price + t.perMonth : selectedApp.yearlyPrice + t.perYear}
              </button>

              {/* Vendor Sign In */}
              <button
                onClick={() => { setVendorAuthOpen(true); setVendorAuthApp(selectedApp); setVendorAuthMode('login'); setVendorAuthError('') }}
                style={{ ...styles.ctaButton, background: 'none', color: '#888', border: '1px solid #ddd', fontSize: 13 }}
              >
                Already subscribed? Sign In to Manage
              </button>

              {/* How It Works — Steps */}
              <div style={{ marginTop: 20, padding: 16, background: '#f8f9fa', borderRadius: 16, border: '1px solid #f0f0f0' }}>
                <h4 style={{ fontSize: 15, fontWeight: 900, marginBottom: 4, textAlign: 'center' }}>{t.steps.title}</h4>
                <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 14, lineHeight: 1.5 }}>
                  {t.steps.subtitle}
                </p>
                {[
                  { step: '1', icon: '👤', title: t.steps.step1, desc: t.steps.step1desc },
                  { step: '2', icon: '📦', title: t.steps.step2, desc: t.steps.step2desc },
                  { step: '3', icon: '💳', title: t.steps.step3, desc: t.steps.step3desc },
                  { step: '4', icon: '🍽️', title: t.steps.step4, desc: t.steps.step4desc },
                  { step: '5', icon: '🔗', title: t.steps.step5, desc: t.steps.step5desc },
                  { step: '6', icon: '🚀', title: t.steps.step6, desc: t.steps.step6desc },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: 'center', marginTop: 8, padding: '10px 14px', background: '#1a1a1a', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#FFD600', margin: 0 }}>
                    {t.steps.commission}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...styles.ctaButton, background: '#e0e0e0', color: '#999', cursor: 'default' }}>
              {t.comingSoon}
            </div>
          )}

          {/* Signup Popup */}
          {signupOpen && (
            <div style={styles.paymentOverlay} onClick={() => setSignupOpen(false)}>
              <div style={{ ...styles.paymentSheet, borderTop: '4px solid #FFD600', backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2004_47_24%20PM.png?updatedAt=1777542461928)', backgroundSize: 'cover', backgroundPosition: 'center' }} onClick={e => e.stopPropagation()}>
                <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.4)', borderRadius: 2, margin: '10px auto 16px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>Create Your Account</h3>
                  <button onClick={() => setSignupOpen(false)} style={styles.paymentClose}>&times;</button>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20, lineHeight: 1.5, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
                  {signupAction === 'demo' ? 'Create a free account to try the demo.' : 'Create your account to subscribe.'}
                </p>

                {signupError && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12, fontWeight: 700, background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: 8 }}>{signupError}</p>}

                <label style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 4, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Your Full Name</label>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                  <input type="text" value={signupForm.name} onChange={e => setSignupForm({ ...signupForm, name: e.target.value })} placeholder="Enter your full name" style={{ width: '100%', background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 500, outline: 'none', padding: 0, fontFamily: 'inherit' }} />
                </div>

                {/* Business / Trading Name with slug check */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Business / Trading Name</label>
                  <button onClick={() => setShowNameHelp(true)} style={{ background: 'none', border: 'none', color: '#FFD600', fontSize: 14, cursor: 'pointer', padding: 0 }}>ⓘ</button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${slugCheck === 'taken' ? 'rgba(239,68,68,0.5)' : slugCheck === 'available' ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '10px 14px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="text"
                      value={signupForm.businessName}
                      onChange={e => {
                        const val = e.target.value
                        setSignupForm({ ...signupForm, businessName: val })
                        const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
                        setSlugValue(slug)
                        setSlugCheck(slug ? 'checking' : null)
                        clearTimeout(slugTimer.current)
                        if (slug) {
                          slugTimer.current = setTimeout(async () => {
                            try {
                              const { data, error } = await supabase.from('user_accounts').select('id').eq('slug', slug).maybeSingle()
                              if (error) { console.warn('Slug check error:', error); setSlugCheck('available') }
                              else { setSlugCheck(data ? 'taken' : 'available') }
                            } catch (e) { console.warn('Slug check network error:', e); setSlugCheck('available') }
                          }, 500)
                        }
                      }}
                      placeholder="e.g. Warung Sari Rasa"
                      style={{ width: '100%', background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 500, outline: 'none', padding: 0, fontFamily: 'inherit', flex: 1 }}
                    />
                    {slugCheck === 'checking' && <span style={{ fontSize: 14, flexShrink: 0 }}>⏳</span>}
                    {slugCheck === 'available' && <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>}
                    {slugCheck === 'taken' && <span style={{ fontSize: 14, flexShrink: 0 }}>❌</span>}
                  </div>
                </div>
                {/* URL Preview */}
                {slugValue && (
                  <div style={{ padding: '6px 14px', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>streetlocal.live/</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: slugCheck === 'taken' ? '#EF4444' : slugCheck === 'available' ? '#22c55e' : '#FFD600' }}>{slugValue}</span>
                    {slugCheck === 'taken' && <span style={{ fontSize: 10, color: '#EF4444', marginLeft: 8 }}>{t.signup.nameTaken}</span>}
                  </div>
                )}
                {!slugValue && <div style={{ height: 8 }} />}
                {/* Warning */}
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 12, paddingLeft: 14, lineHeight: 1.4 }}>
                  ⚠️ {t.signup.nameWarning}
                </p>

                {/* Help popup */}
                {showNameHelp && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowNameHelp(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 24, maxWidth: 340, width: '100%' }} onClick={e => e.stopPropagation()}>
                      <h4 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>{t.signup.helpTitle}</h4>
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 10 }}>
                        {t.signup.helpBody}
                      </p>
                      <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 700, lineHeight: 1.6, marginBottom: 14 }}>
                        ⚠️ {t.signup.helpWarning}
                      </p>
                      <button onClick={() => setShowNameHelp(false)} style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                        {t.signup.helpGotIt}
                      </button>
                    </div>
                  </div>
                )}

                <label style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 4, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Email Address</label>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                  <input type="email" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} placeholder="you@email.com" style={{ width: '100%', background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 500, outline: 'none', padding: 0, fontFamily: 'inherit' }} />
                </div>

                <label style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 4, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Country</label>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 2 }}>Country</label>
                  <select value={signupForm.country} onChange={e => setSignupForm({ ...signupForm, country: e.target.value })} style={{ width: '100%', background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 500, outline: 'none', padding: 0, fontFamily: 'inherit', appearance: 'auto' }}>
                  <option value="">Select your country</option>
                  <option value="ID">🇮🇩 Indonesia</option>
                  <option value="MY">🇲🇾 Malaysia</option>
                  <option value="SG">🇸🇬 Singapore</option>
                  <option value="TH">🇹🇭 Thailand</option>
                  <option value="PH">🇵🇭 Philippines</option>
                  <option value="VN">🇻🇳 Vietnam</option>
                  <option value="AU">🇦🇺 Australia</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="AE">🇦🇪 UAE</option>
                  <option value="SA">🇸🇦 Saudi Arabia</option>
                  <option value="IN">🇮🇳 India</option>
                  <option value="JP">🇯🇵 Japan</option>
                  <option value="KR">🇰🇷 South Korea</option>
                  <option value="CN">🇨🇳 China</option>
                  <option value="NL">🇳🇱 Netherlands</option>
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="FR">🇫🇷 France</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="NZ">🇳🇿 New Zealand</option>
                  <option value="OTHER">🌍 Other</option>
                </select>
                </div>

                <label style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'block', marginBottom: 4, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Phone / WhatsApp</label>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                  <input type="tel" value={signupForm.phone} onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })} placeholder="+62 812 3456 7890" style={{ width: '100%', background: 'none', border: 'none', color: '#fff', fontSize: 15, fontWeight: 500, outline: 'none', padding: 0, fontFamily: 'inherit' }} />
                </div>

                <button
                  onClick={async () => {
                    if (!signupForm.name || !signupForm.email || !signupForm.phone || !signupForm.country || !signupForm.businessName) {
                      setSignupError(t.signup.fillAll)
                      return
                    }
                    if (!slugValue) {
                      setSignupError(t.signup.enterName)
                      return
                    }
                    if (slugCheck === 'taken') {
                      setSignupError(t.signup.nameTaken)
                      return
                    }
                    if (slugCheck === 'checking') {
                      setSignupError(t.signup.checking)
                      return
                    }
                    setSignupError('')
                    const countryNames = { ID: 'Indonesia', MY: 'Malaysia', SG: 'Singapore', TH: 'Thailand', PH: 'Philippines', VN: 'Vietnam', AU: 'Australia', GB: 'United Kingdom', US: 'United States', AE: 'UAE', SA: 'Saudi Arabia', IN: 'India', JP: 'Japan', KR: 'South Korea', CN: 'China', NL: 'Netherlands', DE: 'Germany', FR: 'France', CA: 'Canada', NZ: 'New Zealand', OTHER: 'Other' }
                    const account = {
                      name: signupForm.name,
                      email: signupForm.email,
                      phone: signupForm.phone,
                      country_code: signupForm.country,
                      country_name: countryNames[signupForm.country] || signupForm.country,
                      business_name: signupForm.businessName,
                      slug: slugValue,
                    }
                    // Save to Supabase — try insert first, then update if exists
                    try {
                      // Check if email already exists
                      const { data: existing } = await supabase.from('user_accounts').select('id').eq('email', signupForm.email).maybeSingle()
                      let saveError = null
                      if (existing) {
                        // Update existing account
                        const { error } = await supabase.from('user_accounts').update({
                          name: account.name,
                          phone: account.phone,
                          country_code: account.country_code,
                          country_name: account.country_name,
                          business_name: account.business_name,
                          slug: account.slug,
                        }).eq('id', existing.id)
                        saveError = error
                      } else {
                        // Insert new account
                        const { error } = await supabase.from('user_accounts').insert(account)
                        saveError = error
                      }
                      if (saveError) {
                        console.error('Account save error:', saveError)
                        if (saveError.message?.includes('slug') || saveError.message?.includes('unique')) {
                          setSignupError(t.signup.nameTaken)
                        } else if (saveError.message?.includes('email')) {
                          setSignupError(t.signup.emailExists)
                        } else {
                          setSignupError(t.signup.saveFailed)
                        }
                        return
                      }
                    } catch (err) {
                      console.error('Network error:', err)
                      setSignupError(t.signup.connectionFailed)
                      return
                    }
                    // Save locally
                    localStorage.setItem('sl_user_account', JSON.stringify(account))
                    setUserAccount(account)
                    setSignupOpen(false)
                    // Perform the action they wanted
                    if (signupAction === 'demo') {
                      const demoUrl = window.location.port === '5173'
                        ? (selectedApp.id === 'basic' ? 'http://localhost:5176/' : 'http://localhost:5174/food/pro/')
                        : selectedApp.url
                      window.open(demoUrl, '_blank')
                    } else if (signupAction === 'subscribe') {
                      setPaymentOpen(true)
                      setPaymentProof(null)
                      setCopied(false)
                    }
                  }}
                  style={{
                    ...styles.ctaButton,
                    background: signupForm.name && signupForm.email && signupForm.phone && signupForm.country && signupForm.businessName && slugCheck === 'available' ? '#FFD600' : '#e0e0e0',
                    color: signupForm.name && signupForm.email && signupForm.phone && signupForm.country && signupForm.businessName && slugCheck === 'available' ? '#1a1a1a' : '#999',
                    border: 'none',
                  }}
                >
                  {signupAction === 'demo' ? 'Create Account & Try Demo' : 'Create Account & Subscribe'}
                </button>
              </div>
            </div>
          )}

          {/* Payment Sheet */}

          {paymentOpen && (
            <div style={styles.paymentOverlay} onClick={() => setPaymentOpen(false)}>
              <div style={styles.paymentSheet} onClick={e => e.stopPropagation()}>
                {/* Handle bar */}
                <div style={styles.paymentHandle} />
                {/* Header */}
                <div style={styles.paymentHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src="https://ik.imagekit.io/nepgaxllc/mmmass-removebg-preview.png?updatedAt=1777002478628" alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    <h3 style={styles.paymentTitle}>{t.payment.title} {selectedApp.name}</h3>
                  </div>
                  <button onClick={() => setPaymentOpen(false)} style={styles.paymentClose}>&times;</button>
                </div>

                <p style={styles.paymentPrice}>
                  {billingCycle === 'monthly' ? selectedApp.price : selectedApp.yearlyPrice}
                  <span style={{ fontSize: 14, color: '#888' }}>{billingCycle === 'monthly' ? t.perMonth : t.perYear}</span>
                </p>

                {/* Payment — QR code if available for country, otherwise contact */}
                {countryPricing ? (
                  <>
                    {/* QR Code — from country_pricing table */}
                    {(() => {
                      const qrKey = selectedApp.id === 'pro'
                        ? (billingCycle === 'monthly' ? 'pro_qr_monthly' : 'pro_qr_yearly')
                        : (billingCycle === 'monthly' ? 'basic_qr_monthly' : 'basic_qr_yearly')
                      const qrUrl = countryPricing[qrKey]
                      // Fallback to Indonesia QR codes if no country-specific QR
                      const fallbackQr = userAccount?.country_code === 'ID'
                        ? (selectedApp.id === 'pro' ? 'https://ik.imagekit.io/nepgaxllc/Untitleddssaaadsddsdss.png' : 'https://ik.imagekit.io/nepgaxllc/Untitleddssaaadsddsd.png')
                        : null
                      const finalQr = qrUrl || fallbackQr
                      return finalQr ? (
                        <div style={{ ...styles.paymentBank, textAlign: 'center' }}>
                          <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{t.payment?.scanToPay || 'Scan to Pay'}</p>
                          <img src={finalQr} alt="QR Code" style={{ width: '100%', maxWidth: 220, height: 'auto', borderRadius: 12, margin: '0 auto 10px', display: 'block' }} />
                          <p style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>
                            {countryPricing.currency_symbol} {billingCycle === 'monthly'
                              ? (selectedApp.id === 'pro' ? countryPricing.pro_monthly : countryPricing.basic_monthly).toLocaleString()
                              : (selectedApp.id === 'pro' ? countryPricing.pro_yearly : countryPricing.basic_yearly).toLocaleString()
                            } — {countryPricing.currency}
                          </p>
                        </div>
                      ) : (
                        <div style={{ ...styles.paymentBank, textAlign: 'center' }}>
                          <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{t.payment?.otherCountry || 'Payment for your country'}</p>
                          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 14 }}>
                            {countryPricing.currency_symbol} {billingCycle === 'monthly'
                              ? (selectedApp.id === 'pro' ? countryPricing.pro_monthly : countryPricing.basic_monthly).toLocaleString()
                              : (selectedApp.id === 'pro' ? countryPricing.pro_yearly : countryPricing.basic_yearly).toLocaleString()
                            } — {t.payment?.otherCountryMsg || 'Contact us via WhatsApp for payment details.'}
                          </p>
                          <a href={`https://wa.me/6281392000050?text=${encodeURIComponent(`Hi, I'd like to subscribe to ${selectedApp.name}. Country: ${countryPricing.country_name}. Price: ${countryPricing.currency_symbol} ${billingCycle === 'monthly' ? (selectedApp.id === 'pro' ? countryPricing.pro_monthly : countryPricing.basic_monthly) : (selectedApp.id === 'pro' ? countryPricing.pro_yearly : countryPricing.basic_yearly)}`)}`} target="_blank" rel="noreferrer" style={{ ...styles.ctaButton, background: '#25D366', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
                            💬 {t.payment?.contactPricing || 'Contact for Payment'}
                          </a>
                        </div>
                      )
                    })()}

                    {/* Bank fallback */}
                    <details style={{ marginBottom: 16 }}>
                      <summary style={{ fontSize: 13, fontWeight: 700, color: '#888', cursor: 'pointer', padding: '8px 0' }}>
                        Or pay via bank transfer ▾
                      </summary>
                      <div style={{ ...styles.paymentBank, marginTop: 8 }}>
                        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{t.payment.transferTo}</p>
                        <p style={{ fontSize: 16, fontWeight: 800 }}>🏦 {t.payment.bankName}</p>
                        <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1, margin: '6px 0' }}>{t.payment.accountNumber}</p>
                        <p style={{ fontSize: 14, color: '#666' }}>{t.payment.accountHolder}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(t.payment.accountNumber.replace(/-/g, ''))
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                          style={styles.paymentCopyBtn}
                        >
                          {copied ? '✓ ' + t.payment.copied : '📋 ' + t.payment.copyAccount}
                        </button>
                      </div>
                    </details>
                  </>
                ) : (
                  /* Other countries — contact for pricing */
                  <div style={{ ...styles.paymentBank, textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Payment for your country</p>
                    <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 14 }}>
                      Pricing may vary based on your location. Contact us via WhatsApp for payment details and pricing in your local currency.
                    </p>
                    <a
                      href={`https://wa.me/6281392000050?text=${encodeURIComponent(`Hi, I'd like to subscribe to ${selectedApp.name} (${selectedApp.tier}). My country: ${userAccount?.country_name || 'N/A'}. Please send me payment details.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...styles.ctaButton, background: '#25D366', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
                    >
                      💬 Contact for Pricing
                    </a>
                  </div>
                )}

                {/* Upload Proof */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t.payment.uploadTitle}</p>
                  <label style={styles.paymentUpload}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files[0]
                        if (file) setPaymentProof(file)
                      }}
                    />
                    {paymentProof ? (
                      <div style={{ textAlign: 'center' }}>
                        <img
                          src={URL.createObjectURL(paymentProof)}
                          alt="Proof"
                          style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, marginBottom: 8 }}
                        />
                        <span style={{ fontSize: 13, color: '#FFD600' }}>{t.payment.changeImage}</span>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <img src="https://ik.imagekit.io/nepgaxllc/Untitledddddccc-removebg-preview.png?updatedAt=1777894363133" alt="Upload" style={{ width: 48, height: 48, objectFit: 'contain' }} />
                        <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>{t.payment.uploadBtn}</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Confirm Payment — send to email */}
                <button
                  onClick={() => {
                    const subject = encodeURIComponent(`Payment Confirmation — ${selectedApp.name} (${selectedApp.tier})`)
                    const body = encodeURIComponent(
                      `New Subscription Payment\n\n` +
                      `Customer: ${userAccount?.name || 'N/A'}\n` +
                      `Email: ${userAccount?.email || 'N/A'}\n` +
                      `Phone: ${userAccount?.phone || 'N/A'}\n` +
                      `Country: ${userAccount?.country_name || 'N/A'}\n\n` +
                      `Software: ${selectedApp.name} (${selectedApp.tier})\n` +
                      `Plan: ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}\n` +
                      `Price: ${billingCycle === 'monthly' ? selectedApp.price + '/month' : selectedApp.yearlyPrice + '/year'}\n\n` +
                      `Payment proof screenshot attached.\n` +
                      `Please activate my account.`
                    )
                    window.open(`mailto:indootechteam@gmail.com?subject=${subject}&body=${body}`, '_blank')
                    // Close payment sheet and show registration after short delay
                    setTimeout(() => {
                      setPaymentOpen(false)
                      setRegSubmitted(false)
                      setRegForm({ name: '', url: '', whatsapp: '', email: '' })
                      setDetailTab('register')
                    }, 1000)
                  }}
                  style={{
                    ...styles.ctaButton,
                    background: '#FFD600',
                    color: '#1a1a1a',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: paymentProof ? 1 : 0.4,
                    pointerEvents: paymentProof ? 'auto' : 'none',
                  }}
                >
                  ✉️ Confirm Payment
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={styles.footer}>
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%205,%202026,%2003_03_19%20PM.png" alt="" style={styles.footerImage} />
          <p style={styles.footerText}>{t.footer}</p>
        </div>
      </div>
    )
  }

  /* Category detail — show apps in that category */
  if (selectedCategory && !vendorAuthOpen) {
    return (
      <div style={styles.page}>
        <div style={styles.detailHeader}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal</div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddddvv-removebg-preview.png" alt="Home" style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>

        {/* Hero image */}
        {selectedCategory.id === 'food' && (
          <FadeIn>
            <div style={{ textAlign: 'center', padding: '10px 20px 0' }}>
              <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%205,%202026,%2012_48_31%20PM.png" alt="Food Ordering Software" style={{ width: 180, height: 180, borderRadius: 24, objectFit: 'cover' }} />
            </div>
          </FadeIn>
        )}

        <div style={{ padding: '12px 20px 40px' }}>
          <FadeIn>
            <h1 style={{ ...styles.catTitle, justifyContent: 'center' }}>
              {selectedCategory.id !== 'food' && (
                <span style={{ fontSize: 36 }}>{selectedCategory.icon}</span>
              )}
              {selectedCategory.name}
            </h1>
            <p style={{ ...styles.catDesc, textAlign: 'center' }}>{selectedCategory.description}</p>
          </FadeIn>

          <div style={styles.appList}>
            {selectedCategory.apps.map((app, i) => (
              <FadeIn key={app.id} delay={i * 0.1}>
                <div
                  style={styles.appCard}
                  onClick={() => { setSelectedApp(app); setDetailTab('details') }}
                >
                  <div style={styles.appCardPhone}>
                    <PhoneMockup screenshot={app.screenshots[0]} color={app.color} small />
                  </div>
                  <div style={styles.appCardInfo}>
                    <img
                      src={app.id === 'basic' ? 'https://ik.imagekit.io/nepgaxllc/eeeee-removebg-preview.png' : 'https://ik.imagekit.io/nepgaxllc/eeeeevvv-removebg-preview.png'}
                      alt={app.tier}
                      style={{ width: 80, height: 80, objectFit: 'contain' }}
                    />
                    <h3 style={styles.appCardName}>{app.name}</h3>
                    <p style={styles.appCardPrice}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a' }}>{app.price}</span>
                      <span style={{ fontSize: 13, color: '#888' }}>{t.perMonth}</span>
                    </p>
                    <p style={styles.appCardTagline}>{app.tagline}</p>
                    <span style={{ ...styles.appCardBtn, color: app.color }}>
                      {t.viewDetails}
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
        <div style={styles.footer}>
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%205,%202026,%2003_03_19%20PM.png" alt="" style={styles.footerImage} />
          <p style={styles.footerText}>{t.footer}</p>
        </div>
      </div>
    )
  }

  /* ─── Admin Dashboard ─── */
  if (vendorAuthOpen) {
    return (
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: '#fff', position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {/* Background image */}
        <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%206,%202026,%2001_18_35%20AM.png?updatedAt=1778005134436" alt="" style={{ position: 'absolute', top: 30, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />

        {/* Header */}
        <div style={{ ...styles.detailHeader, position: 'relative', zIndex: 2, background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none', borderBottom: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal</div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => setVendorAuthOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="https://ik.imagekit.io/nepgaxllc/Untitleddddvv-removebg-preview.png" alt="Home" style={{ width: 42, height: 42, objectFit: 'contain' }} />
          </button>
        </div>

        {/* Form container — centered over image */}
        <div style={{ position: 'relative', zIndex: 2, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: 'calc(100vh - 70px)' }}>
          <div style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 16, padding: '20px 16px' }}>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 4 }}>
            {vendorAuthMode === 'login' ? 'Sign In' : 'Create Account'}
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 20 }}>
            {vendorAuthMode === 'login' ? 'Sign in to manage your app' : 'Create your vendor account'}
          </p>
          {vendorAuthError && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 12, fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{vendorAuthError}</p>}

          {vendorAuthMode === 'signup' && (
            <>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 4, display: 'block' }}>Business Name</label>
              <input type="text" value={vendorAuthForm.name} onChange={e => setVendorAuthForm({ ...vendorAuthForm, name: e.target.value })} placeholder="Your business name" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 4, display: 'block' }}>Country</label>
              <select value={vendorAuthForm.country} onChange={e => {
                const c = VENDOR_COUNTRIES.find(x => x.code === e.target.value)
                setVendorAuthForm({ ...vendorAuthForm, country: e.target.value, phone: c ? c.prefix : vendorAuthForm.phone })
              }} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: '#111', color: vendorAuthForm.country ? '#fff' : '#888', fontSize: 15, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', appearance: 'auto' }}>
                <option value="" style={{ background: '#111', color: '#888' }}>Select country</option>
                {VENDOR_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code} style={{ background: '#111', color: '#ccc' }}>{c.flag} {c.name} ({c.prefix})</option>
                ))}
              </select>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 4, display: 'block' }}>Food Category</label>
              <select value={vendorAuthForm.category} onChange={e => setVendorAuthForm({ ...vendorAuthForm, category: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: '#111', color: vendorAuthForm.category ? '#fff' : '#888', fontSize: 15, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', appearance: 'auto' }}>
                <option value="" style={{ background: '#111', color: '#888' }}>Select category</option>
                <option value="Indonesian Street Food" style={{ background: '#111', color: '#ccc' }}>Indonesian Street Food</option>
                <option value="Street Food" style={{ background: '#111', color: '#ccc' }}>Street Food</option>
                <option value="Asian Cuisine" style={{ background: '#111', color: '#ccc' }}>Asian Cuisine</option>
                <option value="Kebabs" style={{ background: '#111', color: '#ccc' }}>Kebabs</option>
                <option value="Burgers" style={{ background: '#111', color: '#ccc' }}>Burgers</option>
                <option value="Donuts" style={{ background: '#111', color: '#ccc' }}>Donuts</option>
                <option value="Chicken Satay" style={{ background: '#111', color: '#ccc' }}>Chicken Satay</option>
                <option value="Fresh Juice" style={{ background: '#111', color: '#ccc' }}>Fresh Juice</option>
                <option value="Fried Rice" style={{ background: '#111', color: '#ccc' }}>Fried Rice</option>
                <option value="Noodle Soup" style={{ background: '#111', color: '#ccc' }}>Noodle Soup</option>
                <option value="Meatball Soup" style={{ background: '#111', color: '#ccc' }}>Meatball Soup</option>
                <option value="Crispy Chicken" style={{ background: '#111', color: '#ccc' }}>Crispy Chicken</option>
                <option value="Coffee" style={{ background: '#111', color: '#ccc' }}>Coffee</option>
              </select>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 4, display: 'block' }}>City</label>
              <input type="text" value={vendorAuthForm.city} onChange={e => setVendorAuthForm({ ...vendorAuthForm, city: e.target.value })} placeholder={{
                ID: 'e.g. Jakarta, Yogyakarta, Bali',
                MY: 'e.g. Kuala Lumpur, Penang, Johor',
                SG: 'e.g. Singapore',
                TH: 'e.g. Bangkok, Chiang Mai, Phuket',
                VN: 'e.g. Hanoi, Ho Chi Minh, Da Nang',
                PH: 'e.g. Manila, Cebu, Davao',
                IN: 'e.g. Mumbai, Delhi, Bangalore',
                AU: 'e.g. Sydney, Melbourne, Brisbane',
                GB: 'e.g. London, Manchester, Birmingham',
                US: 'e.g. New York, Los Angeles, Chicago',
                AE: 'e.g. Dubai, Abu Dhabi, Sharjah',
                SA: 'e.g. Riyadh, Jeddah, Mecca',
                JP: 'e.g. Tokyo, Osaka, Kyoto',
                KR: 'e.g. Seoul, Busan, Incheon',
                DE: 'e.g. Berlin, Munich, Hamburg',
                FR: 'e.g. Paris, Lyon, Marseille',
              }[vendorAuthForm.country] || 'Enter your city'} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            </>
          )}

          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 4, display: 'block' }}>WhatsApp Number</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <span style={{ padding: '12px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              {(() => { const c = VENDOR_COUNTRIES.find(x => x.code === vendorAuthForm.country); return c ? `${c.flag} ${c.prefix}` : '📱' })()}
            </span>
            <input type="tel" value={vendorAuthForm.phone} onChange={e => setVendorAuthForm({ ...vendorAuthForm, phone: e.target.value })} placeholder="Phone number" style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
          </div>

          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 4, display: 'block' }}>Password</label>
          <input type="password" value={vendorAuthForm.password} onChange={e => setVendorAuthForm({ ...vendorAuthForm, password: e.target.value })} placeholder={vendorAuthMode === 'signup' ? 'Create password' : 'Password'} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, marginBottom: 20, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />

          <button onClick={async () => {
            setVendorAuthError('')
            const phone = vendorAuthForm.phone.replace(/[^0-9]/g, '')
            if (!phone || !vendorAuthForm.password) { setVendorAuthError('Please fill in all fields'); return }
            if (vendorAuthMode === 'login') {
              const { data } = await supabase.from('vendor_accounts').select('*').eq('phone', phone).eq('password_hash', vendorAuthForm.password).single()
              if (!data) { setVendorAuthError('Invalid phone or password'); return }
              localStorage.setItem('indoo_vendor_phone', phone)
              localStorage.setItem('indoo_vendor_pass', vendorAuthForm.password)
              localStorage.setItem('indoo_vendor_id', data.id)
              localStorage.setItem('vendorbasic_vendorId', data.id)
              const isDev = window.location.port === '5173' || window.location.port === '5174'
              const baseUrl = vendorAuthApp?.id === 'basic'
                ? (isDev ? 'http://localhost:5176/' : '/food/basic/')
                : (isDev ? '/food/pro/' : '/food/pro/')
              const appUrl = `${baseUrl}?vendor=${data.id}`
              window.open(appUrl, '_blank')
              setVendorAuthOpen(false)
            } else {
              if (!vendorAuthForm.name.trim()) { setVendorAuthError('Enter your business name'); return }
              if (!vendorAuthForm.country) { setVendorAuthError('Select your country'); return }
              if (!vendorAuthForm.city.trim()) { setVendorAuthError('Enter your city'); return }
              if (!vendorAuthForm.category) { setVendorAuthError('Select a food category'); return }
              if (vendorAuthForm.password.length < 4) { setVendorAuthError('Password min 4 characters'); return }
              const countryInfo = VENDOR_COUNTRIES.find(c => c.code === vendorAuthForm.country)
              const fullPhone = countryInfo ? countryInfo.prefix.replace('+', '') + phone : phone
              const slug = vendorAuthForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
              const { data, error } = await supabase.from('vendor_accounts').insert({
                phone: fullPhone, password_hash: vendorAuthForm.password,
                shop_name: vendorAuthForm.name, shop_food_type: vendorAuthForm.category,
                shop_phone: fullPhone, country_code: vendorAuthForm.country, shop_city: vendorAuthForm.city,
                slug, status: 'active'
              }).select().single()
              if (error) { setVendorAuthError(error.message?.includes('duplicate') ? 'Phone already registered' : 'Signup failed'); return }
              // Register in app_registrations for admin dashboard
              try {
                await supabase.from('app_registrations').insert({
                  business_name: vendorAuthForm.name,
                  slug,
                  whatsapp: fullPhone,
                  email: '',
                  app_type: vendorAuthApp?.id || 'basic',
                  app_tier: vendorAuthApp?.id || 'basic',
                  status: 'active',
                  billing_cycle: 'monthly',
                })
              } catch (e) { /* ignore */ }
              localStorage.setItem('indoo_vendor_phone', phone)
              localStorage.setItem('indoo_vendor_pass', vendorAuthForm.password)
              localStorage.setItem('indoo_vendor_id', data.id)
              localStorage.setItem('vendorbasic_vendorId', data.id)
              const isDev = window.location.port === '5173' || window.location.port === '5174'
              const baseUrl = vendorAuthApp?.id === 'basic'
                ? (isDev ? 'http://localhost:5176/' : '/food/basic/')
                : (isDev ? '/food/pro/' : '/food/pro/')
              const countryName = VENDOR_COUNTRIES.find(c => c.code === vendorAuthForm.country)?.name || ''
              const appUrl = `${baseUrl}?vendor=${data.id}&city=${encodeURIComponent(vendorAuthForm.city)}&country=${encodeURIComponent(countryName)}&cc=${vendorAuthForm.country}`
              window.open(appUrl, '_blank')
              setVendorAuthOpen(false)
            }
          }} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#FACC15', color: '#000', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {vendorAuthMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <button onClick={() => { setVendorAuthMode(vendorAuthMode === 'login' ? 'signup' : 'login'); setVendorAuthError('') }} style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', marginTop: 12, padding: 4 }}>
            {vendorAuthMode === 'login' ? (
              <>Don't have an account? <span style={{ color: '#FACC15', fontWeight: 700 }}>Create Account</span></>
            ) : (
              <>Already have an account? <span style={{ color: '#FACC15', fontWeight: 700 }}>Sign In</span></>
            )}
          </button>
          </div>
        </div>
      </div>
    )
  }

  if (currentPage === 'admin') {
    return <Admin onClose={() => setCurrentPage(null)} />
  }

  /* ─── Sub Pages (About, FAQ, Services) ─── */
  if (currentPage) {
    return (
      <div style={styles.page}>
        <div style={styles.detailHeader}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal</div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://ik.imagekit.io/nepgaxllc/Untitleddddvv-removebg-preview.png" alt="Home" style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>

        <div style={{ padding: '20px 24px 40px' }}>
          {currentPage === 'about' && (
            <div>
              <img src="https://ik.imagekit.io/nepgaxllc/dsfsdfffsss.png" alt="About Us" style={{ width: '100%', borderRadius: 20, marginBottom: 20 }} />
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 16 }}>{t.aboutTitle}</h1>
              {t.aboutBody.split('\n\n').map((p, i) => (
                <p key={i} style={{ fontSize: 15, color: '#444', lineHeight: 1.7, marginBottom: 14 }}>{p}</p>
              ))}
            </div>
          )}

          {currentPage === 'faq' && (
            <div>
              <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%205,%202026,%2006_39_32%20PM.png" alt="FAQ" style={{ width: '100%', borderRadius: 20, marginBottom: 20 }} />
              {t.faqs.map((faq, i) => (
                <div key={i} style={styles.faqItem}>
                  <h4 style={styles.faqQ}>{faq.q}</h4>
                  <p style={styles.faqA}>{faq.a}</p>
                </div>
              ))}
            </div>
          )}

          {currentPage === 'services' && (
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>{t.termsTitle}</h1>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>{t.termsLastUpdated}</p>
              {(t.termsSections === 'same' ? TRANSLATIONS.en.termsSections : t.termsSections).map((sec, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>{sec.title}</h3>
                  {sec.body.split('\n\n').map((para, j) => (
                    <p key={j} style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>{para}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

        </div>

        <div style={styles.footer}>
          <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%205,%202026,%2003_03_19%20PM.png" alt="" style={styles.footerImage} />
          <p style={styles.footerText}>{t.footer}</p>
        </div>
      </div>
    )
  }

  /* ─── Home / Landing ─── */
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 0' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal</div>
          <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
        </div>
        <LangSwitcher locale={locale} setLocale={setLocale} />
      </div>

      {/* Hero */}
      <FadeIn>
        <div style={styles.hero}>
          <img
            src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%205,%202026,%2002_58_20%20PM.png"
            alt="Street Local Live"
            style={styles.heroLogo}
          />
          <p style={styles.heroSub}>
            {t.heroSub}<br />{t.heroSub2}
          </p>
        </div>
      </FadeIn>

      {/* Available in languages */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '0 20px 10px' }}>
        <span style={{ fontSize: 11, color: '#999', marginRight: 4 }}>{locale === 'id' ? 'Tersedia dalam' : 'Available in'}:</span>
        {[
          { code: 'en', flag: '🇬🇧' }, { code: 'id', flag: '🇮🇩' }, { code: 'ms', flag: '🇲🇾' },
          { code: 'vi', flag: '🇻🇳' }, { code: 'th', flag: '🇹🇭' }, { code: 'fil', flag: '🇵🇭' },
        ].map(l => (
          <button key={l.code} onClick={() => setLocaleAndSave(l.code)} style={{ background: locale === l.code ? 'rgba(255,214,0,0.2)' : 'transparent', border: locale === l.code ? '1.5px solid #FFD600' : '1.5px solid transparent', borderRadius: 8, padding: '4px 6px', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>
            {l.flag}
          </button>
        ))}
      </div>

      {/* Floating right side nav */}
      <div style={{ position: 'fixed', right: 6, top: '50%', transform: 'translateY(calc(-50% - 70px))', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => setCurrentPage('about')} style={styles.navBtn}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#1a1a1a', fontFamily: 'serif' }}>i</div>
          <span style={styles.navBtnLabel}>{t.navAbout}</span>
        </button>
        <button onClick={() => setCurrentPage('faq')} style={styles.navBtn}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>?</div>
          <span style={styles.navBtnLabel}>{t.navFaq}</span>
        </button>
        <button onClick={() => setCurrentPage('services')} style={styles.navBtn}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>§</div>
          <span style={styles.navBtnLabel}>{t.navServices}</span>
        </button>
      </div>

      {/* Categories */}
      <div style={styles.section}>
        <FadeIn delay={0.2}>
          <h2 style={{ ...styles.sectionTitle, marginTop: 50 }}>{countryPricing ? `${t.ourApps?.split(' ')[0] || 'Starting'} ${countryPricing.currency_symbol} ${countryPricing.basic_monthly.toLocaleString()}${t.perMonth}` : t.ourApps}</h2>
        </FadeIn>

        {/* Food App — full-width banner card with image */}
        {CATEGORIES.filter(c => c.id === 'food').map((cat) => (
          <FadeIn key={cat.id} delay={0.3}>
            <div
              style={styles.foodBannerCard}
              onClick={() => setSelectedCategory(cat)}
            >
              {/* Header over image */}
              <div style={styles.foodBannerHeader}>
                <span style={styles.foodBannerHeaderText}>
                  {(cat.name || '').split(' ')[0]}<br />
                  <span style={{ fontSize: 14 }}>{(cat.name || '').split(' ').slice(1).join(' ')}</span>
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>2,572 downloads</span>
              </div>
              <img
                src={cat.bannerImage}
                alt={cat.name}
                style={styles.foodBannerImage}
              />
              {/* Yellow enter button */}
              <div style={styles.foodBannerBottom}>
                <button style={styles.foodBannerEnterBtn}>
                  {locale === 'id' || locale === 'ms' ? 'Masuk' : locale === 'vi' ? 'Vào' : locale === 'th' ? 'เข้า' : locale === 'fr' ? 'Entrer' : locale === 'de' ? 'Eintreten' : locale === 'es' ? 'Entrar' : locale === 'zh' ? '进入' : locale === 'ar' ? 'دخول' : 'Enter'} →
                </button>
              </div>
            </div>
          </FadeIn>
        ))}

        {/* Remaining + placeholder categories */}
        <div style={{ ...styles.catGrid, marginTop: 12 }}>
          {CATEGORIES.filter(c => c.id !== 'food').map((cat, i) => (
            <FadeIn key={cat.id} delay={0.4 + i * 0.1}>
              <div
                style={styles.catCard}
                onClick={() => setSelectedCategory(cat)}
              >
                <span style={styles.catIcon}>{cat.icon}</span>
                <h3 style={styles.catCardName}>{cat.name}</h3>
                <p style={styles.catCardDesc}>{cat.description}</p>
                <span style={styles.catCardCount}>
                  {t.apps.replace('{count}', cat.apps.length)}
                </span>
              </div>
            </FadeIn>
          ))}

          {/* Placeholder cards for future categories */}
          {[...Array(3)].map((_, i) => (
            <FadeIn key={`placeholder-${i}`} delay={0.5 + i * 0.1}>
              <div style={styles.catCardPlaceholder}>
                <span style={{ fontSize: 28, opacity: 0.3 }}>🔜</span>
                <span style={{ fontSize: 14, color: '#ccc', fontWeight: 600 }}>{t.comingSoon}</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <img src="https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%205,%202026,%2003_03_19%20PM.png" alt="" style={styles.footerImage} />
        <p style={styles.footerText} onClick={() => setCurrentPage('admin')}>{t.footer}</p>
      </div>
    </div>
  )
}

/* ─── Styles ─── */
const styles = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    color: '#1a1a1a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 480,
    margin: '0 auto',
    overflowX: 'hidden',
    overflowY: 'auto',
  },

  /* Nav Buttons */
  navButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    padding: '8px 20px 16px',
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  navBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    background: '#FFD600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    boxShadow: '0 4px 12px rgba(255,214,0,0.3)',
    color: '#1a1a1a',
  },
  navBtnLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#666',
  },

  /* FAQ */
  faqItem: {
    background: '#f8f9fa',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    border: '1px solid #f0f0f0',
  },
  faqQ: {
    fontSize: 15,
    fontWeight: 800,
    margin: '0 0 6px',
    color: '#1a1a1a',
  },
  faqA: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.6,
    margin: 0,
  },

  /* Registration Form */
  regLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#333',
    display: 'block',
    marginBottom: 6,
  },
  regInput: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1.5px solid #e0e0e0',
    fontSize: 15,
    fontWeight: 500,
    outline: 'none',
    marginBottom: 16,
    fontFamily: 'inherit',
    minHeight: 48,
  },
  regUrlRow: {
    display: 'flex',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  regUrlPrefix: {
    background: '#1a1a1a',
    color: '#FFD600',
    padding: '14px 12px',
    borderRadius: '12px 0 0 12px',
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },

  /* Service Card */
  serviceCard: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    background: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    border: '1px solid #f0f0f0',
  },

  /* Hero */
  hero: {
    padding: '8px 24px 8px',
    textAlign: 'center',
  },
  heroLogo: {
    width: '100%',
    maxWidth: 320,
    height: 'auto',
    marginBottom: -30,
  },
  heroSub: {
    fontSize: 16,
    color: '#666',
    lineHeight: 1.6,
    margin: 0,
  },

  /* Section */
  section: {
    padding: '0 20px 40px',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 20,
  },

  /* Category Grid */
  catGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  catCard: {
    background: '#f8f9fa',
    borderRadius: 20,
    padding: 20,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #f0f0f0',
  },
  catCardPlaceholder: {
    background: '#fafafa',
    borderRadius: 20,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 120,
    border: '1px dashed #e0e0e0',
  },
  catIcon: {
    fontSize: 32,
    display: 'block',
    marginBottom: 8,
  },
  catCardName: {
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 4px',
  },
  catCardDesc: {
    fontSize: 13,
    color: '#888',
    margin: '0 0 8px',
    lineHeight: 1.4,
  },
  catCardCount: {
    fontSize: 13,
    fontWeight: 700,
    color: '#FFD600',
  },

  /* Category Detail */
  catTitle: {
    fontSize: 28,
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '0 0 8px',
  },
  catDesc: {
    fontSize: 15,
    color: '#666',
    margin: '0 0 24px',
  },

  /* App List */
  appList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  appCard: {
    background: '#f8f9fa',
    borderRadius: 24,
    padding: 20,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  appCardPhone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appCardInfo: {
    width: '100%',
    textAlign: 'center',
  },
  appCardName: {
    fontSize: 18,
    fontWeight: 800,
    margin: '6px 0 4px',
  },
  appCardPrice: {
    margin: '4px 0 6px',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
  },
  appCardTagline: {
    fontSize: 13,
    color: '#666',
    margin: '0 0 10px',
    lineHeight: 1.4,
  },
  appCardBtn: {
    fontSize: 14,
    fontWeight: 700,
  },

  /* Tier Badge */
  tierBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Detail Page */
  detailHeader: {
    padding: '16px 20px',
    position: 'sticky',
    top: 0,
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(10px)',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: 16,
    fontWeight: 600,
    color: '#FFD600',
    cursor: 'pointer',
    padding: '8px 0',
    minHeight: 44,
  },
  detailHero: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px 0 30px',
  },
  detailContent: {
    padding: '0 24px 60px',
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 900,
    margin: '10px 0 6px',
  },
  detailTagline: {
    fontSize: 16,
    color: '#666',
    margin: '0 0 16px',
  },
  detailDesc: {
    fontSize: 15,
    color: '#444',
    lineHeight: 1.7,
    margin: '0 0 24px',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 800,
    margin: '0 0 12px',
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 24px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    fontSize: 15,
    borderBottom: '1px solid #f0f0f0',
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    color: '#fff',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* Screenshots */
  screenshotRow: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto',
    padding: '0 0 20px',
    WebkitOverflowScrolling: 'touch',
  },
  screenshotThumb: {
    width: 120,
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
    background: '#f0f0f0',
  },

  /* Detail Toggle Tabs */
  detailToggle: {
    display: 'flex',
    gap: 0,
    background: '#f0f0f0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  detailToggleBtn: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    padding: '10px 8px',
    borderRadius: 11,
    fontSize: 13,
    fontWeight: 700,
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: 44,
  },

  /* Benefits */
  benefitsIntro: {
    fontSize: 17,
    fontWeight: 800,
    color: '#1a1a1a',
    lineHeight: 1.6,
    margin: '0 0 16px',
  },
  benefitsBodyText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 1.7,
    margin: '0 0 14px',
  },
  benefitsWithApp: {
    fontSize: 18,
    fontWeight: 800,
    color: '#1a1a1a',
    margin: '20px 0 14px',
  },
  benefitsClosing: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a1a',
    lineHeight: 1.7,
    margin: '20px 0 24px',
    padding: 18,
    background: '#FFD600',
    borderRadius: 16,
  },
  benefitsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  benefitCard: {
    background: '#f8f9fa',
    borderRadius: 16,
    padding: '16px 18px',
    border: '1px solid #f0f0f0',
  },
  benefitIcon: {
    fontSize: 24,
    flexShrink: 0,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 800,
    margin: 0,
    color: '#1a1a1a',
  },
  benefitPoints: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  benefitPoint: {
    fontSize: 14,
    color: '#555',
    lineHeight: 1.5,
    padding: '4px 0',
    display: 'flex',
    alignItems: 'flex-start',
  },

  /* Payment Sheet */
  paymentOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  paymentSheet: {
    background: '#fff',
    borderRadius: '24px 24px 0 0',
    padding: '0 20px 32px',
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'slideUp 0.3s ease',
    borderTop: '4px solid #FFD600',
  },
  paymentHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    background: '#ddd',
    margin: '10px auto 16px',
  },
  paymentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 800,
    margin: 0,
  },
  paymentClose: {
    background: '#8B0000',
    border: 'none',
    width: 36,
    height: 36,
    borderRadius: 18,
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  paymentPrice: {
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 20,
  },
  paymentBank: {
    background: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    border: '1px solid #f0f0f0',
  },
  paymentCopyBtn: {
    marginTop: 10,
    background: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    minHeight: 44,
  },
  paymentUpload: {
    display: 'block',
    border: '2px dashed #ddd',
    borderRadius: 16,
    padding: 12,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },

  /* CTA */
  ctaButton: {
    display: 'block',
    width: '100%',
    padding: '16px',
    borderRadius: 14,
    border: 'none',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    marginTop: 8,
  },

  /* Food Banner Card */
  foodBannerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  },
  foodBannerHeader: {
    background: '#1a1a1a',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodBannerHeaderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: -0.3,
  },
  foodBannerImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  foodBannerBottom: {
    padding: '14px 20px',
    background: '#1a1a1a',
    display: 'flex',
    justifyContent: 'center',
  },
  foodBannerEnterBtn: {
    background: '#FFD600',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: 12,
    padding: '12px 0',
    width: '100%',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    minHeight: 48,
    letterSpacing: 0.3,
  },

  /* Language Switcher */
  langSwitcher: {
    display: 'flex',
    gap: 4,
    background: '#f0f0f0',
    borderRadius: 10,
    padding: 3,
  },
  langBtn: {
    border: 'none',
    background: 'transparent',
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: 44,
    minWidth: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnActive: {
    background: '#fff',
    color: '#1a1a1a',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },

  /* Footer */
  footer: {
    padding: '20px 20px 30px',
    textAlign: 'center',
  },
  footerImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    fontWeight: 600,
  },
}
