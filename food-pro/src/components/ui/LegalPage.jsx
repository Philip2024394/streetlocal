import { useState } from 'react';
import { createPortal } from 'react-dom';
import IndooFooter from '@/components/ui/IndooFooter';

const DAY_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2004_47_24%20PM.png';
const NIGHT_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2004_47_24%20PM.png';
function getLegalBG() {
  const h = new Date().getHours();
  return (h >= 6 && h < 18) ? DAY_BG : NIGHT_BG;
}

const TABS = [
  { key: 'privacy', label: 'Privacy' },
  { key: 'terms', label: 'Terms' },
  { key: 'refund', label: 'Refund' },
];

function Bullet({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
      <div
        style={{
          width: 6,
          height: 6,
          minWidth: 6,
          borderRadius: '50%',
          background: '#8DC63F',
          marginTop: 7,
        }}
      />
      <span>{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 16,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 900,
          color: '#8DC63F',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <>
      <Section title="1. Data We Collect">
        <Bullet>Full name and display name</Bullet>
        <Bullet>Email address</Bullet>
        <Bullet>Phone number</Bullet>
        <Bullet>Location data (GPS coordinates)</Bullet>
        <Bullet>Profile photos and uploaded images</Bullet>
        <Bullet>Payment information</Bullet>
        <Bullet>Device information (OS, browser, device ID)</Bullet>
      </Section>

      <Section title="2. Why We Collect Your Data">
        <Bullet>To provide and improve our services (rides, delivery, marketplace)</Bullet>
        <Bullet>Account verification and identity confirmation</Bullet>
        <Bullet>Safety and security of all platform users</Bullet>
        <Bullet>Communication regarding orders, rides, and account activity</Bullet>
        <Bullet>Compliance with applicable laws and regulations</Bullet>
      </Section>

      <Section title="3. How Data Is Stored">
        <Bullet>Supabase — primary database, encrypted at rest and in transit</Bullet>
        <Bullet>Firebase — authentication and push notifications</Bullet>
        <Bullet>ImageKit — image storage and optimization</Bullet>
        <div style={{ marginTop: 6 }}>
          All data is stored on secure servers with industry-standard encryption protocols.
        </div>
      </Section>

      <Section title="4. Third-Party Services">
        <Bullet>Supabase — database and backend infrastructure</Bullet>
        <Bullet>Firebase — authentication services</Bullet>
        <Bullet>Stripe — payment processing</Bullet>
        <Bullet>Mapbox — map rendering and route calculation</Bullet>
        <Bullet>ImageKit — image CDN and transformations</Bullet>
        <Bullet>Google Maps — geocoding and place search</Bullet>
        <div style={{ marginTop: 6 }}>
          Each third-party service operates under its own privacy policy. We only share the minimum data necessary for each service to function.
        </div>
      </Section>

      <Section title="5. Location & Camera Usage">
        <Bullet>Location is used for ride matching, delivery tracking, and showing nearby services</Bullet>
        <Bullet>Camera access is used for profile photos and document verification</Bullet>
        <Bullet>Location data is collected only while using the app or as needed for active orders</Bullet>
        <Bullet>You may revoke location or camera permissions at any time through your device settings</Bullet>
      </Section>

      <Section title="6. Your Rights">
        <Bullet>Access — request a copy of all personal data we hold about you</Bullet>
        <Bullet>Correction — update or correct inaccurate personal information</Bullet>
        <Bullet>Deletion — request permanent deletion of your account and associated data</Bullet>
        <Bullet>Data Export — receive your data in a portable, machine-readable format</Bullet>
        <div style={{ marginTop: 6 }}>
          To exercise any of these rights, contact us at privacy@indoo.id.
        </div>
      </Section>

      <Section title="7. Indonesian Law Compliance">
        <Bullet>
          UU No. 27 Tahun 2022 (Undang-Undang Pelindungan Data Pribadi / PDP) — Indonesia's Personal Data Protection Law governing the collection, processing, and storage of personal data
        </Bullet>
        <Bullet>
          UU No. 11 Tahun 2008 (Undang-Undang Informasi dan Transaksi Elektronik / ITE) — governs electronic information and transactions, including data privacy provisions
        </Bullet>
        <div style={{ marginTop: 6 }}>
          We are committed to full compliance with all applicable Indonesian data protection regulations.
        </div>
      </Section>

      <Section title="8. Contact">
        <div>For privacy-related inquiries or data requests:</div>
        <div style={{ color: '#8DC63F', marginTop: 6, fontWeight: 700 }}>privacy@indoo.id</div>
      </Section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <Section title="1. Platform Description">
        <div>
          INDOO is a digital marketplace platform that connects users with providers of physical services. We facilitate connections between service seekers and service providers but do not directly provide transportation, delivery, or other physical services ourselves.
        </div>
      </Section>

      <Section title="2. User Accounts">
        <Bullet>You must be at least 17 years of age to create an account</Bullet>
        <Bullet>All information provided during registration must be accurate and current</Bullet>
        <Bullet>You are responsible for maintaining the security of your account credentials</Bullet>
        <Bullet>One account per person — duplicate accounts may be suspended</Bullet>
      </Section>

      <Section title="3. Services">
        <Bullet>Bike Rides — motorcycle taxi services for personal transportation</Bullet>
        <Bullet>Car Rides — car-based transportation services</Bullet>
        <Bullet>Food Delivery — ordering and delivery from local restaurants and food vendors</Bullet>
        <Bullet>Deals — marketplace for local deals, products, and promotional offers</Bullet>
      </Section>

      <Section title="4. Payments">
        <Bullet>All customer payments are Cash on Delivery (COD) only</Bullet>
        <Bullet>Service providers receive payment directly from customers upon completion</Bullet>
        <Bullet>Digital wallet functionality is available for service providers only</Bullet>
        <Bullet>Pricing is displayed before order confirmation</Bullet>
      </Section>

      <Section title="5. Wallet System">
        <Bullet>Service providers maintain a prepaid wallet balance on the platform</Bullet>
        <Bullet>A 10% commission is deducted from each completed transaction</Bullet>
        <Bullet>Minimum wallet balances are required to accept new orders</Bullet>
        <Bullet>Wallet top-ups can be made through supported payment channels</Bullet>
        <Bullet>Wallet balances are non-transferable between accounts</Bullet>
      </Section>

      <Section title="6. Refund Policy Summary">
        <div>
          Refunds are available under specific conditions depending on the service type. For complete details on eligibility, timelines, and the refund process, please see the <span style={{ color: '#8DC63F', fontWeight: 700 }}>Refund</span> tab.
        </div>
      </Section>

      <Section title="7. User Conduct">
        <div style={{ marginBottom: 6 }}>All users agree to refrain from:</div>
        <Bullet>Fraudulent activity, including fake orders or false claims</Bullet>
        <Bullet>Harassment, threats, or abusive behavior toward other users or providers</Bullet>
        <Bullet>Creating fake or duplicate accounts</Bullet>
        <Bullet>Manipulating ratings, reviews, or platform features</Bullet>
        <Bullet>Using the platform for any illegal purpose</Bullet>
        <div style={{ marginTop: 6 }}>
          Violations may result in account suspension or permanent ban.
        </div>
      </Section>

      <Section title="8. Limitation of Liability">
        <div>
          INDOO operates as a marketplace platform connecting users with independent service providers. We are not the direct provider of transportation, delivery, or any physical services. As such, INDOO is not liable for the actions, omissions, or conduct of service providers or users. We make reasonable efforts to maintain platform safety and reliability but do not guarantee uninterrupted or error-free service.
        </div>
      </Section>

      <Section title="9. Governing Law">
        <div>
          These Terms of Service are governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes arising from the use of this platform shall be subject to the jurisdiction of Indonesian courts.
        </div>
      </Section>

      <Section title="10. Contact">
        <div>For legal inquiries or questions about these terms:</div>
        <div style={{ color: '#8DC63F', marginTop: 6, fontWeight: 700 }}>legal@indoo.id</div>
      </Section>
    </>
  );
}

function RefundContent() {
  return (
    <>
      <Section title="1. Food Delivery Refunds">
        <div style={{ marginBottom: 6 }}>You may be eligible for a refund if:</div>
        <Bullet>Your order was not delivered</Bullet>
        <Bullet>You received the wrong items</Bullet>
        <Bullet>Items were missing from your order</Bullet>
        <Bullet>Food arrived in a condition that is unsafe to consume</Bullet>
        <div style={{ marginTop: 8, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
          Reports must be submitted within 2 hours of the expected delivery time.
        </div>
      </Section>

      <Section title="2. Ride Refunds">
        <div style={{ marginBottom: 6 }}>You may be eligible for a refund if:</div>
        <Bullet>The driver did not show up (no-show)</Bullet>
        <Bullet>A safety incident occurred during the ride</Bullet>
        <Bullet>You were charged for a ride that was not completed</Bullet>
        <Bullet>The driver took a significantly longer route without justification</Bullet>
        <div style={{ marginTop: 8, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
          Reports must be submitted within 24 hours of the ride.
        </div>
      </Section>

      <Section title="3. Marketplace Refunds">
        <Bullet>Products may be returned within 7 days if not as described</Bullet>
        <Bullet>Items must be in original condition and packaging</Bullet>
        <Bullet>Buyer is responsible for return shipping unless the item was defective or misrepresented</Bullet>
        <Bullet>Refund is processed after the seller confirms receipt of the returned item</Bullet>
      </Section>

      <Section title="4. Non-Refundable Items">
        <div style={{ marginBottom: 6 }}>The following are not eligible for refunds:</div>
        <Bullet>Wallet top-ups — all wallet deposits are final</Bullet>
        <Bullet>Platform commissions — fees deducted from completed transactions</Bullet>
        <Bullet>Completed services where no issue was reported within the required timeframe</Bullet>
        <Bullet>Promotional credits or bonus balances</Bullet>
      </Section>

      <Section title="5. Refund Process">
        <Bullet>Submit a refund request via the Contact Us page or in-app support</Bullet>
        <Bullet>Include your order/ride ID and a description of the issue</Bullet>
        <Bullet>Our team will review your request within 72 hours</Bullet>
        <Bullet>Approved refunds are processed within 7 business days</Bullet>
        <Bullet>Refunds are issued to the original payment method or as wallet credit</Bullet>
      </Section>

      <Section title="6. Contact">
        <div>For refund requests or support inquiries:</div>
        <div style={{ color: '#8DC63F', marginTop: 6, fontWeight: 700 }}>support@indoo.id</div>
      </Section>
    </>
  );
}

export default function LegalPage({ onClose, initialTab = 'privacy' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const content = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        background: '#080808',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Background image — time-based */}
      <img src={getLegalBG()} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', zIndex: 0 }} />

      {/* Single scrollable area */}
      <div className="legalScroll" style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
      <style>{`.legalScroll::-webkit-scrollbar { display: none; }`}</style>

      {/* Hero */}
      <div
        style={{
          position: 'relative',
          padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 16px 12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>Legal & Policies</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>PT HAMMEREX PRODUCTS INDONESIA</div>
      </div>

      {/* Tab pills */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '0 16px 14px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 4,
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 12,
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  background: isActive ? '#8DC63F' : 'transparent',
                  color: isActive ? '#000' : '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: 44,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '0 16px 32px',
        }}
      >
        {activeTab === 'privacy' && <PrivacyContent />}
        {activeTab === 'terms' && <TermsContent />}
        {activeTab === 'refund' && <RefundContent />}

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            padding: '24px 0 16px',
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
            lineHeight: 1.8,
          }}
        >
          <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
            PT HAMMEREX PRODUCTS INDONESIA
          </div>
          <div>Last updated: April 2026</div>
        </div>
      </div>
      </div>{/* end single scrollable area */}

      <IndooFooter label="Legal" onHome={onClose} onClose={onClose} />
    </div>
  );

  return createPortal(content, document.body);
}
