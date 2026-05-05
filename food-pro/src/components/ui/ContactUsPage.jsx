import { useState } from 'react';
import { createPortal } from 'react-dom';
import IndooFooter from '@/components/ui/IndooFooter';

const COUNTRY_CODES = [
  { code: '+62', label: '🇮🇩 +62 Indonesia' },
  { code: '+44', label: '🇬🇧 +44 UK' },
  { code: '+1', label: '🇺🇸 +1 USA' },
  { code: '+61', label: '🇦🇺 +61 Australia' },
  { code: '+65', label: '🇸🇬 +65 Singapore' },
  { code: '+60', label: '🇲🇾 +60 Malaysia' },
  { code: '+81', label: '🇯🇵 +81 Japan' },
  { code: '+91', label: '🇮🇳 +91 India' },
  { code: '+971', label: '🇦🇪 +971 UAE' },
  { code: '+966', label: '🇸🇦 +966 Saudi' },
];

const CITIES = [
  'Yogyakarta', 'Jakarta', 'Surabaya', 'Bandung', 'Semarang',
  'Medan', 'Makassar', 'Denpasar/Bali', 'Malang', 'Solo',
  'Palembang', 'Other',
];

const CONTACT_REASONS = [
  'Bike Delivery Driver',
  'Car Driver',
  'Restaurant Partner',
  'Street Food Vendor',
  'Customer Support',
  'Business Partnership',
  'Report an Issue',
  'Other',
];

const BIKE_VEHICLES = ['Honda Beat', 'Honda Vario', 'Yamaha NMAX', 'Honda PCX', 'Suzuki', 'Other'];
const CAR_VEHICLES = ['Toyota Avanza', 'Toyota Innova', 'Daihatsu Xenia', 'Honda Brio', 'Suzuki Ertiga', 'Other'];

const EMPLOYMENT_OPTIONS = ['Gojek', 'Grab', 'Maxim', 'Other platform', 'Not currently driving', 'First time'];
const DELIVERY_PLATFORMS = ['Gojek', 'Grab', 'ShopeeFood', 'Other'];

const glassStyle = {
  borderRadius: 20,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: 20,
  marginBottom: 18,
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 14,
  color: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='white' stroke-width='2'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: 36,
};

const optionStyle = { background: '#1a1a1a', color: '#fff' };

const labelStyle = {
  display: 'block',
  color: '#FACC15',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
};

const sectionTitleStyle = {
  color: '#fff',
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 14,
};

export default function ContactUsPage({ onClose }) {
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  // Driver fields
  const [experienced, setExperienced] = useState(null);
  const [yearsExp, setYearsExp] = useState('');
  const [age, setAge] = useState('');
  const [ownVehicle, setOwnVehicle] = useState(null);
  const [vehicleType, setVehicleType] = useState('');
  const [employment, setEmployment] = useState('');

  // Restaurant/vendor fields
  const [businessName, setBusinessName] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [address, setAddress] = useState('');
  const [menuItems, setMenuItems] = useState('');
  const [usesDelivery, setUsesDelivery] = useState(null);
  const [platforms, setPlatforms] = useState([]);

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const isDriver = reason === 'Bike Delivery Driver' || reason === 'Car Driver';
  const isBike = reason === 'Bike Delivery Driver';
  const isCar = reason === 'Car Driver';
  const isFood = reason === 'Restaurant Partner' || reason === 'Street Food Vendor';

  const togglePlatform = (p) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = 'Required';
    if (!whatsapp.trim()) e.whatsapp = 'Required';
    if (!city) e.city = 'Required';
    if (!reason) e.reason = 'Required';
    if (isDriver) {
      if (!age) e.age = 'Required';
    }
    if (isFood) {
      if (!businessName.trim()) e.businessName = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const ticket = 'INDOO-' + String(Math.floor(100000 + Math.random() * 900000));
    setTicketNumber(ticket);

    const data = {
      ticket,
      fullName,
      countryCode,
      whatsapp,
      city,
      email,
      reason,
      message,
      submittedAt: new Date().toISOString(),
    };

    if (isDriver) {
      Object.assign(data, {
        experienced,
        yearsExp: experienced ? yearsExp : null,
        age,
        ownVehicle,
        vehicleType,
        employment,
        simType: isBike ? 'SIM C' : 'SIM A',
      });
    }

    if (isFood) {
      Object.assign(data, {
        businessName,
        cuisineType,
        address,
        menuItems,
        usesDelivery,
        platforms: usesDelivery ? platforms : [],
      });
    }

    try {
      const existing = JSON.parse(localStorage.getItem('indoo_contact_requests') || '[]');
      existing.push(data);
      localStorage.setItem('indoo_contact_requests', JSON.stringify(existing));
    } catch {
      // silent
    }

    setSubmitted(true);
  };

  const ToggleButtons = ({ value, onChange }) => (
    <div style={{ display: 'flex', gap: 10 }}>
      {['Yes', 'No'].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt === 'Yes')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 12,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            background:
              value === (opt === 'Yes')
                ? '#8DC63F'
                : 'rgba(255,255,255,0.08)',
            color: value === (opt === 'Yes') ? '#000' : '#fff',
            transition: 'all 0.2s',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const fieldGap = { marginBottom: 14 };

  const renderDriverFields = () => (
    <div style={glassStyle}>
      <div style={sectionTitleStyle}>Driver Details</div>

      <div style={fieldGap}>
        <label style={labelStyle}>Are you an experienced driver?</label>
        <ToggleButtons value={experienced} onChange={setExperienced} />
      </div>

      {experienced === true && (
        <div style={fieldGap}>
          <label style={labelStyle}>Years of experience</label>
          <input
            type="number"
            min="0"
            value={yearsExp}
            onChange={(e) => setYearsExp(e.target.value)}
            placeholder="e.g. 3"
            style={inputStyle}
          />
        </div>
      )}

      <div style={fieldGap}>
        <label style={labelStyle}>
          Age <span style={{ color: '#f87171' }}>*</span>
        </label>
        <input
          type="number"
          min="17"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Your age"
          style={{
            ...inputStyle,
            borderColor: errors.age ? '#f87171' : 'rgba(255,255,255,0.15)',
          }}
        />
        {errors.age && <span style={{ color: '#f87171', fontSize: 12 }}>{errors.age}</span>}
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>Do you have your own vehicle?</label>
        <ToggleButtons value={ownVehicle} onChange={setOwnVehicle} />
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>Vehicle type</label>
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          style={selectStyle}
        >
          <option value="" style={optionStyle}>Select vehicle</option>
          {(isBike ? BIKE_VEHICLES : CAR_VEHICLES).map((v) => (
            <option key={v} value={v} style={optionStyle}>{v}</option>
          ))}
        </select>
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>Current employment</label>
        <select
          value={employment}
          onChange={(e) => setEmployment(e.target.value)}
          style={selectStyle}
        >
          <option value="" style={optionStyle}>Select current employment</option>
          {EMPLOYMENT_OPTIONS.map((v) => (
            <option key={v} value={v} style={optionStyle}>{v}</option>
          ))}
        </select>
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>SIM type</label>
        <div
          style={{
            ...inputStyle,
            background: 'rgba(141,198,63,0.15)',
            borderColor: '#8DC63F',
            color: '#8DC63F',
            fontWeight: 600,
          }}
        >
          {isBike ? 'SIM C' : 'SIM A'} (auto-selected)
        </div>
      </div>
    </div>
  );

  const renderFoodFields = () => (
    <div style={glassStyle}>
      <div style={sectionTitleStyle}>
        {reason === 'Restaurant Partner' ? 'Restaurant' : 'Vendor'} Details
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>
          {reason === 'Restaurant Partner' ? 'Restaurant' : 'Vendor'} name{' '}
          <span style={{ color: '#f87171' }}>*</span>
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name"
          style={{
            ...inputStyle,
            borderColor: errors.businessName ? '#f87171' : 'rgba(255,255,255,0.15)',
          }}
        />
        {errors.businessName && (
          <span style={{ color: '#f87171', fontSize: 12 }}>{errors.businessName}</span>
        )}
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>Cuisine type</label>
        <input
          type="text"
          value={cuisineType}
          onChange={(e) => setCuisineType(e.target.value)}
          placeholder="e.g. Indonesian, Japanese"
          style={inputStyle}
        />
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Full address"
          style={inputStyle}
        />
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>How many menu items?</label>
        <input
          type="number"
          min="1"
          value={menuItems}
          onChange={(e) => setMenuItems(e.target.value)}
          placeholder="e.g. 25"
          style={inputStyle}
        />
      </div>

      <div style={fieldGap}>
        <label style={labelStyle}>Do you currently use delivery platforms?</label>
        <ToggleButtons value={usesDelivery} onChange={setUsesDelivery} />
      </div>

      {usesDelivery === true && (
        <div style={fieldGap}>
          <label style={labelStyle}>Which platforms?</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DELIVERY_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: platforms.includes(p)
                    ? '#8DC63F'
                    : 'rgba(255,255,255,0.08)',
                  color: platforms.includes(p) ? '#000' : '#fff',
                  transition: 'all 0.2s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSuccessOverlay = () => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10001,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          ...glassStyle,
          textAlign: 'center',
          maxWidth: 380,
          width: '100%',
          padding: 32,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#8DC63F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'scaleIn 0.4s ease',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 style={{ color: '#fff', fontSize: 22, margin: '0 0 12px', fontWeight: 700 }}>
          Request Submitted!
        </h2>

        <div
          style={{
            background: 'rgba(141,198,63,0.15)',
            border: '1px solid #8DC63F',
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 20,
          }}
        >
          <div style={{ color: '#FACC15', fontSize: 12, marginBottom: 4 }}>Ticket Number</div>
          <div style={{ color: '#8DC63F', fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>
            #{ticketNumber}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' }}>
          Our team will contact you within 72 hours
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>
          You will receive a WhatsApp message confirming your ticket
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 14,
            border: 'none',
            background: '#8DC63F',
            color: '#000',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 48,
          }}
        >
          Back to Home
        </button>
      </div>

      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );

  const page = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        backgroundImage:
          'url(https://ik.imagekit.io/nepgaxllc/Untitledfsdsss.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <IndooFooter label="Contact" onHome={onClose} onClose={onClose} />

      {/* Scrollable form */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '200px 16px 32px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Hero title inside form area */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 42, fontWeight: 900, color: '#fff', display: 'block' }}>Contact Us</span>
          <span style={{ fontSize: 20, fontWeight: 800, display: 'block', marginTop: 8, background: 'linear-gradient(90deg, #fff 0%, #fff 40%, #8DC63F 60%, #fff 80%, #fff 100%)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'contactShine 3s linear infinite' }}>Get in touch — we're here to help</span>
          <style>{`@keyframes contactShine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>

        {/* Section 1 - Personal Details */}
        <div style={glassStyle}>
          <div style={sectionTitleStyle}>Personal Details</div>

          <div style={fieldGap}>
            <label style={labelStyle}>
              Full Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              style={{
                ...inputStyle,
                borderColor: errors.fullName ? '#f87171' : 'rgba(255,255,255,0.15)',
              }}
            />
            {errors.fullName && (
              <span style={{ color: '#f87171', fontSize: 12 }}>{errors.fullName}</span>
            )}
          </div>

          <div style={fieldGap}>
            <label style={labelStyle}>
              WhatsApp Number <span style={{ color: '#f87171' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{ ...selectStyle, width: 155, flex: 'none' }}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code} style={optionStyle}>{c.label}</option>
                ))}
              </select>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="812 3456 7890"
                style={{
                  ...inputStyle,
                  flex: 1,
                  borderColor: errors.whatsapp ? '#f87171' : 'rgba(255,255,255,0.15)',
                }}
              />
            </div>
            {errors.whatsapp && (
              <span style={{ color: '#f87171', fontSize: 12 }}>{errors.whatsapp}</span>
            )}
          </div>

          <div style={fieldGap}>
            <label style={labelStyle}>
              City in Indonesia <span style={{ color: '#f87171' }}>*</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                ...selectStyle,
                borderColor: errors.city ? '#f87171' : 'rgba(255,255,255,0.15)',
              }}
            >
              <option value="" style={optionStyle}>Select city</option>
              {CITIES.map((c) => (
                <option key={c} value={c} style={optionStyle}>{c}</option>
              ))}
            </select>
            {errors.city && (
              <span style={{ color: '#f87171', fontSize: 12 }}>{errors.city}</span>
            )}
          </div>

          <div style={fieldGap}>
            <label style={labelStyle}>Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Section 2 - Reason for Contact */}
        <div style={glassStyle}>
          <div style={sectionTitleStyle}>Reason for Contact</div>
          <div style={fieldGap}>
            <label style={labelStyle}>
              Select a reason <span style={{ color: '#f87171' }}>*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                ...selectStyle,
                borderColor: errors.reason ? '#f87171' : 'rgba(255,255,255,0.15)',
              }}
            >
              <option value="" style={optionStyle}>Choose one...</option>
              {CONTACT_REASONS.map((r) => (
                <option key={r} value={r} style={optionStyle}>{r}</option>
              ))}
            </select>
            {errors.reason && (
              <span style={{ color: '#f87171', fontSize: 12 }}>{errors.reason}</span>
            )}
          </div>
        </div>

        {/* Section 3 - Conditional fields */}
        {isDriver && renderDriverFields()}
        {isFood && renderFoodFields()}

        {/* Section 4 - Message */}
        <div style={glassStyle}>
          <div style={sectionTitleStyle}>Additional Message</div>
          <div style={fieldGap}>
            <label style={labelStyle}>Your message / notes</label>
            <textarea
              rows={5}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us more about your inquiry..."
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 100,
              }}
            />
            <div
              style={{
                textAlign: 'right',
                fontSize: 12,
                color: message.length >= 480 ? '#f87171' : 'rgba(255,255,255,0.4)',
                marginTop: 4,
              }}
            >
              {message.length}/500
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 16,
            border: 'none',
            background: '#8DC63F',
            color: '#000',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 52,
            marginBottom: 16,
            boxShadow: '0 4px 20px rgba(141,198,63,0.3)',
          }}
        >
          Submit Contact Request
        </button>
      </div>

      {submitted && renderSuccessOverlay()}
    </div>
  );

  return createPortal(page, document.body);
}
