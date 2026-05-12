// Indoo brand quotes — shown on no-photo profile cards
// Social outing focused — not dating

export const BRAND_QUOTES = [
  // Going out
  "The best nights start with a plan. Tonight's yours.",
  "Your city is out. Are you?",
  "Good things happen when you leave the house.",
  "Every outing is a story waiting to happen.",
  "Stop scrolling. Start going.",
  "Tonight could be one of those nights.",
  "Your next great memory starts outside.",
  "The best people are already out there.",
  "Get out. See who's waiting.",
  "Real life happens away from the screen.",
  "Tonight has potential. Use it.",
  "The city doesn't sleep, why should you?",
  "Someone nearby is hoping you'll show up.",
  "The best plans are made last minute.",
  "What are you waiting for — everyone's out.",
  "Great evenings don't plan themselves.",
  "Step outside. See what happens.",
  "Your crew is out there. Go find them.",
  "Tonight's vibe is whatever you make it.",
  "Adventure starts the moment you decide to go.",

  // Connection & people
  "The best conversations happen face to face.",
  "People are more interesting in person.",
  "Your next friend could be around the corner.",
  "Every stranger is someone you haven't met yet.",
  "Great connections start with showing up.",
  "The right people find each other when they get out.",
  "Someone nearby shares your interests.",
  "Real conversations beat notifications every time.",
  "The people worth knowing are already out.",
  "Go where the energy is.",
  "You're one outing away from a great connection.",
  "The right person could be at the same place tonight.",
  "People remember the nights they said yes.",
  "Say yes to tonight. You won't regret it.",
  "Meet someone worth remembering.",
  "Your next great friendship starts with a hello.",
  "Real memories are made with real people.",
  "Everyone out there tonight has a story.",
  "Connection happens when you show up.",
  "Be the person someone's glad they met tonight.",

  // Fun & spontaneous
  "Spontaneous nights become the best stories.",
  "Good vibes only — and they're out there.",
  "Tonight has no script. That's the point.",
  "The best nights need no planning.",
  "Life is too short to stay in on a good night.",
  "Go out. Laugh. Come back with stories.",
  "Fun doesn't come to you. You go to it.",
  "Some of the best nights were unplanned.",
  "Your comfort zone is boring. Step outside it.",
  "No regrets start with going out.",
  "Tonight's energy is contagious. Catch it.",
  "The night is yours — own it.",
  "Out there beats in here every time.",
  "Make tonight a story worth telling.",
  "The best version of tonight hasn't happened yet.",
  "Be someone else's favourite part of their evening.",
  "Good nights are made, not waited for.",
  "Show up. See what happens. Repeat.",
  "Tonight could surprise you.",
  "Go out. You can sleep when it rains.",

  // Community & social
  "Your city is full of people like you.",
  "Every neighbourhood has its crowd. Find yours.",
  "Good places attract good people.",
  "The community you want is already out there.",
  "Be where the good energy is.",
  "Your kind of people are closer than you think.",
  "Find your crowd. Start tonight.",
  "Everyone's looking for the same thing — good company.",
  "The best groups don't form online. They form out.",
  "Out there is where community happens.",

  // Career & ambition
  "The right conversation can change your career.",
  "Opportunities don't come to people who stay home.",
  "Your next collaboration could be at the same venue tonight.",
  "Ideas spark faster in person.",
  "The best networks are built face to face.",
  "Go where the movers and makers are.",
  "Your next big thing could start tonight.",
  "Show up where things happen.",

  // Family & wellbeing
  "Good days out become great family memories.",
  "The best wellness plan starts with getting outside.",
  "A good outing clears the mind like nothing else.",
  "Time outside is never wasted.",
  "Fresh air, good people, great evening.",
  "The best therapy is a good night out with friends.",
]

// Deterministic quote per user — consistent every render
export function quoteForUser(nameOrId) {
  const key = nameOrId ?? 'anon'
  const code = [...key].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return BRAND_QUOTES[code % BRAND_QUOTES.length]
}

// Module-level shuffled queue for rotation display (bio picker, carousels)
let _queue = []
function _refill() {
  const a = [...BRAND_QUOTES]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  _queue = a
}

export function nextBrandQuote() {
  if (_queue.length === 0) _refill()
  return _queue.pop()
}
