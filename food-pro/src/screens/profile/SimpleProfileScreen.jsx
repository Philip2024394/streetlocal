import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ContactUsPage from '@/components/ui/ContactUsPage';
import LegalPage from '@/components/ui/LegalPage';
import IndooFooter from '@/components/ui/IndooFooter';
import { useLanguage, LANGUAGES as LANG_OPTIONS } from '@/i18n';

const DAY_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2004_47_24%20PM.png';
const NIGHT_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2004_47_24%20PM.png';

const CITIES = [
  'Yogyakarta', 'Jakarta', 'Surabaya', 'Bandung', 'Semarang',
  'Medan', 'Makassar', 'Denpasar', 'Malang', 'Solo',
];

const LANG_NAME_MAP = { en: 'English', id: 'Bahasa Indonesia', zh: '中文', ar: 'العربية' };

const GLASS = {
  borderRadius: 20,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: 20,
  marginBottom: 16,
};

const GREEN = '#8DC63F';

function getTimeBasedBg() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? DAY_BG : NIGHT_BG;
}

function loadProfile() {
  try {
    const raw = localStorage.getItem('indoo_demo_profile');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProfile(updates) {
  const current = loadProfile();
  const merged = { ...current, ...updates };
  try {
    localStorage.setItem('indoo_demo_profile', JSON.stringify(merged));
  } catch (e) {
    // Quota exceeded — remove old data and retry without photo
    try {
      localStorage.removeItem('indoo_places_yogyakarta');
      localStorage.removeItem('indoo_chat_history');
      localStorage.setItem('indoo_demo_profile', JSON.stringify(merged));
    } catch {
      // Still full — save without photo
      const { photo_url, ...rest } = merged;
      try { localStorage.setItem('indoo_demo_profile', JSON.stringify(rest)); } catch {}
    }
  }
  return merged;
}

export default function SimpleProfileScreen({ onClose }) {
  const { setLang: appSetLang } = useLanguage()
  const [profile, setProfile] = useState(loadProfile);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name || '');
  const [showContact, setShowContact] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [notifications, setNotifications] = useState(profile.notifications !== false);
  const [email, setEmail] = useState(profile.email || '');
  const [city, setCity] = useState(profile.city || 'Yogyakarta');
  const [language, setLanguage] = useState(profile.language || 'Bahasa Indonesia');

  // Saved locations
  const [locations, setLocations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('indoo_saved_locations') || '{}') }
    catch { return {} }
  });
  const [editingLoc, setEditingLoc] = useState(null); // 'home'|'work'|'favourite'|null
  const [locInput, setLocInput] = useState('');
  const [locSuggestions, setLocSuggestions] = useState([]);

  const saveLocation = (key, address) => {
    const updated = { ...locations, [key]: { address, savedAt: new Date().toISOString() } };
    setLocations(updated);
    localStorage.setItem('indoo_saved_locations', JSON.stringify(updated));
    setEditingLoc(null);
    setLocInput('');
    setLocSuggestions([]);
  };

  const removeLocation = (key) => {
    const updated = { ...locations };
    delete updated[key];
    setLocations(updated);
    localStorage.setItem('indoo_saved_locations', JSON.stringify(updated));
  };

  // Simple address suggestions (Indonesian cities/areas)
  const SUGGESTIONS_DB = [
    'Jl. Malioboro, Yogyakarta', 'Jl. Kaliurang KM 5, Yogyakarta', 'Jl. Prawirotaman, Yogyakarta',
    'UGM Campus, Yogyakarta', 'Tugu Station, Yogyakarta', 'Ambarukmo Plaza, Yogyakarta',
    'Jl. Solo, Yogyakarta', 'Jl. Godean, Yogyakarta', 'Kotagede, Yogyakarta', 'Seturan, Yogyakarta',
    'Jl. Sudirman, Jakarta', 'Jl. Thamrin, Jakarta', 'Monas, Jakarta', 'Blok M, Jakarta',
    'Jl. Braga, Bandung', 'Jl. Dago, Bandung', 'Jl. Tunjungan, Surabaya',
  ];

  const handleLocInputChange = (val) => {
    setLocInput(val);
    if (val.length >= 2) {
      const filtered = SUGGESTIONS_DB.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 3);
      setLocSuggestions(filtered);
    } else {
      setLocSuggestions([]);
    }
  };
  const scrollRef = useRef(null);
  const profileCardRef = useRef(null);

  useEffect(() => {
    saveProfile({ email, city, language, notifications });
  }, [email, city, language, notifications]);

  const handlePhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const photo = ev.target.result;
        const updated = saveProfile({ photo });
        setProfile(updated);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSignOut = () => {
    localStorage.removeItem('indoo_registered');
    localStorage.removeItem('indoo_demo_profile');
    window.location.reload();
  };

  const scrollToProfileCard = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      profileCardRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  if (showContact)
    return <ContactUsPage onClose={() => setShowContact(false)} />;
  if (showLegal)
    return <LegalPage onClose={() => setShowLegal(false)} />;

  const content = (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `url(${getTimeBasedBg()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 1,
        pointerEvents: 'none',
      }} />

      {/* Single scrollable area */}
      <div className="profileScroll" style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2, scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
      <style>{`.profileScroll::-webkit-scrollbar { display: none; }`}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>
            <span style={{ color: '#fff' }}>IND</span><span style={{ color: '#8DC63F' }}>OO</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 2 }}>My Profile</div>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
          aria-label="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '0 16px 100px 16px',
        }}
      >
        {/* Profile Card */}
        <div ref={profileCardRef} style={{ ...GLASS, textAlign: 'center', paddingTop: 28, paddingBottom: 24 }}>
          {/* Photo with glow ring */}
          <div style={{
            width: 110, height: 110, borderRadius: '50%', margin: '0 auto 14px', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Animated glow ring */}
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              background: `conic-gradient(from 0deg, ${GREEN}, rgba(141,198,63,0.1), ${GREEN})`,
              animation: 'profileRingSpin 4s linear infinite',
            }} />
            <style>{`@keyframes profileRingSpin { to { transform: rotate(360deg); } }`}</style>
            <div style={{
              width: 102, height: 102, borderRadius: '50%', overflow: 'hidden',
              background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', zIndex: 1, border: '3px solid #080808',
            }}>
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 44, color: 'rgba(255,255,255,0.3)' }}>👤</span>
              )}
            </div>
            {/* Camera badge */}
            <div onClick={handlePhotoUpload} style={{
              position: 'absolute', bottom: 2, right: 2, zIndex: 2,
              width: 32, height: 32, borderRadius: '50%',
              background: GREEN, border: '3px solid #080808',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </div>

          {/* Name — editable */}
          {editingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { const updated = saveProfile({ name: nameInput.trim() || 'User' }); setProfile(updated); setEditingName(false) } }}
                style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${GREEN}`, background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 18, fontWeight: 900, textAlign: 'center', outline: 'none', fontFamily: 'inherit', width: 200 }}
              />
              <button onClick={() => { const updated = saveProfile({ name: nameInput.trim() || 'User' }); setProfile(updated); setEditingName(false) }} style={{ width: 36, height: 36, borderRadius: 10, background: GREEN, border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
            </div>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
              {profile.name || 'User'}
            </div>
          )}

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
            {profile.city || city}
          </div>

          <button
            onClick={() => { setNameInput(profile.name || ''); setEditingName(true) }}
            style={{
              background: 'rgba(141,198,63,0.12)', border: `1.5px solid rgba(141,198,63,0.3)`,
              color: GREEN, borderRadius: 14, padding: '10px 24px',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '0 auto',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Profile
          </button>
        </div>

        {/* Personal Info */}
        <div style={GLASS}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>Personal Info</div>

          {/* Phone */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
              Phone / WhatsApp
            </label>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '10px 14px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}>
              {profile.phone || 'Not set'}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                minHeight: 44,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* City */}
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                minHeight: 44,
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {CITIES.map((c) => (
                <option key={c} value={c} style={{ background: '#222', color: '#fff' }}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* My Locations */}
        <div style={GLASS}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>My Locations</div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 16 }}>Save locations for faster checkout</span>

          {[
            { key: 'home', icon: '🏠', label: 'Home', desc: 'Default pickup & delivery', required: true },
            { key: 'work', icon: '💼', label: 'Work', desc: 'Your workplace address', required: false },
            { key: 'favourite', icon: '⭐', label: 'Favourite', desc: 'Any spot you visit often', required: false },
          ].map(loc => (
            <div key={loc.key} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{loc.icon}</span>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{loc.label}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{loc.desc}</span>
                  </div>
                </div>
                {locations[loc.key] && (
                  <button onClick={() => removeLocation(loc.key)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 16, cursor: 'pointer', padding: 4 }}>✕</button>
                )}
              </div>

              {locations[loc.key] && editingLoc !== loc.key ? (
                <div onClick={() => { setEditingLoc(loc.key); setLocInput(locations[loc.key].address); }} style={{ background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>📍</span>
                  <span style={{ fontSize: 13, color: '#8DC63F', fontWeight: 600, flex: 1 }}>{locations[loc.key].address}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Edit</span>
                </div>
              ) : editingLoc === loc.key ? (
                <div>
                  <input
                    type="text"
                    value={locInput}
                    onChange={(e) => handleLocInputChange(e.target.value)}
                    placeholder="Type address or area..."
                    autoFocus
                    style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  {/* Suggestions dropdown */}
                  {locSuggestions.length > 0 && (
                    <div style={{ marginTop: 4, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {locSuggestions.map((s, i) => (
                        <button key={i} onClick={() => saveLocation(loc.key, s)} style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.7)', border: 'none', borderBottom: i < locSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', color: '#fff', fontSize: 13, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#8DC63F' }}>📍</span> {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => { if (locInput.trim()) saveLocation(loc.key, locInput.trim()) }} style={{ flex: 1, padding: 10, borderRadius: 10, background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setEditingLoc(null); setLocInput(''); setLocSuggestions([]) }} style={{ padding: '10px 16px', borderRadius: 10, background: '#7F1D1D', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditingLoc(loc.key)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
                  <span>+</span> Add {loc.label.toLowerCase()} address
                </button>
              )}
            </div>
          ))}

          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'block', marginTop: 4 }}>💡 Saved locations appear as quick-select when booking rides or ordering food</span>
        </div>

        {/* Preferences */}
        <div style={GLASS}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>Preferences</div>

          {/* Language — flag image buttons connected to app i18n */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }}>
              Language
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {LANG_OPTIONS.map(l => {
                const isActive = language === (LANG_NAME_MAP[l.code] || l.label)
                return (
                  <button key={l.code} onClick={() => { setLanguage(LANG_NAME_MAP[l.code] || l.label); appSetLang(l.code) }} style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '10px 6px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                    background: isActive ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.04)',
                    border: isActive ? '2px solid rgba(141,198,63,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isActive ? '0 0 12px rgba(141,198,63,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    <img src={l.image} alt={l.label} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: '50%' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#8DC63F' : 'rgba(255,255,255,0.5)' }}>{l.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notifications toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#fff' }}>Notifications</span>
            <button
              onClick={() => setNotifications((v) => !v)}
              style={{
                width: 50,
                height: 28,
                borderRadius: 14,
                border: 'none',
                background: notifications ? GREEN : 'rgba(255,255,255,0.2)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
                minWidth: 50,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
              aria-label={`Notifications ${notifications ? 'on' : 'off'}`}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: notifications ? 25 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div style={GLASS}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>App Info</div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>App Version</span>
            <span style={{ fontSize: 14, color: '#fff' }}>INDOO v1.0</span>
          </div>

          <button
            onClick={() => setShowLegal(true)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: 10,
              textAlign: 'left',
              minHeight: 44,
            }}
          >
            View Legal & Policies
          </button>

          <button
            onClick={() => setShowContact(true)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              textAlign: 'left',
              minHeight: 44,
            }}
          >
            Contact Support
          </button>
        </div>
      </div>

      </div>{/* end single scrollable area */}

      <IndooFooter label="Profile" onHome={onClose} onClose={onClose} />

      {/* Settings Drawer Backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            animation: 'drawerFadeIn 0.3s ease',
          }}
        />
      )}
      <style>{`
        @keyframes drawerFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes drawerEdgeLight { 0% { top: -80px; } 100% { top: 100%; } }
        @keyframes drawerSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>

      {/* Settings Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: drawerOpen ? 0 : -320, bottom: 0,
        width: 300, zIndex: 10002,
        background: 'rgba(8,8,12,0.85)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
        borderLeft: '2px solid rgba(141,198,63,0.2)',
        transition: 'right 0.35s cubic-bezier(0.32,0.72,0,1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Green running light on left edge */}
        <div style={{ position: 'absolute', top: 0, left: -2, width: 2, height: '100%', overflow: 'hidden', zIndex: 1 }}>
          <div style={{ position: 'absolute', width: '100%', height: 80, background: 'linear-gradient(180deg, transparent, #8DC63F, #a8e650, #8DC63F, transparent)', animation: 'drawerEdgeLight 2.5s linear infinite' }} />
        </div>

        {/* Header */}
        <div style={{
          padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 16px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(141,198,63,0.1)',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Settings</div>
            <div style={{ fontSize: 10, color: 'rgba(141,198,63,0.5)', fontWeight: 600, marginTop: 2 }}>Manage your account</div>
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
          {/* Account section */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(141,198,63,0.5)', letterSpacing: 1, padding: '0 4px 8px', textTransform: 'uppercase' }}>Account</div>
          {[
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: 'Edit Profile', action: scrollToProfileCard },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, label: 'Privacy & Security', action: () => { setDrawerOpen(false); setShowLegal(true) } },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{
              width: '100%', marginBottom: 6, padding: '13px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              transition: 'background 0.15s',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1, textAlign: 'left' }}>{item.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}

          {/* Legal section */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(141,198,63,0.5)', letterSpacing: 1, padding: '14px 4px 8px', textTransform: 'uppercase' }}>Legal</div>
          {[
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: 'Terms of Service', color: '#60A5FA' },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, label: 'Refund Policy', color: '#FACC15' },
          ].map(item => (
            <button key={item.label} onClick={() => { setDrawerOpen(false); setShowLegal(true) }} style={{
              width: '100%', marginBottom: 6, padding: '13px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(255,255,255,0.04)`, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1, textAlign: 'left' }}>{item.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}

          {/* Support section */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(141,198,63,0.5)', letterSpacing: 1, padding: '14px 4px 8px', textTransform: 'uppercase' }}>Support</div>
          <button onClick={() => { setDrawerOpen(false); setShowContact(true) }} style={{
            width: '100%', marginBottom: 6, padding: '13px 14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1, textAlign: 'left' }}>Contact Us</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          {/* Sign Out */}
          <div style={{ padding: '20px 0 10px' }}>
            <button onClick={handleSignOut} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Footer brand */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800 }}><span style={{ color: 'rgba(255,255,255,0.3)' }}>IND</span><span style={{ color: 'rgba(141,198,63,0.4)' }}>OO</span></span>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginTop: 2 }}>v1.0 · Yogyakarta</div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
