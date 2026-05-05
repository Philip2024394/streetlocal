// Firestore collection path constants
export const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  OTW_REQUESTS: 'otwRequests',
  INTERESTS: 'interests',        // mutual like/invite docs
  VENUE_UNLOCKS: 'venueUnlocks',
  REPORTS: 'reports',
  BLOCKS: 'blocks',
}

// Sub-collection paths
export const BLOCKS_SUB = (userId) => `blocks/${userId}/blockedUsers`

// Interest doc ID format: {fromUserId}_{toUserId}_{sessionId}
export const interestId = (fromUid, toUid, sessionId) =>
  `${fromUid}_${toUid}_${sessionId}`

// Venue unlock doc ID format: {buyerUserId}_{sessionId}
export const unlockId = (buyerUid, sessionId) =>
  `${buyerUid}_${sessionId}`

// OTW Request statuses
export const OTW_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  PAID: 'paid',
  PROCEEDING: 'proceeding',
  COMPLETED: 'completed',
}

// Interest / mutual invite statuses
export const INTEREST_STATUS = {
  PENDING: 'pending',   // one side expressed interest
  MUTUAL: 'mutual',     // both sides matched
}

// Session statuses
export const SESSION_STATUS = {
  INVITE_OUT: 'invite_out', // wants to go out — yellow, visible on map
  ACTIVE: 'active',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired',
  ENDED: 'ended',
}

// ─── Activity categories ───────────────────────────────────────────────────

export const ACTIVITY_CATEGORIES = [
  { id: 'night_out',    label: 'Night Out',          emoji: '🌙' },
  { id: 'food_drink',   label: 'Food & Drink',       emoji: '🍽️' },
  { id: 'music',        label: 'Music & Gigs',       emoji: '🎵' },
  { id: 'arts',         label: 'Arts & Creative',    emoji: '🎨' },
  { id: 'active',       label: 'Active & Sport',     emoji: '🏃' },
  { id: 'culture',      label: 'Culture & Events',   emoji: '🎭' },
  { id: 'tech',         label: 'Tech & Gaming',      emoji: '💻' },
  { id: 'social',       label: 'Social & Friends',   emoji: '👥' },
  { id: 'family',       label: 'Family & Kids',      emoji: '👨‍👩‍👧' },
  { id: 'travel',       label: 'Travel & Explore',   emoji: '✈️' },
  { id: 'professional', label: 'Career & Business',  emoji: '💼' },
  { id: 'learning',     label: 'Learning & Skills',  emoji: '📚' },
  { id: 'community',    label: 'Community & Causes', emoji: '🤝' },
  { id: 'wellness',     label: 'Sober & Wellness',   emoji: '🧘' },
  { id: 'property',     label: 'Property & Rentals', emoji: '🏠' },
  { id: 'handmade',     label: 'Handmade & Makers',  emoji: '🧵' },
]

// ─── Activity image assets ─────────────────────────────────────────────────

const COFFEE_IMG    = 'https://ik.imagekit.io/dateme/Untitledsdff-removebg-preview.png'
const DRINKS_IMG    = 'https://ik.imagekit.io/dateme/Untitleddsdddd-removebg-preview%20(1).png'
const FOOD_IMG      = 'https://ik.imagekit.io/dateme/Untitledvv-removebg-preview.png'
const GYM_IMG       = 'https://ik.imagekit.io/nepgaxllc/Untitleddssss-removebg-preview.png'
const ART_IMG       = 'https://ik.imagekit.io/nepgaxllc/Untitledffff-removebg-preview.png'
const SHOPPING_IMG  = 'https://ik.imagekit.io/nepgaxllc/Untitleddfsdfsddd-removebg-preview.png'
const WALKING_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitleddsfasdfsdf-removebg-preview.png'
const CYCLING_IMG   = 'https://ik.imagekit.io/nepgaxllc/dddd-removebg-preview.png'
const SWIMMING_IMG  = 'https://ik.imagekit.io/nepgaxllc/Untitledfdsdf-removebg-preview.png'
const HIKING_IMG    = 'https://ik.imagekit.io/nepgaxllc/Untitleddsdsd-removebg-preview.png'
const YOGA_IMG      = 'https://ik.imagekit.io/nepgaxllc/Untitledasdasdasda-removebg-preview.png'
const TENNIS_IMG    = 'https://ik.imagekit.io/nepgaxllc/Untitledfdsfdf-removebg-preview.png'
const RUNNING_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitleddfsdfsdfsdf-removebg-preview.png'
const TRAVEL_IMG    = 'https://ik.imagekit.io/nepgaxllc/Untitledfsdfsdfsdf-removebg-preview.png'
const KARAOKE_IMG   = 'https://ik.imagekit.io/nepgaxllc/aa-removebg-preview.png'
const HANGOUT_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitleddsfsdfds-removebg-preview.png'
const BEACH_IMG     = 'https://ik.imagekit.io/nepgaxllc/Untitledfdasdfa-removebg-preview.png'
const TICKETS_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitledgsdfgsd-removebg-preview.png'
const WINE_IMG      = 'https://ik.imagekit.io/nepgaxllc/Untitleddasda-removebg-preview.png'
const FASTFOOD_IMG  = 'https://ik.imagekit.io/nepgaxllc/Untitledasdasda-removebg-preview.png'
const BOWLING_IMG   = 'https://ik.imagekit.io/nepgaxllc/Untitleddfsdfcc-removebg-preview.png'
const CINEMA_IMG    = 'https://ik.imagekit.io/nepgaxllc/Untitleddsfsdg.png'
const PIZZA_IMG     = 'https://ik.imagekit.io/nepgaxllc/Untitleddfsdfdsdfsd-removebg-preview.png'
const COCKTAILS_IMG = 'https://ik.imagekit.io/nepgaxllc/Untitledcocktail-removebg-preview.png'

// ─── Activity types (with category) ───────────────────────────────────────

export const ACTIVITY_TYPES = [
  // Night Out
  { id: 'drinks',       label: 'Drinks',         emoji: '🍺', img: DRINKS_IMG,    category: 'night_out' },
  { id: 'cocktails',    label: 'Cocktails',       emoji: '🍸', img: COCKTAILS_IMG, category: 'night_out' },
  { id: 'wine',         label: 'Wine',            emoji: '🍷', img: WINE_IMG,      category: 'night_out' },
  { id: 'karaoke',      label: 'Karaoke',         emoji: '🎤', img: KARAOKE_IMG,   category: 'night_out' },
  { id: 'dancing',      label: 'Dancing',         emoji: '💃',                     category: 'night_out' },
  { id: 'afterparty',   label: 'After Party',     emoji: '🎉',                     category: 'night_out' },
  { id: 'rooftop',      label: 'Rooftop Bar',     emoji: '🌃',                     category: 'night_out' },

  // Food & Drink
  { id: 'coffee',       label: 'Coffee',          emoji: '☕', img: COFFEE_IMG,    category: 'food_drink' },
  { id: 'food',         label: 'Food',            emoji: '🍕', img: FOOD_IMG,      category: 'food_drink' },
  { id: 'pizza',        label: 'Pizza',           emoji: '🍕', img: PIZZA_IMG,     category: 'food_drink' },
  { id: 'fastfood',     label: 'Fast Food',       emoji: '🍔', img: FASTFOOD_IMG,  category: 'food_drink' },
  { id: 'brunch',       label: 'Brunch',          emoji: '🥂',                     category: 'food_drink' },
  { id: 'sushi',        label: 'Sushi',           emoji: '🍣',                     category: 'food_drink' },
  { id: 'dinner',       label: 'Dinner',          emoji: '🍽️',                    category: 'food_drink' },
  { id: 'cooking_class',label: 'Cooking Class',   emoji: '👨‍🍳',                   category: 'food_drink' },
  { id: 'wine_tasting', label: 'Wine Tasting',    emoji: '🍷',                     category: 'food_drink' },
  { id: 'food_tour',    label: 'Food Tour',       emoji: '🗺️',                    category: 'food_drink' },
  { id: 'street_food',  label: 'Street Food',     emoji: '🌮',                     category: 'food_drink' },
  { id: 'pop_up',       label: 'Pop-Up Dining',   emoji: '🍴',                     category: 'food_drink' },

  // Active & Sport
  { id: 'walk',         label: 'Walk',            emoji: '🚶', img: WALKING_IMG,   category: 'active' },
  { id: 'running',      label: 'Running',         emoji: '🏃', img: RUNNING_IMG,   category: 'active' },
  { id: 'cycling',      label: 'Cycling',         emoji: '🚴', img: CYCLING_IMG,   category: 'active' },
  { id: 'gym',          label: 'Gym',             emoji: '🏋️', img: GYM_IMG,      category: 'active' },
  { id: 'tennis',       label: 'Tennis',          emoji: '🎾', img: TENNIS_IMG,    category: 'active' },
  { id: 'swimming',     label: 'Swimming',        emoji: '🏊', img: SWIMMING_IMG,  category: 'active' },
  { id: 'hiking',       label: 'Hiking',          emoji: '🥾', img: HIKING_IMG,    category: 'active' },
  { id: 'football',     label: 'Football',        emoji: '⚽',                     category: 'active' },
  { id: 'basketball',   label: 'Basketball',      emoji: '🏀',                     category: 'active' },
  { id: 'padel',        label: 'Padel',           emoji: '🏓',                     category: 'active' },
  { id: 'rugby',        label: 'Rugby',           emoji: '🏉',                     category: 'active' },
  { id: 'cricket',      label: 'Cricket',         emoji: '🏏',                     category: 'active' },
  { id: 'volleyball',   label: 'Volleyball',      emoji: '🏐',                     category: 'active' },
  { id: 'golf',         label: 'Golf',            emoji: '⛳',                     category: 'active' },
  { id: 'martial_arts', label: 'Martial Arts',    emoji: '🥋',                     category: 'active' },
  { id: 'climbing',     label: 'Climbing',        emoji: '🧗',                     category: 'active' },
  { id: 'skiing',       label: 'Skiing',          emoji: '⛷️',                    category: 'active' },

  // Music & Gigs
  { id: 'live_gig',     label: 'Live Gig',        emoji: '🎸',                     category: 'music' },
  { id: 'open_mic',     label: 'Open Mic Night',  emoji: '🎤',                     category: 'music' },
  { id: 'dj_night',     label: 'DJ Night',        emoji: '🎧',                     category: 'music' },
  { id: 'concert',      label: 'Concert',         emoji: '🎶',                     category: 'music' },
  { id: 'festival',     label: 'Music Festival',  emoji: '🎪',                     category: 'music' },
  { id: 'jazz_night',   label: 'Jazz Night',      emoji: '🎷',                     category: 'music' },
  { id: 'acoustic',     label: 'Acoustic Set',    emoji: '🪕',                     category: 'music' },
  { id: 'rave',         label: 'Rave / Club',     emoji: '🕺',                     category: 'music' },

  // Arts & Creative
  { id: 'art_gallery',  label: 'Art Gallery',     emoji: '🖼️', img: ART_IMG,      category: 'arts' },
  { id: 'photo_walk',   label: 'Photography Walk',emoji: '📷',                     category: 'arts' },
  { id: 'pottery',      label: 'Pottery Class',   emoji: '🏺',                     category: 'arts' },
  { id: 'life_drawing', label: 'Life Drawing',    emoji: '✏️',                    category: 'arts' },
  { id: 'improv',       label: 'Improv / Drama',  emoji: '🎭',                     category: 'arts' },
  { id: 'creative_writ',label: 'Creative Writing',emoji: '✍️',                    category: 'arts' },
  { id: 'street_art',   label: 'Street Art Tour', emoji: '🎨',                     category: 'arts' },
  { id: 'craft',        label: 'Craft Workshop',  emoji: '🧶',                     category: 'arts' },
  { id: 'film_screening',label: 'Film Screening', emoji: '🎞️',                    category: 'arts' },

  // Culture & Events
  { id: 'cinema',       label: 'Cinema',          emoji: '🎬', img: CINEMA_IMG,    category: 'culture' },
  { id: 'tickets',      label: 'Events',          emoji: '🎟️', img: TICKETS_IMG,  category: 'culture' },
  { id: 'theatre',      label: 'Theatre',         emoji: '🎭',                     category: 'culture' },
  { id: 'museum',       label: 'Museum',          emoji: '🏛️',                    category: 'culture' },
  { id: 'comedy',       label: 'Comedy Night',    emoji: '😂',                     category: 'culture' },
  { id: 'exhibition',   label: 'Exhibition',      emoji: '🗿',                     category: 'culture' },
  { id: 'spoken_word',  label: 'Spoken Word',     emoji: '🗣️',                    category: 'culture' },
  { id: 'cultural_fest',label: 'Cultural Festival',emoji: '🌍',                   category: 'culture' },

  // Tech & Gaming
  { id: 'hackathon',    label: 'Hackathon',       emoji: '💡',                     category: 'tech' },
  { id: 'tech_meetup',  label: 'Tech Meetup',     emoji: '💻',                     category: 'tech' },
  { id: 'gaming_night', label: 'Gaming Night',    emoji: '🎮',                     category: 'tech' },
  { id: 'esports',      label: 'Esports',         emoji: '🏆',                     category: 'tech' },
  { id: 'vr_experience',label: 'VR Experience',   emoji: '🥽',                     category: 'tech' },
  { id: 'ai_meetup',    label: 'AI & Robotics',   emoji: '🤖',                     category: 'tech' },
  { id: 'crypto',       label: 'Web3 / Crypto',   emoji: '⛓️',                    category: 'tech' },
  { id: 'dev_conf',     label: 'Dev Conference',  emoji: '🖥️',                    category: 'tech' },

  // Social & Friends
  { id: 'hangout',      label: 'Hangout',         emoji: '👥', img: HANGOUT_IMG,   category: 'social' },
  { id: 'bowling',      label: 'Bowling',         emoji: '🎳', img: BOWLING_IMG,   category: 'social' },
  { id: 'shopping',     label: 'Shopping',        emoji: '🛍️', img: SHOPPING_IMG, category: 'social' },
  { id: 'beach',        label: 'Beach',           emoji: '🏖️', img: BEACH_IMG,    category: 'social' },
  { id: 'picnic',       label: 'Picnic',          emoji: '🧺',                     category: 'social' },
  { id: 'board_games',  label: 'Board Games',     emoji: '🎲',                     category: 'social' },
  { id: 'pub_quiz',     label: 'Pub Quiz',        emoji: '🧠',                     category: 'social' },

  // Family & Kids
  { id: 'family_day',    label: 'Family Day Out',  emoji: '👨‍👩‍👧',                   category: 'family' },
  { id: 'kids_play',     label: 'Kids Playdate',   emoji: '🧸',                     category: 'family' },
  { id: 'parent_meet',   label: 'Parent Meetup',   emoji: '👩‍👧',                   category: 'family' },
  { id: 'family_meal',   label: 'Family Meal',     emoji: '🍽️',                    category: 'family' },
  { id: 'park_kids',     label: 'Park & Play',     emoji: '🌳',                     category: 'family' },
  { id: 'family_sports', label: 'Family Sport',    emoji: '⚽',                     category: 'family' },

  // Travel & Explore
  { id: 'travel',       label: 'Travel',          emoji: '✈️', img: TRAVEL_IMG,   category: 'travel' },
  { id: 'day_trip',     label: 'Day Trip',        emoji: '🗺️',                    category: 'travel' },
  { id: 'city_walk',    label: 'City Explore',    emoji: '🌆',                     category: 'travel' },
  { id: 'road_trip',    label: 'Road Trip',       emoji: '🚗',                     category: 'travel' },
  { id: 'backpacking',  label: 'Backpacking',     emoji: '🎒',                     category: 'travel' },

  // Career & Business
  { id: 'networking',   label: 'Networking',      emoji: '🤝',                     category: 'professional' },
  { id: 'coworking',    label: 'Co-working',      emoji: '💻',                     category: 'professional' },
  { id: 'startup',      label: 'Startup Meet',    emoji: '🚀',                     category: 'professional' },
  { id: 'mentoring',    label: 'Mentoring',       emoji: '🎓',                     category: 'professional' },
  { id: 'job_hunting',  label: 'Job Hunting',     emoji: '📋',                     category: 'professional' },
  { id: 'freelance',    label: 'Freelancer Meet', emoji: '🖥️',                    category: 'professional' },
  { id: 'industry_meet',label: 'Industry Meet',   emoji: '🏢',                     category: 'professional' },
  { id: 'pitch_night',  label: 'Pitch Night',     emoji: '📊',                     category: 'professional' },

  // Learning & Skills
  { id: 'study_group',  label: 'Study Group',     emoji: '📖',                     category: 'learning' },
  { id: 'lang_exchange',label: 'Language Exchange',emoji: '🗣️',                   category: 'learning' },
  { id: 'skill_share',  label: 'Skill Share',     emoji: '💡',                     category: 'learning' },
  { id: 'coding',       label: 'Coding Meetup',   emoji: '👨‍💻',                   category: 'learning' },
  { id: 'reading',      label: 'Reading Group',   emoji: '📕',                     category: 'learning' },
  { id: 'creative_wksp',label: 'Creative Workshop',emoji: '🎨',                   category: 'learning' },

  // Community & Causes
  { id: 'volunteering', label: 'Volunteering',    emoji: '❤️',                     category: 'community' },
  { id: 'charity',      label: 'Charity Event',   emoji: '🫶',                     category: 'community' },
  { id: 'local_event',  label: 'Local Event',     emoji: '🏘️',                    category: 'community' },
  { id: 'activism',     label: 'Activism',        emoji: '✊',                     category: 'community' },
  { id: 'faith_group',  label: 'Faith & Belief',  emoji: '🕊️',                    category: 'community' },
  { id: 'environment',  label: 'Environment',     emoji: '🌱',                     category: 'community' },

  // Handmade & Makers
  { id: 'sewing',         label: 'Sewing',              emoji: '🧵', category: 'handmade' },
  { id: 'handbags',       label: 'Handbags & Bags',     emoji: '👜', category: 'handmade' },
  { id: 'jewellery',      label: 'Jewellery Making',    emoji: '💍', category: 'handmade' },
  { id: 'knitting',       label: 'Knitting & Crochet',  emoji: '🧶', category: 'handmade' },
  { id: 'candle_making',  label: 'Candle Making',       emoji: '🕯️', category: 'handmade' },
  { id: 'embroidery',     label: 'Embroidery',          emoji: '🪡', category: 'handmade' },
  { id: 'leatherwork',    label: 'Leatherwork',         emoji: '🧳', category: 'handmade' },
  { id: 'upcycling',      label: 'Upcycling & DIY',     emoji: '♻️', category: 'handmade' },
  { id: 'printmaking',    label: 'Print & Screen Print',emoji: '🖨️', category: 'handmade' },
  { id: 'makers_market',  label: 'Makers Market',       emoji: '🏪', category: 'handmade' },
  { id: 'fashion_design', label: 'Fashion Design',      emoji: '👗', category: 'handmade' },
  { id: 'dress_making',   label: 'Dress Making',         emoji: '🪡', category: 'handmade' },
  { id: 'textile_art',    label: 'Textile Art',         emoji: '🎨', category: 'handmade' },

  // Property & Rentals
  { id: 'property_viewing', label: 'Property Viewing',   emoji: '🏠', category: 'property' },
  { id: 'open_house',       label: 'Open House',         emoji: '🚪', category: 'property' },
  { id: 'rental_search',    label: 'Rental Search',      emoji: '🔑', category: 'property' },
  { id: 'flatmate_search',  label: 'Flatmate Search',    emoji: '🛋️', category: 'property' },
  { id: 'property_invest',  label: 'Property Investment',emoji: '📈', category: 'property' },
  { id: 'landlord_meet',    label: 'Landlord Meetup',    emoji: '🤝', category: 'property' },
  { id: 'first_buyer',      label: 'First Time Buyer',   emoji: '🏡', category: 'property' },
  { id: 'property_network', label: 'Property Networking',emoji: '💼', category: 'property' },
  { id: 'moving_day',       label: 'Moving Day Help',    emoji: '📦', category: 'property' },
  { id: 'interior_design',  label: 'Interior Design',    emoji: '🛏️', category: 'property' },

  // Sober & Wellness
  { id: 'yoga',         label: 'Yoga',            emoji: '🧘', img: YOGA_IMG,      category: 'wellness' },
  { id: 'meditation',   label: 'Meditation',      emoji: '🕯️',                    category: 'wellness' },
  { id: 'spa',          label: 'Spa Day',         emoji: '🛁',                     category: 'wellness' },
  { id: 'book_club',    label: 'Book Club',       emoji: '📚',                     category: 'wellness' },
  { id: 'journaling',   label: 'Journaling',      emoji: '📓',                     category: 'wellness' },
  { id: 'sober_social', label: 'Sober Social',    emoji: '🫖',                     category: 'wellness' },

]

export const activityEmoji = (activityId) =>
  ACTIVITY_TYPES.find(a => a.id === activityId)?.emoji ?? '📍'

export const activityImage = (activityId) =>
  ACTIVITY_TYPES.find(a => a.id === activityId)?.img ?? null
