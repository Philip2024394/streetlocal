import { BASE_LAT, BASE_LNG, offset, now } from "./mockHelpers"

export const DEMO_REVIEWS = [
  {
    id: 'r1',
    displayName: 'Isabelle M.',
    emoji: '😊',
    age: 27,
    area: 'Soho, London',
    country: 'GB',
    flag: '🇬🇧',
    rating: 5,
    text: 'Met someone incredible within 20 minutes of going live. We ended up staying at the bar for 3 hours. This app is genuinely different — no awkward texting, just real chemistry in person.',
    activityType: 'drinks',
    verified: true,
    timeAgo: '2 days ago',
  },
  {
    id: 'r2',
    displayName: 'James T.',
    emoji: '😎',
    age: 31,
    area: 'Shoreditch, London',
    country: 'GB',
    flag: '🇬🇧',
    rating: 5,
    text: 'Refreshing concept. No endless swiping, no ghosting. Hit the button, someone nearby was also out, we grabbed coffee. Simple as that.',
    activityType: 'coffee',
    verified: true,
    timeAgo: '4 days ago',
  },
  {
    id: 'r3',
    displayName: 'Priya K.',
    emoji: '✨',
    age: 25,
    area: 'Notting Hill, London',
    country: 'GB',
    flag: '🇬🇧',
    rating: 5,
    text: 'Finally an app that feels safe. No random messages from strangers — just people who are actually nearby and actually out. The female safety features are a massive plus.',
    activityType: 'food',
    verified: true,
    timeAgo: '1 week ago',
  },
  {
    id: 'r4',
    displayName: 'Marcus O.',
    emoji: '🎯',
    age: 29,
    area: 'Camden, London',
    country: 'GB',
    flag: '🇬🇧',
    rating: 4,
    text: 'Third time using it this week — matched twice and met once. The vibe is totally different to Tinder. People are actually there and ready to meet. Love the Out Later feature for planning weekends.',
    activityType: 'hangout',
    verified: false,
    timeAgo: '3 days ago',
  },
  {
    id: 'r5',
    displayName: 'Sophie R.',
    emoji: '🌸',
    age: 24,
    area: 'Brixton, London',
    country: 'GB',
    flag: '🇬🇧',
    rating: 5,
    text: 'The 10-minute chat window is genius. Forces you to actually go meet them instead of chatting forever. Went on two spontaneous dates this month.',
    activityType: 'drinks',
    verified: true,
    timeAgo: '5 days ago',
  },
]

export const DEMO_CENTER = { lat: BASE_LAT, lng: BASE_LNG }

// Chat statuses:
//  'unlocked' — both paid, full chat open
//  'locked'   — I received a message but haven't paid to read/reply
//  'pending'  — I sent my free first message, waiting for them to unlock
//  'free'     — no messages yet, I can send 1 free message
export const DEMO_CONVERSATIONS = [
  {
    id: 'conv-1',
    userId: 'demo-user-1',
    displayName: 'Jordan',
    emoji: '😎',
    age: 29,
    online: true,
    status: 'unlocked',
    openedAt: now - 4 * 60 * 1000,
    unlockedAt: now - 4 * 60 * 1000,
    lastMessage: 'Which bar are you at now?',
    lastMessageTime: now - 5 * 60 * 1000,
    unread: 1,
    messages: [
      { id: 'm1', fromMe: false, text: 'Hey! Saw you were out in Soho 👋', time: now - 25 * 60 * 1000 },
      { id: 'm2', fromMe: true,  text: 'Yeah! At The Slug & Lettuce', time: now - 22 * 60 * 1000 },
      { id: 'm3', fromMe: false, text: "Nice, I'm nearby. Which bar are you at now?", time: now - 5 * 60 * 1000 },
    ],
  },
  {
    id: 'conv-2',
    userId: 'demo-user-2',
    displayName: 'Ava',
    emoji: '😊',
    age: 26,
    online: true,
    status: 'locked',
    lastMessage: '🔒 Unlock to read',
    lastMessageTime: now - 18 * 60 * 1000,
    unread: 1,
    messages: [],
  },
  {
    id: 'conv-3',
    userId: 'demo-user-3',
    displayName: 'Kai',
    emoji: '🤙',
    age: 28,
    online: false,
    status: 'pending',
    lastMessage: 'You around Dalston tonight?',
    lastMessageTime: now - 45 * 60 * 1000,
    unread: 0,
    messages: [
      { id: 'm1', fromMe: true, text: 'You around Dalston tonight?', time: now - 45 * 60 * 1000 },
    ],
  },
  {
    id: 'conv-4',
    userId: 'demo-user-4',
    displayName: 'Sofia',
    emoji: '✨',
    age: 23,
    online: true,
    status: 'free',
    lastMessage: null,
    lastMessageTime: null,
    unread: 0,
    messages: [],
  },
]

export const DEMO_MATCH_PROFILES = [
  {
    id: 'p1', displayName: 'Sarah', age: 29, emoji: '😊', gender: 'Woman',
    online: true, distanceKm: 2.1, readyToMeet: true, verified: true,
    tagline: 'Coffee and a good walk? Yes please.',
    area: 'Soho', lookingFor: 'Date', availability: 'Tonight',
    meetSpeed: 'Meet now', firstMeet: ['Coffee', 'Walk'],
    responseTime: '< 5 min', liked: false,
  },
  {
    id: 'p2', displayName: 'Marcus', age: 31, emoji: '😎', gender: 'Man',
    online: true, distanceKm: 0.8, readyToMeet: true, verified: true,
    tagline: 'Free this evening. Drinks?',
    area: 'Shoreditch', lookingFor: 'Meet now', availability: 'Tonight',
    meetSpeed: 'Meet now', firstMeet: ['Drinks', 'Dinner'],
    responseTime: '< 10 min', liked: false,
  },
  {
    id: 'p3', displayName: 'Zoe', age: 25, emoji: '🌸', gender: 'Woman',
    online: false, distanceKm: 3.4, readyToMeet: false, verified: false,
    tagline: 'Let\'s find the best coffee spot.',
    area: 'Camden', lookingFor: 'Chat', availability: 'Today',
    meetSpeed: 'Today', firstMeet: ['Coffee'],
    responseTime: '~30 min', liked: false,
  },
  {
    id: 'p4', displayName: 'Kai', age: 27, emoji: '🤙', gender: 'Man',
    online: true, distanceKm: 1.2, readyToMeet: true, verified: true,
    tagline: 'Spontaneous plans only.',
    area: 'Dalston', lookingFor: 'Meet now', availability: 'Tonight',
    meetSpeed: 'Meet now', firstMeet: ['Drinks', 'Walk'],
    responseTime: '< 5 min', liked: false,
  },
  {
    id: 'p5', displayName: 'Priya', age: 26, emoji: '✨', gender: 'Woman',
    online: true, distanceKm: 4.7, readyToMeet: false, verified: true,
    tagline: 'Art, food, good conversation.',
    area: 'Notting Hill', lookingFor: 'Date', availability: 'Weekend',
    meetSpeed: 'This week', firstMeet: ['Dinner', 'Coffee'],
    responseTime: '~1 hr', liked: false,
  },
  {
    id: 'p6', displayName: 'Finn', age: 30, emoji: '🎯', gender: 'Man',
    online: false, distanceKm: 2.9, readyToMeet: true, verified: false,
    tagline: 'Drinks after work — who\'s in?',
    area: 'Brixton', lookingFor: 'Chat', availability: 'Tonight',
    meetSpeed: 'Today', firstMeet: ['Drinks'],
    responseTime: '~20 min', liked: false,
  },
]

// Venue group chat demo messages — keyed by venueId
export const DEMO_VENUE_MESSAGES = {
  'venue-soho-bar': [
    { id: 'vm-1', userId: 'demo-user-1', displayName: 'Jordan', text: "Just got here — it's absolutely packed tonight 🔥", createdAt: now - 18 * 60 * 1000 },
    { id: 'vm-2', userId: 'demo-user-2', displayName: 'Mia',    text: "Same! Grabbed a table near the back 👋", createdAt: now - 15 * 60 * 1000 },
    { id: 'vm-3', userId: 'demo-user-6', displayName: 'Leo',    text: "On my way — 5 mins out", createdAt: now - 12 * 60 * 1000 },
    { id: 'vm-4', userId: 'demo-user-2', displayName: 'Mia',    text: "Live band just started, vibes are unreal 🎶", createdAt: now - 8 * 60 * 1000 },
    { id: 'vm-5', userId: 'demo-user-6', displayName: 'Leo',    text: "Here now — bar is crazy busy, getting drinks first", createdAt: now - 4 * 60 * 1000 },
    { id: 'vm-6', userId: 'demo-user-1', displayName: 'Jordan', text: "Someone save us a spot 😂", createdAt: now - 2 * 60 * 1000 },
  ],
  'venue-fitz-bistro': [
    { id: 'vm-7', userId: 'demo-user-3', displayName: 'Raf', text: "Wine is excellent tonight — 2 for 1 still on 🍷", createdAt: now - 20 * 60 * 1000 },
    { id: 'vm-8', userId: 'demo-user-3', displayName: 'Raf', text: "Anyone else coming here tonight?", createdAt: now - 6 * 60 * 1000 },
  ],
}

// Ephemeral moments — disappear after 6 hours
// In demo, gradient + emoji replace real photos
export const DEMO_MOMENTS = [
  {
    id: 'moment-1',
    userId: 'demo-user-2',
    displayName: 'Mia',
    sessionId: 'demo-session-2',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    emoji: '🍸',
    caption: 'Best spot in Soho tonight — come find me 🔥',
    createdAt: now - 25 * 60 * 1000,
    expiresAt: now + 5.6 * 60 * 60 * 1000,
  },
  {
    id: 'moment-2',
    userId: 'demo-user-1',
    displayName: 'Jordan',
    sessionId: 'demo-session-1',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    emoji: '🎶',
    caption: 'Live music just started here — absolute vibes',
    createdAt: now - 10 * 60 * 1000,
    expiresAt: now + 5.8 * 60 * 60 * 1000,
  },
  {
    id: 'moment-3',
    userId: 'demo-user-3',
    displayName: 'Raf',
    sessionId: 'demo-session-3',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    emoji: '🍝',
    caption: 'This pasta is unreal. Someone come eat with me',
    createdAt: now - 40 * 60 * 1000,
    expiresAt: now + 5.3 * 60 * 60 * 1000,
  },
  {
    id: 'moment-4',
    userId: 'demo-user-5',
    displayName: 'Priya',
    sessionId: 'demo-session-5',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    emoji: '🌙',
    caption: 'Perfect evening for a walk — who else is out?',
    createdAt: now - 55 * 60 * 1000,
    expiresAt: now + 5.1 * 60 * 60 * 1000,
  },
  {
    id: 'moment-5',
    userId: 'demo-user-6',
    displayName: 'Leo',
    sessionId: 'demo-session-6',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    emoji: '🎯',
    caption: "Rooftop bar just opened back up — it's packed tonight",
    createdAt: now - 5 * 60 * 1000,
    expiresAt: now + 5.9 * 60 * 60 * 1000,
  },
]

export const DEMO_LIKED_USERS = [
  { id: 'like-1', displayName: 'Ava',    age: 26, online: true,  emoji: '😊', activityType: 'drinks',  area: 'Soho',         viewCount: 7,  tagline: 'Up for anything tonight 🍸',      likedAt: now - 2 * 60 * 60 * 1000 },
  { id: 'like-2', displayName: 'Marcus', age: 30, online: true,  emoji: '😎', activityType: 'coffee',  area: 'Shoreditch',   viewCount: 12, tagline: 'Coffee first, then we\'ll see 😄', likedAt: now - 5 * 60 * 60 * 1000 },
  { id: 'like-3', displayName: 'Zoe',    age: 24, online: false, emoji: '🌸', activityType: 'food',    area: 'Camden',       viewCount: 3,  tagline: 'Foodie looking for a partner in crime', likedAt: now - 1 * 24 * 60 * 60 * 1000 },
  { id: 'like-4', displayName: 'Kai',    age: 28, online: true,  emoji: '🤙', activityType: 'hangout', area: 'Dalston',      viewCount: 9,  tagline: 'Spontaneous plans only.',          likedAt: now - 3 * 60 * 60 * 1000 },
  { id: 'like-5', displayName: 'Sofia',  age: 23, online: false, emoji: '✨', activityType: 'walk',    area: 'Notting Hill', viewCount: 5,  tagline: 'Art, walks, good vibes ✨',        likedAt: now - 2 * 24 * 60 * 60 * 1000 },
  { id: 'like-6', displayName: 'Finn',   age: 31, online: true,  emoji: '🎯', activityType: 'drinks',  area: 'Brixton',      viewCount: 14, tagline: 'Drinks after work — who\'s in?',   likedAt: now - 30 * 60 * 1000 },
]

// ─────────────────────────────────────────────────────────────────────────────
// DEMO_CATEGORY_SESSIONS
// One showcase profile per category — used to preview every card layout.
// photoURL slots: swap https://picsum.photos/seed/cat-<slug>/400/500
// with real uploads when images are provided.
// All sessions: status = 'invite_out', isSeeded = true, city = London.
// ─────────────────────────────────────────────────────────────────────────────

// Small London coordinate offsets so each pin lands in a different spot
const _LDN = (dlat, dlng) => ({
  lat: 51.5074 + dlat, lng: -0.1278 + dlng,
  fuzzedLat: 51.5074 + dlat + 0.002, fuzzedLng: -0.1278 + dlng + 0.002,
})

