import { supabase } from '@/lib/supabase'
import { notifyDateInvite, notifyDateAccepted } from './notificationService'

export const DATE_IDEAS = [
  // ── Cultural Experiences ──────────────────────────────────────────────────
  {
    id: 'di1',
    title: 'Live Music',
    description: 'Live music makes a first date feel relaxed and natural. It eases pressure by filling silences and offering shared moments. Conversation flows more easily with music as a backdrop, helping both people connect without forced talk or awkward pauses.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfddfgsdfgasdasdasdasdasdasdasdasddsfasdasdasdasdasdsadasadfasd.png?updatedAt=1775543616817',
    section: 'culture',
    popularity: 312,
  },
  {
    id: 'di2',
    title: 'Batik Workshop',
    description: 'A batik date offers a calm and creative first meeting. The hands-on activity helps ease nerves while giving you both something to focus on. Conversation flows naturally as you design and share ideas. It feels relaxed, meaningful, and personal, making it easier to connect without pressure or awkward silence.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfddfgsdfgasdasdasdasdasdasdasdasddsfasdasdasdasdasdsada.png?updatedAt=1775543521658',
    section: 'culture',
    popularity: 278,
  },
  {
    id: 'di7',
    title: 'Traditional Music',
    description: 'A traditional Indonesian music date offers a calm, cultural, and immersive experience. Listening to sounds like Gamelan creates a soothing atmosphere where conversation feels natural and unforced. The unique rhythms and instruments give you both something to share and talk about. The setting feels meaningful and different from typical dates, helping both people relax while experiencing something rich in culture.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfddfgsdfgasdasdasdasd.png?updatedAt=1775542514855',
    section: 'culture',
    popularity: 194,
  },
  {
    id: 'di24',
    title: 'Art Museum',
    description: 'An art museum date offers a calm, inspiring, and thoughtful way to connect. Visiting an art museum creates a quiet atmosphere where conversation feels natural and unforced. Walking through exhibits gives you both endless things to observe and discuss. Sharing opinions on paintings and styles helps reveal personality and perspective in a relaxed way.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsd.png?updatedAt=1775540420687',
    section: 'culture',
    popularity: 233,
  },
  {
    id: 'di9',
    title: 'Cooking Class',
    description: 'An Indonesian cooking class date offers a warm, hands-on way to connect. Preparing dishes like Nasi Goreng or Satay creates a relaxed setting where conversation flows naturally. Working together in the kitchen builds teamwork and shared moments. It\'s interactive, fun, and meaningful, making it easy to bond without pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfddfgsdfg.png?updatedAt=1775542252839',
    section: 'culture',
    popularity: 261,
  },
  {
    id: 'di10',
    title: 'Library',
    description: 'A library date offers a quiet and thoughtful way to connect. Spending time in a library creates a calm atmosphere where conversation feels natural and unforced. Browsing books together gives you easy topics to share and discover each other\'s interests. The quiet setting removes pressure, allowing small conversations and comfortable silence to exist side by side.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdassdasdasdasdasdasdsaasasdasdasdasdasdasdasdasdasdasd.png?updatedAt=1775541811710',
    section: 'culture',
    popularity: 148,
  },
  // ── Outdoor & Adventure ───────────────────────────────────────────────────
  {
    id: 'di40',
    title: 'Beach Sunset',
    description: 'A sunset beach date is pure magic. Walk along the shore as the sky turns golden, listen to the waves, and enjoy a calm, romantic atmosphere. It\'s the perfect moment to relax, talk, and connect while watching the sun dip below the horizon together.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsd.png?updatedAt=1775538946625',
    section: 'outdoor',
    popularity: 356,
  },
  {
    id: 'di30',
    title: 'Sunset',
    description: 'A sunset date offers a calm, romantic, and naturally beautiful way to connect. Watching the sun go down at a sunset viewpoint creates a peaceful atmosphere where conversation feels effortless and genuine. The changing colors and quiet moments help both people relax and be present. It\'s a simple yet powerful setting that encourages a deeper, more meaningful connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasdasdasadasdsdsdadsasdasddssadasdasd.png?updatedAt=1775540132004',
    section: 'outdoor',
    popularity: 341,
  },
  {
    id: 'di17',
    title: 'Moon Viewing',
    description: 'A moonlight beach date offers a calm, romantic, and unforgettable way to connect. Sitting by the beach under the glow of the moon creates a peaceful atmosphere where conversation feels natural and unforced. The sound of waves helps ease nerves and set a gentle rhythm. The quiet setting allows both people to relax, share thoughts, and enjoy meaningful moments together.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdassdasdasdasdasdasdsaas.png?updatedAt=1775541351292',
    section: 'outdoor',
    popularity: 318,
  },
  {
    id: 'di39',
    title: 'Hiking',
    description: 'A hiking date is a perfect blend of adventure and connection. Explore scenic trails, enjoy fresh air, and share meaningful conversations along the way. Whether it\'s a gentle walk or a challenging climb, it creates memorable moments and a natural bond in a peaceful outdoor setting.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasd.png?updatedAt=1775539117814',
    section: 'outdoor',
    popularity: 308,
  },
  {
    id: 'di21',
    title: 'Beach BBQ',
    description: 'A beach barbecue date offers a relaxed, fun, and slightly adventurous way to connect. Setting up by the beach and cooking together creates a casual atmosphere where conversation flows naturally. The mix of food, fresh air, and ocean sounds helps both people feel at ease. Sharing simple moments — grilling, laughing, and watching the sunset — builds a warm and genuine connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdas.png?updatedAt=1775540950615',
    section: 'outdoor',
    popularity: 296,
  },
  {
    id: 'di37',
    title: 'Jeep Tour',
    description: 'A jeep tour date is the perfect mix of adventure and connection. Cruise through scenic landscapes, feel the fresh air, and share real moments away from crowded places. It\'s exciting, relaxed, and gives you plenty to talk about while creating unforgettable memories together.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasd.png?updatedAt=1775539254513',
    section: 'outdoor',
    popularity: 285,
  },
  {
    id: 'di18',
    title: 'Traditional Festival',
    description: 'A traditional Indonesian festival date offers a vibrant and cultural way to connect. Experiencing events like Bali Arts Festival or Sekaten creates a lively atmosphere filled with music, food, and local traditions. The energy of the crowd and shared experiences — like trying street food or watching performances — make conversation flow naturally.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdassdasdasdasdasdasd.png?updatedAt=1775541174025',
    section: 'outdoor',
    popularity: 274,
  },
  {
    id: 'di29',
    title: 'Park Walk',
    description: 'A park walk date offers a calm and refreshing way to connect. Walking through a park creates a peaceful atmosphere where conversation flows naturally. The open space and fresh air help both people relax and feel at ease. Sharing simple moments — like strolling, sitting, or enjoying nature — makes the experience feel effortless. It\'s a gentle and meaningful way to build a genuine connection without pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasdasdasadasdsdsdadsasdasddssadasdasdsd.png?updatedAt=1775540175514',
    section: 'outdoor',
    popularity: 258,
  },
  {
    id: 'di3',
    title: 'Traditional Market',
    description: 'A traditional market date feels lively, relaxed, and full of discovery. Walking through stalls gives you both things to see, taste, and talk about, making conversation flow naturally. The casual setting removes pressure, while shared moments — like trying street food or picking items — create an easy, genuine connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfddfgsdfgasdasdasdasdasdasdasdasddsfasdasdasdasdasd.png?updatedAt=1775543407394',
    section: 'outdoor',
    popularity: 256,
  },
  {
    id: 'di23',
    title: 'Surfing',
    description: 'A surfing date offers an exciting and refreshing way to connect. Riding waves together creates a shared sense of adventure that helps break the ice naturally. The ocean setting brings a relaxed vibe, making both people feel free and present. Between waves, conversation flows easily as you share laughs, challenges, and small wins. It\'s an energetic yet laid-back experience that builds a genuine and memorable connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSD.png?updatedAt=1775540755541',
    section: 'outdoor',
    popularity: 247,
  },
  {
    id: 'di13',
    title: 'Waterfall',
    description: 'A waterfall date offers a peaceful and refreshing way to connect. Visiting a waterfall creates a calming atmosphere with the sound of flowing water helping ease nerves. The natural beauty gives you both something to enjoy together without pressure. Walking, exploring, and sharing the moment makes conversation feel natural and effortless.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdassdasdasdasdasdasdsaasasdasdasdasdasdasd.png?updatedAt=1775541662083',
    section: 'outdoor',
    popularity: 231,
  },
  {
    id: 'di20',
    title: 'Nature Walk',
    description: 'A wildlife nature walk date offers a calm and refreshing way to connect. Exploring a nature trail together creates a peaceful setting where conversation flows naturally. Surrounded by greenery and wildlife, both people can relax and enjoy the moment. The shared experience of spotting animals, listening to nature, and walking side by side builds a gentle, genuine connection without pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdassdasd.png?updatedAt=1775541025566',
    section: 'outdoor',
    popularity: 212,
  },
  {
    id: 'di26',
    title: 'Zoo',
    description: 'A zoo date offers a fun and relaxed way to connect. Visiting a zoo gives you both plenty to see and talk about, making conversation flow naturally. Watching animals together creates light, shared moments that help ease any first-date nerves. The casual setting allows for walking, exploring, and enjoying the experience side by side. It\'s an easygoing and memorable way to build a genuine connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASD.png?updatedAt=1775540527081',
    section: 'outdoor',
    popularity: 204,
  },
  {
    id: 'di12',
    title: 'Dirt Biking',
    description: 'A dirt biking date is adventurous, exciting, and perfect for breaking the ice. Riding through trails creates a shared adrenaline rush that helps both people feel energized and connected. The action keeps things fun while reducing pressure to constantly talk. Between rides, conversation flows easily as you share laughs, challenges, and moments from the experience.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfd.png?updatedAt=1775541862770',
    section: 'outdoor',
    popularity: 198,
  },
  {
    id: 'di22',
    title: 'Kite Flying',
    description: 'A kite flying date offers a fun, light, and carefree way to connect. Flying a kite together creates a playful atmosphere where both people can relax and enjoy the moment. The open space and fresh air make conversation feel easy and natural. Sharing laughs, small challenges, and simple wins builds a genuine connection. It\'s a joyful experience that feels effortless and memorable.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDas.png?updatedAt=1775540868108',
    section: 'outdoor',
    popularity: 181,
  },
  {
    id: 'di11',
    title: 'Golf Course',
    description: 'A golf course date offers a calm and scenic way to connect. Playing gives you plenty of time to talk while enjoying the surroundings. The relaxed pace removes pressure, allowing conversation to flow naturally between shots. It blends light activity with quiet moments, making it easy to build a genuine connection in a peaceful, enjoyable setting.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfd.png?updatedAt=1775542185955',
    section: 'outdoor',
    popularity: 172,
  },
  {
    id: 'di4',
    title: 'Horse Trekking',
    description: 'A horse trekking date in Indonesia offers a peaceful and unique way to connect. Riding through natural landscapes — whether beaches, forests, or hills — creates a calm setting where conversation flows naturally. The shared experience builds trust and comfort, making it easy to bond without pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfddfgsdfgasdasdasdasdasdasdasdasddsfasdasdasd.png?updatedAt=1775543315475',
    section: 'outdoor',
    popularity: 167,
  },
  {
    id: 'di19',
    title: 'Fishing',
    description: 'A traditional fishing date offers a peaceful and authentic way to connect. Trying traditional fishing together creates a calm, slow-paced setting where conversation feels natural and unforced. The quiet surroundings help both people relax and enjoy the moment. Sharing simple tasks like casting nets or waiting for a catch builds teamwork and patience.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdassdasdasdasd.png?updatedAt=1775541081246',
    section: 'outdoor',
    popularity: 163,
  },
  {
    id: 'di5',
    title: 'Sky Diving',
    description: 'A skydiving date is thrilling, unforgettable, and perfect for breaking the ice fast. The shared adrenaline rush creates an instant bond, making both people feel alive and connected. After the jump, conversation flows easily as you relive the experience together, turning nerves into excitement and creating a powerful, memorable first connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfddfgsdfgasdasdasdasdasdasdasdasddsfasd.png?updatedAt=1775543117942',
    section: 'outdoor',
    popularity: 143,
  },
  {
    id: 'di38',
    title: 'Temple Tour',
    description: 'A temple date offers a peaceful and meaningful experience. Walk through beautiful surroundings, take in the history and culture, and enjoy quiet moments together. It\'s a calm, respectful setting that allows for genuine conversation, reflection, and a deeper connection away from distractions.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsada.png?updatedAt=1775539188056',
    section: 'outdoor',
    popularity: 223,
  },
  {
    id: 'di25',
    title: 'Animal Care Day',
    description: 'A wildlife feeding and care date offers a gentle and meaningful way to connect. Interacting with wildlife in a safe environment creates a calm atmosphere where compassion and care come naturally. The shared experience of feeding and looking after animals helps both people feel relaxed and present. It encourages kindness, patience, and teamwork, making conversation flow easily without pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASD.png?updatedAt=1775540564729',
    section: 'outdoor',
    popularity: 176,
  },
  // ── Social & Leisure ──────────────────────────────────────────────────────
  {
    id: 'di27',
    title: 'Clubbing',
    description: 'A clubbing date offers an energetic and exciting way to connect. Going to a nightclub creates a lively atmosphere filled with music, movement, and shared energy. The vibe helps break the ice quickly without the pressure of constant conversation. Dancing, laughing, and enjoying the moment together builds a fun and spontaneous connection. It\'s a bold, social experience that can turn into a memorable night.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqw.png?updatedAt=1775540349462',
    section: 'social',
    popularity: 339,
  },
  {
    id: 'di47',
    title: 'Cinema',
    description: 'A movie night date is cozy, simple, and perfect for relaxing together. Pick a film you both enjoy, share snacks, and unwind in a comfortable setting. It\'s a great way to enjoy quiet moments, spark conversation after, and build a natural connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/coffeedssss.png?updatedAt=1775536992064',
    section: 'social',
    popularity: 341,
  },
  {
    id: 'di46',
    title: 'Karaoke',
    description: 'A karaoke date is fun, lively, and full of personality. Sing your favorite songs, laugh at off-key moments, and enjoy a relaxed, playful vibe. It\'s a great way to break the ice, boost confidence, and create unforgettable memories together.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/coffeedssssss.png?updatedAt=1775537090026',
    section: 'social',
    popularity: 307,
  },
  {
    id: 'di28',
    title: 'Bar Drinks',
    description: 'A bar for drinks date offers a simple and relaxed way to connect. Meeting at a bar creates a comfortable atmosphere where conversation flows naturally. The casual setting helps ease nerves, making it easier to talk and get to know each other. With light music and a laid-back vibe, it allows both people to enjoy the moment without pressure. It\'s an easy, classic choice for building a genuine connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasdasdasadasdsdsdadsasdasddssadasdasdsdasdasdad.png?updatedAt=1775540256643',
    section: 'social',
    popularity: 312,
  },
  {
    id: 'di14',
    title: 'Rooftop Bar',
    description: 'A rooftop bar date offers a stylish and relaxed way to connect. Sitting above the city creates a calm atmosphere with great views that naturally spark conversation. The setting feels special without being too intense. The mix of scenery, soft music, and drinks helps ease nerves, making it easier to talk and enjoy the moment.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdassdasdasdasdasdasdsaasasdasdasdasdasdasdasdasd.png?updatedAt=1775541702874',
    section: 'social',
    popularity: 287,
  },
  {
    id: 'di45',
    title: 'Bowling',
    description: 'A bowling date is playful, energetic, and full of laughs. Challenge each other, celebrate strikes, and enjoy a lighthearted atmosphere. It\'s a great way to break the ice, keep things fun, and create memorable moments while adding a little friendly competition.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/coffeedsssssssss.png?updatedAt=1775537213143',
    section: 'social',
    popularity: 263,
  },
  {
    id: 'di31',
    title: 'Shopping Mall',
    description: 'A shopping mall date offers a fun, easy, and versatile way to connect. Visiting a shopping mall gives you plenty to do — browsing stores, grabbing food, or just walking and talking. The variety keeps things relaxed and flexible, allowing conversation to flow naturally without pressure. It\'s a casual setting that makes it easy to enjoy each other\'s company and build a genuine connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasdasdasadasdsdsdadsasdasddssad.png?updatedAt=1775539883340',
    section: 'social',
    popularity: 267,
  },
  {
    id: 'di15',
    title: 'Spa Treatment',
    description: 'A spa treatment date offers a calm and intimate way to connect. Relaxing together at a spa creates a peaceful atmosphere that helps both people unwind and feel at ease. The soothing environment reduces pressure and encourages a natural sense of comfort. With shared moments of relaxation, conversation feels effortless before or after treatments.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdassdasdasdasdasdasdsaasasdasdasdasd.png?updatedAt=1775541596162',
    section: 'social',
    popularity: 243,
  },
  {
    id: 'di36',
    title: 'Massage',
    description: 'A massage date offers a deeply relaxing and intimate way to connect. Enjoying a treatment at a massage spa creates a calm atmosphere where both people can unwind and feel at ease. The shared sense of relaxation helps reduce nerves, making conversation feel more natural before or after the session. It\'s a soothing and refreshing experience that encourages a genuine, comfortable connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasdasda.png?updatedAt=1775539385967',
    section: 'social',
    popularity: 234,
  },
  {
    id: 'di8',
    title: 'Billiards Pool',
    description: 'A billiards date offers a fun and relaxed way to connect without pressure. Playing a game keeps things interactive, giving you both something to focus on while conversation flows naturally. The light competition adds energy and playful moments, helping break the ice. It creates a balance between talking and doing, making it easier to avoid awkward silences.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfddfgsdfgasdasd.png?updatedAt=1775542411237',
    section: 'social',
    popularity: 221,
  },
  {
    id: 'di35',
    title: 'Gym',
    description: 'A gym date offers an active and motivating way to connect. Working out together creates a supportive atmosphere where both people can encourage each other. The shared activity helps ease pressure while keeping things engaging. Between exercises, conversation flows naturally, and teamwork builds a genuine connection. It\'s a healthy, energetic experience that feels both productive and fun.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasdasdasadas.png?updatedAt=1775539464356',
    section: 'social',
    popularity: 219,
  },
  {
    id: 'di16',
    title: 'Villa Stay',
    description: 'A villa date offers a private, relaxed, and intimate way to connect. Staying in a villa creates a peaceful atmosphere where both people can truly unwind. With no crowds or distractions, conversation flows naturally and feels more personal. Sharing simple moments — like cooking, swimming, or watching the sunset — helps build a deeper connection.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/qwqwdsddsASDASDASDASDsdaSDASDasdasdassdasdasdasdasdasdsaasasd.png?updatedAt=1775541494551',
    section: 'social',
    popularity: 209,
  },
  {
    id: 'di6',
    title: 'Hotel Stay',
    description: 'A hotel stay date offers comfort, privacy, and a relaxed atmosphere for getting to know each other. With no outside distractions, conversation can flow naturally, whether you\'re enjoying room service, watching a movie, or simply talking. The calm setting helps both people feel at ease, creating a more personal and meaningful connection without pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/vfddsfddfgsdfgasdasdasdasdasdasdasdasd.png?updatedAt=1775543025294',
    section: 'social',
    popularity: 189,
  },
  // ── Dining & Food ─────────────────────────────────────────────────────────
  {
    id: 'di49',
    title: 'Coffee Café',
    description: 'A coffee shop date is relaxed, cozy, and perfect for conversation. Sip on coffee or a creamy latte while enjoying a calm atmosphere. It\'s an easy, low-pressure way to chat, get to know each other, and share a comfortable moment together.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/coffee.png?updatedAt=1775536790418',
    section: 'dining',
    popularity: 389,
  },
  {
    id: 'di42',
    title: 'Indonesian Restaurant',
    description: 'An Indonesian food restaurant date is rich in flavor and culture. Share dishes like Nasi Goreng, Satay, and Rendang while enjoying a warm, vibrant atmosphere. It\'s a relaxed setting perfect for conversation, trying new tastes, and creating a memorable, authentic dining experience together.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsss.png?updatedAt=1775538596066',
    section: 'dining',
    popularity: 318,
  },
  {
    id: 'di32',
    title: 'Street Food',
    description: 'A street food date offers a fun, lively, and flavorful way to connect. Exploring local stalls and trying dishes like Satay or Bakso creates a casual atmosphere where conversation flows naturally. The variety of food and shared tasting moments make it easy to laugh, react, and enjoy together. It\'s a relaxed, vibrant experience that helps build a genuine connection without pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasdasdasadasdsdsdadsasdasd.png?updatedAt=1775539752851',
    section: 'dining',
    popularity: 293,
  },
  {
    id: 'di41',
    title: 'Chinese Restaurant',
    description: 'A Chinese restaurant date is warm, flavorful, and perfect for connection. Share delicious dishes, try new flavors together, and enjoy a cozy atmosphere. It\'s a relaxed setting that makes conversation easy while creating a fun and memorable dining experience.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssddd.png?updatedAt=1775538856019',
    section: 'dining',
    popularity: 271,
  },
  {
    id: 'di48',
    title: 'Pizza Café',
    description: 'A pizza date is casual, fun, and perfect for sharing. Enjoy slices with your favorite toppings, laugh over cheesy bites, and relax in an easygoing atmosphere. It\'s a simple way to connect, chat, and enjoy a laid-back, satisfying time together.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/coffeedss.png?updatedAt=1775536948224',
    section: 'dining',
    popularity: 256,
  },
  {
    id: 'di34',
    title: 'Ice Cream Parlour',
    description: 'An ice cream date offers a sweet, fun, and relaxed way to connect. Sharing ice cream creates a lighthearted atmosphere where conversation flows naturally. It feels casual and playful, helping both people ease into the moment. Trying different flavors, laughing, and enjoying something simple together makes it easy to bond. It\'s a cheerful experience that helps build a genuine connection without pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasdasdasadasdsd.png?updatedAt=1775539566986',
    section: 'dining',
    popularity: 241,
  },
  {
    id: 'di43',
    title: 'Sushi Restaurant',
    description: 'A sushi restaurant date is elegant, fresh, and interactive. Share rolls, sashimi, and try new flavors together while enjoying a calm, stylish atmosphere. It\'s a perfect setting for relaxed conversation and a memorable dining experience.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/coffeedsssssssssddddasda.png?updatedAt=1775537441678',
    section: 'dining',
    popularity: 284,
  },
  {
    id: 'di44',
    title: 'Fast Food',
    description: 'A fast food date is fun, casual, and stress-free. Grab favorites like burgers, fries, and a cold drink while enjoying a relaxed vibe. It\'s perfect for easy conversation, laughter, and keeping things simple without any pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/coffeedsssssssssddd.png?updatedAt=1775537329979',
    section: 'dining',
    popularity: 189,
  },
  {
    id: 'di33',
    title: 'Juice Café',
    description: 'A juice bar date offers a fresh, light, and relaxed way to connect. Visiting a juice bar creates a casual atmosphere where conversation flows naturally. The healthy vibe helps both people feel comfortable and at ease. Sharing flavors, trying new blends, and enjoying the moment together makes it easy to bond. It\'s a simple, refreshing experience that encourages a genuine connection without pressure.',
    image_url: 'https://ik.imagekit.io/nepgaxllc/Untitledsssdddsdsdsdsdasdsadasadasdasdasadasdsdsdads.png?updatedAt=1775539667684',
    section: 'dining',
    popularity: 178,
  },
]

export const SECTION_LABELS = {
  culture: '🎨 Cultural Experiences',
  outdoor: '🌿 Outdoor & Adventure',
  social:  '🎭 Social & Leisure',
  dining:  '🍽️ Dining & Food',
}

// ── Invite CRUD ───────────────────────────────────────────────────────────────

export async function sendDateInvite({ fromUserId, fromName, toUserId, ideaId, proposedDate, proposedTime }) {
  const invite = {
    id:            `DINV_${Date.now()}`,
    from_user_id:  fromUserId,
    to_user_id:    toUserId,
    idea_id:       ideaId,
    proposed_date: proposedDate ?? null,
    proposed_time: proposedTime ?? null,
    status:        'pending',
    expires_at:    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at:    new Date().toISOString(),
  }
  if (supabase) {
    const { error } = await supabase.from('date_invites').insert(invite)
    if (error) console.warn('date_invites insert:', error.message)
  }
  const idea = DATE_IDEAS.find(d => d.id === ideaId)
  await notifyDateInvite(toUserId, {
    fromName:  fromName ?? 'Someone',
    ideaTitle: idea?.title ?? 'a date',
    fromUserId,
  })
  return invite
}

export async function acceptDateInvite(inviteId, { fromUserId, acceptorName, ideaId } = {}) {
  if (!supabase) return
  await supabase.from('date_invites').update({ status: 'accepted' }).eq('id', inviteId)
  if (fromUserId) {
    const idea = DATE_IDEAS.find(d => d.id === ideaId)
    await notifyDateAccepted(fromUserId, {
      fromName:  acceptorName ?? 'Someone',
      ideaTitle: idea?.title ?? 'your date',
      fromUserId,
    })
  }
}

export async function declineDateInvite(inviteId) {
  if (!supabase) return
  await supabase.from('date_invites').update({ status: 'declined' }).eq('id', inviteId)
}

export async function getIncomingDateInvites(userId) {
  if (!supabase) return []
  const { data } = await supabase
    .from('date_invites')
    .select('*, profiles!from_user_id(display_name, photo_url, age, city)')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function suggestDateIdea({ userId, title, description }) {
  const suggestion = {
    id:           `DSUGG_${Date.now()}`,
    suggested_by: userId,
    title,
    description:  description || null,
    status:       'pending',
    created_at:   new Date().toISOString(),
  }
  if (supabase) {
    const { error } = await supabase.from('date_suggestions').insert(suggestion)
    if (error) console.warn('date_suggestions insert:', error.message)
  }
  return suggestion
}
