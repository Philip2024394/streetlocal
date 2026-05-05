/**
 * newProjectService — CRUD for developer new-build projects.
 */
import { supabase } from '@/lib/supabase'

const LOCAL_KEY = 'indoo_new_projects'

const DEMO_PROJECTS = [
  {
    id: 'np1', project_name: 'Grand Citra Residence', developer_name: 'Ciputra Group',
    description: 'Modern residential complex near UGM campus. 3 unit types, community pool, 24h security. Strategic location with easy access to ringroad.',
    location: 'Jl. Kaliurang KM 8, Sleman', city: 'Yogyakarta', lat: -7.7550, lng: 110.3780,
    status: 'construction', completion_date: '2027-Q2', launch_date: '2026-Q1',
    units: [
      { type: 'Type 36/72', bedrooms: 2, bathrooms: 1, area_sqm: 36, price: 450000000, available_count: 12, floor_plan_url: null },
      { type: 'Type 45/90', bedrooms: 3, bathrooms: 2, area_sqm: 45, price: 650000000, available_count: 8, floor_plan_url: null },
      { type: 'Type 60/120', bedrooms: 3, bathrooms: 2, area_sqm: 60, price: 850000000, available_count: 5, floor_plan_url: null },
    ],
    amenities: ['Swimming Pool', 'Gym', 'Security 24h', 'Garden', 'Playground', 'Mosque', 'Jogging Track'],
    payment_schedule: 'Booking fee Rp 5M → DP 20% (3x installment over 3 months) → KPR Bank or Cash',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'],
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', brochure_url: null, floor_plans: [], site_plan_url: null, progress_photos: [],
    contact_whatsapp: '081234567890', contact_email: 'sales@ciputra.com', website: 'ciputra.com', instagram: 'ciputragroup',
    min_price: 450000000, max_price: 850000000, total_units: 50, units_sold: 25, verified: true, view_count: 342, inquiry_count: 28,
    site_office: { address: 'Jl. Kaliurang KM 8 No. 22, Sleman', phone: '081234567890', hours: { weekdays: '08:30 - 17:00', saturday: '09:00 - 15:00', sunday: 'Closed' } },
    viewing_schedule: { days: ['mon','tue','wed','thu','fri','sat'], morning: true, afternoon: true, evening: false, notes: 'Walk-ins welcome weekdays' },
  },
  {
    id: 'np2', project_name: 'The Green Villas Kaliurang', developer_name: 'Jogja Land Development',
    description: 'Luxury villa resort with private pools and mountain views. Perfect for investment or holiday home. Each villa includes staff quarter and BBQ area.',
    location: 'Kaliurang KM 20, Sleman', city: 'Yogyakarta', lat: -7.6200, lng: 110.4100,
    status: 'pre_sale', completion_date: '2027-Q4', launch_date: '2026-Q2',
    units: [
      { type: 'Villa A — 2BR Pool', bedrooms: 2, bathrooms: 2, area_sqm: 150, price: 1200000000, available_count: 6, floor_plan_url: null },
      { type: 'Villa B — 3BR Pool', bedrooms: 3, bathrooms: 3, area_sqm: 220, price: 1800000000, available_count: 4, floor_plan_url: null },
      { type: 'Villa C — 4BR Premium', bedrooms: 4, bathrooms: 4, area_sqm: 300, price: 2800000000, available_count: 2, floor_plan_url: null },
    ],
    amenities: ['Private Pool', 'Mountain View', 'Staff Quarter', 'Garden', 'BBQ Area', 'Clubhouse', 'Yoga Deck'],
    payment_schedule: 'Booking Rp 10M → DP 30% (6 months) → Progress payment 40% → Handover 30%',
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600'],
    video_url: null, brochure_url: null, floor_plans: [], site_plan_url: null, progress_photos: [],
    contact_whatsapp: '087654321098', contact_email: 'sales@jogjaland.com', website: null, instagram: 'jogjaland',
    min_price: 1200000000, max_price: 2800000000, total_units: 20, units_sold: 8, verified: true, view_count: 189, inquiry_count: 15,
    site_office: { address: 'Kaliurang KM 20, Sleman', phone: '087654321098', hours: { weekdays: '09:00 - 17:00', saturday: '09:00 - 14:00', sunday: 'By Appointment' } },
    viewing_schedule: { days: ['mon','tue','wed','thu','fri','sat'], morning: true, afternoon: true, evening: false, notes: 'Site visits by appointment only' },
  },
  {
    id: 'np3', project_name: 'Apartemen Malioboro Square', developer_name: 'PP Properti',
    description: 'Prime apartment tower in the heart of Malioboro. Walking distance to Malioboro Street, Tugu Station, and Kraton. Ideal for investment with high rental yield.',
    location: 'Jl. Malioboro, Gedongtengen', city: 'Yogyakarta', lat: -7.7928, lng: 110.3653,
    status: 'pre_sale', completion_date: '2028-Q1', launch_date: '2026-Q3',
    units: [
      { type: 'Studio 22m²', bedrooms: 0, bathrooms: 1, area_sqm: 22, price: 350000000, available_count: 40, floor_plan_url: null },
      { type: '1BR 35m²', bedrooms: 1, bathrooms: 1, area_sqm: 35, price: 520000000, available_count: 30, floor_plan_url: null },
      { type: '2BR 55m²', bedrooms: 2, bathrooms: 1, area_sqm: 55, price: 780000000, available_count: 20, floor_plan_url: null },
      { type: '3BR Penthouse 90m²', bedrooms: 3, bathrooms: 2, area_sqm: 90, price: 1500000000, available_count: 4, floor_plan_url: null },
    ],
    amenities: ['Rooftop Pool', 'Sky Lounge', 'Gym', 'Co-working Space', 'Parking', 'Security 24h', 'Concierge', 'Laundry'],
    payment_schedule: 'NUP Rp 2M → Booking Rp 10M → DP 15% (6x installment) → KPR or Cash',
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600'],
    video_url: null, brochure_url: null, floor_plans: [], site_plan_url: null, progress_photos: [],
    contact_whatsapp: '081111222333', contact_email: 'marketing@ppproperti.com', website: 'ppproperti.com', instagram: 'ppproperti',
    min_price: 350000000, max_price: 1500000000, total_units: 200, units_sold: 56, verified: true, view_count: 567, inquiry_count: 43,
    site_office: { address: 'Jl. Malioboro No. 52, Gedongtengen, Yogyakarta', phone: '081111222333', hours: { weekdays: '09:00 - 18:00', saturday: '10:00 - 16:00', sunday: 'Closed' } },
    viewing_schedule: { days: ['mon','tue','wed','thu','fri','sat'], morning: true, afternoon: true, evening: false, notes: 'Show unit available daily' },
  },
]

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}

export async function getNewProjects() {
  if (supabase) {
    try {
      const { data } = await supabase.from('new_projects').select('*').order('created_at', { ascending: false })
      if (data?.length) return data
    } catch {}
  }
  const local = loadLocal()
  return local.length ? local : DEMO_PROJECTS
}

export async function getProjectById(id) {
  if (supabase) {
    try {
      const { data } = await supabase.from('new_projects').select('*').eq('id', id).single()
      if (data) return data
    } catch {}
  }
  return DEMO_PROJECTS.find(p => p.id === id) || loadLocal().find(p => p.id === id) || null
}

export async function createProject(project) {
  const entry = { id: 'np_' + Date.now(), ...project, created_at: new Date().toISOString(), view_count: 0, inquiry_count: 0, units_sold: 0 }
  const local = loadLocal()
  local.unshift(entry)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(local))

  if (supabase) {
    try {
      const { data: userData } = await supabase.auth.getUser()
      await supabase.from('new_projects').insert({ ...project, developer_id: userData?.user?.id })
    } catch (e) { console.warn('Create project error:', e) }
  }
  return entry
}

export async function updateProject(id, updates) {
  const local = loadLocal()
  const idx = local.findIndex(p => p.id === id)
  if (idx >= 0) { local[idx] = { ...local[idx], ...updates }; localStorage.setItem(LOCAL_KEY, JSON.stringify(local)) }
  if (supabase) {
    try { await supabase.from('new_projects').update(updates).eq('id', id) } catch {}
  }
}

export async function trackProjectView(id) {
  if (!supabase) return
  try { await supabase.rpc('increment', { row_id: id, table_name: 'new_projects', column_name: 'view_count' }).catch(() => {}) } catch {}
}

export function fmtRp(n) {
  if (!n) return '—'
  if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(0)}jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export const STATUS_LABELS = {
  pre_sale: { label: 'Pre-Sale', color: '#FACC15' },
  construction: { label: 'Under Construction', color: '#F97316' },
  topping_off: { label: 'Topping Off', color: '#60A5FA' },
  finishing: { label: 'Finishing', color: '#A855F7' },
  ready: { label: 'Ready to Move', color: '#8DC63F' },
  sold_out: { label: 'Sold Out', color: '#EF4444' },
}
