import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const SERVICE_LABELS = {
  ride_bike: 'Ojek Ride',
  ride_car: 'Car Ride',
  food_delivery: 'Food Delivery',
  andong: 'Andong Ride',
};

const REVIEW_MESSAGES = [
  'INDOO Fleet is the best in Yogyakarta',
  'INDOO drivers are top fleet service providers',
  'INDOO is the go-to place for any destination',
  'Thank you for choosing INDOO — the people\'s ride',
  'Your feedback makes our drivers even better',
  'INDOO — where every ride is a great ride',
  'Our drivers go the extra mile for you',
  'INDOO Fleet — trusted by thousands daily',
  'You\'re part of the INDOO family now',
  'Great rides start with great drivers',
  'INDOO — Yogyakarta\'s favorite ride app',
  'Your driver appreciates your kind words',
  'INDOO Fleet — always on time, always reliable',
  'Together we\'re building better transport',
  'INDOO drivers — the pride of Yogyakarta',
  'Every rating helps our community grow',
  'INDOO — ride with confidence, arrive with a smile',
  'Your review helps other passengers choose wisely',
  'INDOO Fleet — safety first, comfort always',
  'Thank you for riding green with INDOO',
  'INDOO — connecting Yogyakarta one ride at a time',
  'Our drivers love serving you',
  'INDOO Fleet — where service meets heart',
  'Your journey matters to us',
  'INDOO — the smartest way to travel',
  'Great feedback fuels great service',
  'INDOO drivers — trained, trusted, tested',
  'Ride INDOO — feel the difference',
  'INDOO Fleet keeps Yogyakarta moving',
  'Your words inspire our drivers every day',
  'INDOO — more than a ride, it\'s an experience',
  'Thank you for trusting INDOO with your journey',
  'INDOO Fleet — born in Yogyakarta, built for you',
  'Every ride with INDOO is a story worth sharing',
  'INDOO drivers — your safety is our mission',
  'Ride smart, ride INDOO',
  'INDOO — the heartbeat of Yogyakarta transport',
  'Your feedback shapes the future of INDOO',
  'INDOO Fleet — where quality meets affordability',
  'Thank you for being an INDOO rider',
  'INDOO — because you deserve the best ride',
  'Our drivers are the backbone of INDOO',
  'INDOO Fleet — excellence on every road',
  'Your review just made a driver\'s day',
  'INDOO — ride local, support local',
  'Great drivers. Great rides. That\'s INDOO',
  'INDOO Fleet — powering Yogyakarta\'s daily commute',
  'Thank you for helping us improve',
  'INDOO — trusted by the community, for the community',
  'Your safety, our priority — always',
  'INDOO Fleet — the gold standard of ride-hailing',
  'Every star you give lights up a driver\'s day',
  'INDOO — fast, fair, and friendly',
  'Ride INDOO and discover the difference',
  'INDOO Fleet — where passion meets the road',
  'Your loyalty makes INDOO stronger',
  'INDOO — the future of transport is here',
  'Thank you for riding with Indonesia\'s finest',
  'INDOO Fleet — driven by integrity',
  'Your journey. Your driver. Your INDOO',
  'INDOO — making every kilometer count',
  'Our drivers take pride in every ride',
  'INDOO Fleet — Yogyakarta\'s most reliable',
  'Thank you for supporting local drivers',
  'INDOO — where tradition meets technology',
  'Your feedback is a gift to our drivers',
  'INDOO Fleet — setting the standard since day one',
  'Ride with heart. Ride INDOO',
  'INDOO — Indonesia\'s ride revolution',
  'Great rides don\'t happen by accident — they\'re INDOO',
  'INDOO Fleet — your comfort is our commitment',
  'Thank you for being part of our journey',
  'INDOO — affordable rides, unforgettable service',
  'Your driver just leveled up thanks to you',
  'INDOO Fleet — one city, one team, one mission',
  'INDOO — ride happy, arrive happy',
  'Our fleet is powered by your trust',
  'INDOO — the pride of Indonesian ride-hailing',
  'Thank you — your review goes a long way',
  'INDOO Fleet — we don\'t just drive, we care',
  'INDOO — every ride is personal',
  'Your words fuel our drivers\' passion',
  'INDOO Fleet — built different, driven better',
  'INDOO — small commission, big heart',
  'Thank you for making Yogyakarta a better ride',
  'INDOO Fleet — where every driver is a partner',
  'INDOO — ride with purpose',
  'Your rating keeps our streets safer',
  'INDOO Fleet — 10% commission, 100% dedication',
  'INDOO — the app that puts drivers first',
  'Thank you for choosing the people\'s fleet',
  'INDOO — cultural rides, modern service',
  'Your support keeps our drivers on the road',
  'INDOO Fleet — lowest fares, highest standards',
  'INDOO — because every ride should feel special',
  'Thank you — together we\'re changing transport',
  'INDOO Fleet — driven by community, powered by you',
  'INDOO — Yogyakarta\'s #1 choice',
  'Your review just inspired a driver to be even better',
  'INDOO Fleet — ride the future, today',
];

function getRandomMessage() {
  return REVIEW_MESSAGES[Math.floor(Math.random() * REVIEW_MESSAGES.length)];
}

const STAR_EMPTY = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const STAR_FILLED = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#FACC15" stroke="#FACC15" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function RatingPopup({
  driverName,
  driverPhoto,
  serviceType,
  orderId,
  onSubmit,
  onSkip,
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [visible, setVisible] = useState(false);
  const [thankYou, setThankYou] = useState(false);
  const [reviewMsg] = useState(() => getRandomMessage());
  const cardRef = useRef(null);

  useEffect(() => {
    // trigger slide-up on mount
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    const rating = {
      orderId,
      driverName,
      stars,
      comment: comment.trim(),
      favorite,
      serviceType,
      date: new Date().toISOString(),
    };

    // persist to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('indoo_ratings') || '[]');
      existing.push(rating);
      localStorage.setItem('indoo_ratings', JSON.stringify(existing));
    } catch {
      // silent
    }

    setThankYou(true);
    setTimeout(() => {
      onSubmit?.({ stars, comment: comment.trim(), favorite });
      onSkip?.();
    }, 1500);
  };

  const handleSkip = () => {
    setVisible(false);
    setTimeout(() => onSkip?.(), 300);
  };

  // -- styles --
  const overlay = {
    position: 'fixed',
    inset: 0,
    zIndex: 10020,
    display: 'flex',
    flexDirection: 'column',
    transition: 'opacity 0.3s',
    opacity: visible ? 1 : 0,
  };

  const bgImage = {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2009_57_52%20AM.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  };

  const bgOverlay = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.75) 100%)',
    zIndex: 1,
  };

  const card = {
    width: '100%',
    maxWidth: 480,
    margin: '0 auto',
    padding: '0 20px',
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    transform: visible ? 'translateY(0)' : 'translateY(60px)',
    transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.35s',
    opacity: visible ? 1 : 0,
    position: 'relative',
    zIndex: 2,
    marginTop: 'auto',
  };

  const glassBox = {
    width: '100%',
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: '16px',
    position: 'relative',
    zIndex: 1,
  };

  const photoStyle = {
    width: 72,
    height: 72,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid rgba(250,204,21,0.4)',
    boxShadow: '0 0 20px rgba(250,204,21,0.15)',
  };

  const nameStyle = {
    color: '#fff',
    fontSize: 18,
    fontWeight: 800,
    margin: '4px 0 0',
    textAlign: 'center',
  };

  const serviceLabel = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    margin: 0,
  };

  const questionStyle = {
    color: '#fff',
    fontSize: 17,
    fontWeight: 800,
    margin: 0,
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
  };

  const starsRow = {
    display: 'flex',
    gap: 8,
    margin: '4px 0',
  };

  const starBtn = {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    minWidth: 44,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const pillsWrap = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  };

  const pillBase = {
    fontSize: 12,
    fontWeight: 500,
    padding: '6px 12px',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.15)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
  };

  const pillInactive = {
    ...pillBase,
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.7)',
  };

  const pillActive = {
    ...pillBase,
    background: 'rgba(34,197,94,0.2)',
    color: '#22C55E',
    borderColor: '#22C55E',
  };

  const textareaStyle = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    padding: '10px 12px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const tipLabel = {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    margin: 0,
  };

  const tipBtnBase = {
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 14px',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
    minHeight: 44,
    border: '1px solid rgba(255,255,255,0.15)',
  };

  const tipBtnInactive = {
    ...tipBtnBase,
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.7)',
  };

  const tipBtnActive = {
    ...tipBtnBase,
    background: 'rgba(34,197,94,0.2)',
    color: '#22C55E',
    borderColor: '#22C55E',
  };

  const submitBtn = {
    width: '100%',
    padding: '16px 0',
    borderRadius: 14,
    border: 'none',
    background: stars > 0 ? '#8DC63F' : 'rgba(255,255,255,0.08)',
    color: stars > 0 ? '#000' : 'rgba(255,255,255,0.3)',
    fontSize: 16,
    fontWeight: 900,
    cursor: stars > 0 ? 'pointer' : 'default',
    minHeight: 44,
    transition: 'background 0.2s, color 0.2s',
    boxShadow: stars > 0 ? '0 4px 24px rgba(141,198,63,0.4)' : 'none',
    position: 'relative',
    zIndex: 1,
    fontFamily: 'inherit',
  };

  const skipBtn = {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    cursor: 'pointer',
    padding: '8px 16px',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  };

  const thankYouStyle = {
    color: '#22C55E',
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    padding: '48px 0',
  };

  // -- render --
  const content = (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Rate your experience">
      {/* Full-screen background image */}
      <div style={bgImage} />
      <div style={bgOverlay} />

      <div style={card} ref={cardRef}>
        {thankYou ? (
          <div style={{ ...glassBox, textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#8DC63F', fontSize: 24, fontWeight: 900, margin: 0 }}>Thank you! 💚</p>
            {favorite && <p style={{ color: '#FACC15', fontSize: 13, marginTop: 8 }}>Driver added to your favorites ⭐</p>}
          </div>
        ) : (
          <>
            {/* Driver info */}
            <img
              src={driverPhoto}
              alt={driverName}
              style={photoStyle}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div style={{ textAlign: 'center' }}>
              <p style={nameStyle}>{driverName}</p>
              <p style={serviceLabel}>{SERVICE_LABELS[serviceType] || serviceType}</p>
            </div>

            {/* Random INDOO message */}
            <div style={{ ...glassBox, textAlign: 'center', padding: '12px 16px' }}>
              <p style={{ color: '#8DC63F', fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                "{reviewMsg}"
              </p>
            </div>

            {/* Question */}
            <p style={questionStyle}>How was your experience?</p>

            {/* Stars */}
            <div style={starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  style={starBtn}
                  onClick={() => setStars(n)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  {n <= stars ? STAR_FILLED : STAR_EMPTY}
                </button>
              ))}
            </div>

            {/* Comment */}
            {stars > 0 && (
              <textarea
                rows={2}
                style={{ ...textareaStyle, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }}
                placeholder="Leave a comment for your driver..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            )}

            {/* Add to Favorites — yellow */}
            <button
              onClick={() => setFavorite(!favorite)}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14,
                background: favorite ? '#FACC15' : 'rgba(250,204,21,0.12)',
                backdropFilter: 'blur(12px)',
                border: `1.5px solid ${favorite ? '#FACC15' : 'rgba(250,204,21,0.4)'}`,
                color: favorite ? '#000' : '#FACC15',
                fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', minHeight: 44, position: 'relative', zIndex: 1,
                boxShadow: favorite ? '0 4px 20px rgba(250,204,21,0.35)' : '0 0 12px rgba(250,204,21,0.1)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={favorite ? '#000' : 'none'} stroke={favorite ? '#000' : '#FACC15'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              {favorite ? 'Added to Favorites ⭐' : 'Add to Favorite Drivers'}
            </button>

            {/* Submit */}
            <button
              style={submitBtn}
              disabled={stars === 0}
              onClick={handleSubmit}
            >
              Submit Review
            </button>

            {/* Skip */}
            <button style={skipBtn} onClick={handleSkip}>
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
