/**
 * FlyingBird — photorealistic seagull silhouette with correct wing anatomy.
 * - 8 individual primary feathers fan from each wingtip
 * - Scalloped secondary feather row along trailing edge
 * - Covert feather texture rows
 * - Black wingtips (authentic herring gull marking)
 * Flies right → left (SVG drawn right-facing, scaleX(-1) flips it)
 */
export default function FlyingBird() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '240px',
        pointerEvents: 'none',
        zIndex: 2,
        overflow: 'hidden',
      }}
    >
      {/* Outer: horizontal flight path */}
      <div style={{ animation: 'birdFly 42s linear infinite', willChange: 'transform' }}>
        {/* Inner: vertical sine-wave body bob */}
        <div style={{ animation: 'birdBob 3.2s ease-in-out infinite', willChange: 'transform' }}>
          <svg
            viewBox="0 0 320 120"
            width="320"
            height="120"
            style={{
              display: 'block',
              transform: 'scaleX(-1)',
              filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))',
            }}
          >
            <defs>
              {/* Slight yellow cast on all feather surfaces */}
              <linearGradient id="fwBodyG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#f5f0d6" />
                <stop offset="60%"  stopColor="#ddd8b8" />
                <stop offset="100%" stopColor="#aaa69a" />
              </linearGradient>
              <linearGradient id="fwWingTopG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#eae4c8" />
                <stop offset="50%"  stopColor="#c8c2a4" />
                <stop offset="100%" stopColor="#8e8a76" />
              </linearGradient>
              <linearGradient id="fwCovertG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#d8d4b8" />
                <stop offset="100%" stopColor="#b4b09a" />
              </linearGradient>
              <linearGradient id="fwPrimaryG" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#ccc8a8" />
                <stop offset="45%"  stopColor="#6a6650" />
                <stop offset="100%" stopColor="#141210" />
              </linearGradient>
              <linearGradient id="fwPrimaryGR" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%"   stopColor="#ccc8a8" />
                <stop offset="45%"  stopColor="#6a6650" />
                <stop offset="100%" stopColor="#141210" />
              </linearGradient>
              <linearGradient id="fwHeadG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#faf6e0" />
                <stop offset="100%" stopColor="#e0dccc" />
              </linearGradient>
            </defs>

            {/* ══════════════════════════════════════════
                LEFT WING  (flaps via group rotation)
            ══════════════════════════════════════════ */}
            {/* Scale wrapper: shrinks wing span 30% around shoulder pivot */}
            <g transform="translate(186,66) scale(0.7,1) translate(-186,-66)">
            <g style={{
              transformOrigin: '186px 66px',
              animation: 'wingFlapL 0.65s cubic-bezier(0.45,0,0.55,1) infinite',
            }}>

              {/* Wing membrane — main upper surface */}
              <path
                d="
                  M 186 64
                  C 165 56, 140 50, 116 46
                  C 96  42, 70  36, 52  32
                  C 38  29, 20  30, 10  36
                  C 14  46, 20  52, 28  52
                  C 36  56, 40  60, 38  63
                  C 48  59, 55  62, 52  66
                  C 62  62, 70  64, 67  68
                  C 78  63, 87  65, 84  69
                  C 98  65, 110 66, 108 71
                  C 128 67, 148 68, 150 73
                  C 168 70, 182 69, 186 72
                  Z
                "
                fill="url(#fwWingTopG)"
              />

              {/* ── PRIMARY FEATHERS (8 individual feathers from wingtip) ── */}
              {/* P8 — outermost, longest, darkest tip */}
              <path
                d="M 116 46 C 82 40, 42 34, 10 36 C 12 42, 16 46, 20 46 C 36 44, 72 42, 106 50 Z"
                fill="url(#fwPrimaryG)"
              />
              {/* P7 */}
              <path
                d="M 112 47 C 82 41, 52 36, 26 36 C 26 42, 30 46, 34 45 C 54 43, 82 44, 110 51 Z"
                fill="url(#fwPrimaryG)"
                opacity="0.92"
              />
              {/* P6 */}
              <path
                d="M 108 48 C 82 43, 58 38, 38 38 C 36 43, 40 47, 44 47 C 62 45, 86 46, 106 52 Z"
                fill="url(#fwPrimaryG)"
                opacity="0.85"
              />
              {/* P5 */}
              <path
                d="M 104 49 C 84 45, 64 41, 48 41 C 46 46, 50 49, 54 49 C 70 48, 90 48, 102 53 Z"
                fill="url(#fwPrimaryG)"
                opacity="0.78"
              />
              {/* P4 */}
              <path
                d="M 100 50 C 84 47, 68 44, 56 44 C 54 48, 58 51, 62 51 C 76 50, 92 50, 98 54 Z"
                fill="url(#fwPrimaryG)"
                opacity="0.68"
              />
              {/* P3 */}
              <path
                d="M 96 51 C 84 49, 72 47, 64 47 C 62 51, 66 53, 70 53 C 80 52, 90 52, 94 55 Z"
                fill="#8a8682"
                opacity="0.6"
              />
              {/* P2 */}
              <path
                d="M 92 52 C 84 50, 76 49, 70 49 C 68 52, 72 54, 76 54 C 82 53, 88 53, 90 56 Z"
                fill="#9a9692"
                opacity="0.5"
              />
              {/* P1 — innermost, shortest, lightest */}
              <path
                d="M 88 53 C 83 52, 78 51, 74 51 C 73 53, 76 55, 80 55 C 84 54, 86 54, 87 56 Z"
                fill="#b4b0aa"
                opacity="0.42"
              />

              {/* ── SECONDARY FEATHERS — scalloped trailing edge ── */}
              {/* Each scallop = one secondary feather's visible edge */}
              <path
                d="
                  M 116 50
                  C 122 56, 118 62, 120 65
                  C 126 60, 124 55, 128 52
                  C 134 58, 130 63, 132 67
                  C 138 62, 136 57, 140 54
                  C 146 60, 144 65, 146 69
                  C 152 64, 150 59, 154 56
                  C 160 62, 158 67, 160 71
                  C 166 66, 164 61, 168 58
                  C 174 64, 172 69, 174 73
                  C 180 68, 178 63, 182 61
                  C 186 66, 186 70, 186 72
                "
                fill="none"
                stroke="#a8a49e"
                strokeWidth="1.2"
                opacity="0.65"
              />

              {/* ── COVERT ROWS — texture lines across wing surface ── */}
              {/* Greater coverts row */}
              <path
                d="M 186 64 C 165 58, 140 53, 116 50"
                fill="none" stroke="#c2bdb6" strokeWidth="1.4" opacity="0.55"
              />
              {/* Median coverts row */}
              <path
                d="M 186 61 C 162 55, 135 50, 108 48"
                fill="none" stroke="#cac5be" strokeWidth="1.1" opacity="0.45"
              />
              {/* Lesser coverts / scapulars */}
              <path
                d="M 186 58 C 165 53, 142 49, 120 47"
                fill="none" stroke="#d2cec8" strokeWidth="0.9" opacity="0.38"
              />
              {/* Alula — small group of feathers on leading edge near wrist */}
              <path
                d="M 118 46 C 112 42, 108 40, 108 44 C 110 46, 114 47, 118 48 Z"
                fill="#9a9690"
                opacity="0.7"
              />

              {/* Black wingtip patch over outer 3 primaries */}
              <path
                d="
                  M 116 46
                  C 78 38, 32 32, 10 36
                  C 12 40, 16 44, 22 44
                  C 40 42, 68 42, 95 48
                  Z
                "
                fill="#1a1816"
                opacity="0.82"
              />
              {/* White mirror spot on black tip (herring gull marking) */}
              <ellipse cx="16" cy="40" rx="4" ry="3" fill="rgba(255,255,255,0.55)" />
              <ellipse cx="28" cy="38" rx="3" ry="2" fill="rgba(255,255,255,0.35)" />

            </g>
            </g>{/* end left wing scale wrapper */}

            {/* ══════════════════════════════════════════
                RIGHT WING (flaps opposite phase)
            ══════════════════════════════════════════ */}
            <g transform="translate(194,66) scale(0.7,1) translate(-194,-66)">
            <g style={{
              transformOrigin: '194px 66px',
              animation: 'wingFlapR 0.65s cubic-bezier(0.45,0,0.55,1) infinite',
            }}>

              {/* Wing membrane */}
              <path
                d="
                  M 194 64
                  C 215 56, 240 50, 264 46
                  C 284 42, 300 36, 310 36
                  C 314 44, 308 52, 300 52
                  C 292 56, 288 60, 290 63
                  C 280 59, 273 62, 276 66
                  C 266 62, 258 64, 261 68
                  C 250 63, 241 65, 244 69
                  C 230 65, 218 66, 220 71
                  C 200 67, 196 69, 194 72
                  Z
                "
                fill="url(#fwWingTopG)"
              />

              {/* Primary feathers — right wing */}
              <path
                d="M 264 46 C 298 40, 304 34, 310 36 C 308 42, 304 46, 300 46 C 284 44, 268 42, 254 50 Z"
                fill="url(#fwPrimaryGR)"
              />
              <path
                d="M 268 47 C 298 41, 302 36, 306 38 C 304 43, 300 46, 296 45 C 276 43, 270 44, 258 51 Z"
                fill="url(#fwPrimaryGR)"
                opacity="0.92"
              />
              <path
                d="M 272 48 C 298 43, 300 38, 304 39 C 302 44, 298 47, 294 47 C 278 45, 274 46, 262 52 Z"
                fill="url(#fwPrimaryGR)"
                opacity="0.85"
              />
              <path
                d="M 276 49 C 296 45, 300 42, 304 43 C 302 47, 298 50, 294 49 C 282 48, 278 48, 266 53 Z"
                fill="url(#fwPrimaryGR)"
                opacity="0.78"
              />
              <path
                d="M 280 50 C 296 47, 300 44, 302 45 C 300 49, 296 51, 292 51 C 284 50, 280 50, 270 54 Z"
                fill="url(#fwPrimaryGR)"
                opacity="0.68"
              />
              <path
                d="M 284 51 C 296 49, 298 47, 300 48 C 298 51, 294 53, 290 53 C 284 52, 282 52, 274 55 Z"
                fill="#8a8682"
                opacity="0.6"
              />
              <path
                d="M 288 52 C 296 50, 298 49, 298 50 C 296 53, 292 54, 288 54 C 284 53, 282 53, 278 56 Z"
                fill="#9a9692"
                opacity="0.5"
              />
              <path
                d="M 292 53 C 296 52, 296 51, 298 52 C 296 54, 293 55, 290 55 C 286 54, 284 54, 283 56 Z"
                fill="#b4b0aa"
                opacity="0.42"
              />

              {/* Secondary scallops */}
              <path
                d="
                  M 264 50
                  C 258 56, 262 62, 260 65
                  C 254 60, 256 55, 252 52
                  C 246 58, 250 63, 248 67
                  C 242 62, 244 57, 240 54
                  C 234 60, 236 65, 234 69
                  C 228 64, 230 59, 226 56
                  C 220 62, 222 67, 220 71
                  C 214 66, 216 61, 212 58
                  C 206 64, 208 69, 206 73
                  C 200 68, 198 63, 194 61
                  C 194 66, 194 70, 194 72
                "
                fill="none"
                stroke="#a8a49e"
                strokeWidth="1.2"
                opacity="0.65"
              />

              {/* Covert rows */}
              <path
                d="M 194 64 C 215 58, 240 53, 264 50"
                fill="none" stroke="#c2bdb6" strokeWidth="1.4" opacity="0.55"
              />
              <path
                d="M 194 61 C 218 55, 245 50, 272 48"
                fill="none" stroke="#cac5be" strokeWidth="1.1" opacity="0.45"
              />
              <path
                d="M 194 58 C 215 53, 238 49, 260 47"
                fill="none" stroke="#d2cec8" strokeWidth="0.9" opacity="0.38"
              />
              {/* Alula */}
              <path
                d="M 264 46 C 270 42, 274 40, 274 44 C 272 46, 268 47, 264 48 Z"
                fill="#9a9690"
                opacity="0.7"
              />

              {/* Black wingtip */}
              <path
                d="
                  M 264 46
                  C 302 38, 306 32, 310 36
                  C 308 40, 304 44, 298 44
                  C 280 42, 268 42, 245 48
                  Z
                "
                fill="#1a1816"
                opacity="0.82"
              />
              <ellipse cx="306" cy="40" rx="4" ry="3" fill="rgba(255,255,255,0.55)" />
              <ellipse cx="294" cy="38" rx="3" ry="2" fill="rgba(255,255,255,0.35)" />

            </g>
            </g>{/* end right wing scale wrapper */}

            {/* ══════════════════════════════════════════
                BODY
            ══════════════════════════════════════════ */}
            {/* Tail feathers */}
            <path
              d="M 174 72 C 166 80, 160 90, 163 96 C 167 88, 172 80, 177 76 Z"
              fill="#d8d4ce"
            />
            <path
              d="M 171 72 C 162 82, 157 92, 161 98 C 165 89, 170 81, 175 76 Z"
              fill="#c4c0b8"
              opacity="0.8"
            />
            <path
              d="M 177 72 C 170 80, 166 88, 169 94 C 172 86, 176 78, 180 74 Z"
              fill="#e2dfd8"
              opacity="0.7"
            />
            <path
              d="M 168 72 C 160 82, 157 90, 160 96 C 163 88, 168 80, 172 75 Z"
              fill="#b8b4ae"
              opacity="0.6"
            />

            {/* Main body */}
            <ellipse cx="192" cy="70" rx="26" ry="10" fill="url(#fwBodyG)" />
            {/* Belly shading */}
            <ellipse cx="192" cy="73" rx="20" ry="6" fill="#bab6b0" opacity="0.35" />
            {/* Body feather texture lines */}
            <path d="M 172 68 C 182 65, 196 64, 210 66" fill="none" stroke="#d0ccc6" strokeWidth="0.7" opacity="0.5" />
            <path d="M 170 71 C 180 68, 196 67, 212 69" fill="none" stroke="#d0ccc6" strokeWidth="0.7" opacity="0.4" />

            {/* ══════════════════════════════════════════
                HEAD
            ══════════════════════════════════════════ */}
            <ellipse cx="213" cy="62" rx="13" ry="12" fill="url(#fwHeadG)" />
            {/* Neck shading */}
            <path
              d="M 200 66 C 203 62, 208 59, 213 60 C 208 64, 203 68, 200 70 Z"
              fill="#c8c4be"
              opacity="0.4"
            />
            {/* Gape line (mouth line) */}
            <path
              d="M 213 63 C 218 63, 226 64, 232 65"
              fill="none" stroke="#c8a040" strokeWidth="1.2" opacity="0.6"
            />
            {/* Eye ring */}
            <circle cx="218" cy="60" r="3.5" fill="#1a1815" />
            <circle cx="218" cy="60" r="2.4" fill="#241f1c" />
            {/* Eye highlight */}
            <circle cx="219" cy="59.2" r="0.9" fill="rgba(255,255,255,0.7)" />

            {/* BEAK */}
            {/* Upper mandible */}
            <path
              d="M 224 60 C 232 60, 240 61, 243 63 C 240 64, 232 63, 224 62 Z"
              fill="#e8c840"
            />
            {/* Lower mandible */}
            <path
              d="M 224 63 C 232 63, 240 64, 242 65 C 240 66, 232 65, 224 64 Z"
              fill="#d4b42e"
            />
            {/* Beak tip hook */}
            <path
              d="M 241 62 C 244 62, 245 63, 244 65 C 243 65, 242 64, 241 63 Z"
              fill="#d4b42e"
            />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes birdFly {
          0%   { transform: translateX(calc(100vw + 260px)); }
          33%  { transform: translateX(-260px); }
          34%  { transform: translateX(calc(100vw + 260px)); }
          100% { transform: translateX(calc(100vw + 260px)); }
        }
        @keyframes birdBob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes wingFlapL {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(-20deg); }
          60%  { transform: rotate(12deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes wingFlapR {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(20deg); }
          60%  { transform: rotate(-12deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
