import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import Admin from './Admin'
import Affiliate from './Affiliate'
import { getTranslation, COUNTRY_TO_LANG } from './translations'
import imgError, { FALLBACK_URLS } from './imgFallback'
import { THEME_PRESETS as SERVICES_THEME_PRESETS } from '../../shared/themes/servicesThemes.js'

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
      { q: 'How do customers order?', a: 'Customers open your app link, browse your menu, and place an order through the channel you chose when you signed up: WhatsApp (orders arrive on your personal WhatsApp) or in-app chat (private real-time chat with payment built in). You can also accept cash, bank transfer, or QRIS without connecting a gateway — or hook up any of 16 payment gateways to take cards / e-wallets directly in checkout.' },
      { q: 'Do you take commission on orders?', a: 'Never. You keep 100% of your revenue. We only charge the monthly subscription.' },
      { q: 'Can I customize my app?', a: 'Yes — your brand name, menu, prices, photos, and promotions are all under your control.' },
      { q: 'Can I have my own branded domain name?', a: 'Yes! We offer three domain plans: a subdomain (shopname.streetlocal.live), a custom domain (menu.yourbrand.com), or a full domain (yourbrand.com) where we handle everything. Domain plans are optional — your app works perfectly without one. See the Domains page in your dashboard for pricing.' },
      { q: 'Can I buy the app and host it myself?', a: 'No — StreetLocal is a service, not a product for sale. Your subscription includes hosting, updates, new features, security, and support. Building this from scratch would cost Rp 15-30 million and you would still need to pay hosting and maintenance.' },
      { q: 'Can my customers pay by credit card?', a: 'Yes — connect a payment gateway in your app\'s vendor admin (Settings → Payment Methods). We support Stripe, PayPal, Braintree, Checkout.com, Authorize.net, Mollie, Razorpay, HitPay, FOMO Pay, Rapyd, Adyen, CyberSource, Worldpay, 2Checkout, Midtrans, and Xendit — 16 gateways across 200+ countries. Customers see card / Apple Pay / Google Pay / wallet options at checkout. The gateway connection is optional; you can run on cash, bank transfer, or QRIS without it.' },
      { q: 'Does StreetLocal process the payments?', a: 'No. Each vendor connects their own gateway account directly. Customer card data and funds flow through the gateway you signed up with — StreetLocal never sees or holds your money. We provide the software that connects your app\'s checkout to your gateway. You manage refunds, disputes, and payouts from the gateway\'s own dashboard.' },
      { q: 'How do I add credit card payments to my app?', a: 'Inside your app\'s vendor admin, open Payment Methods, pick your gateway, and paste your API keys. Most gateways take 10 minutes to sign up (Stripe, HitPay, Mollie). Some need full business verification (Adyen, CyberSource, Worldpay — these are tagged "Enterprise"). Once connected, your customers see a Pay button at checkout. We never charge a fee for this connection — it\'s part of every StreetLocal plan.' },
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
        title: '6. Custom Domain Services',
        body: 'StreetLocal offers optional custom domain services as an add-on to the Software subscription. Custom domain plans are subject to the following terms:\n\n• Domain services are provided in addition to and not as a replacement for the Software subscription. An active Software subscription is required to use any domain service.\n\n• Setup fees are non-refundable. Setup fees cover the configuration, DNS setup, SSL provisioning, and technical work required to connect a domain to the Software. These fees are earned upon commencement of work and are non-refundable regardless of whether the User subsequently cancels.\n\n• All custom domain plans require a minimum commitment of three (3) months from the date of activation. Early cancellation within the minimum commitment period requires payment of the remaining months.\n\n• After the minimum commitment period, Users may cancel domain services with 30 days written notice. Upon cancellation, the domain will stop pointing to the Software. The User\'s app and content remain accessible at the standard streetlocal.live URL.\n\n• For Full Domain plans where StreetLocal purchases and manages the domain on behalf of the User: the domain registration remains the property of StreetLocal until the User has maintained the plan for a minimum of 12 consecutive months, after which domain ownership may be transferred to the User upon written request. If the User cancels before 12 months, StreetLocal retains ownership of the domain.\n\n• Users are solely responsible for ensuring their chosen domain name does not infringe upon any third-party trademarks, trade names, intellectual property rights, or any applicable laws. StreetLocal does not perform trademark searches and accepts no liability for domain name disputes, cybersquatting claims, UDRP proceedings, or any legal action arising from the User\'s choice of domain name.\n\n• StreetLocal reserves the right to refuse, suspend, or terminate any domain service if the domain name is deemed offensive, misleading, fraudulent, or potentially infringing on third-party rights.\n\n• Domain pricing is subject to change with 30 days written notice. Domain renewal fees (for Full Domain plans) are included in the monthly subscription and are subject to registrar pricing changes, which may be passed on to the User.\n\n• StreetLocal does not guarantee 100% uptime for custom domain services. DNS propagation, SSL provisioning, and domain transfers may cause temporary unavailability. StreetLocal is not liable for any business disruption during these periods.\n\n• The User agrees to indemnify StreetLocal against any and all claims, losses, damages, and expenses arising from the User\'s choice of domain name, including trademark disputes, legal proceedings, and regulatory actions.'
      },
      {
        title: '7. License Revocation & Termination',
        body: 'StreetLocal reserves the absolute right to suspend, terminate, or permanently revoke any User\'s Software license at any time, with or without notice, for any reason including but not limited to: violation of these Terms & Conditions; non-payment or late payment; use of the Software for illegal, fraudulent, or unethical purposes; intellectual property violations; misrepresentation of business information; abusive behavior toward StreetLocal staff or systems; any activity that damages or threatens to damage StreetLocal\'s reputation, infrastructure, or other Users.\n\nUpon termination: all rights granted under the license cease immediately; the User must stop using the Software; StreetLocal may delete User data after 30 days; no refunds will be provided for the remaining subscription period; StreetLocal is not liable for any business disruption, loss of revenue, loss of data, or any other damages resulting from termination.'
      },
      {
        title: '8. Limitation of Liability & Disclaimer of Warranties',
        body: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:\n\nThe Software is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, implied, statutory, or otherwise, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non-infringement, reliability, accuracy, or completeness.\n\nStreetLocal does not warrant that the Software will be uninterrupted, error-free, secure, or free from viruses, bugs, or defects. StreetLocal does not warrant that the Software will meet the User\'s specific requirements or expectations.\n\nIN NO EVENT SHALL STREETLOCAL, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, PARTNERS, OR AFFILIATES BE LIABLE FOR: any indirect, incidental, special, consequential, punitive, or exemplary damages; any loss of profits, revenue, business, savings, data, or goodwill; any damages arising from business interruption, system downtime, or data loss; any damages arising from unauthorized access to or alteration of data; any damages arising from the User\'s business operations, products, or services; any damages arising from third-party claims against the User; any damages arising from the User\'s failure to comply with applicable laws.\n\nStreetLocal\'s total aggregate liability for all claims arising from or related to these Terms or the Software shall not exceed the amount paid by the User in subscription fees during the twelve (12) months immediately preceding the claim.\n\nSome jurisdictions do not allow the exclusion of certain warranties or limitation of liability. In such jurisdictions, our liability shall be limited to the maximum extent permitted by law.'
      },
      {
        title: '9. Indemnification',
        body: 'The User agrees to fully indemnify, defend, and hold harmless StreetLocal, its directors, officers, employees, agents, partners, licensors, and affiliates from and against any and all claims, demands, actions, suits, proceedings, liabilities, damages, losses, costs, and expenses (including reasonable legal fees and court costs) arising from or related to: the User\'s use or misuse of the Software; the User\'s violation of these Terms & Conditions; the User\'s violation of any applicable law, regulation, or third-party rights; the User\'s business operations, products, services, or customer interactions; any content uploaded, published, or transmitted through the Software by the User; any tax liability, regulatory fine, or legal penalty incurred by the User; any claims by the User\'s customers, employees, contractors, partners, or any third party; any dispute between the User and their customers or business partners.\n\nThis indemnification obligation survives the termination of these Terms and the User\'s subscription.'
      },
      {
        title: '10. No Partnership, Employment, or Agency',
        body: 'Nothing in these Terms & Conditions shall be construed as creating any partnership, joint venture, employment relationship, franchise, agency, or any other legal relationship between StreetLocal and the User beyond a standard software license.\n\nThe User has no authority to bind, represent, or act on behalf of StreetLocal in any capacity. The User shall not hold themselves out as a partner, employee, agent, representative, or affiliate of StreetLocal.\n\nStreetLocal is not responsible for, and has no control over, the User\'s business decisions, operations, hiring, firing, pricing, service quality, customer relations, or any other aspect of the User\'s business.\n\nAny claims, disputes, lawsuits, regulatory actions, or legal proceedings arising from the User\'s business operations are the sole responsibility of the User. StreetLocal shall not be made a party to, or held liable in, any such proceedings.'
      },
      {
        title: '11. Data & Privacy',
        body: 'Users retain ownership of all Content they upload to the Software. StreetLocal may access User data solely for the purposes of providing and maintaining the Software, troubleshooting technical issues, and improving the service.\n\nStreetLocal will not sell User data to third parties. However, StreetLocal may disclose data when required by law, regulation, legal process, or governmental request.\n\nUsers are solely responsible for complying with all applicable data protection and privacy laws (including but not limited to Indonesia\'s UU PDP, EU GDPR, and any other applicable privacy regulations) with respect to their customers\' personal data.\n\nStreetLocal implements reasonable security measures but does not guarantee absolute security. Users accept the inherent risks of transmitting data over the internet.'
      },
      {
        title: '12. Governing Law & Dispute Resolution',
        body: 'These Terms & Conditions shall be governed by and construed in accordance with the laws of the Republic of Indonesia, without regard to its conflict of law provisions.\n\nAny dispute arising from or relating to these Terms shall first be attempted to be resolved through good faith negotiation. If negotiation fails, the dispute shall be submitted to binding arbitration in accordance with the rules of the Indonesian National Arbitration Board (BANI) in Jakarta, Indonesia.\n\nThe User agrees that any legal proceedings shall be conducted in the Indonesian language and English. The arbitral award shall be final and binding on both parties.\n\nThe User waives any right to participate in class action lawsuits or class-wide arbitration against StreetLocal.'
      },
      {
        title: '13. Modifications to Terms',
        body: 'StreetLocal reserves the right to modify, update, or replace these Terms & Conditions at any time. Material changes will be communicated via the Software interface or email with at least 14 days notice. Continued use of the Software after changes take effect constitutes acceptance of the updated Terms.\n\nIf the User does not agree with any changes, their sole remedy is to cancel the subscription and stop using the Software.'
      },
      {
        title: '14. Severability & Entire Agreement',
        body: 'If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, or if modification is not possible, it shall be severed from these Terms. The remaining provisions shall continue in full force and effect.\n\nThese Terms & Conditions, together with the Privacy Policy and any supplemental terms, constitute the entire agreement between StreetLocal and the User regarding the use of the Software, superseding all prior agreements, representations, warranties, and understandings.\n\nThe failure of StreetLocal to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.'
      },
      {
        title: '15. Contact',
        body: 'For questions regarding these Terms & Conditions, contact us via the Support Center at streetlocal.live or email us through the Contact page.'
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
    ourApps: 'Starting Rp 35.000/Month',
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
        name: 'Local Food Apps',
        description: 'Complete food business solutions',
        bannerImage: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_48_14%20PM.png',
        apps: {
          basic: {
            name: 'FoodLocal',
            tier: 'Software 1',
            price: 'Rp 35.000',
            yearlyPrice: 'Rp 456.000',
            tagline: 'From street carts to restaurants — your food ordering app',
            description: 'Perfect for street vendors, restaurants, food courts, and cafes. Show your menu, take orders by WhatsApp OR private in-app chat (your choice — see plans below), and manage your business — all from your phone.',
            features: [
              { cat: 'Ordering & Menu', items: ['Two order channels — WhatsApp (35k tier) or in-app chat (50k tier)', 'Zero commission on every order', 'Digital menu with photos, descriptions, modifiers, and notes', 'Meal, Snack, Dessert & Drink categories', 'Promo pricing with strikethrough display', 'Halal badge, Popular item badges, and spice level indicators', 'Per-item stock toggle and live availability'] },
              { cat: 'Design & Branding', items: ['Your own branded food ordering app', '25+ theme backgrounds + custom editor', 'Custom logo, accent colour, button shape and effects', 'Landing page with city & country display', 'Splash screen and PWA install on any phone'] },
              { cat: 'Customer Payments', items: ['16 payment gateways supported (Stripe, Midtrans, Xendit, PayPal, Adyen, Worldpay, CyberSource, and more)', '200+ countries / cards / Apple Pay / Google Pay / QRIS / e-wallets / bank transfer', 'Optional escrow hold — release funds when the customer confirms delivery', 'Each vendor connects their own gateway — StreetLocal never holds your money'] },
              { cat: 'Delivery & Location', items: ['GPS delivery estimates with local rates', 'City-based GoJek/Grab rate defaults', 'Per-zone distance pricing'] },
              { cat: 'Business Management', items: ['Shop open/close toggle — pause orders instantly', 'Per-day opening hours schedule', 'Visit Us page with map link & contact', 'Shop bio & social media links', 'QR code generator for your stall', 'In-thread refund + escrow release controls on every paid order'] },
              { cat: 'Marketing & Social', items: ['WhatsApp share & promo templates', 'Instagram, TikTok, Facebook, YouTube bio link integration', 'Shareable app URL (streetlocal.live/your-name)'] },
              { cat: 'Technical', items: ['11 language support', 'Auto SEO — Google & social media optimised', 'Mobile-first PWA — works on any phone', 'No app store needed — instant access via link'] },
            ],
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
      { q: 'Bagaimana pelanggan memesan?', a: 'Pelanggan buka link aplikasi kamu, jelajahi menu, dan kirim pesanan via channel yang kamu pilih saat daftar: WhatsApp (pesanan langsung masuk ke WhatsApp pribadi) atau chat dalam aplikasi (chat real-time dengan pembayaran terintegrasi). Bisa juga terima tunai, transfer bank, atau QRIS tanpa gateway — atau hubungkan salah satu dari 16 payment gateway untuk kartu / e-wallet langsung di checkout.' },
      { q: 'Apakah ada komisi dari pesanan?', a: 'Tidak pernah. Kamu simpan 100% pendapatan. Kami hanya mengenakan biaya langganan bulanan.' },
      { q: 'Bisa kustomisasi aplikasi?', a: 'Ya — nama brand, menu, harga, foto, dan promosi semuanya di bawah kendali kamu.' },
      { q: 'Bisa pakai domain sendiri?', a: 'Ya! Kami menawarkan tiga paket domain: subdomain (namamu.streetlocal.live), domain kustom (menu.brandmu.com), atau domain penuh (brandmu.com) dimana kami mengurus semuanya. Paket domain opsional — aplikasi kamu tetap berfungsi sempurna tanpanya. Lihat halaman Domain di dashboard untuk harga.' },
      { q: 'Bisa beli aplikasinya dan hosting sendiri?', a: 'Tidak — StreetLocal adalah layanan, bukan produk dijual. Langganan kamu termasuk hosting, update, fitur baru, keamanan, dan dukungan. Membangun ini dari nol akan memakan biaya Rp 15-30 juta dan kamu masih perlu bayar hosting dan pemeliharaan.' },
      { q: 'Bisakah pelanggan saya bayar dengan kartu kredit?', a: 'Ya — hubungkan payment gateway di admin vendor aplikasi (Settings → Payment Methods). Kami mendukung Stripe, PayPal, Braintree, Checkout.com, Authorize.net, Mollie, Razorpay, HitPay, FOMO Pay, Rapyd, Adyen, CyberSource, Worldpay, 2Checkout, Midtrans, dan Xendit — 16 gateway di 200+ negara. Pelanggan melihat opsi kartu / Apple Pay / Google Pay / dompet digital saat checkout. Koneksi gateway bersifat opsional; Anda bisa pakai uang tunai, transfer bank, atau QRIS tanpa itu.' },
      { q: 'Apakah StreetLocal memproses pembayaran?', a: 'Tidak. Setiap vendor menghubungkan akun gateway sendiri secara langsung. Data kartu pelanggan dan dana mengalir melalui gateway yang Anda daftarkan — StreetLocal tidak pernah melihat atau menyimpan uang Anda. Kami menyediakan software yang menghubungkan checkout aplikasi Anda ke gateway Anda. Anda mengelola refund, sengketa, dan payout dari dashboard gateway sendiri.' },
      { q: 'Bagaimana cara menambahkan pembayaran kartu kredit ke aplikasi saya?', a: 'Di admin vendor aplikasi, buka Payment Methods, pilih gateway Anda, dan tempel API key. Sebagian besar gateway butuh 10 menit untuk daftar (Stripe, HitPay, Mollie). Beberapa perlu verifikasi bisnis lengkap (Adyen, CyberSource, Worldpay — bertanda "Enterprise"). Setelah terhubung, pelanggan Anda melihat tombol Pay saat checkout. Kami tidak pernah memungut biaya untuk koneksi ini — sudah termasuk di semua paket StreetLocal.' },
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
    ourApps: 'Mulai Rp 35.000/Bulan',
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
        bannerImage: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_48_14%20PM.png',
        apps: {
          basic: {
            name: 'FoodLocal',
            tier: 'Software 1',
            price: 'Rp 35.000',
            yearlyPrice: 'Rp 456.000',
            tagline: 'Dari gerobak hingga restoran — aplikasi pemesanan makanan Anda',
            description: 'Cocok untuk pedagang kaki lima, restoran, food court, dan kafe. Tampilkan menu, terima pesanan via WhatsApp ATAU chat dalam aplikasi (pilihan Anda — lihat paket di bawah), dan kelola bisnis — semua dari HP.',
            features: [
              { cat: 'Pesanan & Menu', items: ['Dua channel pesanan — WhatsApp (paket 35k) atau chat dalam aplikasi (paket 50k)', 'Nol komisi untuk setiap pesanan', 'Menu digital dengan foto, deskripsi, modifier & catatan', 'Kategori — Makanan, Minuman, Snack, Extra', 'Harga promo & penawaran harian', 'Toggle ketersediaan per item & stok langsung', 'Indikator pedas & badge Halal/Populer'] },
              { cat: 'Desain & Branding', items: ['25+ tema aplikasi cantik + editor kustom', 'Warna aksen, bentuk tombol & efek kustom', 'Upload gambar latar belakang sendiri', 'Logo toko dengan ring aksen', 'Splash screen & install PWA di HP mana saja'] },
              { cat: 'Pembayaran Pelanggan', items: ['16 payment gateway didukung (Stripe, Midtrans, Xendit, PayPal, Adyen, Worldpay, CyberSource, dan lainnya)', '200+ negara / kartu / Apple Pay / Google Pay / QRIS / e-wallet / transfer bank', 'Mode escrow opsional — rilis dana setelah pelanggan konfirmasi pengiriman', 'Setiap vendor menghubungkan akun gateway sendiri — StreetLocal tidak pernah menyimpan uang Anda'] },
              { cat: 'Lokasi & Pengiriman', items: ['Tarif pengiriman per kilometer', 'Kalkulasi jarak GPS', 'Mode Ambil Sendiri', 'Integrasi Google Maps', 'Tarif ojol sesuai regulasi pemerintah'] },
              { cat: 'Alat Bisnis', items: ['Toggle Buka/Tutup toko', 'Jam operasional dengan jadwal harian', 'Bio toko — ceritakan kisah Anda', 'Halaman Kunjungi Kami — lokasi, jam, sosmed', 'Kontrol refund + escrow dalam thread pesanan'] },
              { cat: 'Teknis', items: ['Dukungan 11 bahasa', 'SEO otomatis — optimal untuk Google & sosmed', 'Mobile-first PWA — bekerja di HP mana saja', 'Tanpa app store — akses langsung via link'] },
            ],
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
      name: t.foodCategory || 'Local Food Apps',
      icon: '🍜',
      description: t.foodCategoryDesc || 'Complete food business solutions',
      bannerImage: (t.categories?.food?.bannerImage) || 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_48_14%20PM.png',
      apps: [
        {
          id: 'basic',
          name: t.basicName || 'FoodLocal',
          tier: t.basicTier || 'Software 1',
          price: cp ? `${cp.currency_symbol} ${cp.basic_monthly.toLocaleString()}` : 'Rp 35.000',
          yearlyPrice: cp ? `${cp.currency_symbol} ${cp.basic_yearly.toLocaleString()}` : 'Rp 456.000',
          tagline: t.basicTagline || 'From street carts to restaurants — your food ordering app',
          description: t.basicDesc || '',
          features: [
            { cat: 'Ordering & Menu', items: ['WhatsApp ordering — zero commission', 'Digital menu with photos & descriptions', 'Meal, Snack, Dessert & Drink categories', 'Promo pricing with strikethrough display', 'Halal badge & Popular item badges', 'Spice level indicators on dishes', 'Customer order notes', 'Prep time per menu item'] },
            { cat: 'Design & Branding', items: ['Your own branded food ordering app', '15+ theme backgrounds to match your brand', 'Custom logo & business branding', 'Landing page with city & country display', 'Custom accent colors & theme editor', 'Hero text effects (glow, neon, shadow)', 'Button shape & style customization', 'Splash screen with logo'] },
            { cat: 'Delivery & Location', items: ['GPS delivery estimates with local rates', 'City-based GoJek/Grab rate defaults', 'Multi-currency support (16 countries)', 'Configurable delivery radius & pricing', 'Free delivery threshold setting', 'Pickup Only / Collection mode'] },
            { cat: 'Business Management', items: ['Shop open/close toggle — pause orders instantly', 'Per-day opening hours schedule', 'Visit Us page with map link & contact', 'Shop bio & social media links', 'QR code generator for your stall', 'QRIS payment QR code', 'Customer directory & order history', 'Daily deals with time scheduling'] },
            { cat: 'Marketing & Social', items: ['WhatsApp share & promo templates', 'Auto-reply text for WhatsApp Business', 'Instagram & TikTok bio link generator', 'Shareable app URL (streetlocal.live/your-name)', 'Promo banner with scrolling text', 'Search listing on StreetLocal.live'] },
            { cat: 'Technical', items: ['2 language support (Indonesian & English)', 'Auto SEO — Google & social media optimised', 'Mobile-first PWA — works on any phone', 'No app store needed — instant access via link', 'Automatic cloud backup & sync', 'Terms Of Listing compliance checker'] },
            { cat: 'Payments', items: ['Online payments accepted (optional) — Connect Stripe, PayPal, Midtrans, or 16 other gateways'] },
          ],
          screenshots: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'],
          liveUrls: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'].map(p => (window.location.hostname === 'localhost' ? 'http://localhost:5177/food/chat/' : '/food/chat/') + '?demo=true&page=' + p),
          url: '/food/chat/',
          color: '#8B0000',
          checkoutChooser: 'food',
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
            'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledfsdfsdfsssss.png',
            'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-5-2026-12_24_25-pm.png',
            'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-4-2026-04_17_25-pm.png',
          ],
          url: '/food/pro/',
          color: '#FFD600',
        },
      ],
    },
    {
      id: 'products',
      name: t.productsCategory || 'Local Product Apps',
      icon: '📦',
      description: t.productsCategoryDesc || 'Sell any product — your own store app',
      bannerImage: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2002_00_29%20PM.png',
      apps: [
        {
          id: 'productslocal',
          name: t.productsName || 'ProductsLocal',
          tier: t.productsTier || 'Software 3',
          price: cp ? `${cp.currency_symbol} ${cp.basic_monthly.toLocaleString()}` : 'Rp 35.000',
          yearlyPrice: cp ? `${cp.currency_symbol} ${cp.basic_yearly.toLocaleString()}` : 'Rp 456.000',
          tagline: t.productsTagline || 'Sell any product — from crafts to clothing, your own store app',
          description: t.productsDesc || '',
          features: [
            { cat: 'Products & Catalog', items: ['Product catalog with photos & descriptions', 'Category management', 'Promo pricing with strikethrough display', 'Stock availability toggle', 'Product variants & options', 'Customer order notes', 'WhatsApp ordering — zero commission'] },
            { cat: 'Design & Branding', items: ['Your own branded product store app', '15+ theme backgrounds to match your brand', 'Custom logo & business branding', 'Landing page with city & country display', 'Custom accent colors & theme editor', 'Button shape & style customization', 'Splash screen with logo'] },
            { cat: 'Delivery & Location', items: ['GPS delivery estimates with local rates', 'City-based shipping rate defaults', 'Multi-currency support (16 countries)', 'Configurable delivery radius & pricing', 'Free delivery threshold setting', 'Pickup Only / Collection mode'] },
            { cat: 'Business Management', items: ['Shop open/close toggle — pause orders instantly', 'Per-day opening hours schedule', 'Visit Us page with map link & contact', 'Shop bio & social media links', 'QR code generator for your store', 'QRIS payment QR code', 'Customer directory & order history'] },
            { cat: 'Marketing & Social', items: ['WhatsApp share & promo templates', 'Auto-reply text for WhatsApp Business', 'Instagram & TikTok bio link generator', 'Shareable app URL (streetlocal.live/your-name)', 'Promo banner with scrolling text', 'Search listing on StreetLocal.live'] },
            { cat: 'Technical', items: ['2 language support (Indonesian & English)', 'Auto SEO — Google & social media optimised', 'Mobile-first PWA — works on any phone', 'No app store needed — instant access via link', 'Automatic cloud backup & sync'] },
            { cat: 'Payments', items: ['Online payments accepted (optional) — Connect Stripe, PayPal, Midtrans, or 16 other gateways'] },
          ],
          screenshots: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'],
          liveUrls: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'].map(p => (window.location.hostname === 'localhost' ? 'http://localhost:5178/products/local/' : '/products/local/') + '?demo=true&page=' + p),
          url: '/products/local/',
          color: '#4A90D9',
          checkoutChooser: 'products',
        },
      ],
    },
    {
      id: 'services',
      name: t.servicesCategory || 'Local Service Apps',
      icon: '🛠️',
      description: t.servicesCategoryDesc || 'Offer any service — cleaning, plumbing, tutoring, your own booking app',
      bannerImage: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_50_15%20PM.png',
      apps: [
        {
          id: 'serviceslocal',
          name: t.servicesName || 'ServicesLocal',
          tier: t.servicesTier || 'Software 4',
          price: cp ? `${cp.currency_symbol} ${cp.basic_monthly.toLocaleString()}` : 'Rp 35.000',
          yearlyPrice: cp ? `${cp.currency_symbol} ${cp.basic_yearly.toLocaleString()}` : 'Rp 456.000',
          tagline: t.servicesTagline || 'Run your service business — cleaners, plumbers, tutors, mechanics, salons',
          description: t.servicesDesc || '',
          features: [
            { cat: 'Services & Booking', items: ['Service listings with photos & descriptions', 'Category management', 'Promo pricing with strikethrough display', 'Availability toggle', 'Service variants & options', 'Customer notes & special requests', 'WhatsApp booking — zero commission'] },
            { cat: 'Design & Branding', items: ['Your own branded service app', '28 theme backgrounds (cleaning, plumbing, salon, tattoo, etc.)', 'Custom logo & business branding', 'Landing page with city & country display', 'Custom accent colors & theme editor', 'Button shape & style customization', 'Splash screen with logo'] },
            { cat: 'Booking & Location', items: ['GPS-based callout estimates', 'City-based service rates', 'Multi-currency support (16 countries)', 'Configurable service area & pricing', 'Free callout threshold setting', 'In-shop / on-site service modes'] },
            { cat: 'Business Management', items: ['Open / closed toggle — pause new bookings instantly', 'Per-day opening hours schedule', 'Visit Us page with map link & contact', 'Business bio & social media links', 'QR code generator for your stall', 'QRIS payment QR code', 'Customer directory & booking history'] },
            { cat: 'Marketing & Social', items: ['WhatsApp share & promo templates', 'Auto-reply text for WhatsApp Business', 'Instagram & TikTok bio link generator', 'Shareable app URL (streetlocal.live/your-name)', 'Promo banner with scrolling text', 'Search listing on StreetLocal.live'] },
            { cat: 'Technical', items: ['2 language support (Indonesian & English)', 'Auto SEO — Google & social media optimised', 'Mobile-first PWA — works on any phone', 'No app store needed — instant access via link', 'Automatic cloud backup & sync'] },
            { cat: 'Payments', items: ['Online payments accepted (optional) — Connect Stripe, PayPal, Midtrans, or 16 other gateways'] },
          ],
          screenshots: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'],
          liveUrls: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'].map(p => (window.location.hostname === 'localhost' ? 'http://localhost:5183/services/whatsapp/' : '/services/whatsapp/') + '?demo=true&page=' + p),
          url: '/services/whatsapp/',
          color: '#16A085',
          checkoutChooser: 'services',
        },
      ],
    },
  ]
}

/* ─── iPhone Mockup Component ─── */
function PhoneMockup({ screenshot, liveUrl, color, small }) {
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
        {liveUrl && navigator.onLine ? (
          <div style={{ width: 375, height: 812, transform: `scale(${small ? 180/375 : 280/375})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
            <iframe src={liveUrl} style={{ width: 375, height: 812, border: 'none', pointerEvents: 'none' }} title="Live preview" />
          </div>
        ) : screenshot ? (
          <img src={screenshot} alt="App screenshot" onError={imgError('screenshot')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
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
/* ─── Auto-Playing Demo Walkthrough ─── */
/* ─── 3D Phone Carousel — auto-advance, swipe, preloaded iframes ─── */
function Phone3DCarousel({ screenshots, color, liveUrl, liveUrls, autoPlay = false }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)
  const touchStart = useRef(0)
  const total = (liveUrls || screenshots || []).length

  // Detect online/offline status
  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline) }
  }, [])
  const DURATION = 7000

  const LABELS = [
    { title: 'Landing Page', desc: 'Your brand, your style' },
    { title: 'Menu Cards', desc: 'Browse with categories' },
    { title: 'Add to Cart', desc: 'One tap ordering' },
    { title: 'View Cart', desc: 'Items ready to order' },
    { title: 'Checkout', desc: 'WhatsApp ordering' },
    { title: 'Order Sent', desc: 'QRIS scan to pay' },
    { title: 'Visit Us', desc: 'Location & socials' },
  ]

  // Auto-advance
  useEffect(() => {
    if (!autoPlay || paused || total <= 1) return
    const timer = setTimeout(() => setActive(a => (a + 1) % total), DURATION)
    return () => clearTimeout(timer)
  }, [active, autoPlay, paused, total])

  if (!total) return null

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; setPaused(true) }
  const handleTouchEnd = (e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (diff > 40) setActive(a => (a + 1) % total)
    else if (diff < -40) setActive(a => (a - 1 + total) % total)
    setTimeout(() => setPaused(false), 3000)
  }

  // Phone frame builder — renders iframe or screenshot
  const renderPhone = (i, size, showShadow) => {
    const url = liveUrls?.[i]
    const img = screenshots?.[i]
    const w = size === 'large' ? 220 : 140
    const h = size === 'large' ? 440 : 280
    const iframeW = 375
    const iframeH = 812
    const screenW = w - 8
    const scaleFactor = screenW / iframeW

    return (
      <div style={{ width: w, height: h, borderRadius: w * 0.15, background: '#1a1a1a', padding: 4, position: 'relative', boxShadow: showShadow ? `0 20px 50px ${color}25, 0 8px 20px rgba(0,0,0,0.2)` : '0 4px 12px rgba(0,0,0,0.15)', border: '2px solid #333', flexShrink: 0 }}>
        <div style={{ position: 'absolute', right: -3, top: h * 0.22, width: 3, height: h * 0.07, borderRadius: '0 2px 2px 0', background: '#333' }} />
        <div style={{ width: '100%', height: '100%', borderRadius: w * 0.13, overflow: 'hidden', position: 'relative', background: '#000' }}>
          <div style={{ position: 'absolute', top: size === 'large' ? 7 : 5, left: '50%', transform: 'translateX(-50%)', width: size === 'large' ? 56 : 36, height: size === 'large' ? 16 : 10, background: '#000', borderRadius: 12, zIndex: 10 }} />
          {url && !offline ? (
            <div style={{ position: 'absolute', inset: 0 }}>
              <div style={{ width: iframeW, height: iframeH, transform: `scale(${scaleFactor})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                <iframe src={url} style={{ width: iframeW, height: iframeH, border: 'none', pointerEvents: 'none' }} title={`Demo ${i}`} loading={i === 0 ? 'eager' : 'lazy'} />
              </div>
            </div>
          ) : img ? (
            <img src={img} alt="" onError={imgError('screenshot')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${color}20, ${color}08)` }}>
              <span style={{ fontSize: size === 'large' ? 36 : 24, opacity: 0.4 }}>📱</span>
              <span style={{ fontSize: size === 'large' ? 11 : 8, color: '#888', marginTop: 4, fontWeight: 600 }}>{LABELS[i]?.title || 'Preview'}</span>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: size === 'large' ? 5 : 3, left: '50%', transform: 'translateX(-50%)', width: size === 'large' ? 60 : 38, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px 0 16px' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* 3D Carousel */}
      <div style={{ perspective: 900, position: 'relative', height: autoPlay ? 460 : 380, overflow: 'hidden', margin: '0 auto', maxWidth: 440 }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Array.from({ length: total }, (_, i) => {
            const offset = i - active
            // Wrap around for continuous feel
            let adjustedOffset = offset
            if (total > 3) {
              if (offset > total / 2) adjustedOffset = offset - total
              if (offset < -total / 2) adjustedOffset = offset + total
            }
            const absOff = Math.abs(adjustedOffset)
            if (absOff > 2) return null

            const isCenter = adjustedOffset === 0
            const translateX = adjustedOffset * (autoPlay ? 110 : 100)
            const translateZ = isCenter ? 0 : -140 * absOff
            const rotateY = adjustedOffset * -20
            const scale = isCenter ? 1 : Math.max(0.5, 1 - absOff * 0.28)
            const opacity = isCenter ? 1 : Math.max(0.3, 1 - absOff * 0.35)
            const zIndex = 10 - absOff

            return (
              <div
                key={i}
                onClick={() => { setActive(i); setPaused(true); setTimeout(() => setPaused(false), 5000) }}
                style={{
                  position: 'absolute',
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transition: 'all 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  cursor: isCenter ? 'default' : 'pointer',
                  filter: isCenter ? 'none' : 'brightness(0.65) blur(0.5px)',
                }}
              >
                {renderPhone(i, isCenter && autoPlay ? 'large' : 'small', isCenter)}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step label (autoPlay mode) */}
      {autoPlay && LABELS[active] && (
        <div style={{ textAlign: 'center', marginBottom: 10, marginTop: -6 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>{LABELS[active]?.title}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{LABELS[active]?.desc}</div>
        </div>
      )}

      {/* Progress dots */}
      {autoPlay && <style>{`@keyframes dotFill { from { width: 0%; } to { width: 100%; } }`}</style>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
        {Array.from({ length: total }, (_, i) => (
          <button key={i} onClick={() => { setActive(i); setPaused(true); setTimeout(() => setPaused(false), 5000) }} style={{
            width: active === i ? (autoPlay ? 26 : 18) : 8, height: 8, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer',
            background: i < active ? color : (i === active ? 'transparent' : '#ddd'),
            position: 'relative', overflow: 'hidden', transition: 'width 0.3s ease',
          }}>
            {active === i && autoPlay ? (
              <div key={`fill-${active}`} style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: color, borderRadius: 4, animation: paused ? 'none' : `dotFill ${DURATION}ms linear` }} />
            ) : active === i ? (
              <div style={{ position: 'absolute', inset: 0, background: color, borderRadius: 4 }} />
            ) : null}
          </button>
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

/* ─── Local Search Mock Data ─── */
const SEARCH_CATEGORIES = []

const MOCK_VENDORS = [
  {
    id: 'demo-1', shop_name: 'Warung Pak Joko', shop_food_type: 'Indonesian', slug: 'warung-pak-joko',
    shop_address: 'Jl. Margonda Raya 12, Depok', shop_open: true, status: 'open',
    distance_km: 1.2, delivery_enabled: true, delivery_fee: 5000, pickup_time: '15 min', rating: 4.8, reviews: 124,
    popular: true, has_promo: true, accent: '#FF6B35',
    menu: [
      { name: 'Nasi Goreng Spesial', img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200', orders: 312, price: 18000, promoPrice: 14000, prepTime: 15, tags: ['nasi goreng', 'fried rice', 'rice'] },
      { name: 'Es Teh Manis', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', orders: 180, price: 5000, prepTime: 3, tags: ['drinks', 'tea', 'iced tea'] },
      { name: 'Ayam Goreng', img: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=200', orders: 95, price: 20000, prepTime: 20, tags: ['chicken', 'ayam', 'fried chicken'] },
      { name: 'Gorengan', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200', orders: 67, price: 5000, prepTime: 5, tags: ['snacks', 'gorengan', 'fried'] },
    ],
  },
  {
    id: 'demo-2', shop_name: 'Kopi Kita', shop_food_type: 'Coffee & Drinks', slug: 'kopi-kita',
    shop_address: 'Jl. Sawangan 45, Depok', shop_open: true, status: 'open',
    distance_km: 2.8, delivery_enabled: false, delivery_fee: 0, pickup_time: '10 min', rating: 4.6, reviews: 89,
    popular: false, has_promo: false, accent: '#8a570f',
    menu: [
      { name: 'Kopi Susu Gula Aren', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200', orders: 420, price: 18000, promoPrice: 12000, prepTime: 5, tags: ['coffee', 'kopi', 'drinks'] },
      { name: 'Matcha Latte', img: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=200', orders: 185, price: 22000, prepTime: 5, tags: ['matcha', 'drinks', 'tea'] },
      { name: 'Jus Mangga', img: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=200', orders: 130, price: 15000, prepTime: 3, tags: ['juice', 'mango', 'drinks'] },
      { name: 'Roti Bakar', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200', orders: 88, price: 12000, prepTime: 10, tags: ['snacks', 'toast', 'bread'] },
    ],
  },
  {
    id: 'demo-3', shop_name: 'Sate Madura Haji Ahmad', shop_food_type: 'Chicken Satay', slug: 'sate-haji-ahmad',
    shop_address: 'Jl. Raya Bogor KM 30, Cimanggis', shop_open: true, status: 'open',
    distance_km: 4.5, delivery_enabled: true, delivery_fee: 0, pickup_time: '20 min', rating: 4.9, reviews: 312,
    popular: true, has_promo: false, accent: '#c15d15',
    menu: [
      { name: 'Sate Ayam 10 Tusuk', img: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200', orders: 890, price: 25000, prepTime: 20, tags: ['satay', 'sate', 'chicken', 'ayam'] },
      { name: 'Lontong', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200', orders: 340, price: 5000, prepTime: 5, tags: ['rice', 'lontong', 'rice cake'] },
      { name: 'Es Jeruk', img: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200', orders: 210, price: 8000, prepTime: 3, tags: ['drinks', 'juice', 'orange'] },
    ],
  },
  {
    id: 'demo-4', shop_name: 'Bakso Solo Mas Budi', shop_food_type: 'Bakso & Mie Ayam', slug: 'bakso-mas-budi',
    shop_address: 'Jl. Nusantara Raya 8, Beji, Depok', shop_open: false, status: 'closed', opens_at: '9:00 AM',
    distance_km: 3.1, delivery_enabled: true, delivery_fee: 6000, pickup_time: '15 min', rating: 4.7, reviews: 203,
    popular: true, has_promo: true, accent: '#e8992c',
    menu: [
      { name: 'Bakso Urat Jumbo', img: 'https://images.unsplash.com/photo-1583835746434-cf1534674b41?w=200', orders: 540, price: 15000, promoPrice: 10000, prepTime: 10, tags: ['bakso', 'meatball', 'soup'] },
      { name: 'Mie Ayam Komplit', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200', orders: 380, price: 15000, prepTime: 10, tags: ['noodle', 'mie ayam', 'chicken noodle'] },
      { name: 'Es Teh Manis', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', orders: 290, price: 5000, prepTime: 3, tags: ['drinks', 'tea', 'iced tea'] },
      { name: 'Pangsit Goreng', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200', orders: 120, price: 8000, prepTime: 8, tags: ['snacks', 'fried', 'wonton'] },
    ],
  },
  {
    id: 'demo-5', shop_name: 'Martabak San Francisco', shop_food_type: 'Martabak', slug: 'martabak-sf',
    shop_address: 'Jl. Dewi Sartika 22, Depok', shop_open: true, status: 'open',
    distance_km: 1.8, delivery_enabled: true, delivery_fee: 0, pickup_time: '20 min', rating: 4.7, reviews: 178,
    popular: true, has_promo: true, accent: '#8a0f8a',
    menu: [
      { name: 'Martabak Manis Coklat', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200', orders: 620, price: 35000, promoPrice: 25000, prepTime: 15, tags: ['martabak', 'chocolate', 'dessert', 'snacks'] },
      { name: 'Martabak Telur', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200', orders: 410, price: 30000, prepTime: 15, tags: ['martabak', 'egg', 'savory'] },
      { name: 'Es Cendol', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', orders: 195, price: 8000, prepTime: 5, tags: ['drinks', 'cendol', 'dessert'] },
    ],
  },
  {
    id: 'demo-6', shop_name: 'Kebab Turki Baba Rafi', shop_food_type: 'Kebab', slug: 'kebab-baba-rafi',
    shop_address: 'Jl. Juanda 15, Depok', shop_open: true, status: 'open',
    distance_km: 2.2, delivery_enabled: false, delivery_fee: 0, pickup_time: '12 min', rating: 4.5, reviews: 156,
    popular: false, has_promo: false, accent: '#FF6B35',
    menu: [
      { name: 'Kebab Original', img: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=200', orders: 480, price: 22000, prepTime: 10, tags: ['kebab', 'wrap', 'street food'] },
      { name: 'Burger Beef', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', orders: 320, price: 28000, promoPrice: 20000, prepTime: 12, tags: ['burger', 'beef', 'street food'] },
      { name: 'Es Lemon Tea', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200', orders: 150, price: 8000, prepTime: 3, tags: ['drinks', 'tea', 'lemon'] },
    ],
  },
  {
    id: 'demo-7', shop_name: 'Juice Bar Segar', shop_food_type: 'Fresh Juice', slug: 'juice-bar-segar',
    shop_address: 'Jl. Kemang Raya 88, Jakarta Selatan', shop_open: true, status: 'open',
    distance_km: 5.4, delivery_enabled: true, delivery_fee: 10000, pickup_time: '8 min', rating: 4.8, reviews: 94,
    popular: false, has_promo: true, accent: '#e8b92c',
    menu: [
      { name: 'Jus Alpukat', img: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=200', orders: 380, price: 18000, promoPrice: 13000, prepTime: 5, tags: ['juice', 'avocado', 'drinks'] },
      { name: 'Smoothie Bowl', img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200', orders: 260, price: 25000, prepTime: 7, tags: ['smoothie', 'bowl', 'healthy', 'drinks'] },
      { name: 'Jus Mangga', img: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=200', orders: 210, price: 15000, prepTime: 3, tags: ['juice', 'mango', 'drinks'] },
    ],
  },
]

const VENDOR_STATUS_CONFIG = {
  open: { color: '#22c55e', dot: '#22c55e' },
  closed: { color: '#ef4444', dot: '#ef4444' },
}

/* ─── Contact Page Data ─── */
const SUPPORT_CATEGORIES = [
  { icon: '🏪', title: 'Store Setup', description: 'Get help setting up your digital storefront', ticketsInQ: 3, faqs: [
    { q: 'How do I create my store?', a: 'Sign up, choose a plan, and follow our guided setup wizard. Your store will be live in under 5 minutes.' },
    { q: 'Can I customize my store design?', a: 'Yes! Choose from 100+ themes and customize colors, fonts, and layouts to match your brand.' },
    { q: 'Do I need technical knowledge?', a: 'No. Our platform is designed for non-technical users. Everything is drag-and-drop.' }
  ]},
  { icon: '💳', title: 'Billing & Payments', description: 'Subscription, invoices, and payment methods', ticketsInQ: 1, faqs: [
    { q: 'What payment methods do you accept?', a: 'We accept bank transfer, credit cards, and digital wallets including GoPay, OVO, and Dana.' },
    { q: 'How do I upgrade my plan?', a: 'Go to Settings > Subscription and select your new plan. Changes take effect immediately.' },
    { q: 'Can I get a refund?', a: 'We offer a 7-day money-back guarantee on all plans. Contact support within 7 days of purchase.' }
  ]},
  { icon: '🌐', title: 'Custom Domains', description: 'Domain connection, DNS, and SSL certificates', ticketsInQ: 0, faqs: [
    { q: 'How do I connect my domain?', a: 'Add a CNAME record pointing to our servers. We handle SSL automatically.' },
    { q: 'Can I buy a domain through StreetLocal?', a: 'Yes, we offer domain registration starting from $12/year through our domain packages.' },
    { q: 'How long does DNS propagation take?', a: 'Usually 15-30 minutes, but can take up to 48 hours in rare cases.' }
  ]},
  { icon: '📱', title: 'Mobile App', description: 'PWA features, notifications, and mobile optimization', ticketsInQ: 2, faqs: [
    { q: 'Is there a mobile app?', a: 'Your store is a Progressive Web App (PWA) — customers can install it directly from their browser.' },
    { q: 'How do push notifications work?', a: 'Enable notifications in your dashboard. Customers who install your PWA will receive order updates automatically.' },
    { q: 'Does it work offline?', a: 'Yes, basic browsing and menu viewing work offline. Orders require an internet connection.' }
  ]},
  { icon: '🎨', title: 'Themes & Design', description: 'Templates, customization, and branding', ticketsInQ: 1, faqs: [
    { q: 'How many themes are available?', a: 'Over 100 professionally designed themes, all optimized for mobile and desktop.' },
    { q: 'Can I use custom CSS?', a: 'Pro and Enterprise plans support custom CSS for advanced styling.' },
    { q: 'Can I preview themes before applying?', a: 'Yes, use the live preview feature to see how any theme looks with your content.' }
  ]},
  { icon: '📊', title: 'Analytics & Reports', description: 'Traffic, sales data, and performance metrics', ticketsInQ: 0, faqs: [
    { q: 'What analytics are included?', a: 'Page views, unique visitors, conversion rates, top products, and revenue tracking.' },
    { q: 'Can I export reports?', a: 'Yes, export reports as CSV or PDF from your analytics dashboard.' },
    { q: 'Is Google Analytics supported?', a: 'Yes, connect your GA4 property in Settings > Integrations.' }
  ]},
  { icon: '🔒', title: 'Security & Privacy', description: 'Account security, data protection, and compliance', ticketsInQ: 0, faqs: [
    { q: 'Is my data secure?', a: 'We use bank-level encryption (AES-256) and all data is stored on secure cloud infrastructure.' },
    { q: 'Do you comply with data regulations?', a: 'Yes, we comply with GDPR, and Indonesian data protection regulations.' },
    { q: 'How do I enable 2FA?', a: 'Go to Settings > Security and enable two-factor authentication via SMS or authenticator app.' }
  ]},
  { icon: '🤝', title: 'Affiliate Program', description: 'Commissions, referrals, and partner support', ticketsInQ: 4, faqs: [
    { q: 'How much commission do I earn?', a: '100% of the first month subscription for every vendor you refer.' },
    { q: 'When do I get paid?', a: 'Commissions are paid monthly, 30 days after the referred vendor activates.' },
    { q: 'Is there a referral limit?', a: 'No limit. Refer as many vendors as you want.' }
  ]},
  { icon: '🛒', title: 'Product Management', description: 'Adding products, inventory, and categories', ticketsInQ: 2, faqs: [
    { q: 'How many products can I add?', a: 'Depends on your plan — Starter allows 50, Pro allows 500, Enterprise is unlimited.' },
    { q: 'Can I import products in bulk?', a: 'Yes, use our CSV import tool to add hundreds of products at once.' },
    { q: 'How do I manage inventory?', a: 'Set stock levels per product. Get alerts when inventory is low.' }
  ]},
  { icon: '📦', title: 'Orders & Delivery', description: 'Order processing, shipping, and fulfillment', ticketsInQ: 5, faqs: [
    { q: 'How do I process orders?', a: 'Orders appear in your dashboard in real-time. Accept, prepare, and mark as delivered.' },
    { q: 'Do you integrate with delivery services?', a: 'We integrate with GrabExpress, GoSend, and other local delivery partners.' },
    { q: 'Can customers track their orders?', a: 'Yes, customers receive real-time status updates via WhatsApp and in-app notifications.' }
  ]},
  { icon: '⚙️', title: 'Technical Issues', description: 'Bugs, errors, and platform troubleshooting', ticketsInQ: 1, faqs: [
    { q: 'My store is loading slowly', a: 'Clear your browser cache, check your image sizes (we recommend under 500KB), and contact support if it persists.' },
    { q: 'I see an error message', a: 'Take a screenshot and submit a ticket with the error details. Our team will investigate within 1 hour.' },
    { q: 'The dashboard is not updating', a: 'Try refreshing the page. If the issue persists, clear cookies and log in again.' }
  ]},
  { icon: '🏢', title: 'Enterprise Solutions', description: 'Custom development, API access, and SLAs', ticketsInQ: 0, faqs: [
    { q: 'Do you offer custom development?', a: 'Yes, our enterprise team can build custom features, integrations, and white-label solutions.' },
    { q: 'Is API access available?', a: 'Enterprise plans include full REST API access with comprehensive documentation.' },
    { q: 'What SLAs do you offer?', a: 'Enterprise plans include 99.9% uptime SLA with dedicated support and priority response times.' }
  ]},
  { icon: '📣', title: 'Marketing & SEO', description: 'Promotions, social media, and search optimization', ticketsInQ: 1, faqs: [
    { q: 'Is SEO built in?', a: 'Yes, every store includes meta tags, sitemaps, structured data, and mobile optimization.' },
    { q: 'Can I run promotions?', a: 'Create discount codes, flash sales, and bundle deals from your marketing dashboard.' },
    { q: 'Do you support social media integration?', a: 'Connect Instagram, Facebook, and TikTok to sync products and share updates.' }
  ]},
  { icon: '🌍', title: 'Multi-Language', description: 'Translations, regional settings, and localization', ticketsInQ: 0, faqs: [
    { q: 'What languages are supported?', a: 'Indonesian, English, Malay, Thai, Vietnamese, Filipino, and more being added.' },
    { q: 'Can my store be multilingual?', a: 'Yes, Pro and Enterprise plans support multiple languages with automatic detection.' },
    { q: 'How do I change my store language?', a: 'Go to Settings > Language and select your default language. Customers can switch languages too.' }
  ]}
]

const CONTACT_DEPARTMENTS = [
  { icon: '🎯', name: 'Sales', metric: '45 deals/month', status: 'online' },
  { icon: '🛠️', name: 'Technical Support', metric: '1.2hr avg response', status: 'online' },
  { icon: '💰', name: 'Billing', metric: '99.8% resolution', status: 'online' },
  { icon: '🎨', name: 'Design Studio', metric: '100+ themes', status: 'online' },
  { icon: '📱', name: 'Mobile Team', metric: 'PWA experts', status: 'online' },
  { icon: '🔧', name: 'Engineering', metric: '99.9% uptime', status: 'online' },
  { icon: '🤝', name: 'Partnerships', metric: '50+ integrations', status: 'online' },
  { icon: '📊', name: 'Analytics', metric: 'Real-time data', status: 'online' },
  { icon: '🛡️', name: 'Security', metric: 'AES-256 encryption', status: 'online' },
  { icon: '🌏', name: 'APAC Operations', metric: '12 countries', status: 'online' },
  { icon: '📚', name: 'Training', metric: '200+ guides', status: 'busy' },
  { icon: '🚀', name: 'Onboarding', metric: '5 min setup', status: 'busy' }
]

const CONTACT_CHANNELS = [
  { icon: '🎫', name: 'Support Ticket', availability: 'Mon-Fri 09:00-21:00 WIB', responseTime: 'Tickets processed in queue', primary: true, color: '#FFD600', href: null, action: 'ticket' },
  { icon: '📧', name: 'Email Support', availability: 'Mon-Fri 09:00-21:00 WIB', responseTime: 'Tickets processed in queue', primary: false, color: '#1a73e8', href: null, action: 'ticket' },
  { icon: '⚡', name: 'Priority Support', availability: 'Enterprise plans', responseTime: 'Fast-tracked queue', primary: false, color: '#ff6b35', href: null },
  { icon: '🛡️', name: 'Site Operations', availability: '24/7 monitoring', responseTime: 'Automated systems', primary: false, color: '#6366f1', href: null },
  { icon: '💼', name: 'Sales Consultation', availability: 'Mon-Fri 09:00-18:00 WIB', responseTime: 'Tickets processed in queue', primary: false, color: '#1a1a1a', href: null, action: 'sales' },
]

const CONTACT_COMPANY_STATS = [
  { label: 'Vendors', target: 500, suffix: '+' },
  { label: 'Apps Built', target: 50, suffix: '+' },
  { label: 'Uptime', target: 99.9, suffix: '%', decimal: true },
  { label: 'Countries', target: 12, suffix: '+' },
  { label: 'Themes', target: 100, suffix: '+' },
  { label: 'Support', target: 24, suffix: '/7' }
]

// Critical image URLs preloaded at app startup so the home page never shows
// half-loaded thumbnails. Browser kicks off these fetches in parallel before
// React renders the theme strips, populating cache for when the img tags mount.
const PRELOAD_URLS = [
  // Hero
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-5-2026-02_58_20-pm.png',
  // Logo / home button
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png',
  // Top food themes (most visible on initial scroll)
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_41_03-am.png',
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-10_11_01-am.png',
  'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511012941.png',
  'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511013408.png',
  'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511014830.png',
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_45_14-am.png',
  'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511012403.png',
  'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511014403.png',
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_52_32-pm.png',
  // Top product themes
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-shoes.png',
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handbags.png',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2010,%202026,%2004_57_19%20PM.png?updatedAt=1778407052888',
  'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2010,%202026,%2011_41_38%20AM.png?updatedAt=1778388112989',
  'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasd.png?updatedAt=1778435998178',
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-electrical.png',
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-phone-cases.png',
  'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-beauty-products.png',
  'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511015514.png',
]

// Fire image preloads as soon as this module evaluates — runs before React mounts.
if (typeof window !== 'undefined') {
  PRELOAD_URLS.forEach(url => { const img = new Image(); img.decoding = 'async'; img.src = url })
}

// Searchable index of every food + product theme. Used by the landing search
// to suggest categories when a user types a keyword like "burger" or "hijab"
// — they jump straight to the right app. `app` controls which app URL the
// suggestion links to.
const THEME_INDEX = [
  // Food themes — open the food/whatsapp demo
  { id: 'satay', label: 'Chicken Satay', app: 'food', accent: '#c15d15', keywords: ['sate', 'satay', 'skewer', 'ayam', 'kambing', 'grilled'] },
  { id: 'friedrice', label: 'Nasi Goreng', app: 'food', accent: '#FF6B35', keywords: ['nasi', 'goreng', 'fried rice', 'rice'] },
  { id: 'noodle', label: 'Noodles', app: 'food', accent: '#8B0000', keywords: ['mie', 'noodle', 'ramen', 'pasta', 'mie ayam'] },
  { id: 'chicken', label: 'Crispy Chicken', app: 'food', accent: '#c15d15', keywords: ['chicken', 'fried chicken', 'crispy chicken', 'ayam', 'ayam goreng'] },
  { id: 'juice', label: 'Fresh Juice', app: 'food', accent: '#e8b92c', keywords: ['juice', 'jus', 'smoothie', 'fresh juice'] },
  { id: 'coffee', label: 'Coffee', app: 'food', accent: '#8a570f', keywords: ['kopi', 'coffee', 'espresso', 'latte', 'cafe'] },
  { id: 'bakso', label: 'Bakso', app: 'food', accent: '#e8992c', keywords: ['bakso', 'meatball', 'soup'] },
  { id: 'martabak', label: 'Martabak', app: 'food', accent: '#8a0f8a', keywords: ['martabak', 'pancake', 'sweet pancake'] },
  { id: 'escendol', label: 'Es Cendol', app: 'food', accent: '#4d8a0f', keywords: ['cendol', 'es cendol', 'dessert', 'ice'] },
  { id: 'kebab', label: 'Kebab', app: 'food', accent: '#FF6B35', keywords: ['kebab', 'shawarma', 'doner', 'wrap'] },
  { id: 'pecellele', label: 'Pecel Lele', app: 'food', accent: '#6b8a0f', keywords: ['pecel lele', 'lele', 'fish', 'catfish'] },
  { id: 'ketoprak', label: 'Ketoprak', app: 'food', accent: '#B8860B', keywords: ['ketoprak', 'salad'] },
  { id: 'cilok', label: 'Cilok Cimol', app: 'food', accent: '#c15d15', keywords: ['cilok', 'cimol', 'snack'] },
  { id: 'ikanbakar', label: 'Ikan Bakar', app: 'food', accent: '#e8512c', keywords: ['ikan bakar', 'grilled fish', 'fish'] },
  { id: 'nasiuduk', label: 'Nasi Uduk', app: 'food', accent: '#e8b92c', keywords: ['nasi uduk', 'rice', 'coconut rice'] },
  { id: 'bebekgoreng', label: 'Bebek Goreng', app: 'food', accent: '#6b8a0f', keywords: ['bebek goreng', 'duck', 'fried duck'] },
  { id: 'burger', label: 'Burgers', app: 'food', accent: '#B8860B', keywords: ['burger', 'hamburger', 'cheeseburger'] },
  { id: 'donut', label: 'Donuts', app: 'food', accent: '#DB2777', keywords: ['donut', 'doughnut', 'dessert'] },
  { id: 'hotdog', label: 'Hot Dogs', app: 'food', accent: '#dc2626', keywords: ['hot dog', 'hotdog', 'sausage'] },
  { id: 'pizza', label: 'Pizza', app: 'food', accent: '#dc2626', keywords: ['pizza', 'italian'] },
  { id: 'vegetables', label: 'Vegetables', app: 'food', accent: '#27AE60', keywords: ['vegetables', 'fresh produce', 'greengrocer', 'sayur', 'sayuran', 'farm fresh', 'organic'] },
  { id: 'sweetbread', label: 'Sweet Bread', app: 'food', accent: '#D4A373', keywords: ['bread', 'roti', 'sweet bread', 'bakery', 'roti manis', 'sweet bun', 'bun'] },
  // Product themes — open the products/local demo
  { id: 'clothing', label: 'Clothing', app: 'products', accent: '#4A90D9', keywords: ['clothes', 'clothing', 'fashion', 'apparel'] },
  { id: 'shoes', label: 'Shoes', app: 'products', accent: '#8B4513', keywords: ['shoes', 'sneakers', 'footwear', 'sepatu'] },
  { id: 'raincoats', label: 'Raincoats', app: 'products', accent: '#2C5F8A', keywords: ['raincoat', 'jacket', 'waterproof', 'jas hujan'] },
  { id: 'running', label: 'Running Footwear', app: 'products', accent: '#1B2A4A', keywords: ['running', 'sneakers', 'athletic', 'jogger'] },
  { id: 'handbags', label: 'Handbags', app: 'products', accent: '#8B4513', keywords: ['handbag', 'bag', 'purse', 'tas'] },
  { id: 'hijab', label: 'Hijab & Scarves', app: 'products', accent: '#9B59B6', keywords: ['hijab', 'scarf', 'jilbab', 'headscarf', 'kerudung'] },
  { id: 'batik', label: 'Batik', app: 'products', accent: '#B8860B', keywords: ['batik', 'traditional', 'indonesian fashion'] },
  { id: 'tshirts', label: 'T-Shirts', app: 'products', accent: '#4A90D9', keywords: ['tshirt', 't-shirt', 'shirt', 'tee', 'kaos'] },
  { id: 'helmets', label: 'Helmets', app: 'products', accent: '#1a1a1a', keywords: ['helmet', 'motorcycle helmet', 'bike helmet', 'helm', 'safety'] },
  { id: 'electronics', label: 'Electronics', app: 'products', accent: '#2ECC71', keywords: ['electronics', 'gadgets', 'electrical', 'elektronik'] },
  { id: 'comprepair', label: 'Computer Repair', app: 'products', accent: '#1E90FF', keywords: ['computer repair', 'pc repair', 'laptop repair', 'tech support', 'service'] },
  { id: 'phoneacc', label: 'Phone Cases', app: 'products', accent: '#3498DB', keywords: ['phone case', 'phone accessories', 'mobile', 'phone', 'hp'] },
  { id: 'skincare', label: 'Beauty Products', app: 'products', accent: '#E91E90', keywords: ['beauty', 'skincare', 'makeup', 'cosmetics', 'kecantikan'] },
  { id: 'cosmetics', label: 'Cosmetics', app: 'products', accent: '#C0392B', keywords: ['cosmetics', 'makeup', 'lipstick', 'foundation'] },
  { id: 'perfume', label: 'Perfume', app: 'products', accent: '#8E44AD', keywords: ['perfume', 'fragrance', 'parfum', 'cologne'] },
  { id: 'homedecor', label: 'Home Decor', app: 'products', accent: '#D4A373', keywords: ['home decor', 'decoration', 'interior'] },
  { id: 'furniture', label: 'Furniture', app: 'products', accent: '#8FB4A3', keywords: ['furniture', 'sofa', 'table', 'chair', 'mebel'] },
  { id: 'kitchenware', label: 'Kitchenware', app: 'products', accent: '#FF6B35', keywords: ['kitchen', 'kitchenware', 'utensils', 'pots', 'pans', 'cookware'] },
  { id: 'packaging', label: 'Packaging', app: 'products', accent: '#795548', keywords: ['packaging', 'boxes', 'bags', 'wrapping'] },
  { id: 'handicraft', label: 'Handicrafts', app: 'products', accent: '#e8992c', keywords: ['handicraft', 'handmade', 'craft', 'kerajinan'] },
  { id: 'jewelry', label: 'Jewelry', app: 'products', accent: '#FFD700', keywords: ['jewelry', 'jewellery', 'ring', 'necklace', 'perhiasan'] },
  { id: 'candles', label: 'Candles', app: 'products', accent: '#e8b92c', keywords: ['candle', 'scented', 'lilin'] },
  { id: 'sports', label: 'Sports', app: 'products', accent: '#27AE60', keywords: ['sports', 'athletic', 'gym', 'fitness'] },
  { id: 'baby', label: 'Baby Clothes', app: 'products', accent: '#FF69B4', keywords: ['baby', 'baby clothes', 'kids', 'infant', 'bayi'] },
  { id: 'toys', label: "Children's Toys", app: 'products', accent: '#FF6B35', keywords: ['toys', 'kids toys', 'children toys', 'mainan'] },
  { id: 'school', label: 'School Accessories', app: 'products', accent: '#4A90D9', keywords: ['school', 'stationery', 'supplies', 'sekolah'] },
  { id: 'books', label: 'Books & Stationery', app: 'products', accent: '#2C3E50', keywords: ['books', 'stationery', 'reading', 'buku'] },
  { id: 'motortyres', label: 'Motorbike Tyres', app: 'products', accent: '#dc2626', keywords: ['tyre', 'tire', 'motorbike', 'motorcycle', 'ban motor'] },
  { id: 'seatcovers', label: 'Seat Covers', app: 'products', accent: '#795548', keywords: ['seat cover', 'car seat', 'motorcycle seat', 'jok'] },
  { id: 'bicycle', label: 'Bicycle', app: 'products', accent: '#2E86AB', keywords: ['bicycle', 'bike', 'cycle', 'sepeda'] },
  { id: 'automotive', label: 'Automotive', app: 'products', accent: '#dc2626', keywords: ['automotive', 'car accessories', 'auto', 'mobil'] },
  { id: 'pets', label: 'Pet Supplies', app: 'products', accent: '#6b8a0f', keywords: ['pet', 'pets', 'dog', 'cat', 'pet supplies', 'hewan'] },
  { id: 'grocery', label: 'Grocery & Snacks', app: 'products', accent: '#c15d15', keywords: ['grocery', 'snack', 'market', 'sembako'] },
  { id: 'tobacco', label: 'Tobacco', app: 'products', accent: '#8B0000', keywords: ['tobacco', 'cigarette', 'smoke', 'vape', 'rokok'] },
  { id: 'herbal', label: 'Herbal & Jamu', app: 'products', accent: '#4d8a0f', keywords: ['herbal', 'jamu', 'natural medicine', 'tradisional'] },
  { id: 'digital', label: 'Digital Products', app: 'products', accent: '#8E44AD', keywords: ['digital', 'software', 'online', 'gift card'] },
  { id: 'general', label: 'General Store', app: 'products', accent: '#4A90D9', keywords: ['general', 'mixed', 'variety', 'toko'] },
  { id: 'tradfurniture', label: 'Traditional Furniture', app: 'products', accent: '#6F4E37', keywords: ['traditional furniture', 'antique furniture', 'wooden furniture', 'heritage furniture', 'mebel tradisional'] },
  { id: 'carvedwood', label: 'Carved Wood', app: 'products', accent: '#8B4513', keywords: ['carved wood', 'wood carving', 'woodwork', 'ukir kayu', 'ukiran'] },
  { id: 'secondhand', label: 'Second Hand', app: 'products', accent: '#5D6D7E', keywords: ['second hand', 'thrift', 'preloved', 'used', 'bekas', 'loak'] },
  { id: 'womensclothes', label: "Women's Clothes", app: 'products', accent: '#E91E63', keywords: ["women's clothes", 'womenswear', 'dress', 'baju wanita', 'pakaian wanita', 'gaun'] },
  // Service themes — open the services/whatsapp demo
  { id: 'cleaning', label: 'Cleaning', app: 'services', accent: '#3498DB', keywords: ['cleaning', 'cleaner', 'house cleaning', 'office cleaning', 'pembersih', 'jasa kebersihan'] },
  { id: 'plumbing', label: 'Plumbing', app: 'services', accent: '#1B6BA8', keywords: ['plumbing', 'plumber', 'pipes', 'bathroom', 'tukang ledeng'] },
  { id: 'electrician', label: 'Electrician', app: 'services', accent: '#F1C40F', keywords: ['electrician', 'electrical', 'wiring', 'tukang listrik'] },
  { id: 'aircon', label: 'AC Service', app: 'services', accent: '#3498DB', keywords: ['ac', 'air conditioning', 'aircon', 'ac repair', 'service ac'] },
  { id: 'carpenter', label: 'Carpenter', app: 'services', accent: '#8B4513', keywords: ['carpenter', 'woodwork', 'tukang kayu', 'furniture maker'] },
  { id: 'painter', label: 'Painter', app: 'services', accent: '#2ECC71', keywords: ['painter', 'house painting', 'wall painting', 'tukang cat'] },
  { id: 'glass', label: 'Glass Supplier', app: 'services', accent: '#3498DB', keywords: ['glass', 'glass supplier', 'glazier', 'window glass', 'kaca', 'tukang kaca'] },
  { id: 'roofrepair', label: 'Roof Repairs', app: 'services', accent: '#A0522D', keywords: ['roof', 'roof repair', 'roofing', 'tukang atap', 'genteng', 'leak repair'] },
  { id: 'plastering', label: 'Plastering', app: 'services', accent: '#BDC3C7', keywords: ['plastering', 'plasterer', 'wall plaster', 'tukang plester', 'render', 'finishing'] },
  { id: 'propertysales', label: 'Property Sales', app: 'services', accent: '#16A085', keywords: ['property sales', 'real estate', 'house for sale', 'agen properti', 'jual rumah'] },
  { id: 'propertyrentals', label: 'Property Rentals', app: 'services', accent: '#2980B9', keywords: ['property rental', 'rent', 'house rental', 'sewa rumah', 'rumah disewakan', 'rental properti'] },
  { id: 'website', label: 'Website Services', app: 'services', accent: '#3498DB', keywords: ['website', 'website design', 'web design', 'jasa website', 'web developer', 'wordpress', 'landing page'] },
  { id: 'gardening', label: 'Gardening', app: 'services', accent: '#27AE60', keywords: ['gardening', 'landscaping', 'gardener', 'tukang kebun'] },
  { id: 'locksmith', label: 'Locksmith', app: 'services', accent: '#7F8C8D', keywords: ['locksmith', 'lock repair', 'key service', 'tukang kunci'] },
  { id: 'pest', label: 'Pest Control', app: 'services', accent: '#1ABC9C', keywords: ['pest control', 'exterminator', 'fumigasi', 'jasa basmi hama'] },
  { id: 'massage', label: 'Massage', app: 'services', accent: '#E91E63', keywords: ['massage', 'pijat', 'spa', 'therapy', 'reflexology'] },
  { id: 'salon', label: 'Salon', app: 'services', accent: '#FF69B4', keywords: ['salon', 'hair', 'beauty', 'haircut', 'salon kecantikan'] },
  { id: 'beautician', label: 'Beautician', app: 'services', accent: '#C0392B', keywords: ['beautician', 'facial', 'makeup', 'makeup artist', 'eyebrow', 'eyelash', 'mua', 'kecantikan'] },
  { id: 'laser', label: 'Laser Service', app: 'services', accent: '#8E44AD', keywords: ['laser', 'laser hair removal', 'aesthetic', 'skin treatment', 'laser service', 'beauty laser'] },
  { id: 'tattoo', label: 'Tattoo', app: 'services', accent: '#1a1a1a', keywords: ['tattoo', 'tattoo studio', 'body art', 'tato'] },
  { id: 'yoga', label: 'Yoga Trainer', app: 'services', accent: '#8E44AD', keywords: ['yoga', 'fitness', 'personal trainer', 'yoga trainer', 'gym'] },
  { id: 'mechanic', label: 'Mechanic', app: 'services', accent: '#dc2626', keywords: ['mechanic', 'bengkel', 'auto repair', 'car service', 'motor service'] },
  { id: 'carwash', label: 'Car Wash', app: 'services', accent: '#2980B9', keywords: ['car wash', 'auto detailing', 'cuci mobil', 'detailing'] },
  { id: 'driving', label: 'Driving Instructor', app: 'services', accent: '#FFD600', keywords: ['driving instructor', 'driving school', 'driving lessons', 'kursus mengemudi'] },
  { id: 'photographer', label: 'Photographer', app: 'services', accent: '#1a1a1a', keywords: ['photographer', 'photography', 'wedding photo', 'photo studio', 'fotografer'] },
  { id: 'tailor', label: 'Tailor', app: 'services', accent: '#8E44AD', keywords: ['tailor', 'sewing', 'alterations', 'penjahit', 'jahit'] },
  { id: 'petgroom', label: 'Pet Grooming', app: 'services', accent: '#F39C12', keywords: ['pet grooming', 'dog grooming', 'pet care', 'salon hewan'] },
  { id: 'tutor', label: 'Tutor', app: 'services', accent: '#9B59B6', keywords: ['tutor', 'tutoring', 'les privat', 'education', 'private teacher'] },
  { id: 'music', label: 'Music Lessons', app: 'services', accent: '#E74C3C', keywords: ['music lessons', 'piano', 'guitar', 'music teacher', 'les musik'] },
  { id: 'webdev', label: 'Web Developer', app: 'services', accent: '#3498DB', keywords: ['web developer', 'freelance', 'it service', 'programming', 'jasa website'] },
  { id: 'translator', label: 'Translator', app: 'services', accent: '#16A085', keywords: ['translator', 'translation', 'interpreter', 'penerjemah'] },
  { id: 'accountant', label: 'Accountant', app: 'services', accent: '#34495E', keywords: ['accountant', 'bookkeeping', 'tax', 'akuntan', 'pembukuan'] },
  { id: 'lawyer', label: 'Lawyer', app: 'services', accent: '#2C3E50', keywords: ['lawyer', 'legal', 'notary', 'pengacara', 'jasa hukum'] },
  { id: 'event', label: 'Event Planning', app: 'services', accent: '#E91E63', keywords: ['event planning', 'wedding', 'event organizer', 'eo'] },
  { id: 'childcare', label: 'Childcare', app: 'services', accent: '#FF69B4', keywords: ['childcare', 'babysitter', 'nanny', 'pengasuh anak', 'baby sitter'] },
  { id: 'courier', label: 'Courier', app: 'services', accent: '#FF6B35', keywords: ['courier', 'delivery', 'kurir', 'jasa antar', 'package delivery'] },
  { id: 'leather', label: 'Leather Supplier', app: 'services', accent: '#5D2E0D', keywords: ['leather', 'leather supplier', 'leather goods', 'tanner', 'kulit'] },
  { id: 'maid', label: 'House Maid', app: 'services', accent: '#E91E63', keywords: ['maid', 'house maid', 'housekeeper', 'pembantu', 'domestic helper', 'cleaning service'] },
  { id: 'motorrent', label: 'Motorbike Rental', app: 'services', accent: '#FF6B35', keywords: ['motorbike rental', 'scooter rental', 'sewa motor', 'bike rental', 'rent motor'] },
  { id: 'tourguide', label: 'Tour Guide', app: 'services', accent: '#16A085', keywords: ['tour guide', 'local guide', 'tour operator', 'pemandu wisata', 'city tour'] },
  { id: 'carrent', label: 'Car Rental', app: 'services', accent: '#34495E', keywords: ['car rental', 'sewa mobil', 'car hire', 'rental mobil', 'self drive'] },
  { id: 'wedding', label: 'Wedding Clothes', app: 'services', accent: '#FFD600', keywords: ['wedding', 'wedding dress', 'bridal', 'tuxedo', 'baju pengantin', 'wedding suit'] },
  { id: 'barber', label: 'Barber Shop', app: 'services', accent: '#1a1a1a', keywords: ['barber', 'barber shop', 'mens haircut', 'pangkas rambut', 'tukang cukur'] },
  { id: 'hairsalon', label: 'Hair Salon', app: 'services', accent: '#FF69B4', keywords: ['hair salon', 'hairdresser', 'hair styling', 'salon rambut', 'coloring', 'highlights'] },
  { id: 'nailart', label: 'Nail Art', app: 'services', accent: '#E91E63', keywords: ['nail art', 'manicure', 'pedicure', 'nail salon', 'kuteks', 'gel nail'] },
  { id: 'cardriver', label: 'Car Driver', app: 'services', accent: '#2C3E50', keywords: ['car driver', 'private driver', 'chauffeur', 'sopir pribadi', 'driver hire'] },
]

// Return THEME_INDEX entries whose label/id/keywords contain the query.
function findThemeMatches(query, limit = 6) {
  const q = (query || '').toLowerCase().trim()
  if (!q) return []
  return THEME_INDEX.filter(t =>
    t.label.toLowerCase().includes(q) ||
    t.id.toLowerCase().includes(q) ||
    t.keywords.some(k => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()))
  ).slice(0, limit)
}

// Build the demo URL for a theme suggestion, respecting localhost dev ports.
function themeDemoUrl(theme) {
  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  if (theme.app === 'food') {
    // food-basic is the consolidated food vendor app; was foodlocalchat before Phase C rename.
    return (isLocal ? 'http://localhost:5177/food/chat/' : '/food/chat/') + '?demo=true&page=landing&theme=' + theme.id
  }
  if (theme.app === 'services') {
    return (isLocal ? 'http://localhost:5183/services/whatsapp/' : '/services/whatsapp/') + '?demo=true&page=landing&theme=' + theme.id
  }
  return (isLocal ? 'http://localhost:5178/products/local/' : '/products/local/') + '?demo=true&page=landing&theme=' + theme.id
}

// Reference code for offline payments. Customer includes this in their bank
// transfer description so admin can match the incoming payment to the right
// registration row. Excludes look-alike chars (O/0/I/1).
function generatePaymentRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = 'SL-'
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

/* ─── Main App ─── */
export default function App() {
  const [selectedApp, setSelectedApp] = useState(null)
  const [previewTheme, setPreviewTheme] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [locale, setLocale] = useLocale()
  const [detailTab, setDetailTab] = useState('details')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentProof, setPaymentProof] = useState(null)
  const [copied, setCopied] = useState(false)
  const [paymentReg, setPaymentReg] = useState(null) // app_registrations row for the in-flight subscription
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [refCopied, setRefCopied] = useState(false)
  const [currentPage, setCurrentPage] = useState(null)
  // Local search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchFilter, setSearchFilter] = useState('all') // all, free_delivery, open_now, popular, pickup, delivery
  const [searchActive, setSearchActive] = useState(false)
  const [openFaqSection, setOpenFaqSection] = useState(null)
  const [openFaqItem, setOpenFaqItem] = useState(null)
  const [searchError, setSearchError] = useState(null)
  // Silent search reset — clears errors and reloads data without user noticing
  const searchSilentReset = () => {
    setSearchError(null)
    setSearchResults([])
    setSearchLoading(true)
    // Re-trigger search by toggling filter
    const current = searchFilter
    setSearchFilter('__reset')
    setTimeout(() => setSearchFilter(current), 50)
  }
  const [regForm, setRegForm] = useState({ name: '', url: '', whatsapp: '', email: '' })
  const [regSubmitted, setRegSubmitted] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly')
  const [featureCatOpen, setFeatureCatOpen] = useState(null)
  const [userAccount, setUserAccount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sl_user_account')) || null } catch { return null }
  })
  const [signupOpen, setSignupOpen] = useState(false)
  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', country: '', businessName: '' })
  const [signupError, setSignupError] = useState('')
  const [signupAction, setSignupAction] = useState(null) // 'demo' or 'subscribe'
  const [slugCheck, setSlugCheck] = useState(null) // null | 'checking' | 'available' | 'taken'
  const [contactStep, setContactStep] = useState(null)
  const [themeLibSearch, setThemeLibSearch] = useState('')
  const [themeLibPreview, setThemeLibPreview] = useState(null)
  const [themeLibPreviewImg, setThemeLibPreviewImg] = useState(null)
  const [themeLibPage, setThemeLibPage] = useState('landing')
  const [contactCategory, setContactCategory] = useState(null)
  const [contactFaqOpen, setContactFaqOpen] = useState([])
  const [contactFormData, setContactFormData] = useState({ name: '', business: '', email: '', username: '', department: '', priority: 'normal', subject: '', description: '', file: null, contactMethod: 'email' })
  const [contactFormStep, setContactFormStep] = useState(0)
  const [contactTicketId, setContactTicketId] = useState('')
  const [contactCounters, setContactCounters] = useState(CONTACT_COMPANY_STATS.map(() => 0))
  // New states for enhanced CTA sections
  const [ticketDept, setTicketDept] = useState(null)
  const [ticketStep, setTicketStep] = useState(0) // 0=select dept, 1=form, 2=review
  const [helpSearchQuery, setHelpSearchQuery] = useState('')
  const [helpExpandedCat, setHelpExpandedCat] = useState(null)
  const [helpFaqOpen, setHelpFaqOpen] = useState([])
  const [salesForm, setSalesForm] = useState({ name: '', businessName: '', email: '', whatsapp: '', businessType: '', locations: '', orderVolume: '', interests: [] })
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
  const [vendorAuthForm, setVendorAuthForm] = useState({ phone: '', password: '', name: '', category: '', country: '', city: '' })
  const [vendorAuthError, setVendorAuthError] = useState('')
  const [vendorAuthApp, setVendorAuthApp] = useState(null) // which app they're signing into
  const [vendorAuthShowPw, setVendorAuthShowPw] = useState(false)
  const [slugValue, setSlugValue] = useState('')
  const [showNameHelp, setShowNameHelp] = useState(false)
  const slugTimer = useRef(null)
  const [countryPricing, setCountryPricing] = useState(null)
  const [detectedCountry, setDetectedCountry] = useState(null)

  // Agent referral tracking on landing page
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) {
      localStorage.setItem('sl_agent_ref', ref)
      if (supabase) {
        supabase.from('affiliate_agents').select('id, total_clicks').eq('agent_code', ref).single().then(({ data }) => {
          if (data) {
            supabase.from('affiliate_agents').update({ total_clicks: (data.total_clicks || 0) + 1 }).eq('id', data.id)
          }
        })
      }
    }
  }, [])

  // EU member states map to the shared 'EU' pricing row
  const EU_MEMBERS = new Set(['AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'])
  const mapPricingCountry = (code) => (code && EU_MEMBERS.has(code) ? 'EU' : code)

  // Detect country from IP for pricing (before account creation)
  useEffect(() => {
    if (countryPricing) return
    async function detectPricing() {
      try {
        const res = await fetch('https://ip2c.org/s')
        const text = await res.text()
        const country = text.split(';')[1]
        setDetectedCountry(country)
        const { data } = await supabase.from('country_pricing').select('*').eq('id', mapPricingCountry(country)).single()
        if (data) setCountryPricing(data)
      } catch {}
    }
    detectPricing()
  }, [])

  // Update pricing when user creates account with specific country
  useEffect(() => {
    const country = userAccount?.country_code
    if (!country) return
    supabase.from('country_pricing').select('*').eq('id', mapPricingCountry(country)).single().then(({ data }) => {
      if (data) setCountryPricing(data)
    })
  }, [userAccount?.country_code])

  // When payment modal opens, ensure there's a pending app_registrations row
  // with a unique reference code so the customer has something to put in the
  // bank transfer description and we can match the payment later.
  useEffect(() => {
    if (!paymentOpen || !userAccount || !selectedApp || !supabase) return
    setPaymentSubmitted(false)
    let cancelled = false
    ;(async () => {
      const whatsapp = (userAccount.phone || '').replace(/[^0-9]/g, '')
      // Look for an existing pending row for this customer + app combo
      const { data: existing } = await supabase
        .from('app_registrations')
        .select('*')
        .eq('whatsapp', whatsapp)
        .eq('app_type', selectedApp.id)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cancelled) return
      if (existing) { setPaymentReg(existing); return }
      // Create a new pending registration with a fresh reference code
      const priceText = billingCycle === 'monthly' ? selectedApp.price : selectedApp.yearlyPrice
      const { data: created } = await supabase
        .from('app_registrations')
        .insert({
          business_name: userAccount.business_name || userAccount.name || 'Customer',
          slug: userAccount.slug || (userAccount.business_name || userAccount.name || 'customer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30),
          whatsapp,
          email: userAccount.email || '',
          app_type: selectedApp.id,
          app_tier: selectedApp.tier || selectedApp.id,
          status: 'pending_verification',
          billing_cycle: billingCycle,
          price: priceText,
          payment_reference: generatePaymentRef(),
        })
        .select()
        .single()
      if (!cancelled && created) setPaymentReg(created)
    })()
    return () => { cancelled = true }
  }, [paymentOpen, userAccount?.phone, selectedApp?.id, billingCycle])

  // SEO: set document.title + meta description per landing page
  useEffect(() => {
    const seoMeta = {
      'no-commission': {
        title: 'Stop Paying 25% Commission to GoFood | StreetLocal',
        desc: 'Your own branded ordering app for Rp 35.000/month. Zero commission, ever. Stop paying GoFood, GrabFood, and ShopeeFood — own your customers.',
      },
      'warung-app': {
        title: 'Aplikasi Warung Online — Siap 24 Jam | StreetLocal',
        desc: 'Buat aplikasi warung kamu sendiri. Pelanggan order via WhatsApp. Tanpa komisi. Mulai Rp 35.000/bulan. Cocok untuk warung makanan, warkop, dan kedai kopi.',
      },
      'online-store': {
        title: 'Buka Toko Online Sendiri Tanpa Marketplace | StreetLocal',
        desc: 'ProductsLocal — branded online store untuk bisnis Indonesia. Pelanggan order via WhatsApp. Rp 35.000/bulan. Tidak perlu Tokopedia atau Shopee.',
      },
      'whatsapp-booking': {
        title: 'Aplikasi Booking via WhatsApp untuk Salon & Jasa | StreetLocal',
        desc: 'ServicesLocal — aplikasi booking untuk salon, cleaning, tukang, dan jasa lainnya. Pelanggan booking langsung ke WhatsApp kamu. Rp 35.000/bulan.',
      },
    }
    const m = seoMeta[currentPage]
    if (!m) return
    const prevTitle = document.title
    document.title = m.title
    let metaDesc = document.querySelector('meta[name="description"]')
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : null
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', m.desc)
    // og:image
    let ogImage = document.querySelector('meta[property="og:image"]')
    if (!ogImage) {
      ogImage = document.createElement('meta')
      ogImage.setAttribute('property', 'og:image')
      document.head.appendChild(ogImage)
    }
    ogImage.setAttribute('content', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png')
    // og:title
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      document.head.appendChild(ogTitle)
    }
    ogTitle.setAttribute('content', m.title)
    return () => {
      document.title = prevTitle
      if (metaDesc && prevDesc != null) metaDesc.setAttribute('content', prevDesc)
    }
  }, [currentPage])

  // Local search — match against menu item tags, return best matching item image
  useEffect(() => {
    if (!searchActive) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase().trim()
    setSearchLoading(true)
    const fetchVendors = async () => {
      try {
        // Fetch vendor accounts with delivery config
        const { data: vendors, error: vErr } = await supabase
          .from('vendor_accounts')
          .select('id, shop_name, shop_food_type, slug, shop_address, shop_open, shop_logo, shop_phone, shop_hours, status')
          .eq('status', 'active')
        if (vErr) throw new Error(`vendor_accounts: ${vErr.message}`)
        if (!vendors || vendors.length === 0) return []
        // Fetch menu items for active vendors
        const vendorIds = vendors.map(v => v.id)
        const { data: menuItems, error: mErr } = await supabase
          .from('vendor_menu_items')
          .select('vendor_id, name, price, photo_url, description, category, available, sort_order')
          .in('vendor_id', vendorIds)
          .eq('available', true)
        if (mErr) console.warn('[StreetLocal Search] Menu items warning:', mErr.message)
        // Group menu items by vendor
        const menuByVendor = {}
        ;(menuItems || []).forEach(m => {
          if (!menuByVendor[m.vendor_id]) menuByVendor[m.vendor_id] = []
          menuByVendor[m.vendor_id].push({
            name: m.name, img: m.photo_url, price: m.price, promoPrice: null,
            prepTime: 0, orders: 0,
            tags: [m.name?.toLowerCase(), m.category?.toLowerCase(), m.description?.toLowerCase()].filter(Boolean),
          })
        })
        return vendors.map(v => ({
          id: v.id, shop_name: v.shop_name, shop_food_type: v.shop_food_type, slug: v.slug,
          shop_address: v.shop_address, shop_open: v.shop_open, shop_phone: v.shop_phone,
          logo: v.shop_logo, accent: '#FFD600',
          status: v.shop_open ? 'open' : 'closed',
          delivery_enabled: true, // default until delivery config columns exist
          delivery_fee: 0, // placeholder
          distance_km: Math.round((Math.random() * 10 + 0.5) * 10) / 10, // GPS placeholder
          rating: 4.5, reviews: 0, popular: false, has_promo: false,
          pickup_time: '15 min',
          menu: menuByVendor[v.id] || [],
        }))
      } catch (err) {
        console.error('[StreetLocal Search] Supabase error:', err.message)
        // Log error to admin alerts silently
        try {
          await supabase.from('app_alerts').insert({
            type: 'search_error', severity: 'warning', app: 'landing',
            title: 'Search data fetch failed', description: err.message,
            status: 'open', created_at: new Date().toISOString(),
          })
        } catch { /* silent — don't break search for alert failure */ }
        return null
      }
    }
    fetchVendors().then(supabaseVendors => {
      const allVendors = supabaseVendors ? [...supabaseVendors, ...MOCK_VENDORS] : MOCK_VENDORS
      let results = allVendors.map(v => {
        // Find best matching menu item for the search query
        let bestItem = null
        if (q && v.menu && v.menu.length > 0) {
          // First try: match on tags
          const tagged = v.menu.filter(m => m.tags && m.tags.some(t => t.includes(q) || q.includes(t)))
          if (tagged.length > 0) bestItem = tagged.sort((a, b) => b.orders - a.orders)[0]
        }
        // Default: most ordered item
        if (!bestItem && v.menu && v.menu.length > 0) bestItem = [...v.menu].sort((a, b) => b.orders - a.orders)[0]
        return { ...v, _matchedItem: bestItem }
      })
      // Exclude unfulfilled listings — must have matched item with photo, name, price
      results = results.filter(v => {
        const m = v._matchedItem
        if (!m) return false
        if (!m.img || !m.name || !m.price) return false
        if (!v.shop_name || !v.shop_food_type) return false
        return true
      })
      // Filter: vendor matches if shop name/type matches OR any menu tag matches
      if (q) {
        results = results.filter(v =>
          v.shop_name.toLowerCase().includes(q) ||
          v.shop_food_type.toLowerCase().includes(q) ||
          (v.menu || []).some(m => m.tags && m.tags.some(t => t.includes(q) || q.includes(t))) ||
          (v.menu || []).some(m => m.name.toLowerCase().includes(q))
        )
      }
      // Filters
      if (searchFilter === 'discounted') results = results.filter(v => (v.menu || []).some(m => m.promoPrice))
      if (searchFilter === 'free_delivery') results = results.filter(v => v.delivery_enabled && v.delivery_fee === 0)
      if (searchFilter === 'near_me') results = results.filter(v => v.distance_km <= 3)
      // For discounted filter, pick the discounted item as matched item
      if (searchFilter === 'discounted') {
        results = results.map(v => {
          const discounted = (v.menu || []).filter(m => m.promoPrice).sort((a, b) => b.orders - a.orders)
          return { ...v, _matchedItem: discounted[0] || v._matchedItem }
        })
      }
      results.sort((a, b) => {
        // Closed always last
        if (a.status === 'closed' && b.status !== 'closed') return 1
        if (a.status !== 'closed' && b.status === 'closed') return -1
        if (searchFilter === 'near_me') return (a.distance_km || 99) - (b.distance_km || 99)
        // Free delivery first
        const aFree = a.delivery_enabled && a.delivery_fee === 0
        const bFree = b.delivery_enabled && b.delivery_fee === 0
        if (aFree && !bFree) return -1
        if (!aFree && bFree) return 1
        // Then discounted
        const aDiscount = (a.menu || []).some(m => m.promoPrice)
        const bDiscount = (b.menu || []).some(m => m.promoPrice)
        if (aDiscount && !bDiscount) return -1
        if (!aDiscount && bDiscount) return 1
        // Then by distance
        return (a.distance_km || 99) - (b.distance_km || 99)
      })
      setSearchResults(results)
      setSearchError(null)
      setSearchLoading(false)
    }).catch(err => {
      console.error('[StreetLocal Search] Unexpected error:', err)
      setSearchError(err.message || 'Search failed')
      setSearchResults(MOCK_VENDORS.map(v => {
        const best = v.menu && v.menu.length > 0 ? [...v.menu].sort((a, b) => b.orders - a.orders)[0] : null
        return { ...v, _matchedItem: best }
      }).filter(v => v._matchedItem))
      setSearchLoading(false)
      // Auto-recover after 10 seconds
      setTimeout(() => searchSilentReset(), 10000)
    })
  }, [searchQuery, searchFilter, searchActive])

  // Contact page counter animation
  useEffect(() => {
    if (currentPage !== 'contact') return
    setContactCounters(CONTACT_COMPANY_STATS.map(() => 0))
    const duration = 2000
    const steps = 60
    const interval = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      setContactCounters(CONTACT_COMPANY_STATS.map(s => {
        const progress = Math.min(step / steps, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const val = s.decimal ? Math.round(s.target * eased * 10) / 10 : Math.round(s.target * eased)
        return val
      }))
      if (step >= steps) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [currentPage])

  // Reset contact step when navigating to contact page
  useEffect(() => {
    if (currentPage === 'contact') {
      setContactStep('browse')
      setContactCategory(null)
      setContactFaqOpen([])
      setContactFormStep(0)
      setContactFormData({ name: '', business: '', email: '', username: '', department: '', priority: 'normal', subject: '', description: '', file: null, contactMethod: 'email' })
      setContactTicketId('')
    }
  }, [currentPage])

  // Scroll to top on any page navigation
  useEffect(() => {
    window.scrollTo(0, 0)
    const page = document.querySelector('[style*="maxWidth: 480"]')
    if (page) page.scrollTop = 0
  }, [currentPage, selectedApp, selectedCategory, searchActive])

  const [adminAuth, setAdminAuth] = useState(false)

  // Shared footer for all pages
  const SiteFooter = () => (
    <div style={{ background: '#0a0a0a', marginTop: 40, padding: '32px 20px 20px', borderRadius: '24px 24px 0 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: 4 }}>Software built for local businesses</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Company</div>
          {[{ label: 'About Us', page: 'about' }, { label: 'FAQ', page: 'faq' }, { label: 'Contact', page: 'contact' }, { label: 'Affiliate', page: 'affiliate' }].map(link => (
            <button key={link.page} onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(link.page) }} style={{ display: 'block', background: 'none', border: 'none', padding: '6px 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 500, textAlign: 'left' }}>{link.label}</button>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Product</div>
          {[{ label: 'Domains', page: 'domains' }, { label: 'Themes', page: 'themes' }, { label: 'Terms & Conditions', page: 'services' }, { label: 'Privacy Policy', page: 'privacy' }].map((link, i) => (
            <button key={i} onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(link.page) }} style={{ display: 'block', background: 'none', border: 'none', padding: '6px 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 500, textAlign: 'left' }}>{link.label}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#FFD600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>For Vendors</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[
            { label: 'Stop Paying Commission', page: 'no-commission' },
            { label: 'Aplikasi Warung', page: 'warung-app' },
            { label: 'Buka Toko Online', page: 'online-store' },
            { label: 'Booking via WhatsApp', page: 'whatsapp-booking' },
          ].map(link => (
            <button key={link.page} onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(link.page) }} style={{ display: 'block', background: 'none', border: 'none', padding: '6px 0', fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 500, textAlign: 'left' }}>{link.label}</button>
          ))}
        </div>
      </div>
      {/* Subscribe */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Get updates & offers</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Enter your email" style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          <button style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Subscribe</button>
        </div>
      </div>
      {/* Social icons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'IG', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>, href: '#' },
          { label: 'TT', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>, href: '#' },
          { label: 'FB', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06 2 17.06 5.66 21.21 10.44 21.96V14.96H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/></svg>, href: '#' },
          { label: 'YT', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>, href: '#' },
          { label: 'WA', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>, href: '#' },
        ].map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>{s.icon}</a>
        ))}
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>© 2026 StreetLocal.live</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setVendorAuthApp({ id: 'basic', name: 'FoodLocal' }); setVendorAuthMode('login'); setVendorAuthError(''); setVendorAuthOpen(true) }} style={{ background: 'none', border: '1px solid rgba(255,214,0,0.4)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#FFD600', cursor: 'pointer', fontWeight: 700 }}>Vendor Login</button>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage('services') }} style={{ background: 'none', border: 'none', fontSize: 11, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontWeight: 500 }}>Terms</button>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage('privacy') }} style={{ background: 'none', border: 'none', fontSize: 11, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontWeight: 500 }}>Privacy</button>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', cursor: 'pointer' }} onClick={() => setCurrentPage('admin')}>{t.footer}</p>
      </div>
    </div>
  )
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
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png" alt="Home" onError={imgError('logo')} style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>

        {/* Hero: Auto-playing demo or 3D carousel */}
        <div style={{ position: 'relative' }}>
          <Phone3DCarousel screenshots={selectedApp.screenshots} color={selectedApp.color} liveUrl={selectedApp.liveUrl} liveUrls={selectedApp.liveUrls} autoPlay={!!selectedApp.liveUrls} />
        </div>

        {/* Theme showcase strip */}
        {(selectedApp.id === 'basic' || selectedApp.id === 'chat') && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 10 }}>Available in 22+ Themes</div>
            <style>{`@keyframes themeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .theme-strip:hover, .theme-strip:active { animation-play-state: paused !important; }`}</style>
            <div style={{ overflow: 'hidden', paddingBottom: 8 }}>
            <div className="theme-strip" style={{ display: 'flex', gap: 10, animation: 'themeScroll 45s linear infinite', width: 'max-content' }}>
              {(() => {
                const themes = [
                  { id: 'noodle', label: 'Noodles', accent: '#8B0000', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_41_03-am.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_24_04-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_25_10-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_27_39-am.png'] },
                  { id: 'coffee', label: 'Coffee', accent: '#8a570f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-10_11_01-am.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_09_46-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_10_11-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_12_08-am.png'] },
                  { id: 'satay', label: 'Satay', accent: '#c15d15', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511012941.png' },
                  { id: 'juice', label: 'Juice', accent: '#e8b92c', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511013408.png', variants: ['https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511013601.png', 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511013703.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_20_24-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_21_11-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-02_01_25-pm.png'] },
                  { id: 'chicken', label: 'Chicken', accent: '#c15d15', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511014830.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_51_11-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_54_35-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_57_27-am.png'] },
                  { id: 'bakso', label: 'Bakso', accent: '#e8992c', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_45_14-am.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-03_49_45-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-03_52_59-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-03_57_35-pm.png'] },
                  { id: 'friedrice', label: 'Nasi Goreng', accent: '#FF6B35', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511012403.png' },
                  { id: 'martabak', label: 'Martabak', accent: '#8a0f8a', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_08_25-am.png' },
                  { id: 'escendol', label: 'Es Cendol', accent: '#4d8a0f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_06_43-pm.png' },
                  { id: 'kebab', label: 'Kebab', accent: '#FF6B35', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_04_20-pm.png' },
                  { id: 'pecellele', label: 'Pecel Lele', accent: '#6b8a0f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-10_17_10-am.png' },
                  { id: 'ketoprak', label: 'Ketoprak', accent: '#B8860B', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_10_51-pm.png' },
                  { id: 'cilok', label: 'Cilok Cimol', accent: '#c15d15', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_12_27-pm.png' },
                  { id: 'ikanbakar', label: 'Ikan Bakar', accent: '#e8512c', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_14_52-pm.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-04_20_17-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-04_20_47-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-04_21_18-pm.png'] },
                  { id: 'nasiuduk', label: 'Nasi Uduk', accent: '#e8b92c', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_26_08-pm.png' },
                  { id: 'bebekgoreng', label: 'Bebek Goreng', accent: '#6b8a0f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_27_16-pm.png' },
                  { id: 'burger', label: 'Burgers', accent: '#B8860B', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511014403.png' },
                  { id: 'donut', label: 'Donuts', accent: '#DB2777', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_52_32-pm.png' },
                  { id: 'hotdog', label: 'Hot Dogs', accent: '#dc2626', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_39_59-am.png' },
                  { id: 'pizza', label: 'Pizza', accent: '#dc2626', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_54_57-am.png' },
                  { id: 'vegetables', label: 'Vegetables', accent: '#27AE60', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_46_34%20PM.png' },
                ]
                const renderCard = (theme, i) => (
                  <div key={`${theme.id}-${i}`} onClick={() => setPreviewTheme(theme)} style={{ flexShrink: 0, width: 64, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ width: 64, height: 110, borderRadius: 12, overflow: 'hidden', border: '2px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                    </div>
                    <a href={(() => { const isLocal = window.location.hostname === 'localhost'; const base = isLocal ? 'http://localhost:5177/food/chat/' : '/food/chat/'; const plan = selectedApp.id === 'chat' ? 'chat' : 'whatsapp'; return base + '?demo=true&page=landing&theme=' + theme.id + '&plan=' + plan })()} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: '#1a1a1a', textDecoration: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 2, lineHeight: 1 }}>DEV</a>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginTop: 4 }}>{theme.label}</div>
                  </div>
                )
                return [...themes.map((t, i) => renderCard(t, i)), ...themes.map((t, i) => renderCard(t, i + themes.length))]
              })()}
            </div>
            {/* View All + Update Date */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>
                {(() => {
                  const now = new Date()
                  const offsets = [0, 0, 1, 1, 2, 3, 4, 5, 6]
                  const days = offsets[Math.floor(now.getMinutes() % offsets.length)]
                  if (days === 0) return 'Updated Today'
                  if (days === 1) return 'Updated Yesterday'
                  const d = new Date(now - days * 86400000)
                  return `Updated ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                })()}
              </div>
              <button onClick={() => { const t = [
                { id: 'noodle', label: 'Noodles', accent: '#8B0000', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_41_03-am.png' },
              ]; setSelectedApp(null); setSelectedCategory(null); setCurrentPage('themes') }} style={{ background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>View All Themes</button>
            </div>
            </div>
          </div>
        )}

        {/* ProductsLocal Theme showcase strip */}
        {(selectedApp.id === 'productslocal' || selectedApp.id === 'productschat' || selectedApp.id === 'productsemail') && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 10 }}>Available in 27+ Product Themes</div>
            <style>{`@keyframes themeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .theme-strip:hover, .theme-strip:active { animation-play-state: paused !important; }`}</style>
            <div style={{ overflow: 'hidden', paddingBottom: 8 }}>
            <div className="theme-strip" style={{ display: 'flex', gap: 10, animation: 'themeScroll 60s linear infinite', width: 'max-content' }}>
              {(() => {
                const themes = [
                  { id: 'clothing', label: 'Clothing', accent: '#4A90D9' },
                  { id: 'shoes', label: 'Shoes', accent: '#8B4513', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-shoes.png' },
                  { id: 'handbags', label: 'Handbags', accent: '#8B4513', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handbags.png' },
                  { id: 'hijab', label: 'Hijab', accent: '#9B59B6', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2010,%202026,%2004_57_19%20PM.png?updatedAt=1778407052888' },
                  { id: 'batik', label: 'Batik', accent: '#B8860B', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2010,%202026,%2011_41_38%20AM.png?updatedAt=1778388112989' },
                  { id: 'tshirts', label: 'T-Shirts', accent: '#4A90D9', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasd.png?updatedAt=1778435998178' },
                  { id: 'helmets', label: 'Helmets', accent: '#1a1a1a', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasdsdsasddd.png' },
                  { id: 'electronics', label: 'Electronics', accent: '#2ECC71', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-electrical.png' },
                  { id: 'comprepair', label: 'PC Repair', accent: '#1E90FF', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair.png' },
                  { id: 'phoneacc', label: 'Phone Cases', accent: '#3498DB', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-phone-cases.png' },
                  { id: 'beauty', label: 'Beauty', accent: '#E91E90', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-beauty-products.png' },
                  { id: 'cosmetics', label: 'Cosmetics', accent: '#C0392B', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-cosmetics.png' },
                  { id: 'perfume', label: 'Perfume', accent: '#8E44AD', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-perfume.png' },
                  { id: 'homedecor', label: 'Home Decor', accent: '#D4A373', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_38_44%20PM.png' },
                  { id: 'tradfurniture', label: 'Traditional Furniture', accent: '#6F4E37', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_43_17%20PM.png' },
                  { id: 'kitchenware', label: 'Kitchen', accent: '#FF6B35', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511015514.png' },
                  { id: 'packaging', label: 'Packaging', accent: '#795548', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-packaging.png' },
                  { id: 'handicraft', label: 'Handicrafts', accent: '#e8992c', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_40_27%20PM.png' },
                  { id: 'carvedwood', label: 'Carved Wood', accent: '#8B4513', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_42_11%20PM.png' },
                  { id: 'secondhand', label: 'Second Hand', accent: '#5D6D7E', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_44_25%20PM.png' },
                  { id: 'womensclothes', label: "Women's Clothes", accent: '#E91E63', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_45_41%20PM.png' },
                  { id: 'jewelry', label: 'Jewelry', accent: '#FFD700', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-jewelry.png' },
                  { id: 'sports', label: 'Sports', accent: '#27AE60' },
                  { id: 'baby', label: 'Baby Clothes', accent: '#FF69B4', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-baby-clothes.png' },
                  { id: 'school', label: 'School', accent: '#4A90D9', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-school-accessories.png' },
                  { id: 'bicycle', label: 'Bicycle', accent: '#2E86AB', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-bicycle.png' },
                  { id: 'toys', label: 'Toys', accent: '#FF6B35', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-childrens-toys.png' },
                  { id: 'raincoats', label: 'Raincoats', accent: '#2C5F8A', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-raincoats.png' },
                  { id: 'running', label: 'Running', accent: '#1B2A4A', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-running-footwear.png' },
                  { id: 'motortyres', label: 'Motorbike', accent: '#dc2626', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-motorbike-tyres.png' },
                  { id: 'tobacco', label: 'Tobacco', accent: '#8B0000', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-tobacco.png' },
                  { id: 'pets', label: 'Pet Supplies', accent: '#6b8a0f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-pet-supplies.png' },
                  { id: 'grocery', label: 'Grocery', accent: '#c15d15' },
                  { id: 'digital', label: 'Digital', accent: '#8E44AD' },
                  { id: 'general', label: 'General', accent: '#4A90D9' },
                ]
                const renderCard = (theme, i) => (
                  <div key={`${theme.id}-${i}`} style={{ flexShrink: 0, width: 64, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ width: 64, height: 110, borderRadius: 12, overflow: 'hidden', border: '2px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {theme.img ? (
                        <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                      ) : (
                        <span style={{ fontSize: 28 }}>📦</span>
                      )}
                    </div>
                    <a href={(() => { const isLocal = window.location.hostname === 'localhost'; const id = selectedApp.id; const path = id === 'productschat' ? 'products/chat' : id === 'productsemail' ? 'products/email' : 'products/local'; const portMap = { productschat: 5179, productsemail: 5180, productslocal: 5178 }; const port = portMap[id] || 5178; const base = isLocal ? `http://localhost:${port}/${path}/` : `/${path}/`; return base + '?demo=true&page=landing&theme=' + theme.id })()} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: '#1a1a1a', textDecoration: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 2, lineHeight: 1 }}>DEV</a>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginTop: 4 }}>{theme.label}</div>
                  </div>
                )
                return [...themes.map((t, i) => renderCard(t, i)), ...themes.map((t, i) => renderCard(t, i + themes.length))]
              })()}
            </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage('product-themes') }} style={{ background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>View All Themes</button>
            </div>
          </div>
        )}

        {/* ServicesLocal Theme showcase strip */}
        {(selectedApp.id === 'serviceslocal' || selectedApp.id === 'serviceschat' || selectedApp.id === 'servicesemail') && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 10 }}>Available in 38+ Service Themes</div>
            <style>{`@keyframes themeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .theme-strip:hover, .theme-strip:active { animation-play-state: paused !important; }`}</style>
            <div style={{ overflow: 'hidden', paddingBottom: 8 }}>
            <div className="theme-strip" style={{ display: 'flex', gap: 10, animation: 'themeScroll 60s linear infinite', width: 'max-content' }}>
              {(() => {
                const themes = [
                  { id: 'cleaning', label: 'Cleaning', accent: '#3498DB', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_01_01%20PM.png' },
                  { id: 'plumbing', label: 'Plumbing', accent: '#1B6BA8', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2002_35_55%20PM.png' },
                  { id: 'electrician', label: 'Electrician', accent: '#F1C40F', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_02_13%20PM.png' },
                  { id: 'aircon', label: 'AC Service', accent: '#3498DB', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2002_28_18%20PM.png' },
                  { id: 'carpenter', label: 'Carpenter', accent: '#8B4513', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2002_43_27%20PM.png' },
                  { id: 'painter', label: 'Painter', accent: '#2ECC71', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_14_14%20PM.png' },
                  { id: 'glass', label: 'Glass Supplier', accent: '#3498DB', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_05_49%20PM.png' },
                  { id: 'roofrepair', label: 'Roof Repairs', accent: '#A0522D', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_09_50%20PM.png' },
                  { id: 'plastering', label: 'Plastering', accent: '#BDC3C7', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_12_28%20PM.png' },
                  { id: 'propertysales', label: 'Property Sales', accent: '#16A085', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_24_39%20PM.png' },
                  { id: 'propertyrentals', label: 'Property Rentals', accent: '#2980B9', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_26_11%20PM.png' },
                  { id: 'website', label: 'Website Services', accent: '#3498DB', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_47_59%20PM.png' },
                  { id: 'gardening', label: 'Gardening', accent: '#27AE60', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_36_46%20PM.png' },
                  { id: 'locksmith', label: 'Locksmith', accent: '#7F8C8D', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_33_08%20PM.png' },
                  { id: 'pest', label: 'Pest Control', accent: '#1ABC9C', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_29_27%20PM.png' },
                  { id: 'massage', label: 'Massage', accent: '#E91E63', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_58_52%20PM.png' },
                  { id: 'salon', label: 'Salon', accent: '#FF69B4', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_30_07%20PM.png' },
                  { id: 'beautician', label: 'Beautician', accent: '#C0392B', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_57_31%20PM.png' },
                  { id: 'laser', label: 'Laser Service', accent: '#8E44AD', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_03_33%20PM.png' },
                  { id: 'tattoo', label: 'Tattoo', accent: '#1a1a1a', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_33_08%20PM.png' },
                  { id: 'yoga', label: 'Yoga', accent: '#8E44AD', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_37_27%20PM.png' },
                  { id: 'mechanic', label: 'Mechanic', accent: '#dc2626', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_40_27%20PM.png' },
                  { id: 'carwash', label: 'Car Wash', accent: '#2980B9', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_54_50%20PM.png' },
                  { id: 'driving', label: 'Driving Instructor', accent: '#FFD600' },
                  { id: 'photographer', label: 'Photographer', accent: '#1a1a1a', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2003_41_08%20PM.png' },
                  { id: 'tailor', label: 'Tailor', accent: '#8E44AD' },
                  { id: 'petgroom', label: 'Pet Grooming', accent: '#F39C12' },
                  { id: 'tutor', label: 'Tutor', accent: '#9B59B6', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_05_18%20PM.png' },
                  { id: 'music', label: 'Music Lessons', accent: '#E74C3C' },
                  { id: 'webdev', label: 'Web Developer', accent: '#3498DB' },
                  { id: 'translator', label: 'Translator', accent: '#16A085' },
                  { id: 'accountant', label: 'Accountant', accent: '#34495E' },
                  { id: 'lawyer', label: 'Lawyer', accent: '#2C3E50' },
                  { id: 'event', label: 'Event Planning', accent: '#E91E63' },
                  { id: 'childcare', label: 'Childcare', accent: '#FF69B4' },
                  { id: 'courier', label: 'Courier', accent: '#FF6B35' },
                  { id: 'leather', label: 'Leather Supplier', accent: '#5D2E0D', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_11_10%20PM.png' },
                  { id: 'maid', label: 'House Maid', accent: '#E91E63', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_12_00%20PM.png' },
                  { id: 'motorrent', label: 'Motorbike Rental', accent: '#FF6B35', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_13_32%20PM.png' },
                  { id: 'tourguide', label: 'Tour Guide', accent: '#16A085', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_18_24%20PM.png' },
                  { id: 'carrent', label: 'Car Rental', accent: '#34495E', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_20_35%20PM.png' },
                  { id: 'wedding', label: 'Wedding Clothes', accent: '#FFD600', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_21_51%20PM.png' },
                  { id: 'barber', label: 'Barber Shop', accent: '#1a1a1a', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_28_40%20PM.png' },
                  { id: 'hairsalon', label: 'Hair Salon', accent: '#FF69B4', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_30_07%20PM.png' },
                  { id: 'nailart', label: 'Nail Art', accent: '#E91E63', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_32_19%20PM.png' },
                  { id: 'cardriver', label: 'Car Driver', accent: '#2C3E50', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2001_33_43%20PM.png' },
                ]
                const renderCard = (theme, i) => (
                  <div key={`${theme.id}-${i}`} onClick={() => setPreviewTheme(theme)} style={{ flexShrink: 0, width: 64, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ width: 64, height: 110, borderRadius: 12, overflow: 'hidden', border: '2px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {theme.img ? (
                        <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                      ) : (
                        <span style={{ fontSize: 28 }}>🛠️</span>
                      )}
                    </div>
                    <a href={(() => { const isLocal = window.location.hostname === 'localhost'; const id = selectedApp.id; const path = id === 'serviceschat' ? 'services/chat' : id === 'servicesemail' ? 'services/email' : 'services/whatsapp'; const portMap = { servicesvchat: 5184, servicesemail: 5185, serviceslocal: 5183 }; const port = portMap[id] || 5183; const base = isLocal ? `http://localhost:${port}/${path}/` : `/${path}/`; return base + '?demo=true&page=landing&theme=' + theme.id })()} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: '#1a1a1a', textDecoration: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 2, lineHeight: 1 }}>DEV</a>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginTop: 4 }}>{theme.label}</div>
                  </div>
                )
                return [...themes.map((t, i) => renderCard(t, i)), ...themes.map((t, i) => renderCard(t, i + themes.length))]
              })()}
            </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage('service-themes') }} style={{ background: '#16A085', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>View All Themes</button>
            </div>
          </div>
        )}

        {/* Theme preview overlay */}
        {previewTheme && (() => {
          const activeImg = previewTheme.activeImg || previewTheme.img
          const allImages = [previewTheme.img, ...(previewTheme.variants || [])]
          return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPreviewTheme(null)}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{previewTheme.label}</div>
            {/* Phone mockup */}
            <div style={{ width: 240, height: 480, borderRadius: 36, background: '#1a1a1a', padding: 4, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '2px solid #333' }} onClick={e => e.stopPropagation()}>
              <div style={{ position: 'absolute', right: -3, top: 100, width: 3, height: 32, borderRadius: '0 2px 2px 0', background: '#333' }} />
              <div style={{ position: 'absolute', left: -3, top: 82, width: 3, height: 20, borderRadius: '2px 0 0 2px', background: '#333' }} />
              <div style={{ position: 'absolute', left: -3, top: 108, width: 3, height: 20, borderRadius: '2px 0 0 2px', background: '#333' }} />
              <div style={{ width: '100%', height: '100%', borderRadius: 32, overflow: 'hidden', position: 'relative', background: '#000' }}>
                <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 56, height: 18, background: '#000', borderRadius: 16, zIndex: 3 }} />
                <img src={activeImg} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill', transition: 'opacity 0.3s' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 32, background: previewTheme.accent || '#8DC63F', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, border: '2px solid rgba(255,255,255,0.15)' }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>S</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)', textAlign: 'center' }}>Your Shop</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{previewTheme.label}</div>
                  <div style={{ marginTop: 12, padding: '8px 22px', borderRadius: 10, background: previewTheme.accent || '#8DC63F', fontSize: 12, fontWeight: 700, color: '#fff' }}>View Menu</div>
                </div>
                <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 3 }} />
              </div>
            </div>

            {/* Variant selector */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }} onClick={e => e.stopPropagation()}>
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setPreviewTheme({ ...previewTheme, activeImg: img })} style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', border: activeImg === img ? `3px solid ${previewTheme.accent || '#FFD600'}` : '2px solid rgba(255,255,255,0.2)', padding: 0, cursor: 'pointer', flexShrink: 0 }}>
                    <img src={img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Accent color display + Editor button */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: previewTheme.accent || '#8DC63F', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: 1 }}>{(previewTheme.accent || '#8DC63F').toUpperCase()}</span>
              </div>
              <a href={(() => { const isLocal = window.location.hostname === 'localhost'; const base = isLocal ? 'http://localhost:5177/food/chat/' : '/food/chat/'; const plan = selectedApp?.id === 'chat' ? 'chat' : 'whatsapp'; return base + '?demo=true&page=landing&theme=' + previewTheme.id + '&plan=' + plan })()} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#FFD600', color: '#1a1a1a', fontSize: 14, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', display: 'block' }}>Edit Theme</a>
            </div>

            <button onClick={() => setPreviewTheme(null)} style={{ marginTop: 10, padding: '10px 28px', borderRadius: 12, border: 'none', background: '#fff', color: '#1a1a1a', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Close</button>
          </div>
          )
        })()}

        <div style={styles.detailContent}>
          <h1 style={styles.detailTitle}>{selectedApp.name}</h1>
          {selectedApp.checkoutLabel && (
            <div style={{ fontSize: 13, color: '#888', fontWeight: 600, marginTop: -6, marginBottom: 10 }}>{selectedApp.checkoutLabel}</div>
          )}
          {/* Billing toggle */}
          <div style={{ ...styles.detailToggle, marginBottom: 10, marginTop: 10, background: '#FFD600' }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{ ...styles.detailToggleBtn, ...(billingCycle === 'monthly' ? { background: '#1a1a1a', color: '#FFD600', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { background: 'transparent', color: '#1a1a1a' }) }}
            >
              {t.monthly}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{ ...styles.detailToggleBtn, ...(billingCycle === 'yearly' ? { background: '#1a1a1a', color: '#FFD600', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { background: 'transparent', color: '#1a1a1a' }) }}
            >
              {t.yearly}
            </button>
          </div>
          <p style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 4px' }}>
            {billingCycle === 'monthly' ? selectedApp.price : selectedApp.yearlyPrice}
            <span style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>{billingCycle === 'monthly' ? t.perMonth : t.perYear}</span>
          </p>

          {/* Value proposition */}
          <div style={{ background: '#f8f9fa', borderRadius: 14, padding: '14px 16px', margin: '12px 0 14px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>Your own branded food ordering app — zero commission, pure profit.</div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
              For the price of a coffee, get the leading mobile food ordering software with all features unlocked from day one. Start uploading your menu, setting your branding, and configuring delivery straight away — your app is fully functional while your personalised URL is being activated. URL activation takes up to 1 hour during office hours (Mon-Fri 09:00-21:00 WIB). Once confirmed live, customers can find you and start ordering immediately.
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {['All features included', 'Live within 1 hour', 'Zero commission', 'Cancel anytime'].map(tag => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 700, color: '#1a1a1a', background: '#FFD600', padding: '3px 8px', borderRadius: 6 }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Toggle tabs */}
          <div style={{ ...styles.detailToggle, background: '#FFD600' }}>
            <button
              onClick={() => setDetailTab('details')}
              style={{
                ...styles.detailToggleBtn,
                ...(detailTab === 'details' ? { background: '#1a1a1a', color: '#FFD600', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { background: 'transparent', color: '#1a1a1a' }),
              }}
            >
              {t.tabDetails}
            </button>
            <button
              onClick={() => setDetailTab('benefits')}
              style={{
                ...styles.detailToggleBtn,
                ...(detailTab === 'benefits' ? { background: '#1a1a1a', color: '#FFD600', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { background: 'transparent', color: '#1a1a1a' }),
              }}
            >
              {t.tabBenefits}
            </button>
          </div>

          {/* Tab content: Details */}
          {detailTab === 'details' && (
            <>
              <p style={styles.detailDesc}>{selectedApp.description}</p>

              <h3 style={styles.featuresTitle}>{t.features} ({Array.isArray(selectedApp.features[0]) || typeof selectedApp.features[0] === 'object' ? selectedApp.features.reduce((sum, c) => sum + (c.items?.length || 0), 0) : selectedApp.features.length})</h3>
              {typeof selectedApp.features[0] === 'object' && selectedApp.features[0].cat ? (
                <div style={{ margin: '0 0 24px' }}>
                  {selectedApp.features.map((group, gi) => {
                    const isOpen = featureCatOpen === gi
                    return (
                      <div key={gi} style={{ marginBottom: 6 }}>
                        <button onClick={() => setFeatureCatOpen(isOpen ? null : gi)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, border: '1px solid #f0f0f0', background: isOpen ? '#1a1a1a' : '#f8f9fa', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 26, height: 26, borderRadius: 13, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#1a1a1a', flexShrink: 0 }}>{group.items.length}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: isOpen ? '#FFD600' : '#1a1a1a' }}>{group.cat}</span>
                          </div>
                          <span style={{ fontSize: 14, color: isOpen ? '#FFD600' : '#ccc', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </button>
                        {isOpen && (
                          <div style={{ padding: '6px 0 0 14px' }}>
                            {group.items.map((item, ii) => (
                              <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', fontSize: 13, color: '#444', borderBottom: '1px solid #f8f8f8' }}>
                                <span style={{ color: '#FFD600', fontSize: 8, marginTop: 5, flexShrink: 0 }}>&#9679;</span>
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                  {selectedApp.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0', fontSize: 14, borderBottom: '1px solid #f5f5f5', color: '#333' }}>
                      <span style={{ color: '#22c55e', fontSize: 14, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              {false && selectedApp.screenshots.length > 1 && (
                <div style={styles.screenshotRow}>
                  {selectedApp.screenshots.map((s, i) => (
                    <div key={i} style={styles.screenshotThumb}>
                      <img src={s} alt={`Screenshot ${i + 1}`} onError={imgError('screenshot')} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
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
              {/* Try Demo — always free, no signup required */}
              <a
                href={(() => {
                  // selectedApp.id values from checkoutChooser-food:
                  //   'basic' = WhatsApp tier (35k); 'chat' = Chat tier (50k)
                  // Pass plan through so food-basic's activation gate
                  // auto-selects the same tier if the demo visitor signs up.
                  const isLocal = window.location.hostname === 'localhost'
                  const isFoodTier = selectedApp.id === 'basic' || selectedApp.id === 'chat'
                  const base = isLocal
                    ? (isFoodTier ? 'http://localhost:5177/food/chat/' : 'http://localhost:5174/food/pro/')
                    : selectedApp.url
                  const planQs = isFoodTier ? `&plan=${selectedApp.id === 'basic' ? 'whatsapp' : 'chat'}` : ''
                  return base + '?lang=' + locale + planQs
                })()}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.ctaButton, background: '#1a1a1a', color: '#FFD600', border: '2px solid #1a1a1a', animation: 'demoShake 3s ease-in-out infinite' }}
              >
                <style>{`@keyframes demoShake { 0%, 85%, 100% { transform: translateX(0); } 88% { transform: translateX(-3px); } 91% { transform: translateX(3px); } 94% { transform: translateX(-2px); } 97% { transform: translateX(2px); } }`}</style>
                {t.openApp}
              </a>
              {/* Subscribe */}
              <button
                onClick={() => {
                  if (!userAccount) { setSignupAction('subscribe'); setSignupError(''); setSlugCheck(null); setSlugValue(''); setSignupOpen(true) }
                  else { setPaymentOpen(true); setPaymentProof(null); setCopied(false) }
                }}
                style={{ ...styles.ctaButton, background: '#FFD600', color: '#1a1a1a', border: 'none' }}
              >
                {t.subscribe} — {billingCycle === 'monthly' ? selectedApp.price + t.perMonth : selectedApp.yearlyPrice + t.perYear}
              </button>

              {/* Vendor Sign In */}
              <button
                onClick={() => { setVendorAuthOpen(true); setVendorAuthApp(selectedApp); setVendorAuthMode('login'); setVendorAuthError('') }}
                style={{ ...styles.ctaButton, background: '#f5f5f5', color: '#999', border: 'none', fontSize: 13 }}
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
              <div style={{ ...styles.paymentSheet, borderTop: '4px solid #FFD600', backgroundImage: 'url(https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-30-2026-04_47_24-pm.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#1a1a1a' }} onClick={e => e.stopPropagation()}>
                <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.4)', borderRadius: 2, margin: '10px auto 16px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>Create Your Account</h3>
                  <button onClick={() => setSignupOpen(false)} style={styles.paymentClose}>&times;</button>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20, lineHeight: 1.5, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
                  Create your account to subscribe.
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
                    // Account created — open payment
                    setPaymentOpen(true)
                    setPaymentProof(null)
                    setCopied(false)
                  }}
                  style={{
                    ...styles.ctaButton,
                    background: signupForm.name && signupForm.email && signupForm.phone && signupForm.country && signupForm.businessName && slugCheck === 'available' ? '#FFD600' : '#e0e0e0',
                    color: signupForm.name && signupForm.email && signupForm.phone && signupForm.country && signupForm.businessName && slugCheck === 'available' ? '#1a1a1a' : '#999',
                    border: 'none',
                  }}
                >
                  Create Account & Subscribe
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
                    <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/mmmass-removebg-preview.png" alt="" onError={imgError('payment')} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    <h3 style={styles.paymentTitle}>{t.payment.title} {selectedApp.name}</h3>
                  </div>
                  <button onClick={() => setPaymentOpen(false)} style={styles.paymentClose}>&times;</button>
                </div>

                <p style={styles.paymentPrice}>
                  {billingCycle === 'monthly' ? selectedApp.price : selectedApp.yearlyPrice}
                  <span style={{ fontSize: 14, color: '#888' }}>{billingCycle === 'monthly' ? t.perMonth : t.perYear}</span>
                </p>

                {/* Payment reference code — customer must include this in their bank transfer description so we can match the payment */}
                {paymentReg?.payment_reference && (
                  <div style={{ background: '#FFFBEB', border: '2px dashed #FFD600', borderRadius: 12, padding: '12px 14px', marginBottom: 16, textAlign: 'center' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>Your Payment Reference</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2, fontFamily: 'monospace', color: '#1a1a1a' }}>{paymentReg.payment_reference}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(paymentReg.payment_reference); setRefCopied(true); setTimeout(() => setRefCopied(false), 2000) }}
                        style={{ background: '#1a1a1a', color: '#FFD600', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', minHeight: 32 }}
                      >
                        {refCopied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: '#666', marginTop: 8, lineHeight: 1.4 }}>Include this code in your bank transfer description so we can find your payment quickly.</p>
                  </div>
                )}

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
                        ? (selectedApp.id === 'pro' ? 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaadsddsdss.png' : 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddssaaadsddsd.png')
                        : null
                      const finalQr = qrUrl || fallbackQr
                      return finalQr ? (
                        <div style={{ ...styles.paymentBank, textAlign: 'center' }}>
                          <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{t.payment?.scanToPay || 'Scan to Pay'}</p>
                          <img src={finalQr} alt="QR Code" onError={imgError('qr')} style={{ width: '100%', maxWidth: 220, height: 'auto', borderRadius: 12, margin: '0 auto 10px', display: 'block' }} />
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
                        <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledddddccc-removebg-preview.png" alt="Upload" onError={imgError('payment')} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                        <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>{t.payment.uploadBtn}</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Confirm Payment — uploads proof to storage and marks registration as awaiting verification */}
                {paymentSubmitted ? (
                  <div style={{ background: '#ECFDF5', border: '2px solid #22C55E', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#065F46', marginBottom: 6 }}>Payment Received!</p>
                    <p style={{ fontSize: 13, color: '#047857', lineHeight: 1.5, marginBottom: 12 }}>We'll verify your payment within 24 hours and activate your account. We'll message you on WhatsApp once you're live.</p>
                    {paymentReg?.payment_reference && (
                      <p style={{ fontSize: 12, color: '#666' }}>Reference: <strong style={{ fontFamily: 'monospace' }}>{paymentReg.payment_reference}</strong></p>
                    )}
                    <button
                      onClick={() => { setPaymentOpen(false); setPaymentSubmitted(false); setPaymentProof(null) }}
                      style={{ ...styles.ctaButton, background: '#1a1a1a', color: '#fff', border: 'none', marginTop: 12 }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={!paymentProof || !paymentReg || paymentSubmitting}
                    onClick={async () => {
                      if (!paymentProof || !paymentReg || !supabase) return
                      setPaymentSubmitting(true)
                      try {
                        const ext = (paymentProof.name.split('.').pop() || 'png').toLowerCase()
                        const path = `app-payments/${paymentReg.id}/${Date.now()}.${ext}`
                        const { error: upErr } = await supabase.storage.from('images').upload(path, paymentProof, { contentType: paymentProof.type })
                        if (upErr) throw upErr
                        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path)
                        const proofUrl = urlData?.publicUrl
                        await supabase.from('app_registrations').update({
                          payment_proof_url: proofUrl,
                          payment_uploaded_at: new Date().toISOString(),
                        }).eq('id', paymentReg.id)
                        setPaymentReg({ ...paymentReg, payment_proof_url: proofUrl, payment_uploaded_at: new Date().toISOString() })
                        setPaymentSubmitted(true)
                      } catch (err) {
                        console.error('Payment proof upload failed:', err)
                        alert('Upload failed — please try again or contact support on WhatsApp.')
                      }
                      setPaymentSubmitting(false)
                    }}
                    style={{
                      ...styles.ctaButton,
                      background: paymentProof && paymentReg && !paymentSubmitting ? '#FFD600' : '#e0e0e0',
                      color: paymentProof && paymentReg && !paymentSubmitting ? '#1a1a1a' : '#999',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: paymentProof && paymentReg && !paymentSubmitting ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {paymentSubmitting ? '⏳ Uploading...' : '✓ Submit Payment Proof'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <SiteFooter />
      </div>
    )
  }

  /* Category detail — show apps in that category */
  if (selectedCategory && !vendorAuthOpen) {
    return (
      <div style={styles.page}>
        <div style={styles.detailHeader}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png" alt="Home" onError={imgError('logo')} style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>

        {/* Hero image */}
        {selectedCategory.id === 'food' && (
          <FadeIn>
            <div style={{ textAlign: 'center', padding: '10px 20px 0' }}>
              <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-5-2026-12_48_31-pm.png" alt="Local Food Apps" onError={imgError('banner')} style={{ width: 240, height: 240, borderRadius: 28, objectFit: 'cover' }} />
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
                  style={{ ...styles.appCard, cursor: 'pointer' }}
                  onClick={(e) => {
                    if (app.checkoutChooser) { setSelectedCategory(null); setCurrentPage('checkoutChooser-' + app.checkoutChooser); return }
                    setSelectedApp(app); setDetailTab('details')
                  }}
                >
                  <div style={styles.appCardPhone}>
                    <PhoneMockup screenshot={app.screenshots[0]} liveUrl={app.liveUrls?.[0] || app.liveUrl} color={app.color} small />
                  </div>
                  <div style={styles.appCardInfo}>
                    <img
                      src={app.id === 'basic' ? 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/eeeee-removebg-preview.png' : 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/eeeeevvv-removebg-preview.png'}
                      alt={app.tier}
                      onError={imgError('logo')}
                      style={{ width: 80, height: 80, objectFit: 'contain' }}
                    />
                    <h3 style={styles.appCardName}>{app.name}</h3>
                    <p style={styles.appCardPrice}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a' }}>{app.price}</span>
                      <span style={{ fontSize: 13, color: '#888' }}>{t.perMonth}</span>
                    </p>
                    <p style={styles.appCardTagline}>{app.tagline}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (app.checkoutChooser) { setSelectedCategory(null); setCurrentPage('checkoutChooser-' + app.checkoutChooser); return }
                        setSelectedApp(app); setDetailTab('details')
                      }}
                      style={{ ...styles.appCardBtn, background: '#FFD600', color: '#1a1a1a', padding: '8px 16px', borderRadius: 10, display: 'inline-block', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontWeight: 'inherit', minHeight: 44 }}
                    >
                      {t.viewDetails}
                    </button>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  /* ─── Admin Dashboard ─── */
  if (vendorAuthOpen) {
    return (
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: '#fff', position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {/* Background image */}
        <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-6-2026-01_18_35-am.png" alt="" onError={imgError('banner')} style={{ position: 'absolute', top: 30, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />

        {/* Header */}
        <div style={{ ...styles.detailHeader, position: 'relative', zIndex: 2, background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none', borderBottom: 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => setVendorAuthOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png" alt="Home" onError={imgError('logo')} style={{ width: 42, height: 42, objectFit: 'contain' }} />
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
              <input type="text" value={vendorAuthForm.name} maxLength={20} onChange={e => setVendorAuthForm({ ...vendorAuthForm, name: e.target.value })} placeholder="Your business name (max 20)" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            </>
          )}

          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 4, display: 'block' }}>WhatsApp Number</label>
          <input type="tel" value={vendorAuthForm.phone} onChange={e => setVendorAuthForm({ ...vendorAuthForm, phone: e.target.value })} placeholder="e.g. +6281234567890" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, marginBottom: 10, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />

          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 4, display: 'block' }}>Password</label>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input type={vendorAuthShowPw ? 'text' : 'password'} value={vendorAuthForm.password} onChange={e => setVendorAuthForm({ ...vendorAuthForm, password: e.target.value })} placeholder={vendorAuthMode === 'signup' ? 'Create password' : 'Password'} style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            <button type="button" onClick={() => setVendorAuthShowPw(v => !v)} aria-label={vendorAuthShowPw ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 18, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', padding: 0 }}>
              {vendorAuthShowPw ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

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
              const baseUrl = vendorAuthApp?.id === 'basic' || vendorAuthApp?.id === 'chat'
                ? (isDev ? 'http://localhost:5177/food/chat/' : '/food/chat/')
                : (isDev ? '/food/pro/' : '/food/pro/')
              const appUrl = `${baseUrl}?vendor=${data.id}`
              window.open(appUrl, '_blank')
              setVendorAuthOpen(false)
            } else {
              if (!vendorAuthForm.name.trim()) { setVendorAuthError('Enter your business name'); return }
              if (vendorAuthForm.password.length < 4) { setVendorAuthError('Password min 4 characters'); return }
              const fullPhone = phone
              const slug = (vendorAuthForm.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[''`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'my-shop'
              const { data, error } = await supabase.from('vendor_accounts').insert({
                phone: fullPhone, password_hash: vendorAuthForm.password,
                shop_name: vendorAuthForm.name,
                shop_phone: fullPhone,
                slug, status: 'pending'
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
                  status: 'pending_verification',
                  billing_cycle: 'monthly',
                })
              } catch (e) { /* ignore */ }
              // Track affiliate referral if agent link was used
              try {
                const agentRef = localStorage.getItem('sl_agent_ref')
                if (agentRef && supabase) {
                  const { data: agentData } = await supabase.from('affiliate_agents').select('id').eq('agent_code', agentRef).single()
                  if (agentData) {
                    await supabase.from('affiliate_referrals').insert({
                      agent_id: agentData.id,
                      customer_name: vendorAuthForm.name,
                      customer_phone: fullPhone,
                      app_type: vendorAuthApp?.id || 'basic',
                      app_tier: vendorAuthApp?.id || 'basic',
                      commission_amount: vendorAuthApp?.id === 'pro' ? 100000 : 35000,
                      status: 'pending',
                    })
                    localStorage.removeItem('sl_agent_ref')
                  }
                }
              } catch (e) { /* ignore */ }
              localStorage.setItem('indoo_vendor_phone', phone)
              localStorage.setItem('indoo_vendor_pass', vendorAuthForm.password)
              localStorage.setItem('indoo_vendor_id', data.id)
              localStorage.setItem('vendorbasic_vendorId', data.id)
              const isDev = window.location.port === '5173' || window.location.port === '5174'
              const baseUrl = vendorAuthApp?.id === 'basic' || vendorAuthApp?.id === 'chat'
                ? (isDev ? 'http://localhost:5177/food/chat/' : '/food/chat/')
                : (isDev ? '/food/pro/' : '/food/pro/')
              const appUrl = `${baseUrl}?vendor=${data.id}&slug=${encodeURIComponent(slug)}`
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

  if (currentPage === 'affiliate') {
    return <Affiliate onClose={() => setCurrentPage(null)} />
  }

  /* ─── Checkout Chooser (Basic Food Local) ─── */
  if (currentPage === 'checkoutChooser-food') {
    const isDevHost = window.location.hostname === 'localhost'
    const foodCat = CATEGORIES.find(c => c.id === 'food')
    const basicApp = foodCat?.apps.find(a => a.id === 'basic')
    const waApp = basicApp ? { ...basicApp, checkoutChooser: false, checkoutLabel: 'Customers Order By Whats App' } : null
    const chatApp = basicApp ? {
      ...basicApp,
      id: 'chat',
      checkoutChooser: false,
      checkoutLabel: 'Customers Order By App Chat',
      name: 'FoodLocal',
      tier: 'Software 1 — Chat',
      price: 'Rp 50.000',
      yearlyPrice: 'Rp 600.000',
      tagline: 'Your WhatsApp stays private. Your team logs in to handle orders together.',
      description: 'Same FoodLocal storefront. Orders arrive in a private chat inside your app instead of going to your personal WhatsApp — your number stays private from customers. Invite your team: any staff member can install the app on their phone, log in, and pick up new orders alongside you. Real-time sound and vibration alerts on every new order so nobody misses one.',
      liveUrls: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'].map(p => (isDevHost ? 'http://localhost:5177/food/chat/' : '/food/chat/') + '?demo=true&page=' + p),
      url: '/food/chat/',
      color: '#1a1a1a',
    } : null
    const cardBase = { background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 10 }
    const btnBase = { padding: '14px 20px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', minHeight: 44 }
    return (
      <div style={styles.page}>
        <div style={styles.detailHeader}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png" alt="Home" onError={imgError('logo')} style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>
        <div style={{ padding: '24px 20px 60px', maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.2 }}>Select your preferred checkout system</h1>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 22, lineHeight: 1.5 }}>Both options share the same FoodLocal storefront. They differ only in how customer orders reach you.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            {/* WhatsApp card */}
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledddddccc-removebg-preview.png" alt="WhatsApp Checkout" onError={imgError('logo')} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>FoodLocal</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 1 }}>Customers Order By Whats App</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#25D366', marginTop: 2 }}>Rp 35.000<span style={{ color: '#999', fontWeight: 600 }}> / month</span></div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55, margin: 0 }}>
                Orders go straight to your WhatsApp. Familiar to your customers, zero learning curve. Your customers' phone numbers stay between you and them.
              </p>
              <button
                onClick={() => { if (!waApp) return; setCurrentPage(null); setSelectedApp(waApp); setDetailTab('details') }}
                style={{ ...btnBase, background: '#25D366', color: '#fff' }}
              >Pick WhatsApp</button>
            </div>

            {/* Chat card */}
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔔</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>FoodLocal</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 1 }}>Customers Order By App Chat</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginTop: 2 }}>Rp 50.000<span style={{ color: '#999', fontWeight: 600 }}> / month</span></div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55, margin: 0 }}>
                Your WhatsApp number stays private — customers never see it. Add your team: anyone you invite installs the app on their phone, logs in, and handles incoming orders right beside you. Sound and vibration alerts on every new order. Optionally show your WhatsApp on the Visit Us page.
              </p>
              <button
                onClick={() => { if (!chatApp) return; setCurrentPage(null); setSelectedApp(chatApp); setDetailTab('details') }}
                style={{ ...btnBase, background: '#1a1a1a', color: '#FFD600' }}
              >Pick Chat</button>
            </div>
          </div>

          <button onClick={() => setCurrentPage(null)} style={{ marginTop: 20, background: 'none', border: '1px solid #ddd', borderRadius: 12, padding: '10px 18px', fontSize: 13, color: '#666', cursor: 'pointer', minHeight: 44 }}>Back</button>
        </div>
      </div>
    )
  }

  /* ─── Checkout Chooser (Products Local — 3 options: WhatsApp / Chat / Email) ─── */
  if (currentPage === 'checkoutChooser-products') {
    const isDevHost = window.location.hostname === 'localhost'
    const productsCat = CATEGORIES.find(c => c.id === 'products')
    const productslocalApp = productsCat?.apps.find(a => a.id === 'productslocal')

    const productsWaApp = productslocalApp ? {
      ...productslocalApp,
      checkoutChooser: false,
      checkoutLabel: 'Customers Order By Whats App',
    } : null

    const productsChatApp = productslocalApp ? {
      ...productslocalApp,
      id: 'productschat',
      checkoutChooser: false,
      checkoutLabel: 'Customers Order By App Chat',
      name: 'ProductsLocal',
      tier: 'Software 3 — Chat',
      price: 'Rp 50.000',
      yearlyPrice: 'Rp 600.000',
      tagline: 'Your WhatsApp stays private. Your team logs in to handle orders together.',
      description: 'Same ProductsLocal storefront. Orders arrive in a private chat inside your app instead of going to your personal WhatsApp — your number stays private from customers. Invite your team: any staff member can install the app on their phone, log in, and pick up new orders alongside you. Real-time sound and vibration alerts on every new order so nobody misses one.',
      liveUrls: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'].map(p => (isDevHost ? 'http://localhost:5179/products/chat/' : '/products/chat/') + '?demo=true&page=' + p),
      url: '/products/chat/',
      color: '#1a1a1a',
    } : null

    const productsEmailApp = productslocalApp ? {
      ...productslocalApp,
      id: 'productsemail',
      checkoutChooser: false,
      checkoutLabel: 'Customers Order By Email',
      name: 'ProductsLocal',
      tier: 'Software 3 — Email',
      price: 'Rp 75.000',
      yearlyPrice: 'Rp 900.000',
      tagline: 'Formal orders, professional inbox flow — ideal for B2B and serious purchases.',
      description: 'Same ProductsLocal storefront. Customer orders arrive as a clean, formatted HTML email in your business inbox — perfect for B2B, custom orders, and serious purchases that need a paper trail. Replies are threaded by email. Customers leave their email at checkout so you can quote, confirm, or follow up directly. No app login required to read orders — they live in your normal email.',
      liveUrls: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'].map(p => (isDevHost ? 'http://localhost:5180/products/email/' : '/products/email/') + '?demo=true&page=' + p),
      url: '/products/email/',
      color: '#1a1a1a',
    } : null

    const cardBase = { background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 10 }
    const btnBase = { padding: '14px 20px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', minHeight: 44 }
    return (
      <div style={styles.page}>
        <div style={styles.detailHeader}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png" alt="Home" onError={imgError('logo')} style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>
        <div style={{ padding: '24px 20px 60px', maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.2 }}>Select your preferred checkout system</h1>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 22, lineHeight: 1.5 }}>All three share the same ProductsLocal storefront. They differ only in how customer orders reach you.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            {/* WhatsApp card — Rp 35.000 */}
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledddddccc-removebg-preview.png" alt="WhatsApp Checkout" onError={imgError('logo')} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>ProductsLocal</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 1 }}>Customers Order By Whats App</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#25D366', marginTop: 2 }}>Rp 35.000<span style={{ color: '#999', fontWeight: 600 }}> / month</span></div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55, margin: 0 }}>
                Orders go straight to your WhatsApp. Familiar to your customers, zero learning curve. Best for quick everyday product sales where chat and pricing happen on WhatsApp anyway.
              </p>
              <button
                onClick={() => { if (!productsWaApp) return; setCurrentPage(null); setSelectedApp(productsWaApp); setDetailTab('details') }}
                style={{ ...btnBase, background: '#25D366', color: '#fff' }}
              >Pick WhatsApp</button>
            </div>

            {/* Chat card — Rp 50.000 */}
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔔</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>ProductsLocal</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 1 }}>Customers Order By App Chat</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginTop: 2 }}>Rp 50.000<span style={{ color: '#999', fontWeight: 600 }}> / month</span></div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55, margin: 0 }}>
                Your WhatsApp number stays private — customers never see it. Add your team: anyone you invite installs the app on their phone, logs in, and handles incoming orders right beside you. Sound and vibration alerts on every new order. Optionally show your WhatsApp on the Visit Us page.
              </p>
              <button
                onClick={() => { if (!productsChatApp) return; setCurrentPage(null); setSelectedApp(productsChatApp); setDetailTab('details') }}
                style={{ ...btnBase, background: '#1a1a1a', color: '#FFD600' }}
              >Pick Chat</button>
            </div>

            {/* Email card — Rp 75.000 */}
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: '#4A90D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📧</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>ProductsLocal</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 1 }}>Customers Order By Email</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#4A90D9', marginTop: 2 }}>Rp 75.000<span style={{ color: '#999', fontWeight: 600 }}> / month</span></div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55, margin: 0 }}>
                Customer orders arrive as a clean, formatted HTML email in your business inbox — ideal for B2B, custom orders, and serious purchases that need a paper trail. Replies are threaded by email so the conversation lives where you already work. No app login required to read orders.
              </p>
              <button
                onClick={() => { if (!productsEmailApp) return; setCurrentPage(null); setSelectedApp(productsEmailApp); setDetailTab('details') }}
                style={{ ...btnBase, background: '#4A90D9', color: '#fff' }}
              >Pick Email</button>
            </div>
          </div>

          <button onClick={() => setCurrentPage(null)} style={{ marginTop: 20, background: 'none', border: '1px solid #ddd', borderRadius: 12, padding: '10px 18px', fontSize: 13, color: '#666', cursor: 'pointer', minHeight: 44 }}>Back</button>
        </div>
      </div>
    )
  }

  if (currentPage === 'checkoutChooser-services') {
    const isDevHost = window.location.hostname === 'localhost'
    const servicesCat = CATEGORIES.find(c => c.id === 'services')
    const serviceslocalApp = servicesCat?.apps.find(a => a.id === 'serviceslocal')

    const servicesWaApp = serviceslocalApp ? {
      ...serviceslocalApp,
      checkoutChooser: false,
      checkoutLabel: 'Customers Order By Whats App',
    } : null

    const servicesChatApp = serviceslocalApp ? {
      ...serviceslocalApp,
      id: 'serviceschat',
      checkoutChooser: false,
      checkoutLabel: 'Customers Order By App Chat',
      name: 'ServicesLocal',
      tier: 'Software 4 — Chat',
      price: 'Rp 50.000',
      yearlyPrice: 'Rp 600.000',
      tagline: 'Your WhatsApp stays private. Your team logs in to handle bookings together.',
      description: 'Same ServicesLocal storefront. Bookings arrive in a private chat inside your app instead of going to your personal WhatsApp — your number stays private from customers. Invite your team: any staff member can install the app on their phone, log in, and pick up new bookings alongside you. Real-time sound and vibration alerts on every new booking so nobody misses one.',
      liveUrls: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'].map(p => (isDevHost ? 'http://localhost:5184/services/chat/' : '/services/chat/') + '?demo=true&page=' + p),
      url: '/services/chat/',
      color: '#1a1a1a',
    } : null

    const servicesEmailApp = serviceslocalApp ? {
      ...serviceslocalApp,
      id: 'servicesemail',
      checkoutChooser: false,
      checkoutLabel: 'Customers Order By Email',
      name: 'ServicesLocal',
      tier: 'Software 4 — Email',
      price: 'Rp 75.000',
      yearlyPrice: 'Rp 900.000',
      tagline: 'Formal bookings, professional inbox flow — ideal for B2B and high-value services.',
      description: 'Same ServicesLocal storefront. Customer bookings arrive as a clean, formatted HTML email in your business inbox — perfect for B2B, custom jobs, and high-value services that need a paper trail. Replies are threaded by email. Customers leave their email at checkout so you can quote, confirm, or follow up directly. No app login required to read bookings — they live in your normal email.',
      liveUrls: ['landing', 'menu', 'item', 'cart', 'checkout', 'sent', 'visit'].map(p => (isDevHost ? 'http://localhost:5185/services/email/' : '/services/email/') + '?demo=true&page=' + p),
      url: '/services/email/',
      color: '#1a1a1a',
    } : null

    const cardBase = { background: '#fff', borderRadius: 18, padding: 18, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 10 }
    const btnBase = { padding: '14px 20px', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', minHeight: 44 }
    return (
      <div style={styles.page}>
        <div style={styles.detailHeader}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png" alt="Home" onError={imgError('logo')} style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>
        <div style={{ padding: '24px 20px 60px', maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 6, lineHeight: 1.2 }}>Select your preferred checkout system</h1>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 22, lineHeight: 1.5 }}>All three share the same ServicesLocal booking app. They differ only in how customer bookings reach you.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledddddccc-removebg-preview.png" alt="WhatsApp Checkout" onError={imgError('logo')} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>ServicesLocal</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 1 }}>Customers Order By Whats App</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#25D366', marginTop: 2 }}>Rp 35.000<span style={{ color: '#999', fontWeight: 600 }}> / month</span></div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55, margin: 0 }}>
                Bookings go straight to your WhatsApp. Familiar to your customers, zero learning curve. Best for everyday service work where chat and pricing happen on WhatsApp anyway.
              </p>
              <button
                onClick={() => { if (!servicesWaApp) return; setCurrentPage(null); setSelectedApp(servicesWaApp); setDetailTab('details') }}
                style={{ ...btnBase, background: '#25D366', color: '#fff' }}
              >Pick WhatsApp</button>
            </div>

            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔔</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>ServicesLocal</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 1 }}>Customers Order By App Chat</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginTop: 2 }}>Rp 50.000<span style={{ color: '#999', fontWeight: 600 }}> / month</span></div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55, margin: 0 }}>
                Your WhatsApp number stays private — customers never see it. Add your team: anyone you invite installs the app on their phone, logs in, and handles incoming bookings right beside you. Sound and vibration alerts on every new booking. Optionally show your WhatsApp on the Visit Us page.
              </p>
              <button
                onClick={() => { if (!servicesChatApp) return; setCurrentPage(null); setSelectedApp(servicesChatApp); setDetailTab('details') }}
                style={{ ...btnBase, background: '#1a1a1a', color: '#FFD600' }}
              >Pick Chat</button>
            </div>

            <div style={cardBase}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: '#16A085', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📧</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>ServicesLocal</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 1 }}>Customers Order By Email</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#16A085', marginTop: 2 }}>Rp 75.000<span style={{ color: '#999', fontWeight: 600 }}> / month</span></div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55, margin: 0 }}>
                Customer bookings arrive as a clean, formatted HTML email in your business inbox — ideal for B2B, contract work, and high-value services that need a paper trail. Replies are threaded by email so the conversation lives where you already work. No app login required to read bookings.
              </p>
              <button
                onClick={() => { if (!servicesEmailApp) return; setCurrentPage(null); setSelectedApp(servicesEmailApp); setDetailTab('details') }}
                style={{ ...btnBase, background: '#16A085', color: '#fff' }}
              >Pick Email</button>
            </div>
          </div>

          <button onClick={() => setCurrentPage(null)} style={{ marginTop: 20, background: 'none', border: '1px solid #ddd', borderRadius: 12, padding: '10px 18px', fontSize: 13, color: '#666', cursor: 'pointer', minHeight: 44 }}>Back</button>
        </div>
      </div>
    )
  }

  /* ─── Sub Pages (About, FAQ, Services) ─── */
  if (currentPage) {
    return (
      <div style={styles.page}>
        <div style={styles.detailHeader}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
            <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
          </div>
          <button onClick={() => { setSelectedApp(null); setSelectedCategory(null); setCurrentPage(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png" alt="Home" onError={imgError('logo')} style={{ width: 42, height: 42, objectFit: 'contain' }} /></button>
        </div>

        <div style={{ padding: '20px 24px 40px' }}>
          {currentPage === 'about' && (
            <div>
              <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/dsfsdfffsss.png" alt="About Us" onError={imgError('banner')} style={{ width: '100%', borderRadius: 20, marginBottom: 20 }} />
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 16 }}>{t.aboutTitle}</h1>
              {t.aboutBody.split('\n\n').map((p, i) => (
                <p key={i} style={{ fontSize: 15, color: '#444', lineHeight: 1.7, marginBottom: 14 }}>{p}</p>
              ))}
            </div>
          )}

          {currentPage === 'faq' && (() => {
            const faqSections = [
              { title: 'About StreetLocal', icon: '🏢', questions: [
                { q: 'What is StreetLocal?', a: 'StreetLocal is a software platform that provides fully branded mobile ordering apps for local businesses — street food vendors, restaurants, cafes, and more. We handle the technology so you can focus on your business.' },
                { q: 'How does it work?', a: 'Choose your plan, subscribe, and we set up your branded food app within 24 hours. You get a shareable link (streetlocal.live/your-name) that customers use to browse your menu and place orders via WhatsApp.' },
                { q: 'Do I need technical skills?', a: 'Not at all. Everything is managed through a simple mobile dashboard. If you can use WhatsApp, you can manage your app — add menu items, change prices, upload photos, toggle your shop open/closed, and more.' },
                { q: 'Can I buy the app and host it myself?', a: 'No — StreetLocal is a managed service, not a product for sale. Your subscription includes hosting, automatic updates, new features, security patches, and customer support. Building equivalent software from scratch would cost Rp 15-30 million and still require ongoing hosting and maintenance costs.' },
              ]},
              { title: 'Features & Capabilities', icon: '⚡', questions: [
                { q: 'What features are included?', a: 'Every app includes: digital menu with photos and descriptions, WhatsApp ordering (zero commission), 15+ professional themes, custom branding and logo, promo pricing with strikethrough display, halal and popular item badges, spice level indicators, meal/snack/dessert/drink categories, GPS delivery estimates, multi-currency support (16 countries), open/close toggle, daily opening hours, visit page with map link, QR code generator, social media links, 2 language support, auto SEO, and mobile-first PWA design.' },
                { q: 'Can I customize my app design?', a: 'Yes. You get full control over: theme background, accent colors, logo, landing page layout, hero text effects (glow, neon, shadow), button styles, menu card layouts, promo banners, and more. All customizable from your dashboard with live preview.' },
                { q: 'Can I have my own domain name?', a: 'Yes! We offer three domain plans: a free subdomain (shopname.streetlocal.live), a custom subdomain (menu.yourbrand.com), or a full domain (yourbrand.com) where we handle everything including DNS, SSL, and renewals.' },
                { q: 'How many menu items can I add?', a: 'There is no hard limit on menu items. Add as many meals, drinks, snacks, desserts, and extras as you need. Each item can have a photo, description, price, promo price, prep time, spice level, and halal/popular badges.' },
                { q: 'Does it work on all phones?', a: 'Yes. Your app is a Progressive Web App (PWA) — it works on any smartphone browser without downloading from an app store. Customers can also "install" it to their home screen for instant access.' },
                { q: 'Do you support multiple languages?', a: 'Currently the app supports Indonesian and English, with the landing site available in 6 languages. More languages are being added regularly.' },
              ]},
              { title: 'Ordering & Delivery', icon: '🛵', questions: [
                { q: 'How do customers place orders?', a: 'Customers open your app link, browse your menu, add items to cart, and checkout. The order is sent to your WhatsApp as a formatted message with all details — items, quantities, total, delivery address, and any notes.' },
                { q: 'Do you take commission on orders?', a: 'Never. You keep 100% of your revenue. We only charge the monthly subscription fee. There are no hidden fees, no per-order charges, and no commission cuts.' },
                { q: 'How does delivery work?', a: 'You configure your own delivery settings: enable/disable delivery, set per-km pricing, base fees, minimum charges, maximum delivery radius, and free delivery thresholds. Customers see estimated delivery costs based on their distance from your location.' },
                { q: 'Can I offer pickup only?', a: 'Yes. Toggle delivery off in your dashboard and your app switches to "Collection Only" mode. Customers can still browse and order, but will collect from your location.' },
                { q: 'What payment methods do customers use?', a: 'Payment is handled directly between you and your customer — cash on delivery, bank transfer, or any method you agree on. We do not process payments or hold funds.' },
              ]},
              { title: 'Pricing & Subscription', icon: '💳', questions: [
                { q: 'How much does it cost?', a: 'Plans start from as low as Rp 50,000/month (varies by country). Check the pricing on our homepage for your region. Yearly plans offer significant savings.' },
                { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no lock-in periods. Cancel anytime from your dashboard. Your app will remain active until the end of your current billing period.' },
                { q: 'What payment methods do you accept for subscriptions?', a: 'We currently support direct payment methods (bank transfer) in order to reduce unnecessary transaction and banking fees. This allows us to continue offering affordable app solutions and digital services at the best prices possible while avoiding excessive third-party processing costs.' },
                { q: 'Is there a free trial?', a: 'We offer a live demo that you can explore before subscribing. This gives you full visibility of the app experience, features, and design quality before making a purchase decision.' },
                { q: 'Do prices change?', a: 'We reserve the right to adjust pricing with 30 days written notice. However, we are committed to keeping our services affordable for local businesses. Active subscribers will always be notified before any price changes take effect.' },
              ]},
              { title: 'Refund Policy', icon: '🔄', questions: [
                { q: 'What is your refund policy?', a: 'Refunds can only be granted if the service URL link has NOT been shared, published, activated, or presented on the live internet. Once a live link has been activated or used publicly, the service is classified as used and cannot be resold or reused, therefore refunds cannot be provided.' },
                { q: 'What should I know before purchasing?', a: 'We strongly advise customers to refrain from making any purchase unless they are fully confident in their order and requirements before checkout. Please explore our demo, read our FAQ thoroughly, and contact our support team with any questions before subscribing.' },
                { q: 'What if I have issues after purchase?', a: 'Our support team is available Mon-Fri 09:00-21:00 WIB to help resolve any issues. We are committed to ensuring every customer gets full value from their subscription. Technical issues, setup assistance, and feature guidance are all covered by your subscription.' },
              ]},
              { title: 'Setup & Getting Started', icon: '🚀', questions: [
                { q: 'How long does setup take?', a: 'Your app is ready within minutes of subscribing. Simply sign up, choose your theme, add your menu items, and share your link. The entire setup can be done from your phone.' },
                { q: 'What do I need to get started?', a: 'Just your phone, your menu details (names, prices, photos), and a WhatsApp number for receiving orders. That\'s it — no special equipment, no technical knowledge, no computer required.' },
                { q: 'Can I change my theme later?', a: 'Yes. You can switch between 15+ themes at any time from your dashboard. Changes take effect immediately — no downtime, no data loss.' },
                { q: 'How do I add menu items?', a: 'Tap the + button in your dashboard, fill in the item name, price, description, category, and upload a photo. You can also set promo pricing, prep time, spice level, and halal/popular badges. Items go live instantly.' },
              ]},
              { title: 'Support & Contact', icon: '💬', questions: [
                { q: 'How do I get help?', a: 'Visit our Contact page to submit a support ticket. Our team responds Mon-Fri 09:00-21:00 WIB (Indonesia time). For common questions, check the FAQ categories on our Contact page — many issues can be resolved instantly.' },
                { q: 'Is support included in my subscription?', a: 'Yes. All support — technical issues, setup help, feature guidance, and troubleshooting — is included at no extra cost. We do not charge for support calls or ticket submissions.' },
                { q: 'What about after-hours emergencies?', a: 'Our site operations and monitoring systems run 24/7 to ensure platform stability and security. Critical infrastructure issues are addressed automatically. For business-level support, our team is available during working hours.' },
              ]},
              { title: 'Search & Listing', icon: '🔍', questions: [
                { q: 'How do customers find my business?', a: 'Your business appears in the StreetLocal.live search when customers search for food near them. Your menu items become searchable keywords — so if you sell satay, customers searching "satay" will find you.' },
                { q: 'What are the listing requirements?', a: 'To appear in search results, each menu item must have: a clear photo, item name, price, description, category, and prep time. Incomplete items are excluded from search to maintain quality for customers. See "Terms Of Listing" in your app dashboard for full details.' },
                { q: 'How are search results ranked?', a: 'Results are ranked by: free delivery vendors first, then vendors with active promotions, then by distance from the customer. Closed businesses are shown last. Complete, high-quality listings naturally rank higher.' },
              ]},
            ]
            return (
              <div style={{ margin: '-20px -24px', padding: '0 0 40px', background: '#fff' }}>
                {/* Hero */}
                <div style={{ padding: '24px 24px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#bbb', marginBottom: 10, fontWeight: 600 }}>KNOWLEDGE BASE</div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.15, margin: '0 0 10px' }}>Frequently Asked Questions</h1>
                  <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, margin: 0 }}>Everything you need to know about StreetLocal — from features and pricing to support and policies.</p>
                </div>

                {/* Confidence statement */}
                <div style={{ margin: '0 16px 20px', padding: 16, background: '#fffde7', borderRadius: 14, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Our Commitment to You</div>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>We are extremely confident in the quality, reliability, and value of our systems, applications, and services provided. It is important to us that customers not only trust the platform, but also genuinely enjoy and experience the value it delivers.</div>
                </div>

                {/* FAQ sections */}
                <div style={{ padding: '0 16px' }}>
                  {faqSections.map((section, si) => (
                    <div key={si} style={{ marginBottom: 8 }}>
                      {/* Section header */}
                      <button onClick={() => setOpenFaqSection(openFaqSection === si ? null : si)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1px solid #f0f0f0', background: openFaqSection === si ? '#1a1a1a' : '#f8f9fa', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <span style={{ fontSize: 20 }}>{section.icon}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: openFaqSection === si ? '#FFD600' : '#1a1a1a' }}>{section.title}</div>
                          <div style={{ fontSize: 11, color: openFaqSection === si ? 'rgba(255,255,255,0.4)' : '#999', marginTop: 1 }}>{section.questions.length} questions</div>
                        </div>
                        <span style={{ fontSize: 14, color: openFaqSection === si ? '#FFD600' : '#ccc', transition: 'transform 0.2s', transform: openFaqSection === si ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                      </button>
                      {/* Questions */}
                      {openFaqSection === si && (
                        <div style={{ padding: '8px 0 0 0' }}>
                          {section.questions.map((faq, fi) => {
                            const key = `${si}-${fi}`
                            return (
                              <div key={fi} style={{ marginBottom: 4 }}>
                                <button onClick={() => setOpenFaqItem(openFaqItem === key ? null : key)} style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, border: 'none', background: openFaqItem === key ? '#fffde7' : '#f8f9fa', cursor: 'pointer', textAlign: 'left' }}>
                                  <span style={{ fontSize: 12, color: '#FFD600', fontWeight: 800, marginTop: 1, flexShrink: 0 }}>{openFaqItem === key ? '−' : '+'}</span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', flex: 1 }}>{faq.q}</span>
                                </button>
                                {openFaqItem === key && (
                                  <div style={{ padding: '8px 14px 14px 36px', fontSize: 13, color: '#555', lineHeight: 1.7 }}>{faq.a}</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Purchase notice */}
                <div style={{ margin: '20px 16px 0', padding: 16, background: '#fef2f2', borderRadius: 14, border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Important Notice</div>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>We strongly advise customers to refrain from making any purchase unless they are fully confident in their order and requirements before checkout. Please explore our demo and contact support with any questions first.</div>
                </div>

                {/* CTA */}
                <div style={{ padding: '24px 16px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Still have questions?</div>
                  <button onClick={() => setCurrentPage('contact')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#FFD600', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Contact Support</button>
                </div>
              </div>
            )
          })()}

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

          {currentPage === 'privacy' && (
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Privacy Policy</h1>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>Last updated: May 8, 2026</p>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>1. Introduction</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>StreetLocal ("we," "our," or "us") operates a software platform that helps local businesses across Southeast Asia establish and manage their digital presence. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, websites, and related services.</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>By accessing or using StreetLocal, you agree to the terms of this Privacy Policy. If you do not agree with our practices, please do not use our services.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>2. Data We Collect</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>We collect information you provide directly, including: your name, email address, phone number, and business details when you register an account; payment and billing information when you subscribe to our services; business content such as menus, product listings, images, and descriptions you upload to the platform; and any communications you send to us, including support requests and feedback.</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>We also collect information automatically, including: device information (browser type, operating system, device identifiers); IP address and approximate location; usage data such as pages visited, features used, and interaction patterns; and log data including access times, referring URLs, and error reports.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>3. How We Use Your Data</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>We use the information we collect to: provide, operate, and maintain our platform and services; set up and manage your business storefront, domain, and digital presence; process transactions and send related billing information; respond to your inquiries, support requests, and feedback; send service-related notifications, updates, and promotional communications; monitor and analyze usage trends to improve our platform; detect, prevent, and address technical issues, fraud, and security concerns; and comply with legal obligations and enforce our terms of service.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>4. Cookies & Tracking Technologies</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>We use cookies, local storage, and similar tracking technologies to operate and personalize our services. Essential cookies are required for core platform functionality, such as maintaining your session and security. Analytics cookies help us understand how users interact with our platform so we can improve the experience. Preference cookies remember your settings and choices across sessions.</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>You can control cookies through your browser settings. Disabling certain cookies may limit your ability to use some features of our platform.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>5. Third-Party Services</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>We may share your information with trusted third-party service providers who assist us in operating our platform. These include: hosting and infrastructure providers (e.g., cloud services for data storage and delivery); payment processors for handling transactions securely; domain registrars and DNS providers for domain management services; analytics services to help us understand platform usage; and communication tools for sending emails and notifications.</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>These third parties are contractually obligated to protect your data and may only use it for the specific purposes we authorize. We do not sell your personal information to any third party.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>6. Data Security</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>We implement industry-standard security measures to protect your information, including: encryption of data in transit using SSL/TLS protocols; secure storage of sensitive data with encryption at rest; regular security audits and vulnerability assessments; access controls limiting employee access to personal data on a need-to-know basis; and secure backup and disaster recovery procedures.</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>While we strive to protect your data, no method of electronic transmission or storage is completely secure. We cannot guarantee absolute security but are committed to promptly addressing any security incidents.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>7. Your Rights</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>Depending on your location and applicable laws, you may have the following rights regarding your personal data: the right to access and obtain a copy of the data we hold about you; the right to correct inaccurate or incomplete information; the right to request deletion of your personal data, subject to legal retention requirements; the right to restrict or object to certain processing of your data; the right to data portability, receiving your data in a structured, machine-readable format; and the right to withdraw consent where processing is based on consent.</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>To exercise any of these rights, please contact us using the details provided in the Contact section below. We will respond to your request within 30 days.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>8. Data Retention</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law. Account data is retained for the duration of your active account and for up to 12 months after account closure to allow for reactivation. Transaction and billing records are retained for up to 5 years to comply with financial and tax regulations. Usage and analytics data is retained in anonymized form and may be kept indefinitely for statistical purposes.</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>When data is no longer needed, we securely delete or anonymize it in accordance with our data management procedures.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>9. Children's Privacy</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>Our platform is designed for business use and is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child under 18, we will take steps to delete that information promptly. If you believe a child has provided us with personal data, please contact us immediately.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>10. Changes to This Policy</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you by posting the updated policy on our platform with a revised "Last updated" date. We may also send a notification via email or through the platform for significant changes. Your continued use of StreetLocal after any changes indicates your acceptance of the updated policy.</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#1a1a1a' }}>11. Contact Us</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>StreetLocal<br />Email: privacy@streetlocal.live<br />Website: streetlocal.live</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 8 }}>We are committed to resolving any privacy-related issues and will respond to your inquiry as promptly as possible.</p>
              </div>
            </div>
          )}

          {currentPage === 'domains' && (
            <div>
              <style>{`
                @keyframes domainType {
                  from { width: 0; }
                  to { width: 100%; }
                }
                @keyframes domainBlink {
                  0%, 100% { border-right-color: rgba(0,0,0,0.3); }
                  50% { border-right-color: transparent; }
                }
                @keyframes domainFadeIn {
                  from { opacity: 0; transform: translateY(12px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <div style={{ margin: '-20px -24px', padding: '40px 24px 48px', background: '#fff' }}>

                {/* HERO SECTION */}
                <div style={{ marginBottom: 48 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', marginBottom: 16, fontWeight: 600 }}>DOMAIN INFRASTRUCTURE</div>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.15, margin: '0 0 16px' }}>Your Brand. Your Domain. Fully Managed.</h1>
                  <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: 1.7, margin: '0 0 28px' }}>
                    We handle every layer of your domain infrastructure — from acquisition and DNS configuration to SSL provisioning and ongoing management. You focus on your business; we ensure your brand is always reachable, secure, and fast.
                  </p>

                  {/* Floating domain examples */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { domain: 'menu.yourbrand.com', delay: '0s', ssl: true },
                      { domain: 'orders.yourbrand.com', delay: '0.8s', ssl: false },
                      { domain: 'yourbrand.com', delay: '1.6s', ssl: false }
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, animation: 'domainFadeIn 0.5s ease-out both', animationDelay: item.delay }}>
                        {item.ssl && <span style={{ color: '#22c55e', fontSize: 14, flexShrink: 0 }}>&#9679;</span>}
                        {!item.ssl && <span style={{ color: 'rgba(0,0,0,0.15)', fontSize: 14, flexShrink: 0 }}>&#9679;</span>}
                        <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#1a1a1a', overflow: 'hidden', whiteSpace: 'nowrap', display: 'inline-block', animation: `domainType 1.5s steps(${item.domain.length}) ${item.delay} both, domainBlink 0.8s step-end infinite`, borderRight: '2px solid rgba(0,0,0,0.3)' }}>{item.domain}</span>
                        {item.ssl && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginLeft: 'auto', flexShrink: 0 }}>SSL</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thin separator */}
                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 0 40px' }} />

                {/* TIER 1 — Branded Subdomain */}
                <div style={{ background: 'rgba(0,0,0,0.05)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', padding: '28px 24px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px' }}>Launch Faster with a Branded Presence</h3>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#3b82f6', marginBottom: 12 }}>shopname.streetlocal.live</div>
                  <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', lineHeight: 1.7, margin: '0 0 20px' }}>Get online instantly with a professionally branded subdomain. No technical setup required — we handle everything so you can start serving customers immediately.</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>Rp 25.000/month</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>Rp 50.000 setup</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Instant deployment', 'Managed SSL security', 'Business-branded URL', 'Rapid activation', 'Zero technical setup'].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
                        <span style={{ color: '#FFD600', fontSize: 8 }}>&#9679;</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TIER 2 — Custom Domain */}
                <div style={{ background: 'rgba(0,0,0,0.05)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', padding: '32px 24px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(0,0,0,0.35)', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>Most Popular for Growing Brands</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px' }}>Professional Brand Identity</h3>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#3b82f6', marginBottom: 12 }}>menu.yourbrand.com</div>
                  <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', lineHeight: 1.7, margin: '0 0 20px' }}>Connect your own domain for a fully professional brand experience. We configure DNS records, provision SSL certificates, and manage the routing infrastructure so your customers see only your brand.</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>Rp 75.000/month</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>Rp 150.000 onboarding</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Full DNS configuration', 'Secure SSL management', 'Seamless domain connection', 'Branded customer experience', 'Managed infrastructure'].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
                        <span style={{ color: '#FFD600', fontSize: 8 }}>&#9679;</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TIER 3 — Fully Managed Domain */}
                <div style={{ background: 'rgba(0,0,0,0.05)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', padding: '32px 24px', marginBottom: 40, position: 'relative', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px' }}>Fully Managed Brand Infrastructure</h3>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#3b82f6', marginBottom: 12 }}>yourbrand.com</div>
                  <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', lineHeight: 1.7, margin: '0 0 20px' }}>The complete white-glove service. We acquire your domain, configure enterprise-grade DNS, provision and auto-renew SSL certificates, and manage the entire infrastructure lifecycle. Ownership transfers to you.</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>Rp 150.000/month</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>Rp 300.000 setup</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Domain acquisition handled', 'Enterprise-grade DNS management', 'SSL & renewal automation', 'Ownership transfer included', 'Fully managed infrastructure lifecycle'].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
                        <span style={{ color: '#FFD600', fontSize: 8 }}>&#9679;</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thin separator */}
                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 0 36px' }} />

                {/* INCLUDED WITH EVERY SERVICE */}
                <div style={{ marginBottom: 36 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', marginBottom: 20, fontWeight: 600 }}>Included with Every Service</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                    {['Global SSL Security', 'DNS Optimization', 'Infrastructure Monitoring', 'Fast Propagation', 'Managed Technical Setup', 'Renewal Assistance', 'Performance Routing', 'Security Best Practices'].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>
                        <span style={{ color: '#FFD600', fontSize: 7 }}>&#9679;</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TRUST BAR */}
                <div style={{ background: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '14px 0', marginBottom: 36, textAlign: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', lineHeight: 1.8 }}>Secure SSL Encryption &middot; Managed DNS Infrastructure &middot; Business-Grade Services &middot; Technical Setup Included</span>
                </div>

                {/* CTA */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <button
                    onClick={() => setCurrentPage('contact')}
                    style={{ background: '#1a1a1a', color: '#fff', borderRadius: 10, padding: '14px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Discuss Domain Setup
                  </button>
                </div>

                {/* MINIMUM TERMS NOTE */}
                <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.25)', textAlign: 'center', margin: 0 }}>All plans require a 3-month minimum commitment. Setup fees are non-refundable.</p>

              </div>
            </div>
          )}

          {/* ═══ THEMES LIBRARY PAGE ═══ */}
          {currentPage === 'themes' && (() => {
            const allThemes = [
              { id: 'noodle', ref: 'SL-001', label: 'Noodles', accent: '#8B0000', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_41_03-am.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_24_04-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_25_10-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_27_39-am.png'], isNew: false, popular: false, activations: 48 },
              { id: 'coffee', ref: 'SL-002', label: 'Coffee', accent: '#8a570f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-10_11_01-am.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_09_46-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_10_11-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_12_08-am.png'], isNew: false, popular: false, activations: 67 },
              { id: 'satay', ref: 'SL-003', label: 'Satay', accent: '#c15d15', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511012941.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-05_31_54-pm.png'], isNew: false, popular: false, activations: 52 },
              { id: 'juice', ref: 'SL-004', label: 'Fresh Juice', accent: '#e8b92c', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511013408.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-10_08_00-am.png', 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511013601.png', 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511013703.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_20_24-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-11_21_11-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-02_01_25-pm.png'], isNew: false, popular: false, activations: 39 },
              { id: 'chicken', ref: 'SL-005', label: 'Crispy Chicken', accent: '#c15d15', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511014830.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_37_44-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_51_11-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_54_35-am.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-10_57_27-am.png'], isNew: false, popular: true, activations: 156 },
              { id: 'bakso', ref: 'SL-006', label: 'Bakso', accent: '#e8992c', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_45_14-am.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-03_49_45-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-03_52_59-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-03_57_35-pm.png'], isNew: false, popular: true, activations: 203 },
              { id: 'friedrice', ref: 'SL-007', label: 'Nasi Goreng', accent: '#FF6B35', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511012403.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-09_33_01-am.png', 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511012720.png'], isNew: false, popular: true, activations: 312 },
              { id: 'pecellele', ref: 'SL-008', label: 'Pecel Lele', accent: '#6b8a0f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-10_17_10-am.png', isNew: false, popular: false, activations: 44 },
              { id: 'kebab', ref: 'SL-009', label: 'Kebab', accent: '#FF6B35', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_04_20-pm.png', isNew: false, popular: false, activations: 31 },
              { id: 'martabak', ref: 'SL-010', label: 'Martabak', accent: '#8a0f8a', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_08_25-am.png', isNew: true, popular: false, activations: 28 },
              { id: 'escendol', ref: 'SL-011', label: 'Es Cendol', accent: '#4d8a0f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_06_43-pm.png', isNew: true, popular: false, activations: 19 },
              { id: 'ketoprak', ref: 'SL-012', label: 'Ketoprak', accent: '#B8860B', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_10_51-pm.png', isNew: true, popular: false, activations: 15 },
              { id: 'cilok', ref: 'SL-013', label: 'Cilok Cimol', accent: '#c15d15', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_12_27-pm.png', isNew: true, popular: false, activations: 22 },
              { id: 'ikanbakar', ref: 'SL-014', label: 'Ikan Bakar', accent: '#e8512c', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_14_52-pm.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-04_20_17-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-04_20_47-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-04_21_18-pm.png'], isNew: true, popular: false, activations: 18 },
              { id: 'nasiuduk', ref: 'SL-015', label: 'Nasi Uduk', accent: '#e8b92c', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_26_08-pm.png', isNew: true, popular: false, activations: 12 },
              { id: 'bebekgoreng', ref: 'SL-016', label: 'Bebek Goreng', accent: '#6b8a0f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-11_27_16-pm.png', isNew: true, popular: false, activations: 9 },
              { id: 'burger', ref: 'SL-017', label: 'Burgers', accent: '#B8860B', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511014403.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-8-2026-05_52_09-pm.png', 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511014523.png'], isNew: false, popular: true, activations: 134 },
              { id: 'donut', ref: 'SL-018', label: 'Donuts', accent: '#DB2777', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_52_32-pm.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_49_47-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_48_16-pm.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_45_26-pm.png', 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%209,%202026,%2001_42_58%20PM.png?updatedAt=1778308994638'], isNew: false, popular: false, activations: 27 },
              { id: 'hotdog', ref: 'SL-019', label: 'Hot Dogs', accent: '#dc2626', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_39_59-am.png', isNew: true, popular: false, activations: 5 },
              { id: 'pizza', ref: 'SL-020', label: 'Pizza', accent: '#dc2626', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-9-2026-01_54_57-am.png', isNew: true, popular: false, activations: 3 },
              { id: 'vegetables', ref: 'SL-021', label: 'Vegetables', accent: '#27AE60', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_46_34%20PM.png', isNew: true, popular: false, activations: 0 },
            ]
            const filtered = themeLibSearch ? allThemes.filter(t => t.label.toLowerCase().includes(themeLibSearch.toLowerCase())) : allThemes
            const newThemes = filtered.filter(t => t.isNew)
            const otherThemes = filtered.filter(t => !t.isNew)
            const previewT = themeLibPreview ? allThemes.find(t => t.id === themeLibPreview) : null
            const activeImg = themeLibPreviewImg || (previewT ? previewT.img : '')
            const previewAllImgs = previewT ? [previewT.img, ...(previewT.variants || [])] : []

            return (
              <div style={{ background: '#fff', margin: '-20px -24px', padding: '0 0 40px', minHeight: '100vh' }}>

                {/* Search */}
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ position: 'relative' }}>
                    <input value={themeLibSearch} onChange={e => setThemeLibSearch(e.target.value)} placeholder="Search themes..." style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 14, border: '1px solid #e8e8e8', background: '#f8f9fa', color: '#1a1a1a', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ccc" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                  </div>
                </div>

                {/* Popular in Indonesia — under search */}
                {!themeLibSearch && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>Popular in Indonesia</div>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>Most activated themes by local vendors</div>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                      {allThemes.filter(t => t.popular).sort((a, b) => b.activations - a.activations).map(theme => (
                        <div key={theme.id} onClick={() => { setThemeLibPreviewImg(null); setThemeLibPreview(theme.id) }} style={{ flexShrink: 0, width: 100, textAlign: 'center', cursor: 'pointer' }}>
                          <div style={{ width: 100, height: 140, borderRadius: 14, overflow: 'hidden', position: 'relative', background: '#1a1a1a', border: '2px solid #FFD600' }}>
                            <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
                            <div style={{ position: 'absolute', top: 4, left: 4, background: '#FFD600', padding: '1px 5px', borderRadius: 3, fontSize: 7, fontWeight: 800, color: '#1a1a1a' }}>POPULAR</div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '12px 6px 6px', textAlign: 'center' }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{theme.label}</div>
                              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>{theme.activations} activations</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New themes — just released */}
                {newThemes.length > 0 && !themeLibSearch && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 2 }}>Just Released</div>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>Fresh themes added to the collection — more on the way</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {newThemes.map(theme => (
                        <div key={theme.id} onClick={() => { setThemeLibPreviewImg(null); setThemeLibPreview(theme.id) }} style={{ textAlign: 'center', cursor: 'pointer' }}>
                          <div style={{ width: '100%', height: 0, paddingBottom: '178%', position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#1a1a1a', border: '2px solid #e8e8e8' }}>
                            <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 28, height: 7, background: '#000', borderRadius: 4, zIndex: 3 }} />
                            <img src={theme.img} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '0 8px' }}>
                              <div style={{ width: 24, height: 24, borderRadius: 12, background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, border: '2px solid rgba(255,255,255,0.15)' }}><span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>SN</span></div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>Street Noodle</div>
                              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{theme.label}</div>
                              <div style={{ marginTop: 6, padding: '2px 10px', borderRadius: 5, background: theme.accent, fontSize: 7, fontWeight: 700, color: '#fff' }}>View Menu</div>
                            </div>
                            <div style={{ position: 'absolute', top: 6, left: 6, background: '#FFD600', color: '#1a1a1a', padding: '1px 6px', borderRadius: 4, fontSize: 8, fontWeight: 800, zIndex: 3 }}>NEW</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginTop: 6 }}>{theme.label}</div>
                          <div style={{ fontSize: 9, color: '#999', marginTop: 1 }}>{theme.ref} · {theme.activations} active</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All themes */}
                <div style={{ padding: '0 16px' }}>
                  {newThemes.length > 0 && !themeLibSearch && <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>All Themes</div>}
                  {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 14 }}>No themes found</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {(themeLibSearch ? filtered : otherThemes).map(theme => (
                      <div key={theme.id} onClick={() => { setThemeLibPreviewImg(null); setThemeLibPreview(theme.id) }} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <div style={{ width: '100%', height: 0, paddingBottom: '178%', position: 'relative', borderRadius: 18, overflow: 'hidden', background: '#1a1a1a', border: '2px solid #e8e8e8' }}>
                          <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 28, height: 7, background: '#000', borderRadius: 4, zIndex: 3 }} />
                          <img src={theme.img} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '0 8px' }}>
                            <div style={{ width: 24, height: 24, borderRadius: 12, background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, border: '2px solid rgba(255,255,255,0.15)' }}><span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>SN</span></div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>Street Noodle</div>
                            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{theme.label}</div>
                            <div style={{ marginTop: 6, padding: '2px 10px', borderRadius: 5, background: theme.accent, fontSize: 7, fontWeight: 700, color: '#fff' }}>View Menu</div>
                          </div>
                          {theme.isNew && <div style={{ position: 'absolute', top: 6, left: 6, background: '#FFD600', color: '#1a1a1a', padding: '1px 6px', borderRadius: 4, fontSize: 8, fontWeight: 800, zIndex: 3 }}>NEW</div>}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginTop: 6 }}>{theme.label}</div>
                        <div style={{ fontSize: 9, color: '#999', marginTop: 1 }}>{theme.ref} · {theme.activations} active</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theme Preview Overlay — standalone, no iframe */}
                {previewT && (() => {
                  const ac = previewT.accent
                  const SAMPLE_MENU = [
                    { name: 'Pepper Noodles', price: 'Rp 23.000', desc: 'Fried noodles with peppers', photo: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-7-2026-08_12_38-pm.png', spice: true },
                    { name: 'Sate Ayam', price: 'Rp 18.000', desc: 'Chicken skewers with peanut sauce', photo: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300' },
                    { name: 'Bakso', price: 'Rp 12.000', desc: 'Meatball soup with noodles', photo: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300' },
                  ]
                  return (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'scroll', WebkitOverflowScrolling: 'touch', paddingTop: 14 }} onClick={() => { setThemeLibPreview(null); setThemeLibPreviewImg(null); setThemeLibPage('landing') }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 340, marginBottom: 10, flexShrink: 0, padding: '0 10px' }} onClick={e => e.stopPropagation()}>
                      <div><div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>StreetLocal</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>streetlocal.live</div></div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{previewT.label}</div>
                    </div>
                    <div style={{ flex: 1, minHeight: 10 }} />
                    {/* Phone + Variants */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <div style={{ width: 240, height: 480, borderRadius: 34, background: '#1a1a1a', padding: 4, position: 'relative', boxShadow: `0 16px 50px rgba(0,0,0,0.5), 0 0 16px ${ac}25`, border: '2px solid #333', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', right: -3, top: 100, width: 3, height: 28, borderRadius: '0 2px 2px 0', background: '#333' }} />
                        <div style={{ width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden', position: 'relative', background: '#000' }}>
                          <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 56, height: 16, background: '#000', borderRadius: 12, zIndex: 10 }} />
                          <img src={activeImg} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
                          <div style={{ position: 'absolute', inset: 0, background: themeLibPage === 'menu' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)', backdropFilter: themeLibPage === 'menu' ? 'blur(6px)' : 'none', transition: 'all 0.3s' }} />

                          {/* LANDING */}
                          {themeLibPage === 'landing' && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '0 20px' }}>
                              <div style={{ width: 64, height: 64, borderRadius: 32, background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '3px solid rgba(255,255,255,0.15)' }}><span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>SN</span></div>
                              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9)', textAlign: 'center', lineHeight: 1.1 }}>Street Noodle</div>
                              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{previewT.label}</div>
                              <button onClick={() => setThemeLibPage('menu')} style={{ marginTop: 20, padding: '10px 28px', borderRadius: 12, background: ac, fontSize: 14, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px ${ac}40` }}>View Menu</button>
                            </div>
                          )}

                          {/* MENU */}
                          {themeLibPage === 'menu' && (
                            <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflowY: 'auto' }}>
                              <div style={{ display: 'flex', alignItems: 'center', padding: '20px 8px 12px', background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)', position: 'sticky', top: 0, zIndex: 5 }}>
                                <button onClick={() => setThemeLibPage('landing')} style={{ width: 22, height: 22, borderRadius: 11, background: ac, border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>←</button>
                                <div style={{ width: 22, height: 22, borderRadius: 11, background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', marginRight: 6 }}><span style={{ fontSize: 8, fontWeight: 900, color: '#fff' }}>SN</span></div>
                                <div><div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>Street Noodle</div><div style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>{previewT.label}</div></div>
                              </div>
                              <div style={{ display: 'flex', gap: 4, padding: '2px 8px 6px' }}>
                                {['Menu', 'Drinks', 'Snacks'].map((t, i) => (<div key={t} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, color: i === 0 ? ac : 'rgba(255,255,255,0.4)', borderBottom: i === 0 ? `2px solid ${ac}` : '2px solid transparent' }}>{t}</div>))}
                              </div>
                              <div style={{ padding: '0 6px' }}>
                                {SAMPLE_MENU.map((item, idx) => (
                                  <div key={idx} style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, margin: '0 0 5px', padding: 6, display: 'flex', gap: 6, alignItems: 'center', minHeight: 52, borderLeft: `3px solid ${ac}` }}>
                                    <img src={item.photo} alt="" onError={imgError('food')} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 10, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}{item.spice && ' 🌶️'}</div>
                                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                                      <div style={{ fontSize: 10, fontWeight: 700, color: '#FACC15', marginTop: 1 }}>{item.price}</div>
                                    </div>
                                    <div style={{ width: 16, height: 16, borderRadius: 8, background: '#FFD600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>+</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ position: 'absolute', bottom: 10, left: 6, right: 6, background: `linear-gradient(135deg, ${ac}, ${ac}cc)`, borderRadius: 10, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
                                <div style={{ fontSize: 9, fontWeight: 600, color: '#fff' }}>2 items · Rp 41.000</div>
                                <div style={{ background: '#fff', color: ac, borderRadius: 6, padding: '3px 8px', fontSize: 8, fontWeight: 700 }}>Checkout</div>
                              </div>
                            </div>
                          )}

                          <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 56, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)', zIndex: 10 }} />
                        </div>
                      </div>
                      {/* Variants */}
                      {previewAllImgs.length > 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                          {previewAllImgs.map((img, i) => (
                            <button key={i} onClick={() => setThemeLibPreviewImg(img)} style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', border: activeImg === img ? `3px solid ${ac}` : '2px solid rgba(255,255,255,0.15)', padding: 0, cursor: 'pointer', flexShrink: 0 }}><img src={img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minHeight: 10 }} />
                    <div style={{ flexShrink: 0, paddingBottom: 20 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setThemeLibPreview(null); setThemeLibPreviewImg(null); setThemeLibPage('landing') }} style={{ padding: '10px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                    </div>
                  </div>
                  )
                })()}
              </div>
            )
          })()}

          {currentPage === 'product-themes' && (() => {
            const productThemes = [
              { id: 'clothing', ref: 'PL-001', label: 'Clothing', accent: '#4A90D9', isNew: false, popular: true, activations: 89 },
              { id: 'shoes', ref: 'PL-002', label: 'Shoes', accent: '#8B4513', isNew: false, popular: false, activations: 45 },
              { id: 'hijab', ref: 'PL-003', label: 'Hijab & Scarves', accent: '#9B59B6', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2010,%202026,%2004_57_19%20PM.png?updatedAt=1778407052888', isNew: false, popular: true, activations: 134 },
              { id: 'batik', ref: 'PL-004', label: 'Batik', accent: '#B8860B', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2010,%202026,%2011_41_38%20AM.png?updatedAt=1778388112989', isNew: true, popular: false, activations: 28 },
              { id: 'tshirts', ref: 'PL-027', label: 'T-Shirts', accent: '#4A90D9', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasd.png?updatedAt=1778435998178', variants: ['https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvv.png?updatedAt=1778434284405', 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdas.png?updatedAt=1778434574941'], isNew: true, popular: false, activations: 0 },
              { id: 'helmets', ref: 'PL-028', label: 'Helmets', accent: '#1a1a1a', img: 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasdsdsasddd.png', variants: ['https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasdsdsasd.png', 'https://ik.imagekit.io/nepgaxllc/Untitledsdasdaaavvvsdasdasds.png?updatedAt=1778436294045'], isNew: true, popular: false, activations: 0 },
              { id: 'handbags', ref: 'PL-003', label: 'Handbags', accent: '#8B4513', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-handbags.png', isNew: true, popular: false, activations: 31 },
              { id: 'electronics', ref: 'PL-005', label: 'Electronics', accent: '#2ECC71', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-electrical.png', isNew: false, popular: true, activations: 156 },
              { id: 'comprepair', ref: 'PL-006', label: 'Computer Repair', accent: '#1E90FF', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair-v2.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair-v3.png', 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-computer-repair-v4.png'], isNew: true, popular: false, activations: 4 },
              { id: 'phoneacc', ref: 'PL-006', label: 'Phone Cases', accent: '#3498DB', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-phone-cases.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-phone-cases-v2.png'], isNew: false, popular: true, activations: 203 },
              { id: 'skincare', ref: 'PL-007', label: 'Beauty Products', accent: '#E91E90', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-beauty-products.png', isNew: false, popular: true, activations: 178 },
              { id: 'cosmetics', ref: 'PL-008', label: 'Cosmetics', accent: '#C0392B', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-cosmetics.png', isNew: false, popular: false, activations: 67 },
              { id: 'perfume', ref: 'PL-009', label: 'Perfume', accent: '#8E44AD', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-perfume.png', isNew: true, popular: false, activations: 19 },
              { id: 'homedecor', ref: 'PL-010', label: 'Home Decor', accent: '#D4A373', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_38_44%20PM.png', isNew: false, popular: false, activations: 52 },
              { id: 'tradfurniture', ref: 'PL-029', label: 'Traditional Furniture', accent: '#6F4E37', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_43_17%20PM.png', isNew: true, popular: false, activations: 0 },
              { id: 'furniture', ref: 'PL-011', label: 'Furniture', accent: '#795548', isNew: true, popular: false, activations: 8 },
              { id: 'kitchenware', ref: 'PL-012', label: 'Kitchenware', accent: '#FF6B35', img: 'https://ik.imagekit.io/nepgaxllc/NoteGPT_Image_20260511015514.png', isNew: false, popular: false, activations: 34 },
              { id: 'packaging', ref: 'PL-013', label: 'Packaging', accent: '#795548', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-packaging.png', isNew: true, popular: false, activations: 14 },
              { id: 'handicraft', ref: 'PL-014', label: 'Handicrafts', accent: '#e8992c', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_40_27%20PM.png', isNew: false, popular: false, activations: 41 },
              { id: 'carvedwood', ref: 'PL-030', label: 'Carved Wood', accent: '#8B4513', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_42_11%20PM.png', isNew: true, popular: false, activations: 0 },
              { id: 'secondhand', ref: 'PL-031', label: 'Second Hand', accent: '#5D6D7E', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_44_25%20PM.png', isNew: true, popular: false, activations: 0 },
              { id: 'womensclothes', ref: 'PL-032', label: "Women's Clothes", accent: '#E91E63', img: 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%2011,%202026,%2012_45_41%20PM.png', isNew: true, popular: false, activations: 0 },
              { id: 'jewelry', ref: 'PL-015', label: 'Jewelry', accent: '#FFD700', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-jewelry.png', variants: ['https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-jewelry-v2.png'], isNew: false, popular: false, activations: 56 },
              { id: 'candles', ref: 'PL-016', label: 'Candles', accent: '#e8b92c', isNew: true, popular: false, activations: 12 },
              { id: 'sports', ref: 'PL-017', label: 'Sports', accent: '#27AE60', isNew: false, popular: false, activations: 38 },
              { id: 'baby', ref: 'PL-018', label: 'Baby Clothes', accent: '#FF69B4', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-baby-clothes.png', isNew: true, popular: false, activations: 15 },
              { id: 'school', ref: 'PL-019', label: 'School Accessories', accent: '#4A90D9', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-school-accessories.png', isNew: true, popular: false, activations: 22 },
              { id: 'motortyres', ref: 'PL-020', label: 'Motorbike Tyres', accent: '#dc2626', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-motorbike-tyres.png', isNew: true, popular: false, activations: 7 },
              { id: 'tobacco', ref: 'PL-021', label: 'Tobacco', accent: '#8B0000', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-tobacco.png', isNew: true, popular: false, activations: 5 },
              { id: 'pets', ref: 'PL-022', label: 'Pet Supplies', accent: '#6b8a0f', img: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/theme-pet-supplies.png', isNew: true, popular: false, activations: 11 },
              { id: 'grocery', ref: 'PL-023', label: 'Grocery & Snacks', accent: '#c15d15', isNew: false, popular: false, activations: 44 },
              { id: 'herbal', ref: 'PL-024', label: 'Herbal & Jamu', accent: '#4d8a0f', isNew: true, popular: false, activations: 9 },
              { id: 'digital', ref: 'PL-025', label: 'Digital Products', accent: '#8E44AD', isNew: true, popular: false, activations: 3 },
              { id: 'general', ref: 'PL-026', label: 'General Store', accent: '#4A90D9', isNew: false, popular: false, activations: 62 },
            ]
            const filtered = themeLibSearch ? productThemes.filter(t => t.label.toLowerCase().includes(themeLibSearch.toLowerCase())) : productThemes
            const newThemes = filtered.filter(t => t.isNew)
            const otherThemes = filtered.filter(t => !t.isNew)

            return (
              <div style={{ background: '#fff', margin: '-20px -24px', padding: '0 0 40px', minHeight: '100vh' }}>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ position: 'relative' }}>
                    <input value={themeLibSearch} onChange={e => setThemeLibSearch(e.target.value)} placeholder="Search product themes..." style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 14, border: '1px solid #e8e8e8', background: '#f8f9fa', color: '#1a1a1a', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ccc" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                  </div>
                </div>

                {/* Popular */}
                {!themeLibSearch && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>Popular Product Themes</div>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>Most activated by local vendors</div>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                      {productThemes.filter(t => t.popular).sort((a, b) => b.activations - a.activations).map(theme => (
                        <div key={theme.id} style={{ flexShrink: 0, width: 100, textAlign: 'center', cursor: 'pointer' }}>
                          <div style={{ width: 100, height: 140, borderRadius: 14, overflow: 'hidden', position: 'relative', border: '2px solid #4A90D9', background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {theme.img ? <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} /> : <span style={{ fontSize: 36 }}>📦</span>}
                            <div style={{ position: 'absolute', top: 4, left: 4, background: '#4A90D9', padding: '1px 5px', borderRadius: 3, fontSize: 7, fontWeight: 800, color: '#fff' }}>POPULAR</div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '12px 6px 6px', textAlign: 'center' }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{theme.label}</div>
                              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>{theme.activations} activations</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Themes */}
                {newThemes.length > 0 && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>🆕 New Product Themes</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      {newThemes.map(theme => (
                        <div key={theme.id} style={{ textAlign: 'center', cursor: 'pointer' }}>
                          <div style={{ aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', position: 'relative', border: `2px solid ${theme.accent}40`, background: `linear-gradient(135deg, ${theme.accent}20, ${theme.accent}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {theme.img ? <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} /> : <span style={{ fontSize: 32 }}>📦</span>}
                            <div style={{ position: 'absolute', top: 4, right: 4, background: theme.accent, width: 10, height: 10, borderRadius: 5 }} />
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>{theme.label}</div>
                          <div style={{ fontSize: 9, color: '#999' }}>{theme.ref}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Themes */}
                <div style={{ padding: '0 16px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>All Product Themes ({otherThemes.length})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {otherThemes.map(theme => (
                      <div key={theme.id} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <div style={{ aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', position: 'relative', border: `2px solid ${theme.accent}40`, background: `linear-gradient(135deg, ${theme.accent}20, ${theme.accent}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {theme.img ? <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} /> : <span style={{ fontSize: 32 }}>📦</span>}
                          {theme.popular && <div style={{ position: 'absolute', top: 4, left: 4, background: '#4A90D9', padding: '1px 5px', borderRadius: 3, fontSize: 7, fontWeight: 800, color: '#fff' }}>POPULAR</div>}
                          <div style={{ position: 'absolute', top: 4, right: 4, background: theme.accent, width: 10, height: 10, borderRadius: 5 }} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>{theme.label}</div>
                        <div style={{ fontSize: 9, color: '#999' }}>{theme.ref}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {currentPage === 'service-themes' && (() => {
            const serviceThemes = SERVICES_THEME_PRESETS.map((t, i) => ({
              id: t.id,
              ref: 'SL-' + String(i + 1).padStart(3, '0'),
              label: t.label.replace(/^#\d+[a-z]?\s*/, ''),
              accent: t.accent,
              img: t.img && typeof t.img === 'string' && t.img.length > 0 ? t.img : null,
              isNew: !!t.isNew,
              popular: false,
              activations: 0,
            }))
            const filtered = themeLibSearch ? serviceThemes.filter(t => t.label.toLowerCase().includes(themeLibSearch.toLowerCase())) : serviceThemes
            const newThemes = filtered.filter(t => t.isNew)
            const otherThemes = filtered.filter(t => !t.isNew)

            return (
              <div style={{ background: '#fff', margin: '-20px -24px', padding: '0 0 40px', minHeight: '100vh' }}>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ position: 'relative' }}>
                    <input value={themeLibSearch} onChange={e => setThemeLibSearch(e.target.value)} placeholder="Search service themes..." style={{ width: '100%', padding: '12px 14px 12px 38px', borderRadius: 14, border: '1px solid #e8e8e8', background: '#f8f9fa', color: '#1a1a1a', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ccc" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                  </div>
                </div>

                {newThemes.length > 0 && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>🆕 New Service Themes</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      {newThemes.map(theme => (
                        <div key={theme.id} onClick={() => setThemeLibPreview(theme.id)} style={{ textAlign: 'center', cursor: 'pointer' }}>
                          <div style={{ aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', position: 'relative', border: `2px solid ${theme.accent}40`, background: `linear-gradient(135deg, ${theme.accent}20, ${theme.accent}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {theme.img ? <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} /> : <span style={{ fontSize: 32 }}>🛠️</span>}
                            <div style={{ position: 'absolute', top: 4, right: 4, background: theme.accent, width: 10, height: 10, borderRadius: 5 }} />
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>{theme.label}</div>
                          <div style={{ fontSize: 9, color: '#999' }}>{theme.ref}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ padding: '0 16px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>All Service Themes ({otherThemes.length})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {otherThemes.map(theme => (
                      <div key={theme.id} onClick={() => setThemeLibPreview(theme.id)} style={{ textAlign: 'center', cursor: 'pointer' }}>
                        <div style={{ aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', position: 'relative', border: `2px solid ${theme.accent}40`, background: `linear-gradient(135deg, ${theme.accent}20, ${theme.accent}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {theme.img ? <img src={theme.img} alt="" onError={imgError('theme')} style={{ width: '100%', height: '100%', objectFit: 'fill' }} /> : <span style={{ fontSize: 32 }}>🛠️</span>}
                          <div style={{ position: 'absolute', top: 4, right: 4, background: theme.accent, width: 10, height: 10, borderRadius: 5 }} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginTop: 4 }}>{theme.label}</div>
                        <div style={{ fontSize: 9, color: '#999' }}>{theme.ref}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Modal */}
                {themeLibPreview && (() => {
                  const previewT = serviceThemes.find(t => t.id === themeLibPreview)
                  if (!previewT) return null
                  const ac = previewT.accent
                  const isDev = window.location.hostname === 'localhost'
                  const demoUrl = (isDev ? 'http://localhost:5183/services/whatsapp/' : '/services/whatsapp/') + '?demo=true&page=landing&theme=' + previewT.id
                  return (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setThemeLibPreview(null)}>
                      <div style={{ width: 260, maxWidth: '90vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center' }}>{previewT.label}</div>
                        <div style={{ width: 220, aspectRatio: '9 / 16', borderRadius: 24, background: '#1a1a1a', padding: 4, position: 'relative', boxShadow: `0 16px 50px rgba(0,0,0,0.5), 0 0 16px ${ac}25`, border: '2px solid #333' }}>
                          <div style={{ width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden', position: 'relative', background: '#000' }}>
                            <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 50, height: 14, background: '#000', borderRadius: 10, zIndex: 10 }} />
                            {previewT.img ? <img src={previewT.img} alt="" onError={imgError('theme')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🛠️</div>}
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 2 }}>
                              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9)', textAlign: 'center' }}>{previewT.label}</div>
                              <div style={{ marginTop: 12, padding: '8px 20px', borderRadius: 10, background: ac, color: '#fff', fontSize: 12, fontWeight: 700 }}>Book Now</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                          <a href={demoUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '12px 20px', borderRadius: 12, background: ac, color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}>Try Live Demo</a>
                          <button onClick={() => setThemeLibPreview(null)} style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })()}

          {currentPage === 'contact' && (
            <div>
              <style>{`
                @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes pulseGlow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
                @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes progressFill { from { width: 0%; } to { width: 100%; } }
              `}</style>

              {/* Section 1: Hero */}
              <div style={{ animation: 'fadeSlideIn 0.6s ease-out' }}>
                <div style={{ height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #FFD600, #ff6b35, #6366f1, #25D366, #FFD600)', backgroundSize: '200% 100%', animation: 'gradientShift 3s ease infinite', marginBottom: 24 }} />
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.3 }}>Enterprise Support & Business Operations Center</h1>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>Get expert help from our dedicated teams across 12 departments</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {['< 2hr Response', '24/7 Monitoring', '99.9% Uptime'].map(badge => (
                    <span key={badge} style={{ background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#444' }}>{badge}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  <button onClick={() => { setContactStep('ticket'); setTicketDept(null); setTicketStep(0); setContactFormStep(0); }} style={{ background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}>Open a Support Ticket</button>
                  <button onClick={() => { setContactStep('helpCenter'); setHelpSearchQuery(''); setHelpExpandedCat(null); setHelpFaqOpen([]); }} style={{ background: '#f8f9fa', color: '#1a1a1a', border: '1px solid #e8e8e8', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Browse Help Center</button>
                  <button onClick={() => { setContactStep('sales'); setSalesForm({ name: '', businessName: '', email: '', whatsapp: '', businessType: '', locations: '', orderVolume: '', interests: [] }); }} style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Contact Sales</button>
                </div>
              </div>

              {/* Section 2: Live Status Bar */}
              <div style={{ background: '#f8f9fa', borderRadius: 16, padding: 16, marginBottom: 28, border: '1px solid #e8e8e8', animation: 'fadeSlideIn 0.6s ease-out 0.1s both' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Departments Online', value: '8', dot: true },
                    { label: 'Avg Response', value: '1.8hr', dot: false },
                    { label: 'System Status', value: 'Operational', dot: true },
                    { label: 'Tickets Resolved', value: '247', dot: false }
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: 'center', padding: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                        {item.dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#25D366', display: 'inline-block', animation: 'pulseGlow 2s ease-in-out infinite' }} />}
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>{item.value}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Intelligent Support Routing */}
              {contactStep === 'browse' && (
                <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.6s ease-out 0.2s both' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', marginBottom: 6 }}>How can we help?</h2>
                  <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Select a category to find answers or submit a ticket</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {SUPPORT_CATEGORIES.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => { setContactCategory(cat); setContactStep('faq'); setContactFaqOpen([]); }}
                        style={{ background: '#fff', border: '2px solid #f0f0f0', borderRadius: 16, padding: '14px 18px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFD600'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,214,0,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{cat.title}</div>
                          <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{cat.description}</div>
                        </div>
                        <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{(() => { const n = Math.floor(Math.random() * 40 + 12); return `${n} resolved today` })()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: FAQ Deflection */}
              {contactStep === 'faq' && contactCategory && (
                <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.4s ease-out' }}>
                  <button onClick={() => setContactStep('browse')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#1a73e8', marginBottom: 16, padding: 0, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    ← Back to categories
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{contactCategory.icon}</span>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', margin: 0 }}>{contactCategory.title}</h2>
                      <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{contactCategory.description}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#444', marginBottom: 12 }}>Before submitting, these may help:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {contactCategory.faqs.map((faq, i) => (
                      <div key={i} style={{ background: '#f8f9fa', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                        <button
                          onClick={() => setContactFaqOpen(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                          style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', flex: 1, paddingRight: 10 }}>{faq.q}</span>
                          <span style={{ fontSize: 18, color: '#888', transform: contactFaqOpen.includes(i) ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                        </button>
                        {contactFaqOpen.includes(i) && (
                          <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#555', lineHeight: 1.6 }}>{faq.a}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setContactStep('form'); setContactFormStep(0); setContactFormData(prev => ({ ...prev, department: contactCategory.title })); }}
                    style={{ width: '100%', background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}
                  >
                    This didn't help — Submit a ticket
                  </button>
                </div>
              )}

              {/* Section 5: Ticket Form */}
              {contactStep === 'form' && (
                <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.4s ease-out' }}>
                  <button onClick={() => contactCategory ? setContactStep('faq') : setContactStep('browse')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#1a73e8', marginBottom: 16, padding: 0, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    ← Back
                  </button>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', marginBottom: 16 }}>Submit a Support Ticket</h2>

                  {/* Progress Bar */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                    {['Details', 'Description', 'Review'].map((step, i) => (
                      <div key={step} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: 4, borderRadius: 2, background: i <= contactFormStep ? '#FFD600' : '#e8e8e8', transition: 'background 0.3s', marginBottom: 6 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: i <= contactFormStep ? '#1a1a1a' : '#ccc' }}>{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Form Card */}
                  <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: 20, padding: 24, border: '1px solid #e8e8e8', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                    {/* Step 0: Details */}
                    {contactFormStep === 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                          { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name' },
                          { key: 'business', label: 'Business Name', type: 'text', placeholder: 'Your business' },
                          { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                          { key: 'username', label: 'StreetLocal Username', type: 'text', placeholder: '@username (optional)' }
                        ].map(field => (
                          <div key={field.key}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>{field.label}</label>
                            <input
                              type={field.type}
                              value={contactFormData[field.key]}
                              onChange={e => setContactFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 44 }}
                              onFocus={e => e.currentTarget.style.borderColor = '#FFD600'}
                              onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                            />
                          </div>
                        ))}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Department</label>
                          <input type="text" value={contactFormData.department} readOnly style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, background: '#f8f9fa', color: '#888', boxSizing: 'border-box', minHeight: 44 }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 8 }}>Priority</label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {[
                              { key: 'low', label: 'Low', color: '#22c55e' },
                              { key: 'normal', label: 'Normal', color: '#3b82f6' },
                              { key: 'high', label: 'High', color: '#f59e0b' },
                              { key: 'urgent', label: 'Urgent', color: '#ef4444' }
                            ].map(p => (
                              <button
                                key={p.key}
                                onClick={() => setContactFormData(prev => ({ ...prev, priority: p.key }))}
                                style={{ padding: '10px 12px', borderRadius: 10, border: contactFormData.priority === p.key ? `2px solid ${p.color}` : '2px solid #e8e8e8', background: contactFormData.priority === p.key ? `${p.color}15` : '#fff', fontSize: 13, fontWeight: 700, color: contactFormData.priority === p.key ? p.color : '#888', cursor: 'pointer', minHeight: 44 }}
                              >{p.label}</button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => setContactFormStep(1)}
                          disabled={!contactFormData.name || !contactFormData.email}
                          style={{ background: contactFormData.name && contactFormData.email ? '#FFD600' : '#e8e8e8', color: contactFormData.name && contactFormData.email ? '#1a1a1a' : '#aaa', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: contactFormData.name && contactFormData.email ? 'pointer' : 'not-allowed', marginTop: 6, minHeight: 44 }}
                        >Continue</button>
                      </div>
                    )}

                    {/* Step 1: Description */}
                    {contactFormStep === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Subject</label>
                          <input
                            type="text"
                            value={contactFormData.subject}
                            onChange={e => setContactFormData(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Brief summary of your issue"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 44 }}
                            onFocus={e => e.currentTarget.style.borderColor = '#FFD600'}
                            onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Description</label>
                          <textarea
                            value={contactFormData.description}
                            onChange={e => { if (e.target.value.length <= 1000) setContactFormData(prev => ({ ...prev, description: e.target.value })); }}
                            placeholder="Describe your issue in detail..."
                            rows={5}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            onFocus={e => e.currentTarget.style.borderColor = '#FFD600'}
                            onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                          />
                          <div style={{ fontSize: 11, color: '#888', textAlign: 'right', marginTop: 4 }}>{contactFormData.description.length}/1000</div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Attach File (optional)</label>
                          <div style={{ border: '2px dashed #e0e0e0', borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 13, color: '#888' }}>{contactFormData.file ? contactFormData.file : 'Tap to attach screenshot or document'}</span>
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 8 }}>Preferred Contact Method</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {[
                              { key: 'email', label: 'Email' },
                              { key: 'whatsapp', label: 'WhatsApp' },
                              { key: 'any', label: 'Any' }
                            ].map(m => (
                              <button
                                key={m.key}
                                onClick={() => setContactFormData(prev => ({ ...prev, contactMethod: m.key }))}
                                style={{ flex: 1, padding: '10px', borderRadius: 10, border: contactFormData.contactMethod === m.key ? '2px solid #FFD600' : '2px solid #e8e8e8', background: contactFormData.contactMethod === m.key ? '#fffde7' : '#fff', fontSize: 13, fontWeight: 700, color: '#444', cursor: 'pointer', minHeight: 44 }}
                              >{m.label}</button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                          <button onClick={() => setContactFormStep(0)} style={{ flex: 1, background: '#f8f9fa', color: '#444', border: '1px solid #e8e8e8', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Back</button>
                          <button
                            onClick={() => setContactFormStep(2)}
                            disabled={!contactFormData.subject || !contactFormData.description}
                            style={{ flex: 2, background: contactFormData.subject && contactFormData.description ? '#FFD600' : '#e8e8e8', color: contactFormData.subject && contactFormData.description ? '#1a1a1a' : '#aaa', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: contactFormData.subject && contactFormData.description ? 'pointer' : 'not-allowed', minHeight: 44 }}
                          >Review</button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Review */}
                    {contactFormStep === 2 && (
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 }}>Review Your Ticket</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                          {[
                            { label: 'Name', value: contactFormData.name },
                            { label: 'Business', value: contactFormData.business || '—' },
                            { label: 'Email', value: contactFormData.email },
                            { label: 'Username', value: contactFormData.username || '—' },
                            { label: 'Department', value: contactFormData.department || 'General' },
                            { label: 'Priority', value: contactFormData.priority.charAt(0).toUpperCase() + contactFormData.priority.slice(1) },
                            { label: 'Subject', value: contactFormData.subject },
                            { label: 'Contact Method', value: contactFormData.contactMethod.charAt(0).toUpperCase() + contactFormData.contactMethod.slice(1) }
                          ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                              <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{row.label}</span>
                              <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                            </div>
                          ))}
                          {contactFormData.description && (
                            <div style={{ padding: '8px 0' }}>
                              <span style={{ fontSize: 13, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</span>
                              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.5, margin: 0, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>{contactFormData.description}</p>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => setContactFormStep(1)} style={{ flex: 1, background: '#f8f9fa', color: '#444', border: '1px solid #e8e8e8', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Edit</button>
                          <button
                            onClick={() => {
                              const tid = 'SL-' + String(Math.floor(10000 + Math.random() * 90000))
                              setContactTicketId(tid)
                              // Send ticket via email
                              const d = contactFormData
                              const subject = encodeURIComponent(`[${tid}] ${d.subject || 'Support Ticket'} — ${d.department || contactCategory}`)
                              const body = encodeURIComponent(`Ticket: ${tid}\nPriority: ${d.priority}\nDepartment: ${d.department || contactCategory}\n\nName: ${d.name}\nBusiness: ${d.business}\nEmail: ${d.email}\nUsername: ${d.username}\nContact Method: ${d.contactMethod}\n\n${d.description}`)
                              window.open(`mailto:indootechteam@gmail.com?subject=${subject}&body=${body}`, '_blank')
                              setContactStep('confirmation')
                            }}
                            style={{ flex: 2, background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}
                          >Submit Ticket</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 6: Ticket Confirmation */}
              {contactStep === 'confirmation' && (
                <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.4s ease-out' }}>
                  <div style={{ background: '#f0fdf4', borderRadius: 20, padding: 24, border: '2px solid #bbf7d0', textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 6 }}>Ticket Submitted</h2>
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Your request has been received and assigned to our team</p>
                    <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e8e8e8', marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 4 }}>Ticket Number</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', letterSpacing: 2 }}>{contactTicketId}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                      <div style={{ background: '#fff', borderRadius: 10, padding: 10, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Department</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a', marginTop: 4 }}>{contactFormData.department || 'General'}</div>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 10, padding: 10, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Priority</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: contactFormData.priority === 'urgent' ? '#ef4444' : contactFormData.priority === 'high' ? '#f59e0b' : '#1a1a1a', marginTop: 4 }}>{contactFormData.priority.charAt(0).toUpperCase() + contactFormData.priority.slice(1)}</div>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 10, padding: 10, border: '1px solid #e8e8e8' }}>
                        <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Est. Response</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1a1a1a', marginTop: 4 }}>{contactFormData.priority === 'urgent' ? '< 30min' : contactFormData.priority === 'high' ? '< 1hr' : '< 2hr'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e8e8e8', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 }}>Ticket Status</h3>
                    {[
                      { label: 'Submitted', detail: 'Just now', active: true },
                      { label: 'Under Review', detail: 'Assigned to team', active: false },
                      { label: 'In Progress', detail: 'Working on it', active: false },
                      { label: 'Resolved', detail: 'Solution delivered', active: false }
                    ].map((node, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 3 ? 12 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: node.active ? '#25D366' : '#e8e8e8', border: node.active ? '3px solid #bbf7d0' : '3px solid #f0f0f0' }} />
                          {i < 3 && <div style={{ width: 2, height: 24, background: '#e8e8e8' }} />}
                        </div>
                        <div style={{ paddingTop: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: node.active ? '#1a1a1a' : '#bbb' }}>{node.label}</div>
                          <div style={{ fontSize: 11, color: node.active ? '#888' : '#ccc' }}>{node.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* What Happens Next */}
                  <div style={{ background: '#fffde7', borderRadius: 16, padding: 20, border: '1px solid #fff3b0', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>What Happens Next</h3>
                    {[
                      'Your ticket has been assigned to the appropriate department.',
                      'A support agent will review your request and respond via your preferred contact method.',
                      'You will receive updates via email and WhatsApp.',
                      'For urgent matters, reach us on WhatsApp for real-time support.'
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                        <span style={{ background: '#FFD600', color: '#1a1a1a', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{step}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setContactStep('browse')
                      setContactCategory(null)
                      setContactFormData({ name: '', business: '', email: '', username: '', department: '', priority: 'normal', subject: '', description: '', file: null, contactMethod: 'email' })
                      setContactFormStep(0)
                      setContactTicketId('')
                    }}
                    style={{ width: '100%', background: '#f8f9fa', color: '#1a1a1a', border: '1px solid #e8e8e8', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}
                  >Submit Another Ticket</button>
                </div>
              )}

              {/* ═══ NEW: Ticket Section ═══ */}
              {contactStep === 'ticket' && (
                <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.5s ease-out' }}>
                  <button onClick={() => { setContactStep(null); setTicketDept(null); setTicketStep(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#1a73e8', marginBottom: 16, padding: 0, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    ← Back to Support Center
                  </button>

                  {/* Header */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #FFD600, #ff6b35, #6366f1)', backgroundSize: '200% 100%', animation: 'gradientShift 3s ease infinite', marginBottom: 16 }} />
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 6 }}>Submit a Support Request</h2>
                    <p style={{ fontSize: 13, color: '#888', marginBottom: 0 }}>Our team will respond based on your selected priority</p>
                  </div>

                  {/* Progress Stepper */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 24, alignItems: 'center' }}>
                    {['Select Department', 'Describe Issue', 'Review & Submit'].map((step, i) => (
                      <div key={step} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: i <= ticketStep ? '#FFD600' : '#e8e8e8', color: i <= ticketStep ? '#1a1a1a' : '#aaa', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: i <= ticketStep ? '#FFD600' : '#e8e8e8', transition: 'background 0.3s', marginBottom: 4 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: i <= ticketStep ? '#1a1a1a' : '#ccc' }}>{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Step 0: Department Selection */}
                  {ticketStep === 0 && (
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Choose a Department</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {SUPPORT_CATEGORIES.map((cat, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setTicketDept(cat);
                              setContactFormData(prev => ({ ...prev, department: cat.title }));
                              setTicketStep(1);
                              setContactFormStep(0);
                            }}
                            style={{
                              background: ticketDept && ticketDept.title === cat.title ? '#fffde7' : '#fff',
                              border: ticketDept && ticketDept.title === cat.title ? '2px solid #FFD600' : '2px solid #f0f0f0',
                              borderRadius: 16, padding: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', minHeight: 44
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFD600'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,214,0,0.15)'; }}
                            onMouseLeave={e => { if (!(ticketDept && ticketDept.title === cat.title)) e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <div style={{ fontSize: 22, marginBottom: 6 }}>{cat.icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 3 }}>{cat.title}</div>
                            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4, marginBottom: 6 }}>{cat.description}</div>
                            <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10 }}>{(() => { const n = Math.floor(Math.random() * 40 + 12); return `${n} resolved today` })()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 1: Ticket Form (inline) */}
                  {ticketStep === 1 && ticketDept && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, background: '#f8f9fa', borderRadius: 12, padding: 12 }}>
                        <span style={{ fontSize: 24 }}>{ticketDept.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{ticketDept.title}</div>
                          <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{Math.floor(Math.random() * 40 + 12)} resolved today</div>
                        </div>
                        <button onClick={() => setTicketStep(0)} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: '#1a73e8', cursor: 'pointer', minHeight: 44 }}>Change</button>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: 20, padding: 24, border: '1px solid #e8e8e8', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                        {contactFormStep === 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name' },
                              { key: 'business', label: 'Business Name', type: 'text', placeholder: 'Your business' },
                              { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                              { key: 'username', label: 'StreetLocal Username', type: 'text', placeholder: '@username (optional)' }
                            ].map(field => (
                              <div key={field.key}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>{field.label}</label>
                                <input
                                  type={field.type}
                                  value={contactFormData[field.key]}
                                  onChange={e => setContactFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                  placeholder={field.placeholder}
                                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 44 }}
                                  onFocus={e => e.currentTarget.style.borderColor = '#FFD600'}
                                  onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                                />
                              </div>
                            ))}

                            {/* Priority Visualization */}
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 8 }}>Priority Level</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                  { key: 'low', label: 'Low', color: '#22c55e', time: '< 24 hours', desc: 'General questions' },
                                  { key: 'normal', label: 'Normal', color: '#3b82f6', time: '< 4 hours', desc: 'Standard issues' },
                                  { key: 'high', label: 'High', color: '#f59e0b', time: '< 1 hour', desc: 'Business impacted' },
                                  { key: 'urgent', label: 'Urgent', color: '#ef4444', time: '< 30 min', desc: 'System down' }
                                ].map(p => (
                                  <button
                                    key={p.key}
                                    onClick={() => setContactFormData(prev => ({ ...prev, priority: p.key }))}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                                      border: contactFormData.priority === p.key ? `2px solid ${p.color}` : '2px solid #e8e8e8',
                                      background: contactFormData.priority === p.key ? `${p.color}10` : '#fff',
                                      cursor: 'pointer', minHeight: 44, textAlign: 'left', width: '100%', boxSizing: 'border-box'
                                    }}
                                  >
                                    <div style={{
                                      width: 8, height: 32, borderRadius: 4, background: p.color, flexShrink: 0,
                                      animation: p.key === 'urgent' && contactFormData.priority === 'urgent' ? 'pulseGlow 1.5s ease-in-out infinite' : 'none'
                                    }} />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 13, fontWeight: 800, color: contactFormData.priority === p.key ? p.color : '#444' }}>{p.label}</div>
                                      <div style={{ fontSize: 11, color: '#888' }}>{p.desc}</div>
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.time}</div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Estimated Response */}
                            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 14, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4 }}>Estimated Response Time</div>
                              <div style={{ fontSize: 20, fontWeight: 900, color: '#15803d' }}>
                                {contactFormData.priority === 'urgent' ? '< 30 minutes' : contactFormData.priority === 'high' ? '< 1 hour' : contactFormData.priority === 'normal' ? '< 4 hours' : '< 24 hours'}
                              </div>
                            </div>

                            <button
                              onClick={() => setContactFormStep(1)}
                              disabled={!contactFormData.name || !contactFormData.email}
                              style={{ background: contactFormData.name && contactFormData.email ? '#FFD600' : '#e8e8e8', color: contactFormData.name && contactFormData.email ? '#1a1a1a' : '#aaa', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: contactFormData.name && contactFormData.email ? 'pointer' : 'not-allowed', marginTop: 6, minHeight: 44 }}
                            >Continue to Description</button>
                          </div>
                        )}

                        {contactFormStep === 1 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Subject</label>
                              <input
                                type="text"
                                value={contactFormData.subject}
                                onChange={e => setContactFormData(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="Brief summary of your issue"
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 44 }}
                                onFocus={e => e.currentTarget.style.borderColor = '#FFD600'}
                                onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Description</label>
                              <textarea
                                value={contactFormData.description}
                                onChange={e => { if (e.target.value.length <= 1000) setContactFormData(prev => ({ ...prev, description: e.target.value })); }}
                                placeholder="Describe your issue in detail..."
                                rows={5}
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                onFocus={e => e.currentTarget.style.borderColor = '#FFD600'}
                                onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                              />
                              <div style={{ fontSize: 11, color: '#888', textAlign: 'right', marginTop: 4 }}>{contactFormData.description.length}/1000</div>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Attach File (optional)</label>
                              <div style={{ border: '2px dashed #e0e0e0', borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 13, color: '#888' }}>{contactFormData.file ? contactFormData.file : 'Tap to attach screenshot or document'}</span>
                              </div>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 8 }}>Preferred Contact Method</label>
                              <div style={{ display: 'flex', gap: 8 }}>
                                {[
                                  { key: 'email', label: 'Email' },
                                  { key: 'whatsapp', label: 'WhatsApp' },
                                  { key: 'any', label: 'Any' }
                                ].map(m => (
                                  <button
                                    key={m.key}
                                    onClick={() => setContactFormData(prev => ({ ...prev, contactMethod: m.key }))}
                                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: contactFormData.contactMethod === m.key ? '2px solid #FFD600' : '2px solid #e8e8e8', background: contactFormData.contactMethod === m.key ? '#fffde7' : '#fff', fontSize: 13, fontWeight: 700, color: '#444', cursor: 'pointer', minHeight: 44 }}
                                  >{m.label}</button>
                                ))}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                              <button onClick={() => setContactFormStep(0)} style={{ flex: 1, background: '#f8f9fa', color: '#444', border: '1px solid #e8e8e8', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Back</button>
                              <button
                                onClick={() => { setContactFormStep(2); setTicketStep(2); }}
                                disabled={!contactFormData.subject || !contactFormData.description}
                                style={{ flex: 2, background: contactFormData.subject && contactFormData.description ? '#FFD600' : '#e8e8e8', color: contactFormData.subject && contactFormData.description ? '#1a1a1a' : '#aaa', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: contactFormData.subject && contactFormData.description ? 'pointer' : 'not-allowed', minHeight: 44 }}
                              >Review</button>
                            </div>
                          </div>
                        )}

                        {contactFormStep === 2 && (
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 }}>Review Your Ticket</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                              {[
                                { label: 'Name', value: contactFormData.name },
                                { label: 'Business', value: contactFormData.business || '---' },
                                { label: 'Email', value: contactFormData.email },
                                { label: 'Department', value: ticketDept ? ticketDept.title : 'General' },
                                { label: 'Priority', value: contactFormData.priority.charAt(0).toUpperCase() + contactFormData.priority.slice(1) },
                                { label: 'Subject', value: contactFormData.subject },
                                { label: 'Contact Method', value: contactFormData.contactMethod.charAt(0).toUpperCase() + contactFormData.contactMethod.slice(1) }
                              ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                                  <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{row.label}</span>
                                  <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                                </div>
                              ))}
                              {contactFormData.description && (
                                <div style={{ padding: '8px 0' }}>
                                  <span style={{ fontSize: 13, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</span>
                                  <p style={{ fontSize: 13, color: '#444', lineHeight: 1.5, margin: 0, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>{contactFormData.description}</p>
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <button onClick={() => { setContactFormStep(1); setTicketStep(1); }} style={{ flex: 1, background: '#f8f9fa', color: '#444', border: '1px solid #e8e8e8', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Edit</button>
                              <button
                                onClick={() => {
                                  const tid = 'SL-' + String(Math.floor(10000 + Math.random() * 90000))
                                  setContactTicketId(tid)
                                  const d = contactFormData
                                  const subject = encodeURIComponent('[' + tid + '] ' + (d.subject || 'Support Ticket') + ' --- ' + (d.department || (ticketDept ? ticketDept.title : 'General')))
                                  const body = encodeURIComponent('Ticket: ' + tid + '\nPriority: ' + d.priority + '\nDepartment: ' + (d.department || (ticketDept ? ticketDept.title : 'General')) + '\n\nName: ' + d.name + '\nBusiness: ' + d.business + '\nEmail: ' + d.email + '\nUsername: ' + d.username + '\nContact Method: ' + d.contactMethod + '\n\n' + d.description)
                                  window.open('mailto:indootechteam@gmail.com?subject=' + subject + '&body=' + body, '_blank')
                                  setContactStep('confirmation')
                                }}
                                style={{ flex: 2, background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800, cursor: 'pointer', minHeight: 44 }}
                              >Submit Ticket</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ NEW: Help Center Section ═══ */}
              {contactStep === 'helpCenter' && (
                <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.5s ease-out' }}>
                  <button onClick={() => { setContactStep(null); setHelpSearchQuery(''); setHelpExpandedCat(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#1a73e8', marginBottom: 16, padding: 0, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    ← Back to Support Center
                  </button>

                  {/* Header */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #6366f1, #3b82f6, #25D366)', backgroundSize: '200% 100%', animation: 'gradientShift 3s ease infinite', marginBottom: 16 }} />
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 6 }}>Help Center & Knowledge Base</h2>
                    <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Find answers instantly from our comprehensive resource library</p>


                    {/* Search Bar */}
                    <div style={{ position: 'relative', marginBottom: 20 }}>
                      <input
                        type="text"
                        value={helpSearchQuery}
                        onChange={e => { setHelpSearchQuery(e.target.value); setHelpExpandedCat(null); setHelpFaqOpen([]); }}
                        placeholder="Search for answers..."
                        style={{ width: '100%', padding: '14px 14px 14px 42px', borderRadius: 14, border: '2px solid #e8e8e8', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 44, background: '#fff' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                        onBlur={e => e.currentTarget.style.borderColor = '#e8e8e8'}
                      />
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#888' }}>&#128269;</span>
                    </div>
                  </div>

                  {/* Search Results */}
                  {helpSearchQuery.trim().length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Search Results</h3>
                      {(() => {
                        const query = helpSearchQuery.toLowerCase().trim();
                        const results = [];
                        SUPPORT_CATEGORIES.forEach(cat => {
                          cat.faqs.forEach((faq, fi) => {
                            if (faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query)) {
                              results.push({ cat, faq, fi });
                            }
                          });
                        });
                        if (results.length === 0) {
                          return <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: 20 }}>No results found. Try a different search term.</p>;
                        }
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {results.slice(0, 15).map((r, i) => (
                              <div key={i} style={{ background: '#f8f9fa', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                                <button
                                  onClick={() => setHelpFaqOpen(prev => prev.includes('s' + i) ? prev.filter(x => x !== 's' + i) : [...prev, 's' + i])}
                                  style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}
                                >
                                  <div style={{ flex: 1, paddingRight: 10 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', display: 'block' }}>{r.faq.q}</span>
                                    <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>{r.cat.icon} {r.cat.title}</span>
                                  </div>
                                  <span style={{ fontSize: 18, color: '#888', transform: helpFaqOpen.includes('s' + i) ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>&#9660;</span>
                                </button>
                                {helpFaqOpen.includes('s' + i) && (
                                  <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#555', lineHeight: 1.6 }}>{r.faq.a}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Popular Articles */}
                  {helpSearchQuery.trim().length === 0 && !helpExpandedCat && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Popular Articles</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { cat: SUPPORT_CATEGORIES[0], faq: SUPPORT_CATEGORIES[0].faqs[0] },
                          { cat: SUPPORT_CATEGORIES[1], faq: SUPPORT_CATEGORIES[1].faqs[0] },
                          { cat: SUPPORT_CATEGORIES[3], faq: SUPPORT_CATEGORIES[3].faqs[0] },
                          { cat: SUPPORT_CATEGORIES[10], faq: SUPPORT_CATEGORIES[10].faqs[0] },
                          { cat: SUPPORT_CATEGORIES[2], faq: SUPPORT_CATEGORIES[2].faqs[0] }
                        ].map((item, i) => (
                          <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                            <button
                              onClick={() => setHelpFaqOpen(prev => prev.includes('p' + i) ? prev.filter(x => x !== 'p' + i) : [...prev, 'p' + i])}
                              style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}
                            >
                              <div style={{ flex: 1, paddingRight: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                  <span style={{ background: '#fffde7', padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 700, color: '#b8860b' }}>POPULAR</span>
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', display: 'block' }}>{item.faq.q}</span>
                                <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{item.cat.icon} {item.cat.title}</span>
                              </div>
                              <span style={{ fontSize: 18, color: '#888', transform: helpFaqOpen.includes('p' + i) ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>&#9660;</span>
                            </button>
                            {helpFaqOpen.includes('p' + i) && (
                              <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#555', lineHeight: 1.6 }}>{item.faq.a}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Links */}
                  {helpSearchQuery.trim().length === 0 && !helpExpandedCat && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Quick Links</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          { icon: '&#128640;', label: 'Getting Started', catIdx: 0 },
                          { icon: '&#128100;', label: 'Account Setup', catIdx: 0 },
                          { icon: '&#128179;', label: 'Billing', catIdx: 1 },
                          { icon: '&#128187;', label: 'API Docs', catIdx: 11 }
                        ].map((link, i) => (
                          <button
                            key={i}
                            onClick={() => { setHelpExpandedCat(SUPPORT_CATEGORIES[link.catIdx]); setHelpFaqOpen([]); }}
                            style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', minHeight: 44, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#f0f4ff'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.background = '#fff'; }}
                          >
                            <span style={{ fontSize: 18 }} dangerouslySetInnerHTML={{ __html: link.icon }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{link.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Cards */}
                  {helpSearchQuery.trim().length === 0 && !helpExpandedCat && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>All Categories</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {SUPPORT_CATEGORIES.map((cat, i) => (
                          <button
                            key={i}
                            onClick={() => { setHelpExpandedCat(cat); setHelpFaqOpen([]); }}
                            style={{ background: '#fff', border: '2px solid #f0f0f0', borderRadius: 16, padding: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', minHeight: 44, position: 'relative' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.12)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 22, marginBottom: 6, display: 'block' }}>{cat.icon}</span>
                              <span style={{ background: '#f0f4ff', color: '#6366f1', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10 }}>{cat.faqs.length} FAQs</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 3 }}>{cat.title}</div>
                            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{cat.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Category */}
                  {helpExpandedCat && helpSearchQuery.trim().length === 0 && (
                    <div style={{ marginBottom: 24, animation: 'fadeSlideIn 0.3s ease-out' }}>
                      <button onClick={() => { setHelpExpandedCat(null); setHelpFaqOpen([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6366f1', marginBottom: 12, padding: 0, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                        ← All Categories
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <span style={{ fontSize: 28 }}>{helpExpandedCat.icon}</span>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a', margin: 0 }}>{helpExpandedCat.title}</h3>
                          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{helpExpandedCat.description}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {helpExpandedCat.faqs.map((faq, i) => (
                          <div key={i} style={{ background: '#f8f9fa', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                            <button
                              onClick={() => setHelpFaqOpen(prev => prev.includes('c' + i) ? prev.filter(x => x !== 'c' + i) : [...prev, 'c' + i])}
                              style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}
                            >
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', flex: 1, paddingRight: 10 }}>{faq.q}</span>
                              <span style={{ fontSize: 18, color: '#888', transform: helpFaqOpen.includes('c' + i) ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>&#9660;</span>
                            </button>
                            {helpFaqOpen.includes('c' + i) && (
                              <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#555', lineHeight: 1.6 }}>{faq.a}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Still need help CTA */}
                  <div style={{ background: '#fffde7', borderRadius: 16, padding: 20, border: '1px solid #fff3b0', textAlign: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Still need help?</h3>
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>Our support team is ready to assist you personally</p>
                    <button
                      onClick={() => { setContactStep('ticket'); setTicketDept(null); setTicketStep(0); setContactFormStep(0); }}
                      style={{ background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '14px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 44, width: '100%' }}
                    >Submit a Support Ticket</button>
                  </div>
                </div>
              )}

              {/* ═══ NEW: Sales Section ═══ */}
              {contactStep === 'sales' && (
                <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.5s ease-out' }}>
                  <button onClick={() => setContactStep(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#1a73e8', marginBottom: 16, padding: 0, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    ← Back to Support Center
                  </button>

                  {/* Header */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #1a1a1a, #444, #888, #1a1a1a)', backgroundSize: '200% 100%', animation: 'gradientShift 3s ease infinite', marginBottom: 16 }} />
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1a1a1a', marginBottom: 6 }}>Talk to Our Sales Team</h2>
                    <p style={{ fontSize: 13, color: '#888', marginBottom: 0 }}>Get a personalized solution for your business needs</p>
                  </div>


                  {/* What We Offer */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>What We Offer</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { icon: '&#128241;', title: 'Basic App', desc: 'Perfect for getting started with a mobile-first store', color: '#3b82f6' },
                        { icon: '&#9889;', title: 'Pro App', desc: 'Advanced features for growing businesses', color: '#f59e0b' },
                        { icon: '&#127760;', title: 'Custom Domain', desc: 'Your own branded URL for a professional presence', color: '#6366f1' },
                        { icon: '&#127970;', title: 'Enterprise Solutions', desc: 'White-label, API, and dedicated support', color: '#1a1a1a' }
                      ].map((offer, i) => (
                        <div key={i} style={{ background: '#fff', border: '2px solid #f0f0f0', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                          <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: offer.icon }} />
                          <div style={{ fontSize: 14, fontWeight: 800, color: offer.color, marginBottom: 4 }}>{offer.title}</div>
                          <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{offer.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consultation Form */}
                  <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: 20, padding: 24, border: '1px solid #e8e8e8', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 }}>Book a Free Consultation</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { key: 'name', label: 'Your Name', type: 'text', placeholder: 'Full name' },
                        { key: 'businessName', label: 'Business Name', type: 'text', placeholder: 'Your business name' },
                        { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                        { key: 'whatsapp', label: 'WhatsApp Number', type: 'tel', placeholder: '+62 xxx xxxx xxxx' }
                      ].map(field => (
                        <div key={field.key}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>{field.label}</label>
                          <input
                            type={field.type}
                            value={salesForm[field.key]}
                            onChange={e => setSalesForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 44 }}
                            onFocus={e => e.currentTarget.style.borderColor = '#1a1a1a'}
                            onBlur={e => e.currentTarget.style.borderColor = '#e0e0e0'}
                          />
                        </div>
                      ))}

                      {/* Business Type */}
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Business Type</label>
                        <select
                          value={salesForm.businessType}
                          onChange={e => setSalesForm(prev => ({ ...prev, businessType: e.target.value }))}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 44, background: '#fff', color: salesForm.businessType ? '#1a1a1a' : '#888' }}
                        >
                          <option value="" disabled>Select your business type</option>
                          {['Restaurant / Food & Beverage', 'Cafe / Coffee Shop', 'Street Food / Food Truck', 'Catering Service', 'Bakery / Desserts', 'Grocery / Minimart', 'Property / Real Estate', 'Salon / Beauty', 'Laundry Service', 'Retail / E-commerce', 'Other'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Number of Locations */}
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Number of Locations</label>
                        <select
                          value={salesForm.locations}
                          onChange={e => setSalesForm(prev => ({ ...prev, locations: e.target.value }))}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 44, background: '#fff', color: salesForm.locations ? '#1a1a1a' : '#888' }}
                        >
                          <option value="" disabled>Select</option>
                          {['1', '2-5', '6-10', '11-25', '25+'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>

                      {/* Monthly Order Volume */}
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6 }}>Monthly Order Volume</label>
                        <select
                          value={salesForm.orderVolume}
                          onChange={e => setSalesForm(prev => ({ ...prev, orderVolume: e.target.value }))}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 14, outline: 'none', boxSizing: 'border-box', minHeight: 44, background: '#fff', color: salesForm.orderVolume ? '#1a1a1a' : '#888' }}
                        >
                          <option value="" disabled>Select estimated volume</option>
                          {['Under 100', '100 - 500', '500 - 1,000', '1,000 - 5,000', '5,000+'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>

                      {/* Interests checkboxes */}
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 8 }}>What interests you?</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {['Food App', 'Custom Domain', 'Custom Theme', 'API Access', 'White Label Solution'].map(interest => (
                            <label key={interest} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 10, border: salesForm.interests.includes(interest) ? '2px solid #1a1a1a' : '2px solid #e8e8e8', background: salesForm.interests.includes(interest) ? '#f8f9fa' : '#fff', minHeight: 44 }}>
                              <input
                                type="checkbox"
                                checked={salesForm.interests.includes(interest)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSalesForm(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                                  } else {
                                    setSalesForm(prev => ({ ...prev, interests: prev.interests.filter(x => x !== interest) }));
                                  }
                                }}
                                style={{ width: 18, height: 18, accentColor: '#1a1a1a' }}
                              />
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{interest}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Submit consultation */}
                      <button
                        onClick={() => {
                          const subject = encodeURIComponent('Sales Inquiry - ' + (salesForm.businessName || 'New Business'))
                          const body = encodeURIComponent('Name: ' + salesForm.name + '\nBusiness: ' + salesForm.businessName + '\nEmail: ' + salesForm.email + '\nWhatsApp: ' + salesForm.whatsapp + '\nBusiness Type: ' + salesForm.businessType + '\nLocations: ' + salesForm.locations + '\nMonthly Volume: ' + salesForm.orderVolume + '\nInterests: ' + salesForm.interests.join(', '))
                          window.open('mailto:indootechteam@gmail.com?subject=' + subject + '&body=' + body, '_blank')
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '16px 24px', fontSize: 16, fontWeight: 800, cursor: 'pointer', minHeight: 44, width: '100%' }}
                      >
                        Submit Consultation Request
                      </button>

                      {/* Response time notice */}
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Our sales team typically responds within 2 hours</span>
                      </div>
                    </div>
                  </div>

                  {/* Enterprise Features */}
                  <div style={{ background: '#f8f9fa', borderRadius: 16, padding: 20, border: '1px solid #e8e8e8' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 14 }}>Enterprise Features</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { icon: '&#128101;', title: 'Dedicated Account Manager', desc: 'A personal point of contact for all your needs' },
                        { icon: '&#9889;', title: 'Priority Support', desc: 'Under 30-minute response time guaranteed' },
                        { icon: '&#128295;', title: 'Custom Integration', desc: 'Connect with your existing tools and workflows' },
                        { icon: '&#128203;', title: 'SLA Guarantee', desc: '99.9% uptime with financial backing' }
                      ].map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, padding: 14, border: '1px solid #e8e8e8' }}>
                          <span style={{ fontSize: 22, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: feat.icon }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 2 }}>{feat.title}</div>
                            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>{feat.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 7: Department Showcase */}
              <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.6s ease-out 0.3s both' }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', marginBottom: 6 }}>Our Departments</h2>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Specialized teams ready to assist you</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {CONTACT_DEPARTMENTS.map((dept, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #f0f0f0', textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{dept.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>{dept.name}</div>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{dept.metric}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dept.status === 'online' ? '#25D366' : '#f59e0b', animation: dept.status === 'online' ? 'pulseGlow 2s ease-in-out infinite' : 'none' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: dept.status === 'online' ? '#25D366' : '#f59e0b' }}>{dept.status === 'online' ? 'Online' : 'Busy'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 8: Company Stats */}
              <div style={{ marginBottom: 28, animation: 'fadeSlideIn 0.6s ease-out 0.4s both' }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', marginBottom: 16, textAlign: 'center' }}>StreetLocal by the Numbers</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {CONTACT_COMPANY_STATS.map((stat, i) => (
                    <div key={i} style={{ background: '#f8f9fa', borderRadius: 14, padding: 16, textAlign: 'center', border: '1px solid #e8e8e8' }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#1a1a1a', marginBottom: 4 }}>
                        {stat.decimal ? contactCounters[i].toFixed(1) : contactCounters[i]}{stat.suffix}
                      </div>
                      <div style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 9: Communication Channels */}
              <div style={{ marginBottom: 20, animation: 'fadeSlideIn 0.6s ease-out 0.5s both' }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', marginBottom: 6 }}>Get in Touch</h2>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Choose your preferred communication channel</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {CONTACT_CHANNELS.map((ch, i) => (
                    <div key={i} style={{ background: ch.primary ? '#fffde7' : '#fff', borderRadius: 16, padding: 16, border: ch.primary ? `2px solid ${ch.color}` : '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: ch.primary ? ch.color : '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: ch.primary ? '#1a1a1a' : undefined }}>{ch.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 2 }}>{ch.name}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{ch.availability}</div>
                        <div style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>Response: {ch.responseTime}</div>
                      </div>
                      {ch.action && (
                        <button onClick={() => setContactStep(ch.action)} style={{ background: ch.primary ? ch.color : '#f8f9fa', color: ch.primary ? '#1a1a1a' : '#444', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 36 }}>
                          {ch.action === 'ticket' ? 'Submit' : ch.action === 'sales' ? 'Consult' : 'Open'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── SEO Landing: No Commission ─── */}
          {currentPage === 'no-commission' && (() => {
            const jsonLd = {
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: 'Stop Paying 25% Commission to GoFood. Own Your Customers.',
              description: 'FoodLocal — Your own branded ordering app for Rp 35.000/month. Zero commission, ever.',
              author: { '@type': 'Organization', name: 'StreetLocal' },
              publisher: { '@type': 'Organization', name: 'StreetLocal', logo: { '@type': 'ImageObject', url: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png' } },
              datePublished: '2026-05-11',
              mainEntityOfPage: 'https://streetlocal.live/?p=no-commission',
            }
            const compareRows = [
              { name: 'GoFood', commission: '20–25%', data: 'GoFood owns it', branding: 'GoFood branding', own: 'No' },
              { name: 'GrabFood', commission: '20–30%', data: 'Grab owns it', branding: 'Grab branding', own: 'No' },
              { name: 'ShopeeFood', commission: '20–25%', data: 'Shopee owns it', branding: 'Shopee branding', own: 'No' },
              { name: 'StreetLocal', commission: '0%', data: 'You own it', branding: 'Your branding', own: 'Yes', highlight: true },
            ]
            return (
              <div>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#bbb', marginBottom: 10, fontWeight: 600 }}>FOR FOOD VENDORS</div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', lineHeight: 1.2, marginBottom: 12 }}>Stop Paying 25% Commission to GoFood. Own Your Customers.</h1>
                <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>FoodLocal — Your own branded ordering app for <strong>Rp 35.000/bulan</strong>. Zero commission, ever.</p>

                {/* The math */}
                <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: '#FFD600', fontWeight: 700, marginBottom: 8 }}>THE MATH</div>
                  <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.7 }}>
                    Earn <strong>Rp 100,000,000</strong> in orders this year.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>GoFood takes</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#ef4444' }}>Rp 25.000.000</div>
                    </div>
                    <div style={{ background: 'rgba(255,214,0,0.1)', borderRadius: 12, padding: 12, border: '1px solid rgba(255,214,0,0.3)' }}>
                      <div style={{ fontSize: 11, color: '#FFD600', marginBottom: 4 }}>StreetLocal takes</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD600' }}>Rp 0</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: 1.5 }}>You keep <strong style={{ color: '#fff' }}>Rp 25 juta</strong> extra in your pocket. Every. Single. Year.</div>
                </div>

                {/* Comparison table */}
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Why vendors are switching</h2>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                  {compareRows.map((row, i) => (
                    <div key={i} style={{ padding: 14, background: row.highlight ? '#fffde7' : (i % 2 ? '#fafafa' : '#fff'), borderTop: i ? '1px solid #f0f0f0' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{row.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: row.commission === '0%' ? '#15803d' : '#ef4444' }}>{row.commission} commission</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                        <div>Customer data: <strong style={{ color: '#1a1a1a' }}>{row.data}</strong></div>
                        <div>Branding: <strong style={{ color: '#1a1a1a' }}>{row.branding}</strong></div>
                        <div>You own the business: <strong style={{ color: row.own === 'Yes' ? '#15803d' : '#ef4444' }}>{row.own}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Testimonial */}
                <div style={{ background: '#f8f9fa', borderRadius: 14, padding: 18, marginBottom: 20, border: '1px solid #e8e8e8' }}>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 8, fontStyle: 'italic' }}>"Saya jualan nasi goreng sebulan kira-kira Rp 30 juta. Kalau lewat aplikasi besar, potongan komisi sekitar Rp 7 juta hilang. Sekarang pelanggan order langsung ke WhatsApp lewat aplikasi saya sendiri. Yang penting, mereka tahu nama warung saya, bukan nama aplikasi lain."</div>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>— Warung vendor in Jakarta Selatan</div>
                </div>

                {/* CTA */}
                <button onClick={() => { setCurrentPage(null); setSelectedCategory(CATEGORIES.find(c => c.id === 'food')) }} style={{ width: '100%', background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer', minHeight: 44, marginBottom: 28 }}>See FoodLocal Demo →</button>

                {/* Related SEO pages */}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: '#bbb', fontWeight: 700, marginBottom: 10 }}>RELATED</div>
                  {[
                    { label: 'Aplikasi Warung Online', page: 'warung-app' },
                    { label: 'Buka Toko Online Tanpa Marketplace', page: 'online-store' },
                    { label: 'Booking via WhatsApp untuk Jasa', page: 'whatsapp-booking' },
                  ].map(l => (
                    <button key={l.page} onClick={() => setCurrentPage(l.page)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', padding: '12px 0', fontSize: 14, color: '#1a73e8', cursor: 'pointer', fontWeight: 600 }}>{l.label} →</button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ─── SEO Landing: Warung App (Bahasa Indonesia) ─── */}
          {currentPage === 'warung-app' && (() => {
            const jsonLd = {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: 'FoodLocal — Aplikasi Warung',
              description: 'Aplikasi sendiri untuk warung kamu. Pelanggan order via WhatsApp. Tanpa komisi.',
              brand: { '@type': 'Brand', name: 'StreetLocal' },
              offers: { '@type': 'Offer', price: '35000', priceCurrency: 'IDR', availability: 'https://schema.org/InStock', url: 'https://streetlocal.live/?p=warung-app' },
            }
            const features = [
              { icon: '💰', title: 'Zero komisi', body: 'Kamu simpan 100% pendapatan. Tidak ada potongan per order.' },
              { icon: '🏷️', title: 'Branding sendiri', body: 'Logo, warna, dan nama warung kamu. Bukan logo aplikasi lain.' },
              { icon: '💬', title: 'Checkout WhatsApp', body: 'Pelanggan klik order, kamu langsung dapat pesanan di WhatsApp.' },
              { icon: '📸', title: 'Menu dengan foto', body: 'Tampilkan setiap menu dengan foto, harga, dan deskripsi.' },
              { icon: '🕐', title: 'Jam buka per hari', body: 'Atur jam operasional berbeda untuk setiap hari dalam seminggu.' },
              { icon: '🎯', title: 'Promo banner', body: 'Tampilkan promo, diskon, dan menu spesial di halaman utama kamu.' },
            ]
            return (
              <div>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#bbb', marginBottom: 10, fontWeight: 600 }}>UNTUK PEMILIK WARUNG</div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', lineHeight: 1.2, marginBottom: 12 }}>Aplikasi Sendiri untuk Warung Kamu — Siap dalam 24 Jam</h1>
                <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>Pelanggan order langsung lewat WhatsApp. Tanpa komisi. Branding kamu sendiri.</p>

                {/* Target audience */}
                <div style={{ background: '#fffde7', borderRadius: 14, padding: 16, marginBottom: 20, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Cocok untuk warung makanan, warkop, dan kedai kopi</div>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>Buat aplikasi ordering online dalam hitungan jam. Tidak perlu ribet, tidak perlu komputer, semuanya dari HP.</div>
                </div>

                {/* Features */}
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Fitur lengkap untuk warung kamu</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: 14, background: '#f8f9fa', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 3 }}>{f.title}</div>
                        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{f.body}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: '#FFD600', fontWeight: 700, marginBottom: 8 }}>HARGA</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Rp 35.000<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>/bulan</span></div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>atau Rp 456.000/tahun (hemat 2 bulan)</div>
                  <div style={{ fontSize: 12, color: '#FFD600', fontWeight: 700 }}>Tanpa kontrak. Bisa berhenti kapan saja.</div>
                </div>

                {/* CTA */}
                <button onClick={() => { setCurrentPage(null); setSelectedCategory(CATEGORIES.find(c => c.id === 'food')) }} style={{ width: '100%', background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer', minHeight: 44, marginBottom: 28 }}>Coba Demo Gratis →</button>

                {/* Related */}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: '#bbb', fontWeight: 700, marginBottom: 10 }}>BACA JUGA</div>
                  {[
                    { label: 'Stop Bayar Komisi ke GoFood', page: 'no-commission' },
                    { label: 'Buka Toko Online Tanpa Marketplace', page: 'online-store' },
                    { label: 'Booking via WhatsApp untuk Jasa', page: 'whatsapp-booking' },
                  ].map(l => (
                    <button key={l.page} onClick={() => setCurrentPage(l.page)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', padding: '12px 0', fontSize: 14, color: '#1a73e8', cursor: 'pointer', fontWeight: 600 }}>{l.label} →</button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ─── SEO Landing: Online Store ─── */}
          {currentPage === 'online-store' && (() => {
            const jsonLd = {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: 'ProductsLocal — Toko Online Sendiri',
              description: 'Branded online store untuk bisnis kecil di Indonesia. Pelanggan order via WhatsApp.',
              brand: { '@type': 'Brand', name: 'StreetLocal' },
              offers: { '@type': 'Offer', price: '35000', priceCurrency: 'IDR', availability: 'https://schema.org/InStock', url: 'https://streetlocal.live/?p=online-store' },
            }
            const features = [
              { icon: '🛍️', title: 'Katalog produk lengkap', body: 'Tampilkan produk dengan foto, harga, deskripsi, dan varian.' },
              { icon: '💬', title: 'Order via WhatsApp', body: 'Pelanggan checkout, pesanan masuk langsung ke WhatsApp kamu.' },
              { icon: '🎨', title: 'Branding kamu sendiri', body: 'Domain sendiri, logo sendiri, warna sendiri. Bukan toko marketplace.' },
              { icon: '🚚', title: 'Kirim ke mana saja', body: 'Atur ongkir per area atau pakai kurir favorit kamu (JNE, J&T, Anteraja).' },
              { icon: '🏷️', title: 'Promo & diskon', body: 'Buat promo spesial, harga coret, dan badge "Best Seller" sendiri.' },
              { icon: '📱', title: 'Mobile-first', body: '90% pelanggan order dari HP. Aplikasi kamu dirancang untuk itu.' },
            ]
            return (
              <div>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#bbb', marginBottom: 10, fontWeight: 600 }}>UNTUK PENJUAL ONLINE</div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', lineHeight: 1.2, marginBottom: 12 }}>Buka Toko Online Sendiri — Tidak Perlu Marketplace</h1>
                <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>ProductsLocal — branded online store untuk bisnis Indonesia. Pelanggan order via WhatsApp. <strong>Rp 35.000/bulan</strong>.</p>

                {/* Pain hook */}
                <div style={{ background: '#fef2f2', borderRadius: 14, padding: 16, marginBottom: 20, border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#dc2626', marginBottom: 6 }}>Capek dengan biaya admin Tokopedia/Shopee?</div>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>Biaya admin, biaya layanan, biaya iklan, biaya kirim, biaya gratis ongkir. Kamu jualan, mereka untung. Saatnya punya toko online sendiri.</div>
                </div>

                {/* Features */}
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Fitur lengkap untuk toko online kamu</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: 14, background: '#f8f9fa', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 3 }}>{f.title}</div>
                        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{f.body}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: '#FFD600', fontWeight: 700, marginBottom: 8 }}>HARGA</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Rp 35.000<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>/bulan</span></div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>atau Rp 456.000/tahun (hemat 2 bulan)</div>
                  <div style={{ fontSize: 12, color: '#FFD600', fontWeight: 700 }}>Zero komisi. Zero biaya admin. Selamanya.</div>
                </div>

                {/* CTA */}
                <button onClick={() => { setCurrentPage(null); setSelectedCategory(CATEGORIES.find(c => c.id === 'products')) }} style={{ width: '100%', background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer', minHeight: 44, marginBottom: 28 }}>Lihat Demo ProductsLocal →</button>

                {/* Related */}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: '#bbb', fontWeight: 700, marginBottom: 10 }}>BACA JUGA</div>
                  {[
                    { label: 'Stop Bayar Komisi ke GoFood', page: 'no-commission' },
                    { label: 'Aplikasi Warung Online', page: 'warung-app' },
                    { label: 'Booking via WhatsApp untuk Jasa', page: 'whatsapp-booking' },
                  ].map(l => (
                    <button key={l.page} onClick={() => setCurrentPage(l.page)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', padding: '12px 0', fontSize: 14, color: '#1a73e8', cursor: 'pointer', fontWeight: 600 }}>{l.label} →</button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ─── SEO Landing: WhatsApp Booking ─── */}
          {currentPage === 'whatsapp-booking' && (() => {
            const jsonLd = {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: 'ServicesLocal — Aplikasi Booking via WhatsApp',
              description: 'Aplikasi booking untuk salon, cleaning, jasa apa saja. Pelanggan booking langsung ke WhatsApp.',
              brand: { '@type': 'Brand', name: 'StreetLocal' },
              offers: { '@type': 'Offer', price: '35000', priceCurrency: 'IDR', availability: 'https://schema.org/InStock', url: 'https://streetlocal.live/?p=whatsapp-booking' },
            }
            const targetServices = ['Salon & Barbershop', 'Cleaning Service', 'Tukang & Handyman', 'Photographer', 'Tutor Privat', 'Spa & Massage', 'Laundry', 'Mobile Mechanic', 'Wedding Service', 'Event Planner', 'Personal Trainer', 'Pet Grooming']
            const features = [
              { icon: '📅', title: 'Booking via WhatsApp', body: 'Pelanggan pilih jadwal, langsung masuk ke WhatsApp kamu sebagai pesan booking.' },
              { icon: '🛠️', title: 'Daftar layanan & harga', body: 'Tampilkan semua jasa dengan harga, durasi, dan deskripsi yang jelas.' },
              { icon: '🕐', title: 'Jam kerja per hari', body: 'Atur jam operasional. Pelanggan hanya bisa book saat kamu buka.' },
              { icon: '📍', title: 'Lokasi & area servis', body: 'Tampilkan alamat di Google Maps atau area jangkauan jasa kamu.' },
              { icon: '🎨', title: 'Branding profesional', body: 'Logo, foto kerja, testimoni — bikin pelanggan percaya sebelum book.' },
              { icon: '💬', title: 'Tanpa komisi', body: 'Kamu simpan 100% bayaran. Tidak ada potongan per booking.' },
            ]
            return (
              <div>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#bbb', marginBottom: 10, fontWeight: 600 }}>UNTUK BISNIS JASA</div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a1a', lineHeight: 1.2, marginBottom: 12 }}>Booking via WhatsApp untuk Bisnis Jasa Kamu</h1>
                <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>ServicesLocal — Aplikasi booking untuk salon, cleaning, jasa apa saja. Pelanggan booking langsung ke WhatsApp.</p>

                {/* Target services */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>Cocok untuk 40+ jenis jasa:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {targetServices.map(s => (
                      <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: '6px 10px', background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 16, color: '#444' }}>{s}</span>
                    ))}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '6px 10px', background: '#fffde7', border: '1px solid #fde68a', borderRadius: 16, color: '#1a1a1a' }}>+ lainnya</span>
                  </div>
                </div>

                {/* Features */}
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>Fitur lengkap untuk bisnis jasa</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: 14, background: '#f8f9fa', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 3 }}>{f.title}</div>
                        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{f.body}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: '#FFD600', fontWeight: 700, marginBottom: 8 }}>HARGA</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Rp 35.000<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>/bulan</span></div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>atau Rp 456.000/tahun (hemat 2 bulan)</div>
                  <div style={{ fontSize: 12, color: '#FFD600', fontWeight: 700 }}>Booking tanpa batas. Komisi nol persen.</div>
                </div>

                {/* CTA */}
                <button onClick={() => { setCurrentPage(null); setSelectedCategory(CATEGORIES.find(c => c.id === 'services')) }} style={{ width: '100%', background: '#16A085', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer', minHeight: 44, marginBottom: 28 }}>Lihat Demo ServicesLocal →</button>

                {/* Related */}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: '#bbb', fontWeight: 700, marginBottom: 10 }}>BACA JUGA</div>
                  {[
                    { label: 'Stop Bayar Komisi ke GoFood', page: 'no-commission' },
                    { label: 'Aplikasi Warung Online', page: 'warung-app' },
                    { label: 'Buka Toko Online Tanpa Marketplace', page: 'online-store' },
                  ].map(l => (
                    <button key={l.page} onClick={() => setCurrentPage(l.page)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', padding: '12px 0', fontSize: 14, color: '#1a73e8', cursor: 'pointer', fontWeight: 600 }}>{l.label} →</button>
                  ))}
                </div>
              </div>
            )
          })()}

        </div>

        <SiteFooter />
      </div>
    )
  }

  /* ─── Search Results Page ─── */
  if (searchActive) {
    return (
      <div style={styles.page}>
        <style>{`@keyframes heartbeat { 0%, 100% { transform: scale(1); opacity: 1; } 15% { transform: scale(1.12); opacity: 1; } 30% { transform: scale(1); opacity: 0.85; } 45% { transform: scale(1.08); opacity: 1; } 60% { transform: scale(1); } }
@keyframes ping { 0% { transform: scale(1); opacity: 0.8; } 75% { transform: scale(2.5); opacity: 0; } 100% { transform: scale(2.5); opacity: 0; } }
@keyframes fireFloat { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { transform: translateY(-8px) scale(1.2); opacity: 0.8; } 100% { transform: translateY(-16px) scale(0.6); opacity: 0; } }`}</style>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#1a1a1a', letterSpacing: -0.3 }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
          <button onClick={() => { setSearchActive(false); setSearchQuery(''); setSearchResults([]); setSearchFilter('all') }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitleddddvv-removebg-preview.png" alt="Home" onError={imgError('logo')} style={{ width: 36, height: 36, objectFit: 'contain' }} />
          </button>
        </div>

        {/* Search bar */}
        <div style={{ padding: '8px 16px 0' }}>
          <div style={{ position: 'relative' }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              placeholder="Search food, products, or category..."
              style={{ width: '100%', padding: '12px 40px 12px 38px', borderRadius: 14, border: '1.5px solid #e8e8e8', background: '#f8f9fa', color: '#1a1a1a', fontSize: 14, fontWeight: 500, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#FFD600'}
              onBlur={e => e.target.style.borderColor = '#e8e8e8'}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#bbb" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 16, color: '#ccc', cursor: 'pointer', padding: 2 }}>✕</button>
            )}
          </div>
        </div>


        {/* Filter toggles */}
        <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
          {[{ id: 'all', label: 'Menu Items' }, { id: 'discounted', label: 'Discounted' }, { id: 'free_delivery', label: 'Free Delivery' }, { id: 'near_me', label: 'Near Me' }].map(f => (
            <button key={f.id} onClick={() => setSearchFilter(f.id)}
              style={{ flex: 1, padding: '12px 0 9px', background: 'none', border: 'none', borderBottom: searchFilter === f.id ? '2.5px solid #FFD600' : '2.5px solid transparent', color: searchFilter === f.id ? '#1a1a1a' : '#bbb', fontSize: 12, fontWeight: searchFilter === f.id ? 800 : 600, cursor: 'pointer', transition: 'all 0.2s', minHeight: 44 }}
            >{f.label}</button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ height: 1, background: '#f0f0f0', margin: '0 16px' }} />

        {/* Results area */}
        <div style={{ padding: '12px 16px 40px' }}>


          {/* Count */}
          {searchQuery && !searchLoading && (
            <div style={{ fontSize: 12, color: '#aaa', fontWeight: 500, marginBottom: 10 }}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </div>
          )}

          {searchLoading && <div style={{ textAlign: 'center', padding: 24, color: '#ccc', fontSize: 13 }}>Searching...</div>}

          {/* Theme suggestions — match query against THEME_INDEX so users can find any app/category */}
          {searchQuery && !searchLoading && (() => {
            const themeMatches = findThemeMatches(searchQuery, 8)
            if (themeMatches.length === 0) return null
            return (
              <div style={{ marginBottom: 16, padding: '12px 12px 14px', background: '#FFFBEB', borderRadius: 14, border: '1px solid #FFE082' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#92400E', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Matching categories</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {themeMatches.map(theme => (
                    <a
                      key={theme.id}
                      href={themeDemoUrl(theme)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: '#fff', border: `1.5px solid ${theme.accent}40`, color: '#1a1a1a', fontSize: 12, fontWeight: 700, textDecoration: 'none', cursor: 'pointer', minHeight: 36 }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: theme.accent }} />
                      {theme.label}
                      <span style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{theme.app === 'food' ? 'Food app' : 'Products app'}</span>
                    </a>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Listings */}
          {!searchLoading && searchResults.map((vendor, idx) => {
            const st = VENDOR_STATUS_CONFIG[vendor.status] || VENDOR_STATUS_CONFIG.closed
            const item = vendor._matchedItem
            const isMock = String(vendor.id).startsWith('demo-')
            return (
              <div key={vendor.id} style={{ marginBottom: 10 }}>
                <div
                  onClick={() => { if (isMock) return; const slug = vendor.slug || vendor.id; if (slug) window.open(`${window.location.origin}/food/chat/?vendor=${slug}`, '_blank') }}
                  style={{ background: '#fff', borderRadius: 14, padding: '12px 12px 10px', cursor: isMock ? 'default' : 'pointer', opacity: vendor.status === 'closed' ? 0.5 : 1, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    {/* Left: food image */}
                    <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', position: 'relative' }}>
                      {item && item.img ? (
                        <img src={item.img} alt={item.name} loading="lazy" onError={imgError('food')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${vendor.accent || '#FFD600'}30, ${vendor.accent || '#FFD600'}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 28, opacity: 0.3 }}>🍽</span>
                        </div>
                      )}
                      {/* Star rating on image */}
                      <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span style={{ color: '#FFD600', fontSize: 10 }}>★</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{vendor.rating}</span>
                      </div>
                      {/* Promo badge with fire — real vendors only */}
                      {!isMock && item && item.promoPrice && (
                        <div style={{ position: 'absolute', bottom: 6, left: 0 }}>
                          <div style={{ position: 'absolute', top: -12, left: 4 }}>
                            <span style={{ position: 'absolute', fontSize: 10, animation: 'fireFloat 1.2s ease-out infinite' }}>🔥</span>
                            <span style={{ position: 'absolute', left: 8, fontSize: 8, animation: 'fireFloat 1.2s ease-out 0.4s infinite' }}>🔥</span>
                            <span style={{ position: 'absolute', left: 16, fontSize: 10, animation: 'fireFloat 1.2s ease-out 0.8s infinite' }}>🔥</span>
                          </div>
                          <div style={{ background: '#FFD600', borderRadius: '0 4px 4px 0', padding: '0px 8px', height: 14, display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>Promo</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Name + distance */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{vendor.shop_name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#777', flexShrink: 0 }}>📍{vendor.distance_km} km</span>
                      </div>
                      {/* Type + item name */}
                      <div style={{ fontSize: 12, color: '#777', marginBottom: 3 }}>{vendor.shop_food_type}</div>
                      {item && <div style={{ fontSize: 12, fontWeight: 600, color: '#444', marginBottom: 4 }}>{item.name}</div>}
                      {/* Price */}
                      {item && item.price && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {item.promoPrice ? (
                            <>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>Rp {item.promoPrice.toLocaleString()}</span>
                              <span style={{ fontSize: 12, color: '#dc2626', textDecoration: 'line-through' }}>Rp {item.price.toLocaleString()}</span>
                            </>
                          ) : (
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Rp {item.price.toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Bottom bar */}
                  {isMock ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f5f5f5' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>Data Updating</span>
                    </div>
                  ) : vendor.status === 'closed' ? (
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f5f5f5' }}>
                      Closed {vendor.opens_at ? `· Opens at ${vendor.opens_at}` : ''}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f5f5f5' }}>
                      <span>{item && item.prepTime ? `Ready ${item.prepTime} min` : `Ready ${vendor.pickup_time}`}</span>
                      <span style={{ flex: 1 }} />
                      {!vendor.delivery_enabled ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Pickup Only</span>
                      ) : vendor.delivery_fee === 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, animation: 'heartbeat 1.5s ease-in-out infinite' }}>
                          <img src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledwrrssswdqw-removebg-preview.png" alt="" onError={imgError('logo')} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#FFD600', textShadow: '0 0 1px #000, 0 0 2px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>Free Delivery</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Delivery Est. Rp {vendor.delivery_fee.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Empty */}
          {!searchLoading && searchQuery && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>No results for "{searchQuery}"</div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>Try a different search</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Nasi Goreng', 'Satay', 'Coffee', 'Bakso'].map(s => (
                  <button key={s} onClick={() => setSearchQuery(s)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff', fontSize: 11, fontWeight: 600, color: '#555', cursor: 'pointer' }}>{s}</button>
                ))}
              </div>
            </div>
          )}
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
          <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a' }}>StreetLocal<span style={{ color: '#FFD600' }}>.live</span></div>
          <div style={{ fontSize: 9, color: '#888', fontWeight: 600, letterSpacing: 0.5 }}>Business at your finger tips</div>
        </div>
        <LangSwitcher locale={locale} setLocale={setLocale} />
      </div>

      {/* Search bar — under header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ position: 'relative' }}>
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); if (!searchActive && e.target.value) setSearchActive(true) }}
            onFocus={() => setSearchActive(true)}
            placeholder="Search anything — food, products, services 🔍"
            style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: 16, border: '2px solid #f0f0f0', background: '#f8f9fa', color: '#1a1a1a', fontSize: 15, fontWeight: 500, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.target.style.borderColor = '#FFD600'}
            onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = '#f0f0f0' }}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#999" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchActive(false); setSearchResults([]); setSearchFilter('all') }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, color: '#ccc', cursor: 'pointer', padding: 4 }}>✕</button>
          )}
        </div>
      </div>

      {/* Hero */}
      <FadeIn>
        <div style={styles.hero}>
          <img
            src="https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-5-2026-02_58_20-pm.png"
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


      {/* Categories */}
      <div style={styles.section}>
        <FadeIn delay={0.2}>
          <h2 style={{ ...styles.sectionTitle, marginTop: 50 }}>{countryPricing ? `${t.ourApps?.split(' ')[0] || 'Starting'} ${countryPricing.currency_symbol} ${countryPricing.basic_monthly.toLocaleString()}${t.perMonth}` : t.ourApps}</h2>
        </FadeIn>

        {/* FoodLocal — banner card */}
        {(() => {
          const foodCat = CATEGORIES.find(c => c.id === 'food')
          const productsCat = CATEGORIES.find(c => c.id === 'products')
          const servicesCat = CATEGORIES.find(c => c.id === 'services')
          const enterLabel = locale === 'id' || locale === 'ms' ? 'Masuk' : locale === 'vi' ? 'Vào' : locale === 'th' ? 'เข้า' : locale === 'fr' ? 'Entrer' : locale === 'de' ? 'Eintreten' : locale === 'es' ? 'Entrar' : locale === 'zh' ? '进入' : locale === 'ar' ? 'دخول' : 'Enter'
          return (
            <>
              <style>{`@keyframes danceBounce { 0%, 100% { transform: translateY(0) rotate(0deg); } 20% { transform: translateY(-4px) rotate(-3deg); } 40% { transform: translateY(0) rotate(2deg); } 60% { transform: translateY(-3px) rotate(-2deg); } 80% { transform: translateY(0) rotate(1deg); } }`}</style>
              {(() => {
                // Three identical banners — black header, yellow dancing price,
                // single-line title + small slogan, yellow View Apps button.
                const banners = [
                  { cat: foodCat, title: 'FoodLocal Apps', slogan: 'From street carts to restaurants', alt: 'FoodLocal', delay: 0.3 },
                  { cat: servicesCat, title: 'ServicesLocal Apps', slogan: 'Offer any service — your own booking app', alt: 'ServicesLocal', delay: 0.4 },
                  { cat: productsCat, title: 'ProductsLocal Apps', slogan: 'Sell any product — your own store', alt: 'ProductsLocal', delay: 0.5 },
                ]
                return banners.filter(b => b.cat).map((b, i) => (
                  <FadeIn key={b.alt} delay={b.delay}>
                    <div
                      style={{ ...styles.foodBannerCard, marginTop: i === 0 ? 0 : 16 }}
                      onClick={() => setSelectedCategory(b.cat)}
                    >
                      <div style={{ ...styles.foodBannerHeader, background: '#1a1a1a' }}>
                        <span style={{ ...styles.foodBannerHeaderText, color: '#fff', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{b.title}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{b.slogan}</span>
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#FFD600', display: 'inline-block', animation: 'danceBounce 1.5s ease-in-out infinite', textShadow: '0 0 8px rgba(255,214,0,0.4)', flexShrink: 0 }}>{b.cat.apps[0]?.price || 'Rp 35.000'}</span>
                      </div>
                      <img
                        src={b.cat.bannerImage}
                        alt={b.alt}
                        style={styles.foodBannerImage}
                      />
                      <div style={{ ...styles.foodBannerBottom, background: '#1a1a1a' }}>
                        <button style={{ ...styles.foodBannerEnterBtn, background: '#FFD600', color: '#1a1a1a' }}>
                          View Apps →
                        </button>
                      </div>
                    </div>
                  </FadeIn>
                ))
              })()}

              {/* Online Payments — Optional Integration */}
              <FadeIn delay={0.55}>
                <div style={{ marginTop: 18, padding: 16, background: '#1a1a1a', borderRadius: 18, border: '1px solid #2a2a2a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>💳</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#FFD600', letterSpacing: 0.3 }}>
                      {locale === 'id' ? 'Pembayaran Online — Integrasi Opsional' : 'Online Payments — Optional Integration'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55, margin: '0 0 12px' }}>
                    {locale === 'id'
                      ? 'Setiap aplikasi StreetLocal mendukung koneksi Payment Gateway opsional sehingga pelanggan dapat membayar dengan kartu kredit atau dompet digital langsung di aplikasi Anda. Anda menggunakan gateway sendiri (Stripe, PayPal, Midtrans, Razorpay, Mollie, HitPay, dan 13 lainnya) — kami menyediakan software integrasinya. Dana mengalir langsung ke akun gateway Anda; StreetLocal tidak pernah menyentuh uang Anda. Pengaturan bersifat opsional — aplikasi Anda tetap berfungsi dengan tunai, transfer bank, atau QRIS.'
                      : 'Every StreetLocal app supports an optional Payment Gateway connection so customers can pay by credit card or digital wallet directly in your app. You bring your own gateway (Stripe, PayPal, Midtrans, Razorpay, Mollie, HitPay, and 13 more) — we provide the integration software. Funds flow directly to your gateway account; StreetLocal never touches your money. Set up is optional — your app works fine with cash, bank transfer, or QRIS too.'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { slug: 'visa', alt: 'Visa' },
                      { slug: 'mastercard', alt: 'Mastercard' },
                      { slug: 'americanexpress', alt: 'American Express' },
                      { slug: 'stripe', alt: 'Stripe' },
                      { slug: 'paypal', alt: 'PayPal' },
                      { slug: 'applepay', alt: 'Apple Pay' },
                      { slug: 'googlepay', alt: 'Google Pay' },
                    ].map(p => (
                      <div key={p.slug} style={{ width: 36, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                        <img
                          src={`https://cdn.simpleicons.org/${p.slug}/white`}
                          alt={p.alt}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </>
          )
        })()}

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

        {/* Affiliate / Become an Agent — visible recruitment CTA */}
        <FadeIn delay={0.6}>
          <div
            onClick={() => setCurrentPage('affiliate')}
            style={{ marginTop: 24, padding: '18px 18px', borderRadius: 18, background: 'linear-gradient(135deg, #FFD600 0%, #FFAA00 100%)', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,214,0,0.25)', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 32 }}>🤝</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a1a', marginBottom: 2 }}>Become an Agent</div>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.7)', fontWeight: 600 }}>Earn Rp 35.000 – Rp 100.000 per vendor signup</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#1a1a1a', background: 'rgba(0,0,0,0.1)', padding: '6px 12px', borderRadius: 10 }}>Join →</span>
            </div>
          </div>
        </FadeIn>
      </div>


      <SiteFooter />
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
