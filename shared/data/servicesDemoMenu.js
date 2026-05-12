// Shared demo menu data for services family apps (serviceslocalchat, serviceslocalwhatsapp, serviceslocalemail).
// Service-business items: each entry represents a bookable service the vendor can offer.
// Categories: Service (main offerings), Add-On (extras), Package (bundles).

const svcImg = (q) => 'https://image.pollinations.ai/prompt/' + encodeURIComponent(q + ', professional service, clean modern style, soft lighting, 4k') + '?width=300&height=300&nologo=true&seed=42'

export const DEMO_MENU = [
  // Services — main bookable items
  { id: 1, name: 'Hair Cut & Style', price: 50000, photo: svcImg('barber giving a clean haircut to a man in modern salon'), desc: 'Classic cut + wash + blow dry, 45 min appointment', category: 'Service', available: true },
  { id: 2, name: 'Hair Wash & Treatment', price: 75000, photo: svcImg('woman getting hair washed with conditioner treatment salon basin'), desc: 'Deep cleanse, scalp massage, nourishing mask, 30 min', category: 'Service', available: true },
  { id: 3, name: 'AC Service & Clean', price: 120000, photo: svcImg('technician cleaning air conditioner indoor unit on apartment wall'), desc: 'Indoor + outdoor unit clean, freon check, drainage flush', category: 'Service', available: true },
  { id: 4, name: 'Plumbing Call-Out', price: 80000, photo: svcImg('plumber fixing a sink pipe with wrench under kitchen sink'), desc: 'Diagnostic visit, basic repairs included, parts extra', category: 'Service', available: true },
  { id: 5, name: 'Tailor Alteration', price: 35000, photo: svcImg('tailor using sewing machine to alter trouser hem in workshop'), desc: 'Hem, take-in, basic alteration on shirts/pants/dresses', category: 'Service', available: true },
  { id: 6, name: 'Pet Grooming (Small Dog)', price: 150000, photo: svcImg('small dog being groomed and bathed at pet salon clean white background'), desc: 'Wash + dry + trim + nail clip, dogs up to 10kg', category: 'Service', available: true },
  { id: 7, name: 'Pet Grooming (Large Dog)', price: 250000, photo: svcImg('large dog being groomed at professional pet salon'), desc: 'Wash + dry + trim + nail clip, dogs over 10kg', category: 'Service', available: true },
  { id: 8, name: 'Photo Session (1 hour)', price: 500000, photo: svcImg('photographer with camera taking portrait shot in studio'), desc: 'One hour studio or location shoot, ~30 edited photos delivered', category: 'Service', available: true },
  { id: 9, name: 'Home Cleaning (3 hours)', price: 200000, photo: svcImg('woman cleaning house dusting living room professional cleaner'), desc: '3-hour deep clean, supplies included', category: 'Service', available: true },
  { id: 10, name: 'Massage (60 min)', price: 150000, photo: svcImg('woman receiving relaxing massage at clean modern spa'), desc: 'Full body relaxation massage, oil included', category: 'Service', available: true },
  { id: 11, name: 'Maths Tutoring (1 hour)', price: 100000, photo: svcImg('teacher tutoring student with notebook and laptop at desk'), desc: 'One-on-one tutoring, primary and secondary level', category: 'Service', available: true },
  { id: 12, name: 'English Conversation Class', price: 90000, photo: svcImg('two people having English conversation lesson with notebooks at table'), desc: '60-min conversation practice with feedback', category: 'Service', available: true },
  { id: 13, name: 'Manicure', price: 60000, photo: svcImg('woman getting manicure with red nail polish at clean salon'), desc: 'Shape + cuticle care + colour, ~40 min', category: 'Service', available: true },
  { id: 14, name: 'Pedicure', price: 80000, photo: svcImg('woman getting pedicure with foot soak at salon spa'), desc: 'Foot soak + scrub + nail care + colour', category: 'Service', available: true },
  { id: 15, name: 'Facial Treatment', price: 180000, photo: svcImg('woman receiving facial treatment with skincare products at spa'), desc: 'Cleanse + steam + mask + moisturise, 60 min', category: 'Service', available: true },

  // Add-Ons — extras the customer can attach to a booking
  { id: 21, name: 'Home Visit Fee', price: 25000, photo: svcImg('professional service van arriving at customer house'), desc: 'Add to any service to have the vendor come to you (within 5km)', category: 'Add-On', available: true },
  { id: 22, name: 'Express / Same-Day', price: 30000, photo: svcImg('rush express service same day delivery clock urgent'), desc: 'Skip the queue — same-day booking surcharge', category: 'Add-On', available: true },
  { id: 23, name: 'Weekend Booking', price: 20000, photo: svcImg('calendar showing weekend saturday sunday circled service appointment'), desc: 'Saturday or Sunday appointment surcharge', category: 'Add-On', available: true },
  { id: 24, name: 'Extra Time (+30 min)', price: 35000, photo: svcImg('clock timer extra time service appointment'), desc: 'Add 30 min to any booked service', category: 'Add-On', available: true },

  // Packages — bundled deals at a discount
  { id: 31, name: 'Bridal Hair + Makeup', price: 1500000, photo: svcImg('bride with elegant hair styling and bridal makeup on wedding day'), desc: 'Full bridal package: trial + wedding day hair & makeup', category: 'Package', available: true },
  { id: 32, name: 'Monthly AC Maintenance (4 visits)', price: 400000, photo: svcImg('air conditioner being maintained by technician monthly service'), desc: 'One AC service per week for 4 weeks (saves Rp 80k)', category: 'Package', available: true },
  { id: 33, name: 'Pet Grooming Package (5 visits)', price: 600000, photo: svcImg('happy clean groomed dogs at pet salon professional'), desc: '5 grooming sessions for small dogs (saves Rp 150k)', category: 'Package', available: true },
  { id: 34, name: 'Photo Session Half-Day', price: 1200000, photo: svcImg('professional photoshoot with multiple looks studio half day'), desc: '4-hour shoot, 2 location changes, ~100 edited photos', category: 'Package', available: true },
  { id: 35, name: 'Salon Day (Hair + Mani + Pedi)', price: 220000, photo: svcImg('woman enjoying salon day with hair manicure pedicure relaxing'), desc: 'Wash + style + manicure + pedicure in one visit', category: 'Package', available: true },
]
