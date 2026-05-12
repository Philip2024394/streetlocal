// Shared vendor-type definitions for ServicesLocal apps
// (serviceslocalchat, serviceslocalemail, serviceslocalwhatsapp).
// Edit ONCE here — all apps pick up the change automatically.

export const VENDOR_TYPES = {
  home: {
    id: 'home', label: 'Home Services', emoji: '🏠',
    tagline: 'AC, plumbing, cleaning, repair',
    categories: ['AC', 'Plumbing', 'Electrical', 'Cleaning', 'Painting', 'Pest Control', 'Promo'],
  },
  beauty: {
    id: 'beauty', label: 'Beauty / Wellness', emoji: '💆',
    tagline: 'Salon, massage, beauty treatments',
    categories: ['Hair', 'Massage', 'Facial', 'Nails', 'Spa', 'Makeup', 'Promo'],
  },
  automotive: {
    id: 'automotive', label: 'Automotive', emoji: '🚗',
    tagline: 'Car wash, repair, rental',
    categories: ['Wash', 'Repair', 'Detail', 'Tire', 'Rental', 'Inspection', 'Promo'],
  },
  professional: {
    id: 'professional', label: 'Professional', emoji: '💼',
    tagline: 'Tutoring, photography, legal',
    categories: ['Tutoring', 'Photography', 'Translation', 'Legal', 'Accounting', 'Consulting', 'Promo'],
  },
  general: {
    id: 'general', label: 'General Services', emoji: '🔧',
    tagline: 'Mixed service offerings',
    categories: ['Main Service', 'Add-ons', 'Packages', 'Consultation', 'Promo'],
  },
}
