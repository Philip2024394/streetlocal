import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TextField, NumberField, SelectField, PillSelect, ToggleField, TextArea, Row, Section, ImageUploader, PriceFields, PreviewCard, FormFooter, ProgressBar, BuyNowFields } from '../components/FormFields'
import styles from '../rentalFormStyles.module.css'
import showroomStyles from './MotorbikeShowroom.module.css'
import { PickerField, SettingsDrawer, ProcessingStep, SuccessStep, MyListingsPanel, RentalTermsSection, AgreementEditorPopup, FormHeader } from './shared/ListingFormShared'
import DealHuntToggle from '@/components/dealhunt/DealHuntToggle'
import VideoUpload from '@/components/property/VideoUpload'

/* ══════════════════════════════════════════════════════════════════════════════
   PROPERTY DIRECTORY — showroom carousel data
   ══════════════════════════════════════════════════════════════════════════════ */
const PROPERTY_DIRECTORY = [
  { id: 'villa_sunset_bali',      name: 'Villa Sunset Bali',         type: 'Villa',     bedrooms: 3, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-06_57_42-pm.png', listings: 12, priceFrom: 500000, priceTo: 1500000 },
  { id: 'kos_exclusive_jakarta',  name: 'Kos Exclusive Jakarta',     type: 'Kos',       bedrooms: 1, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-07_07_33-pm.png', listings: 28, priceFrom: 1500000, priceTo: 3500000 },
  { id: 'studio_apartment_bandung', name: 'Studio Apartment Bandung', type: 'Studio',    bedrooms: 1, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-10_39_50-pm.png', listings: 18, priceFrom: 300000, priceTo: 800000 },
  { id: 'rice_field_villa_ubud',  name: 'Rice Field Villa Ubud',     type: 'Villa',     bedrooms: 2, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-11_13_56-pm.png?updatedAt=1776528855040', listings: 8, priceFrom: 600000, priceTo: 2000000 },
  { id: 'beachfront_bungalow',    name: 'Beachfront Bungalow',       type: 'Bungalow',  bedrooms: 1, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-06_57_42-pm.png', listings: 6, priceFrom: 400000, priceTo: 1200000 },
  { id: 'modern_loft_surabaya',   name: 'Modern Loft Surabaya',      type: 'Apartment', bedrooms: 1, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-07_07_33-pm.png', listings: 10, priceFrom: 350000, priceTo: 900000 },
  { id: 'family_house_yogya',     name: 'Family House Yogya',        type: 'House',     bedrooms: 4, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-10_39_50-pm.png', listings: 5, priceFrom: 400000, priceTo: 1000000 },
  { id: 'penthouse_suite',        name: 'Penthouse Suite',           type: 'Penthouse', bedrooms: 3, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-11_13_56-pm.png?updatedAt=1776528855040', listings: 2, priceFrom: 2000000, priceTo: 5000000 },
  { id: 'traditional_joglo',      name: 'Traditional Joglo',         type: 'House',     bedrooms: 2, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-06_57_42-pm.png', listings: 4, priceFrom: 500000, priceTo: 1500000 },
  { id: 'container_house',        name: 'Container House',           type: 'House',     bedrooms: 1, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-07_07_33-pm.png', listings: 3, priceFrom: 250000, priceTo: 700000 },
  { id: 'tiny_house',             name: 'Tiny House',                type: 'House',     bedrooms: 1, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-10_39_50-pm.png', listings: 7, priceFrom: 200000, priceTo: 500000 },
  { id: 'glamping_tent',          name: 'Glamping Tent',             type: 'Glamping',  bedrooms: 1, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-11_13_56-pm.png?updatedAt=1776528855040', listings: 9, priceFrom: 300000, priceTo: 800000 },
  { id: 'treehouse_villa',        name: 'Treehouse Villa',           type: 'Villa',     bedrooms: 1, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-06_57_42-pm.png', listings: 3, priceFrom: 500000, priceTo: 1500000 },
  { id: 'cliff_villa_uluwatu',    name: 'Cliff Villa Uluwatu',       type: 'Villa',     bedrooms: 4, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-07_07_33-pm.png', listings: 2, priceFrom: 1500000, priceTo: 5000000 },
  { id: 'pool_villa_seminyak',    name: 'Pool Villa Seminyak',       type: 'Villa',     bedrooms: 3, image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-10_39_50-pm.png', listings: 6, priceFrom: 800000, priceTo: 2500000 },
]

/* ══════════════════════════════════════════════════════════════════════════════
   PROPERTY OPTIONS & CONSTANTS
   ══════════════════════════════════════════════════════════════════════════════ */
// ── Property Classification System ──
const PROPERTY_CATEGORIES = [
  { id: 'residential', label: 'Residential', labelId: 'Hunian', icon: '🏠', types: [
    { id: 'House', label: 'House', labelId: 'Rumah' },
    { id: 'Villa', label: 'Villa', labelId: 'Vila' },
    { id: 'Apartment', label: 'Apartment', labelId: 'Apartemen' },
    { id: 'Condominium', label: 'Condominium', labelId: 'Kondominium' },
    { id: 'Townhouse', label: 'Townhouse / Cluster', labelId: 'Rumah Cluster' },
    { id: 'Studio', label: 'Studio', labelId: 'Studio' },
    { id: 'Serviced Apartment', label: 'Serviced Apartment', labelId: 'Apartemen Servis' },
    { id: 'Penthouse', label: 'Penthouse', labelId: 'Penthouse' },
    { id: 'Kos', label: 'Boarding House', labelId: 'Kos / Indekos' },
    { id: 'Room', label: 'Room Rental', labelId: 'Kamar Sewa' },
    { id: 'Bungalow', label: 'Bungalow', labelId: 'Bungalo' },
    { id: 'Glamping', label: 'Glamping', labelId: 'Glamping' },
  ]},
  { id: 'commercial', label: 'Commercial', labelId: 'Komersial', icon: '🏢', types: [
    { id: 'Ruko', label: 'Shop House', labelId: 'Ruko' },
    { id: 'Office', label: 'Office Space', labelId: 'Kantor' },
    { id: 'Restaurant', label: 'Restaurant / Café', labelId: 'Restoran / Kafe' },
    { id: 'Co-working', label: 'Co-working Space', labelId: 'Co-working' },
    { id: 'Event Space', label: 'Event Space', labelId: 'Ruang Acara' },
  ]},
  { id: 'industrial', label: 'Industrial', labelId: 'Industri', icon: '🏭', types: [
    { id: 'Gudang', label: 'Warehouse', labelId: 'Gudang' },
    { id: 'Pabrik', label: 'Factory', labelId: 'Pabrik' },
    { id: 'Storage', label: 'Storage Unit', labelId: 'Unit Penyimpanan' },
  ]},
  { id: 'land', label: 'Land', labelId: 'Tanah', icon: '🌍', types: [
    { id: 'Tanah', label: 'Land', labelId: 'Tanah' },
    { id: 'Parking', label: 'Parking / Garage', labelId: 'Lahan Parkir' },
  ]},
]
const PROPERTY_TYPES = PROPERTY_CATEGORIES.flatMap(c => c.types.map(t => t.id))
const RENTAL_TYPE_OPTIONS = [
  { id: 'whole', label: 'Whole Property', labelId: 'Seluruh Properti', icon: '🏠' },
  { id: 'room', label: 'Room Only', labelId: 'Kamar Saja', icon: '🚪' },
  { id: 'shared', label: 'Shared', labelId: 'Berbagi', icon: '👥' },
]
const SPECIALTY_TAGS = [
  { id: 'holiday', label: 'Holiday Home', labelId: 'Rumah Liburan', icon: '🌴' },
  { id: 'beachfront', label: 'Beachfront', labelId: 'Tepi Pantai', icon: '🏖️' },
  { id: 'mountain', label: 'Mountain View', labelId: 'Pegunungan', icon: '⛰️' },
  { id: 'luxury', label: 'Luxury', labelId: 'Mewah', icon: '✨' },
  { id: 'eco', label: 'Eco-friendly', labelId: 'Ramah Lingkungan', icon: '🌱' },
  { id: 'pet_friendly', label: 'Pet Friendly', labelId: 'Boleh Hewan', icon: '🐾' },
  { id: 'investment', label: 'Investment Ready', labelId: 'Siap Investasi', icon: '📈' },
  { id: 'furnished_ready', label: 'Move-in Ready', labelId: 'Siap Huni', icon: '🔑' },
]
const LEASE_DURATION_OPTIONS = ['Daily (Harian)', 'Weekly (Mingguan)', 'Monthly (Bulanan)', 'Yearly (Tahunan)', 'Long-term Lease (Kontrak)']
const FURNISHED_OPTIONS = ['Fully Furnished', 'Semi Furnished', 'Unfurnished']
const AMENITIES = ['Pool', 'AC', 'WiFi', 'Kitchen', 'Laundry', 'Parking', 'Garden', 'Security', 'CCTV', 'Hot Water', 'TV', 'Balcony', 'Rooftop']
const AMENITY_ICONS = { Pool: '🏊', AC: '❄️', WiFi: '📶', Kitchen: '🍳', Laundry: '🧺', Parking: '🅿️', Garden: '🌿', Security: '🔒', CCTV: '📹', 'Hot Water': '🚿', TV: '📺', Balcony: '🌅', Rooftop: '🏙️' }
const BEDROOM_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']
const BATHROOM_OPTIONS = ['1', '2', '3', '4', '5+']
const FLOOR_OPTIONS = ['Ground', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+', 'Penthouse']

// Kos-specific options
const KOS_TIER_OPTIONS = ['Basic', 'Standard', 'Premium', 'Exclusive']
const KOS_GENDER_OPTIONS = ['Putra', 'Putri', 'Campur']
const KOS_BED_TYPE_OPTIONS = ['Single 90x200', 'Queen 160x200', 'King 180x200']
const KOS_ROOM_FACILITIES = ['Desk+Chair', 'Mirror', 'Wardrobe', 'Electric Kettle', 'Smart Lock']
const KOS_SHARED_FACILITIES = ['Shared Kitchen', 'Dining Area', 'Common Area', 'Laundry Area']
const KOS_INCLUDED_OPTIONS = ['WiFi', 'Laundry', 'Cleaning', 'Water']
const KOS_EXCLUDED_OPTIONS = ['Electricity', 'Overtime AC']
const KOS_MIN_STAY_OPTIONS = ['1 month', '3 months', '6 months', '1 year']

// House/Villa-specific options
const ELECTRICITY_CAPACITY_OPTIONS = ['450W', '900W', '1300W', '2200W', '3500W', '5500W', '7700W', '11000W']
const WATER_TYPE_OPTIONS = ['PDAM', 'Well']
const CERTIFICATE_TYPE_OPTIONS = ['SHM', 'HGB', 'Hak Pakai', 'SHMSRS', 'AJB', 'Girik', 'Petok D', 'Adat', 'HGU']
const FACING_DIRECTION_OPTIONS = ['North', 'South', 'East', 'West']

// Tanah (Land) options
const ZONING_OPTIONS = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed-Use']
const LAND_SHAPE_OPTIONS = ['Regular', 'L-Shape', 'Irregular', 'Corner Lot']
const LAND_CONTOUR_OPTIONS = ['Flat', 'Sloped', 'Hillside']
const ROAD_ACCESS_OPTIONS = ['Asphalt', 'Concrete', 'Gravel', 'Dirt']

// Ruko options
const BUSINESS_TYPE_OPTIONS = ['Retail', 'Office', 'F&B', 'Mixed']

// Gudang/Pabrik options
const ELECTRICITY_KVA_OPTIONS = ['23 kVA', '53 kVA', '100 kVA', '200 kVA', '350 kVA', '555 kVA', '800 kVA', '1000+ kVA']
const POWER_VOLTAGE_OPTIONS = ['220V', '380V', '220V/380V', '20kV (Medium)', 'Custom']
const POWER_PHASE_OPTIONS = ['1 Phase', '3 Phase']
const PET_TYPE_OPTIONS = ['Dogs', 'Cats', 'Small Pets', 'Birds', 'All Pets']
const WAREHOUSE_ZONING_OPTIONS = ['Industrial', 'Commercial', 'Logistics']
const WATER_SUPPLY_OPTIONS = ['PDAM', 'Well', 'Both']

// Owner type
const OWNER_TYPE_OPTIONS = ['Owner', 'Agent']

// All property types
const CANCELLATION_POLICY_OPTIONS = ['Flexible', 'Moderate', 'Strict', 'Non-refundable']

function generateRef() { return 'PROP-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.floor(1000 + Math.random() * 9000) }


/* ══════════════════════════════════════════════════════════════════════════════
   PROPERTY SHOWROOM — Stage with lighting, swipeable carousel
   ══════════════════════════════════════════════════════════════════════════════ */
function PropertyShowroom({ propType, onSelectProperty }) {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const lastFilledRef = useRef(-1)
  const totalProps = PROPERTY_DIRECTORY.length

  // Triple the array for infinite loop effect
  const displayProps = [...PROPERTY_DIRECTORY, ...PROPERTY_DIRECTORY, ...PROPERTY_DIRECTORY]

  // Start in the middle set on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = totalProps * scrollRef.current.offsetWidth
    }
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const idx = Math.round(el.scrollLeft / el.offsetWidth)
    const realIdx = idx % totalProps
    setActiveIdx(realIdx)

    // Auto-fill on swipe
    if (realIdx !== lastFilledRef.current && PROPERTY_DIRECTORY[realIdx]) {
      lastFilledRef.current = realIdx
      onSelectProperty?.(PROPERTY_DIRECTORY[realIdx])
    }

    // Loop: if scrolled to start or end, jump to middle set
    if (idx <= 2) {
      el.scrollLeft = (totalProps + idx) * el.offsetWidth
    } else if (idx >= totalProps * 2 - 2) {
      el.scrollLeft = (totalProps + (idx - totalProps * 2)) * el.offsetWidth
    }
  }

  const currentProp = PROPERTY_DIRECTORY[activeIdx]
  const isSelected = currentProp && propType && currentProp.type.toLowerCase() === propType.toLowerCase()

  return (
    <div className={showroomStyles.stage}>
      <div className={showroomStyles.spotlightCenter} />
      <div className={showroomStyles.spotlightLeft} />
      <div className={showroomStyles.spotlightRight} />

      {/* Property carousel — all properties, swipeable */}
      <div ref={scrollRef} className={showroomStyles.carousel} onScroll={handleScroll}>
        {displayProps.map((prop, i) => (
          <div key={`${prop.id}-${i}`} className={showroomStyles.bikeSlide} onClick={() => onSelectProperty?.(prop)}>
            <img src={prop.image} alt={prop.name} className={showroomStyles.bikeImg} style={{ borderRadius: 12, objectFit: 'cover' }} />
            <div className={showroomStyles.floorGlow} />
          </div>
        ))}
      </div>

      {/* Tap to select hint */}
      {!isSelected && (
        <div style={{ textAlign: 'center', padding: '0 0 4px', fontSize: 11, color: 'rgba(141,198,63,0.4)', fontWeight: 600 }}>
          ← Swipe to browse · Tap to select →
        </div>
      )}

      {/* Property name + specs */}
      <div className={showroomStyles.bikeName}>
        <span className={showroomStyles.bikeNameBrand}>{currentProp?.type ?? ''}</span>
        <span className={showroomStyles.bikeNameModel}>{currentProp?.name ?? ''}</span>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{currentProp?.bedrooms} BR · {currentProp?.type}</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   AMENITIES BUNDLE — visual cards for included amenities
   ══════════════════════════════════════════════════════════════════════════════ */
function AmenitiesBundle({ amenities }) {
  const items = AMENITIES.map(a => ({
    icon: AMENITY_ICONS[a] || '✓',
    label: a,
    active: amenities.includes(a),
  }))
  return (
    <div className={showroomStyles.bundleGrid}>
      {items.map(item => (
        <div key={item.label} className={`${showroomStyles.bundleCard} ${item.active ? showroomStyles.bundleCardActive : ''}`}>
          <span className={showroomStyles.bundleIcon}>{item.icon}</span>
          <span className={showroomStyles.bundleLabel}>{item.label}</span>
          <span className={showroomStyles.bundleSub}>{item.active ? 'Included' : 'Not included'}</span>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN FORM
   ══════════════════════════════════════════════════════════════════════════════ */
export default function PropertyListingForm({ open, onClose, onSubmit, editListing, listingMarket, propertyType }) {
  const isEditing = !!editListing
  const propRef = useMemo(() => editListing?.ref || generateRef(), [editListing])
  const ef = editListing?.extra_fields || {}
  const [step, setStep] = useState(propertyType ? 1 : 0)
  const [mainImage, setMainImage] = useState(editListing?.image || '')
  const [thumbs, setThumbs] = useState(() => editListing?.images?.slice(1) || [])
  const [title, setTitle] = useState(editListing?.title || '')
  const [desc, setDesc] = useState(editListing?.description || '')
  const [city, setCity] = useState(() => {
    if (editListing?.city) return editListing.city
    try { const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}'); return p.city || '' } catch { return '' }
  })
  const [address, setAddress] = useState(ef.address || '')
  const [propType, setPropType] = useState(ef.propType || propertyType || '')
  const [propCategory, setPropCategory] = useState(ef.propCategory || (() => { const cat = PROPERTY_CATEGORIES.find(c => c.types.some(t => t.id === (ef.propType || propertyType))); return cat?.id || 'residential' })())
  const [rentalType, setRentalType] = useState(ef.rentalType || 'whole')
  const [specialtyTags, setSpecialtyTags] = useState(ef.specialtyTags || [])
  const [leaseDuration, setLeaseDuration] = useState(ef.leaseDuration || '')
  const [bedrooms, setBedrooms] = useState(ef.bedrooms || '1')
  const [bathrooms, setBathrooms] = useState(ef.bathrooms || '1')
  const [sizeSqm, setSizeSqm] = useState(ef.sizeSqm || '')
  const [furnished, setFurnished] = useState(ef.furnished || '')
  const [floorLevel, setFloorLevel] = useState(ef.floorLevel || '')
  const [amenities, setAmenities] = useState(ef.amenities || [])
  const [electricityIncluded, setElectricityIncluded] = useState(ef.electricityIncluded || false)
  const [waterIncluded, setWaterIncluded] = useState(ef.waterIncluded || false)
  const [internetIncluded, setInternetIncluded] = useState(ef.internetIncluded || false)
  const [checkIn, setCheckIn] = useState(ef.checkIn || '14:00')
  const [checkOut, setCheckOut] = useState(ef.checkOut || '12:00')
  const [maxGuests, setMaxGuests] = useState(ef.maxGuests || '2')
  const [petFriendly, setPetFriendly] = useState(ef.petFriendly || false)
  const [viewingDays, setViewingDays] = useState(ef.viewing_schedule?.days || ['mon','tue','wed','thu','fri','sat'])
  const [viewingMorning, setViewingMorning] = useState(ef.viewing_schedule?.morning ?? true)
  const [viewingAfternoon, setViewingAfternoon] = useState(ef.viewing_schedule?.afternoon ?? true)
  const [viewingEvening, setViewingEvening] = useState(ef.viewing_schedule?.evening ?? false)
  const [viewingNotes, setViewingNotes] = useState(ef.viewing_schedule?.notes || '')
  const [officeHoursWeekdays, setOfficeHoursWeekdays] = useState(ef.office_hours?.weekdays || '09:00 - 17:00')
  const [officeHoursSaturday, setOfficeHoursSaturday] = useState(ef.office_hours?.saturday || '09:00 - 14:00')
  const [officeHoursSunday, setOfficeHoursSunday] = useState(ef.office_hours?.sunday || 'Closed')
  const [smokingAllowed, setSmokingAllowed] = useState(ef.smokingAllowed || false)
  const [minAge, setMinAge] = useState(ef.minAge || '18')
  const [petsAllowed, setPetsAllowed] = useState(ef.petsAllowed || [])
  const [petDeposit, setPetDeposit] = useState(ef.petDeposit || '')
  const [powerSupplyVoltage, setPowerSupplyVoltage] = useState(ef.powerSupplyVoltage || '')
  const [powerSupplyPhase, setPowerSupplyPhase] = useState(ef.powerSupplyPhase || '')
  const [minAcceptedPrice, setMinAcceptedPrice] = useState(ef.min_accepted_price || '')
  const [offersEnabled, setOffersEnabled] = useState(ef.offers_enabled !== false)
  const [whatsapp, setWhatsapp] = useState(() => {
    if (ef.whatsapp) return ef.whatsapp
    try { const p = JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}'); return p.whatsapp || '' } catch { return '' }
  })

  // ── Kos-specific fields ──
  const [kosTier, setKosTier] = useState(ef.kosTier || '')
  const [kosGender, setKosGender] = useState(ef.kosGender || '')
  const [kosBedType, setKosBedType] = useState(ef.kosBedType || '')
  const [kosMaxOccupants, setKosMaxOccupants] = useState(ef.kosMaxOccupants || '1')
  const [kosRoomFacilities, setKosRoomFacilities] = useState(ef.kosRoomFacilities || [])
  const [kosSharedFacilities, setKosSharedFacilities] = useState(ef.kosSharedFacilities || [])
  const [kosIncluded, setKosIncluded] = useState(ef.kosIncluded || [])
  const [kosExcluded, setKosExcluded] = useState(ef.kosExcluded || [])
  const [kosGuestHours, setKosGuestHours] = useState(ef.kosGuestHours || '22:00')
  const [kosCouplesAllowed, setKosCouplesAllowed] = useState(ef.kosCouplesAllowed || false)
  const [kos24HourAccess, setKos24HourAccess] = useState(ef.kos24HourAccess ?? true)
  const [kosDepositAmount, setKosDepositAmount] = useState(ef.kosDepositAmount || '')
  const [kosMinStay, setKosMinStay] = useState(ef.kosMinStay || '')
  const [kosAvailableRooms, setKosAvailableRooms] = useState(ef.kosAvailableRooms || '')
  const [kosAvailableFrom, setKosAvailableFrom] = useState(ef.kosAvailableFrom || '')

  // ── House/Villa-specific fields ──
  const [landArea, setLandArea] = useState(ef.landArea || '')
  const [buildingArea, setBuildingArea] = useState(ef.buildingArea || '')
  const [numFloors, setNumFloors] = useState(ef.numFloors || '')
  const [numGarages, setNumGarages] = useState(ef.numGarages || '')
  const [electricityCapacity, setElectricityCapacity] = useState(ef.electricityCapacity || '')
  const [waterType, setWaterType] = useState(ef.waterType || '')
  const [certificateType, setCertificateType] = useState(ef.certificateType || '')
  const [facingDirection, setFacingDirection] = useState(ef.facingDirection || '')
  const [yearBuilt, setYearBuilt] = useState(ef.yearBuilt || '')
  const [accessRoadWidth, setAccessRoadWidth] = useState(ef.accessRoadWidth || '')
  const [floodFree, setFloodFree] = useState(ef.floodFree ?? true)
  const [nearTollRoad, setNearTollRoad] = useState(ef.nearTollRoad || false)
  const [nearPublicTransport, setNearPublicTransport] = useState(ef.nearPublicTransport || false)

  // ── Interior Features ──
  const [parkingCar, setParkingCar] = useState(ef.parkingCar || '')
  const [parkingMotorbike, setParkingMotorbike] = useState(ef.parkingMotorbike || '')
  const [kitchenType, setKitchenType] = useState(ef.kitchenType || '')
  const [diningRoom, setDiningRoom] = useState(ef.diningRoom || false)
  const [livingRoom, setLivingRoom] = useState(ef.livingRoom || false)
  const [storageRoom, setStorageRoom] = useState(ef.storageRoom || false)
  const [maidRoom, setMaidRoom] = useState(ef.maidRoom || false)
  const [maidBathroom, setMaidBathroom] = useState(ef.maidBathroom || false)
  const [walkInCloset, setWalkInCloset] = useState(ef.walkInCloset || false)
  const [smartHome, setSmartHome] = useState(ef.smartHome || false)

  // ── Exterior Features ──
  const [frontYard, setFrontYard] = useState(ef.frontYard || false)
  const [terrace, setTerrace] = useState(ef.terrace || false)
  const [gatedProperty, setGatedProperty] = useState(ef.gatedProperty || false)
  const [outdoorKitchen, setOutdoorKitchen] = useState(ef.outdoorKitchen || false)

  // ── Utilities ──
  const [internetAvail, setInternetAvail] = useState(ef.internetAvail || false)
  const [cableTv, setCableTv] = useState(ef.cableTv || false)
  const [drainageSystem, setDrainageSystem] = useState(ef.drainageSystem || false)
  const [septicTank, setSepticTank] = useState(ef.septicTank || false)

  // ── Security ──
  const [security24h, setSecurity24h] = useState(ef.security24h || false)
  const [alarmSystem, setAlarmSystem] = useState(ef.alarmSystem || false)
  const [smartLock, setSmartLock] = useState(ef.smartLock || false)
  const [oneGateSystem, setOneGateSystem] = useState(ef.oneGateSystem || false)

  // ── Complex Facilities ──
  const [elevator, setElevator] = useState(ef.elevator || false)
  const [gym, setGym] = useState(ef.gym || false)
  const [playground, setPlayground] = useState(ef.playground || false)
  const [clubhouse, setClubhouse] = useState(ef.clubhouse || false)
  const [joggingTrack, setJoggingTrack] = useState(ef.joggingTrack || false)
  const [basementParking, setBasementParking] = useState(ef.basementParking || false)
  const [sharedPool, setSharedPool] = useState(ef.sharedPool || false)
  const [mosque, setMosque] = useState(ef.mosque || false)

  // ── Access & Environment ──
  const [cornerLot, setCornerLot] = useState(ef.cornerLot || false)
  const [quietNeighborhood, setQuietNeighborhood] = useState(ef.quietNeighborhood || false)
  const [nearMainRoad, setNearMainRoad] = useState(ef.nearMainRoad || false)
  const [viewType, setViewType] = useState(ef.viewType || '')
  const [nearSchools, setNearSchools] = useState(ef.nearSchools || false)
  const [nearHospital, setNearHospital] = useState(ef.nearHospital || false)
  const [nearShopping, setNearShopping] = useState(ef.nearShopping || false)

  // ── Condition ──
  const [renovationYear, setRenovationYear] = useState(ef.renovationYear || '')
  const [occupancyStatus, setOccupancyStatus] = useState(ef.occupancyStatus || '')

  // ── Construction Details ──
  const [structureType, setStructureType] = useState(ef.structureType || '')
  const [roofType, setRoofType] = useState(ef.roofType || '')
  const [wallMaterial, setWallMaterial] = useState(ef.wallMaterial || '')
  const [flooringType, setFlooringType] = useState(ef.flooringType || '')
  const [foundationType, setFoundationType] = useState(ef.foundationType || '')
  const [buildQuality, setBuildQuality] = useState(ef.buildQuality || '')

  // ── Warranty ──
  const [warrantyStructure, setWarrantyStructure] = useState(ef.warrantyStructure || '')
  const [warrantyRoof, setWarrantyRoof] = useState(ef.warrantyRoof || '')
  const [warrantyWaterproofing, setWarrantyWaterproofing] = useState(ef.warrantyWaterproofing || '')
  const [warrantyElectrical, setWarrantyElectrical] = useState(ef.warrantyElectrical || '')
  const [warrantyDeveloper, setWarrantyDeveloper] = useState(ef.warrantyDeveloper || '')

  // ── All property types — additional fields ──
  const [videoTourUrl, setVideoTourUrl] = useState(ef.videoTourUrl || '')
  const [floorPlanImage, setFloorPlanImage] = useState(ef.floorPlanImage || '')
  const [cancellationPolicy, setCancellationPolicy] = useState(ef.cancellationPolicy || '')
  const [dealHuntEnabled, setDealHuntEnabled] = useState(false)
  const [dealHuntPct, setDealHuntPct] = useState(0)

  // Pricing
  const [nightly, setNightly] = useState(editListing?.price_day || '')
  const [weekly, setWeekly] = useState(editListing?.price_week || '')
  const [monthly, setMonthly] = useState(editListing?.price_month || '')
  const [yearly, setYearly] = useState(editListing?.price_year || ef.yearly || '')
  const [deposit, setDeposit] = useState(ef.deposit || '')
  const [cleaningFee, setCleaningFee] = useState(ef.cleaningFee || '')
  const [lateFee, setLateFee] = useState(ef.lateFee || '')
  const [buyNow, setBuyNow] = useState(!!editListing?.buy_now)
  const [buyNowPrice, setBuyNowPrice] = useState(editListing?.buy_now?.price || '')
  const [negotiable, setNegotiable] = useState(editListing?.buy_now?.negotiable ?? true)

  // Terms
  const [showLocalTerms, setShowLocalTerms] = useState(false)
  const [showTouristTerms, setShowTouristTerms] = useState(false)
  const [localTermsEnabled, setLocalTermsEnabled] = useState(true)
  const [touristTermsEnabled, setTouristTermsEnabled] = useState(true)
  const [showAgreementEditor, setShowAgreementEditor] = useState(false)
  const [agreementEditTab, setAgreementEditTab] = useState('local')
  const ownerProfile = useMemo(() => { try { return JSON.parse(localStorage.getItem('indoo_rental_owner') || '{}') } catch { return {} } }, [])
  const ownerAgreementSaved = !!ownerProfile.rentalAgreement?.accepted
  const [editLocalTerms, setEditLocalTerms] = useState(ownerProfile.rentalAgreement?.local || '')
  const [editTouristTerms, setEditTouristTerms] = useState(ownerProfile.rentalAgreement?.tourist || '')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [editingType, setEditingType] = useState(false)
  const [editingFurnished, setEditingFurnished] = useState(false)
  const [editingFloor, setEditingFloor] = useState(false)
  const [editingBedrooms, setEditingBedrooms] = useState(false)
  const [editingBathrooms, setEditingBathrooms] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showMyListings, setShowMyListings] = useState(false)
  const [previewListingIdx, setPreviewListingIdx] = useState(null)

  const DEMO_LISTINGS = [
    { ref: 'PROP-AB3K7821', category: 'Property', title: 'Villa Sunset 3BR - Seminyak', image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-06_57_42-pm.png', price_day: '850.000', price_week: '5.000.000', price_month: '15.000.000', status: 'live', created_at: '2026-04-15T10:30:00Z', extra_fields: { propType: 'Villa', bedrooms: '3', bathrooms: '2', amenities: ['Pool', 'AC', 'WiFi', 'Kitchen'] } },
    { ref: 'PROP-CD5M2943', category: 'Property', title: 'Kos Exclusive Jakarta Selatan', image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-07_07_33-pm.png', price_day: '150.000', price_month: '3.500.000', status: 'live', created_at: '2026-04-12T08:15:00Z', extra_fields: { propType: 'Kos', bedrooms: '1', bathrooms: '1', amenities: ['AC', 'WiFi', 'Laundry'] } },
    { ref: 'PROP-EF8N4567', category: 'Property', title: 'Studio Apartment Bandung', image: 'https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-10_39_50-pm.png', price_day: '300.000', price_month: '5.000.000', status: 'offline', created_at: '2026-04-10T14:20:00Z', extra_fields: { propType: 'Studio', bedrooms: '1', bathrooms: '1', amenities: ['AC', 'WiFi', 'Parking'] } },
  ]
  const [myListings, setMyListings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('indoo_my_property_listings') || '[]')
      return saved.length > 0 ? saved : DEMO_LISTINGS
    } catch { return DEMO_LISTINGS }
  })

  if (!open) return null

  const autoTitle = [propType, bedrooms && `${bedrooms}BR`, city].filter(Boolean).join(' ')
  const displayTitle = title || (autoTitle ? `${autoTitle} — Rental`.trim() : '')
  const tags = [propType, bedrooms && `${bedrooms} BR`, bathrooms && `${bathrooms} BA`, `${maxGuests} guests`, furnished, petFriendly && 'Pet Friendly', ...amenities.slice(0, 3)].filter(Boolean)

  // Auto-generate description
  const autoDesc = useMemo(() => {
    if (!propType) return ''
    const loc = city ? ` in ${city}` : ''
    const br = bedrooms ? ` ${bedrooms} bedroom${Number(bedrooms) > 1 ? 's' : ''}` : ''
    const ba = bathrooms ? `, ${bathrooms} bathroom${Number(bathrooms) > 1 ? 's' : ''}` : ''
    const sz = sizeSqm ? ` (${sizeSqm} sqm)` : ''
    const furn = furnished ? ` ${furnished}.` : ''
    const amenList = amenities.length > 0 ? ` Amenities include ${amenities.slice(0, 5).join(', ')}.` : ''
    const pet = petFriendly ? ' Pet friendly.' : ''
    const utils = [electricityIncluded && 'electricity', waterIncluded && 'water', internetIncluded && 'internet'].filter(Boolean)
    const utilStr = utils.length > 0 ? ` ${utils.join(', ')} included.` : ''
    const templates = [
      `Beautiful ${propType.toLowerCase()}${br}${ba}${sz} available for rent${loc}.${furn}${amenList}${pet}${utilStr} Perfect for your stay!`,
      `${propType}${br}${ba}${loc}${sz}.${furn}${amenList}${utilStr}${pet} Available for daily, weekly or monthly rental.`,
      `Charming${br} ${propType.toLowerCase()}${loc}${sz}.${furn}${amenList}${pet}${utilStr} Great location, comfortable stay guaranteed.`,
    ]
    return templates[Math.floor(Math.random() * templates.length)]
  }, [propType, bedrooms, bathrooms, sizeSqm, furnished, amenities, city, petFriendly, electricityIncluded, waterIncluded, internetIncluded])

  const priceChange = (k, v) => {
    if (k === 'daily') setNightly(v)
    if (k === 'weekly') setWeekly(v)
    if (k === 'monthly') setMonthly(v)
    if (k === 'deposit') setDeposit(v)
    if (k === 'lateFee') setLateFee(v)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const listing = {
      ref: propRef, category: 'Property', title: title || autoTitle, description: desc || autoDesc, city, image: mainImage,
      images: [mainImage, ...thumbs].filter(Boolean),
      price_day: nightly, price_week: weekly, price_month: monthly, price_year: yearly,
      buy_now: buyNow ? { price: buyNowPrice, negotiable } : null,
      extra_fields: {
        propType, propCategory, rentalType, specialtyTags, leaseDuration,
        address, bedrooms, bathrooms, sizeSqm, furnished, floorLevel, amenities, electricityIncluded, waterIncluded, internetIncluded, checkIn, checkOut, maxGuests, petFriendly, petsAllowed, petDeposit, smokingAllowed, minAge, whatsapp, deposit, cleaningFee, lateFee, yearly, powerSupplyVoltage, powerSupplyPhase,
        // Kos fields
        kosTier, kosGender, kosBedType, kosMaxOccupants, kosRoomFacilities, kosSharedFacilities, kosIncluded, kosExcluded, kosGuestHours, kosCouplesAllowed, kos24HourAccess, kosDepositAmount, kosMinStay, kosAvailableRooms, kosAvailableFrom,
        // House/Villa fields
        landArea, buildingArea, numFloors, numGarages, electricityCapacity, waterType, certificateType, facingDirection, yearBuilt, accessRoadWidth, floodFree, nearTollRoad, nearPublicTransport,
        // Interior
        parkingCar, parkingMotorbike, kitchenType, diningRoom, livingRoom, storageRoom, maidRoom, maidBathroom, walkInCloset, smartHome,
        // Exterior
        frontYard, terrace, gatedProperty, outdoorKitchen,
        // Utilities
        internetAvail, cableTv, drainageSystem, septicTank,
        // Security
        security24h, alarmSystem, smartLock, oneGateSystem,
        // Complex
        elevator, gym, playground, clubhouse, joggingTrack, basementParking, sharedPool, mosque,
        // Access & Environment
        cornerLot, quietNeighborhood, nearMainRoad, viewType, nearSchools, nearHospital, nearShopping,
        // Condition
        renovationYear, occupancyStatus,
        // Construction
        structureType, roofType, wallMaterial, flooringType, foundationType, buildQuality,
        // Warranty
        warrantyStructure, warrantyRoof, warrantyWaterproofing, warrantyElectrical, warrantyDeveloper,
        // Universal fields
        videoTourUrl, floorPlanImage, cancellationPolicy,
        viewing_schedule: { days: viewingDays, morning: viewingMorning, afternoon: viewingAfternoon, evening: viewingEvening, notes: viewingNotes },
        office_hours: { weekdays: officeHoursWeekdays, saturday: officeHoursSaturday, sunday: officeHoursSunday },
        min_accepted_price: minAcceptedPrice ? Number(String(minAcceptedPrice).replace(/\./g, '')) : null,
        offers_enabled: offersEnabled,
      },
      min_accepted_price: minAcceptedPrice ? Number(String(minAcceptedPrice).replace(/\./g, '')) : null,
      offers_enabled: offersEnabled,
      status: 'live',
      created_at: new Date().toISOString(),
    }
    // Save to localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('indoo_my_property_listings') || '[]')
      if (isEditing) {
        const idx = saved.findIndex(l => l.ref === propRef)
        if (idx >= 0) saved[idx] = { ...saved[idx], ...listing }
        else saved.push(listing)
      } else {
        saved.push(listing)
      }
      localStorage.setItem('indoo_my_property_listings', JSON.stringify(saved))
    } catch {}
    await onSubmit?.(listing)
    // Create Deal Hunt entry if enabled
    if (dealHuntEnabled && dealHuntPct > 0) {
      try {
        const { createDealFromListing } = await import('@/services/dealService')
        await createDealFromListing({ listing, discountPct: dealHuntPct, category: 'Property', isSale: !!buyNow })
      } catch (e) { console.warn('Deal Hunt listing failed:', e) }
    }
    setSubmitting(false); setStep(5)
    // After 5 seconds, show success
    setTimeout(() => setStep(6), 5000)
  }

  return createPortal(
    <div className={styles.screen} style={{ backgroundImage: 'url(https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-may-2-2026-02_15_43-am.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>

      <FormHeader step={step} setStep={setStep} onClose={onClose} setShowDrawer={setShowDrawer} />

      {/* Settings Side Drawer */}
      <SettingsDrawer showDrawer={showDrawer} setShowDrawer={setShowDrawer} menuItems={[
        { icon: '', img: PROPERTY_DIRECTORY[0]?.image, label: 'My Listings', sub: `${myListings.length} listing${myListings.length !== 1 ? 's' : ''}`, action: () => { setShowDrawer(false); setShowMyListings(true) } },
        { icon: '\ud83d\udccb', label: 'Rental Agreement', sub: 'Update local & tourist terms', action: () => { setShowDrawer(false); setShowAgreementEditor(true) } },
        { icon: '\ud83d\udcc5', label: 'Booking Calendar', sub: 'View & manage bookings' },
        { icon: '\ud83d\udcca', label: 'Rental Shop Stats', sub: 'Views, bookings & revenue' },
        { icon: '\ud83d\udcc4', label: 'Terms of Rental Service', sub: 'Policies & conditions' },
      ]} />

      <div className={styles.content} style={{ paddingTop: 97 }}>

        {/* ── Hero Slogan ── */}
        {step < 5 && (
          <div style={{ textAlign: 'center', padding: '0 16px 20px' }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>Indonesia's Most Advanced Property Marketplace</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 500, lineHeight: 1.5, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>Your property deserves the best showcase. List with INDOO and reach millions of buyers and renters across Indonesia.</p>
          </div>
        )}

        {/* ═══ STEP 5: ENTERING MARKETPLACE — ping animation ═══ */}
        {step === 5 && <ProcessingStep isEditing={isEditing} emoji={"🏠"} vehicleName="Property" refCode={propRef} />}

        {/* ═══ STEP 6: SUCCESS ═══ */}
        {step === 6 && <SuccessStep isEditing={isEditing} refCode={propRef} summaryTitle={`${propertyName || title}`} summaryDetails={`${propertyType} \u00b7 ${bedrooms} bed \u00b7 ${bathrooms} bath`} summaryPrice={daily ? `Rp ${daily}/day` : monthly ? `Rp ${monthly}/month` : ""} onClose={onClose} onViewMyListings={() => { setMyListings(JSON.parse(localStorage.getItem("indoo_my_listings") || "[]")); setShowMyListings(true) }} itemName="property" />}

        {/* ═══ STEP 0: PROPERTY DETAILS ═══ */}
        {step === 0 && (
          <div className={styles.form}>

            {/* ── SHOWROOM STAGE ── */}
            <PropertyShowroom propType={propType} onSelectProperty={(prop) => {
              setPropType(prop.type)
              setBedrooms(String(prop.bedrooms))
              if (!title) setTitle(prop.name)
            }} />

            {/* ── Category Selector ── */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', marginTop: 23, boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Property Category</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Select category, then property type</p>

              {/* Category tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {PROPERTY_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => { setPropCategory(cat.id); if (!cat.types.find(t => t.id === propType)) setPropType(cat.types[0]?.id || '') }} style={{ flex: 1, padding: '10px 6px', borderRadius: 12, border: propCategory === cat.id ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.06)', background: propCategory === cat.id ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{cat.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: propCategory === cat.id ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{cat.label}</div>
                    <div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.15)' }}>{cat.labelId}</div>
                  </button>
                ))}
              </div>

              {/* Property types for selected category */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 4 }}>
                {(PROPERTY_CATEGORIES.find(c => c.id === propCategory)?.types || []).map(t => (
                  <button key={t.id} onClick={() => setPropType(t.id)} style={{ padding: '10px 6px', borderRadius: 10, border: propType === t.id ? '1.5px solid #FACC15' : '1.5px solid rgba(255,255,255,0.06)', background: propType === t.id ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: propType === t.id ? '#FACC15' : 'rgba(255,255,255,0.5)' }}>{t.label}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: propType === t.id ? 'rgba(250,204,21,0.6)' : 'rgba(255,255,255,0.15)' }}>{t.labelId}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Rental Type ── */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Rental Type</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {RENTAL_TYPE_OPTIONS.map(r => (
                  <button key={r.id} onClick={() => setRentalType(r.id)} style={{ flex: 1, padding: '12px 6px', borderRadius: 12, border: rentalType === r.id ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.06)', background: rentalType === r.id ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{r.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: rentalType === r.id ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{r.label}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>{r.labelId}</div>
                  </button>
                ))}
              </div>

              {/* Lease Duration */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Preferred Duration</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {LEASE_DURATION_OPTIONS.map(d => (
                  <button key={d} onClick={() => setLeaseDuration(leaseDuration === d ? '' : d)} style={{ padding: '7px 12px', borderRadius: 8, border: leaseDuration === d ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.06)', background: leaseDuration === d ? 'rgba(141,198,63,0.1)' : 'rgba(255,255,255,0.02)', color: leaseDuration === d ? '#8DC63F' : 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{d}</button>
                ))}
              </div>
            </div>

            {/* ── Property Details ── */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Property Details</h2>
              <div className={styles.inlineGroup}>
                {/* Bedrooms — hide for land/parking/storage */}
                {!['Tanah', 'Parking', 'Storage', 'Event Space'].includes(propType) && (
                  <PickerField label="Bedrooms" value={bedrooms} onChange={setBedrooms} options={BEDROOM_OPTIONS} placeholder="2" editing={editingBedrooms} setEditing={setEditingBedrooms} styles={styles} cols={5} />
                )}
                {!['Tanah', 'Parking', 'Storage', 'Event Space'].includes(propType) && (
                  <PickerField label="Bathrooms" value={bathrooms} onChange={setBathrooms} options={BATHROOM_OPTIONS} placeholder="1" editing={editingBathrooms} setEditing={setEditingBathrooms} styles={styles} cols={5} />
                )}
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Size</span>
                  <input className={`${styles.inlineInput} ${!sizeSqm ? styles.inlineInputEmpty : ''}`} value={sizeSqm} onChange={e => setSizeSqm(e.target.value.replace(/[^0-9]/g, ''))} placeholder="45" inputMode="numeric" />
                  {sizeSqm && <span className={styles.inlineSuffix}>sqm</span>}
                </div>
                {!['Tanah', 'Parking', 'Storage'].includes(propType) && (
                  <PickerField label="Furnished" value={furnished} onChange={setFurnished} options={FURNISHED_OPTIONS} placeholder="Fully Furnished" editing={editingFurnished} setEditing={setEditingFurnished} styles={styles} />
                )}
                {['Apartment', 'Kos', 'Penthouse', 'Studio', 'Condominium', 'Serviced Apartment', 'Co-working', 'Office'].includes(propType) && (
                  <PickerField label="Floor" value={floorLevel} onChange={setFloorLevel} options={FLOOR_OPTIONS} placeholder="Ground" editing={editingFloor} setEditing={setEditingFloor} styles={styles} cols={4} />
                )}
                {!['Tanah', 'Parking', 'Storage'].includes(propType) && (
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Max Guests</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => setMaxGuests(String(Math.max(1, Number(maxGuests) - 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>-</button>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', minWidth: 16, textAlign: 'center' }}>{maxGuests}</span>
                      <button onClick={() => setMaxGuests(String(Math.min(20, Number(maxGuests) + 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Specialty Tags ── */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(250,204,21,0.15)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(250,204,21,0.04)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, color: '#FACC15', textShadow: '0 0 12px rgba(250,204,21,0.4)' }}>Specialty Tags</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Optional — highlight what makes your property special</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {SPECIALTY_TAGS.map(tag => {
                  const active = specialtyTags.includes(tag.id)
                  return (
                    <button key={tag.id} onClick={() => setSpecialtyTags(prev => active ? prev.filter(t => t !== tag.id) : [...prev, tag.id])} style={{ padding: '10px 4px', borderRadius: 10, border: active ? '1.5px solid rgba(250,204,21,0.3)' : '1.5px solid rgba(255,255,255,0.06)', background: active ? 'rgba(250,204,21,0.08)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 16, marginBottom: 3 }}>{tag.icon}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: active ? '#FACC15' : 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>{tag.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: PHOTOS + INFO + AMENITIES + RULES ═══ */}
        {step === 1 && (
          <div className={styles.form} style={{ paddingTop: 150 }}>

            {/* ── Photos ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Property Photos</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>No watermarks. Main + up to 4 thumbnails</p>
              <ImageUploader mainImage={mainImage} thumbImages={thumbs.slice(0, 4)} onSetMain={setMainImage} onAddThumb={u => { if (thumbs.length < 4) setThumbs(p => [...p, u]) }} onRemoveThumb={i => setThumbs(p => p.filter((_, j) => j !== i))} onRemoveMain={() => setMainImage('')} />
            </div>

            {/* ── Video Tour ── */}
            <VideoUpload listingRef={propRef} existingUrl={videoTourUrl} onVideoUploaded={(url) => setVideoTourUrl(url || '')} />

            {/* ── Listing Info ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Listing Info</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Title, description & contact</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              {/* Auto-filled property info */}
              {propType && (
                <div style={{ padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {propType && <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD700', background: 'rgba(255,215,0,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,215,0,0.15)' }}>{propType}</span>}
                  {bedrooms && <span style={{ fontSize: 11, fontWeight: 700, color: '#8DC63F', background: 'rgba(141,198,63,0.08)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(141,198,63,0.15)' }}>{bedrooms} BR</span>}
                  {bathrooms && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{bathrooms} BA</span>}
                  {sizeSqm && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{sizeSqm} sqm</span>}
                  {furnished && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{furnished}</span>}
                </div>
              )}
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Title</span>
                  <input className={styles.inlineInput} value={title || autoTitle} onChange={e => { if (e.target.value.length <= 80) setTitle(e.target.value) }} placeholder="Villa Sunset 3BR - Seminyak" maxLength={80} />
                </div>
                <div className={styles.inlineField} style={{ alignItems: 'flex-start', paddingTop: 16 }}>
                  <span className={styles.inlineLabel} style={{ paddingTop: 2 }}>Description</span>
                  <div style={{ flex: 1 }}>
                    <textarea
                      className={styles.inlineInput}
                      style={{ resize: 'none', minHeight: 100, display: 'block', width: '100%', overflow: 'hidden', height: 'auto' }}
                      value={desc || autoDesc}
                      onChange={e => { if (e.target.value.length <= 1500) setDesc(e.target.value) }}
                      placeholder="Property features, neighborhood, views..."
                      rows={5}
                      onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
                    />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', float: 'right' }}>{(desc || autoDesc).length}/1,500</span>
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Location</span>
                  <input className={styles.inlineInput} value={city} onChange={e => setCity(e.target.value)} placeholder="Seminyak, Bali" />
                  <button onClick={() => { setCity('Detecting...'); navigator.geolocation.getCurrentPosition(async (pos) => { try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`); const d = await r.json(); setCity([d.address?.city, d.address?.town, d.address?.village, d.address?.state].filter(Boolean).slice(0, 2).join(', ') || 'Location set') } catch { setCity('Location set') } }, () => setCity(''), { enableHighAccuracy: true, timeout: 10000 }) }} style={{ background: 'none', border: 'none', color: '#8DC63F', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', padding: '0 0 0 8px' }}>GPS</button>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Address</span>
                  <input className={styles.inlineInput} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area, postal code" />
                </div>
                <div className={styles.inlineField} style={{ opacity: 0.5, pointerEvents: 'none', position: 'relative' }}>
                  <span className={styles.inlineLabel}>WhatsApp</span>
                  <input className={styles.inlineInput} value={whatsapp ? whatsapp.slice(0, 4) + '--------' : ''} readOnly placeholder="Locked" type="tel" style={{ cursor: 'not-allowed' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#FFD700', letterSpacing: '0.04em' }}>PRO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Amenities — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Amenities</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Select all amenities available</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {AMENITIES.map(a => {
                  const active = amenities.includes(a)
                  return (
                    <button key={a} onClick={() => setAmenities(prev => active ? prev.filter(x => x !== a) : [...prev, a])} style={{
                      padding: '12px 6px', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                      background: active ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)',
                      border: active ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)',
                      boxShadow: active ? '0 0 12px rgba(141,198,63,0.15), inset 0 0 6px rgba(141,198,63,0.05)' : 'none',
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{AMENITY_ICONS[a]}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{a}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Viewing & Office Hours — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Viewing Schedule</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>When can potential tenants visit?</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              {/* Day selector pills */}
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Available Days</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {[{ id: 'mon', label: 'Mon' }, { id: 'tue', label: 'Tue' }, { id: 'wed', label: 'Wed' }, { id: 'thu', label: 'Thu' }, { id: 'fri', label: 'Fri' }, { id: 'sat', label: 'Sat' }, { id: 'sun', label: 'Sun' }].map(d => {
                  const active = viewingDays.includes(d.id)
                  return (
                    <button key={d.id} onClick={() => setViewingDays(prev => active ? prev.filter(x => x !== d.id) : [...prev, d.id])} style={{
                      padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                      background: active ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)',
                      border: active ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)',
                      color: active ? '#8DC63F' : 'rgba(255,255,255,0.3)',
                      boxShadow: active ? '0 0 10px rgba(141,198,63,0.12)' : 'none',
                    }}>
                      {d.label}
                    </button>
                  )
                })}
              </div>

              {/* Time slot toggles */}
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Preferred Time Slots</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {[{ label: 'Morning', sub: '09:00 - 12:00', value: viewingMorning, set: setViewingMorning }, { label: 'Afternoon', sub: '13:00 - 17:00', value: viewingAfternoon, set: setViewingAfternoon }, { label: 'Evening', sub: '17:00 - 20:00', value: viewingEvening, set: setViewingEvening }].map(slot => (
                  <button key={slot.label} onClick={() => slot.set(!slot.value)} style={{
                    flex: 1, minWidth: 90, padding: '10px 8px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.2s',
                    background: slot.value ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)',
                    border: slot.value ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)',
                    boxShadow: slot.value ? '0 0 12px rgba(141,198,63,0.15)' : 'none',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: slot.value ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{slot.label}</div>
                    <div style={{ fontSize: 10, color: slot.value ? 'rgba(141,198,63,0.6)' : 'rgba(255,255,255,0.15)', marginTop: 2 }}>{slot.sub}</div>
                  </button>
                ))}
              </div>

              {/* Notes input */}
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Special Instructions</p>
              <input
                className={styles.inlineInput}
                value={viewingNotes}
                onChange={e => setViewingNotes(e.target.value)}
                placeholder="e.g. Call before visiting, gate code required..."
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 14 }}
              />

              {/* Office hours */}
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Office Hours</p>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel} style={{ minWidth: 70 }}>Weekdays</span>
                  <input className={styles.inlineInput} value={officeHoursWeekdays} onChange={e => setOfficeHoursWeekdays(e.target.value)} placeholder="09:00 - 17:00" style={{ flex: 1 }} />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel} style={{ minWidth: 70 }}>Saturday</span>
                  <input className={styles.inlineInput} value={officeHoursSaturday} onChange={e => setOfficeHoursSaturday(e.target.value)} placeholder="09:00 - 14:00" style={{ flex: 1 }} />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel} style={{ minWidth: 70 }}>Sunday</span>
                  <input className={styles.inlineInput} value={officeHoursSunday} onChange={e => setOfficeHoursSunday(e.target.value)} placeholder="Closed" style={{ flex: 1 }} />
                </div>
              </div>
            </div>

            {/* ── Utilities ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Utilities Included</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>What's included in the rental price</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Electricity</span>
                  <button onClick={() => setElectricityIncluded(!electricityIncluded)} style={{ background: 'none', border: 'none', color: electricityIncluded ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {electricityIncluded ? 'Included' : 'Not included'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setElectricityIncluded(!electricityIncluded)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Water</span>
                  <button onClick={() => setWaterIncluded(!waterIncluded)} style={{ background: 'none', border: 'none', color: waterIncluded ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {waterIncluded ? 'Included' : 'Not included'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setWaterIncluded(!waterIncluded)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Internet</span>
                  <button onClick={() => setInternetIncluded(!internetIncluded)} style={{ background: 'none', border: 'none', color: internetIncluded ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {internetIncluded ? 'Included' : 'Not included'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setInternetIncluded(!internetIncluded)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── House Rules ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>House Rules</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Check-in/out, pets & smoking policy</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Check-in</span>
                  <input className={styles.inlineInput} type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Check-out</span>
                  <input className={styles.inlineInput} type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Min Age</span>
                  <input className={styles.inlineInput} value={minAge} onChange={e => setMinAge(e.target.value.replace(/[^0-9]/g, ''))} placeholder="18" inputMode="numeric" />
                  <span className={styles.inlineSuffix}>years</span>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Pets Allowed</span>
                  <button onClick={() => setPetFriendly(!petFriendly)} style={{ background: 'none', border: 'none', color: petFriendly ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {petFriendly ? 'Yes' : 'No'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setPetFriendly(!petFriendly)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                {/* Pet details — show when pets allowed */}
                {petFriendly && (
                  <>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Pet Types</span>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                        {PET_TYPE_OPTIONS.map(pt => (
                          <button key={pt} onClick={() => setPetsAllowed(prev => prev.includes(pt) ? prev.filter(x => x !== pt) : [...prev, pt])} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: petsAllowed.includes(pt) ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.03)', border: petsAllowed.includes(pt) ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)', color: petsAllowed.includes(pt) ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{pt}</button>
                        ))}
                      </div>
                    </div>
                    <div className={styles.inlineField}>
                      <span className={styles.inlineLabel}>Pet Deposit</span>
                      <input className={styles.inlineInput} value={petDeposit} onChange={e => setPetDeposit(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="e.g. 500.000" inputMode="text" />
                      {petDeposit && <span className={styles.inlineSuffix}>Rp</span>}
                    </div>
                  </>
                )}
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Smoking</span>
                  <button onClick={() => setSmokingAllowed(!smokingAllowed)} style={{ background: 'none', border: 'none', color: smokingAllowed ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                    {smokingAllowed ? 'Allowed' : 'Not allowed'}
                  </button>
                  <button className={styles.inlineEditBtn} onClick={() => setSmokingAllowed(!smokingAllowed)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Buy Now — glass container ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Buy Now Price</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>List your property for sale</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Price</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={buyNowPrice} onChange={e => { const raw = e.target.value.replace(/[^0-9.]/g, ''); setBuyNowPrice(raw); setBuyNow(!!raw) }} placeholder="500.000.000" inputMode="decimal" />
                </div>
                {buyNowPrice && (
                  <div style={{ padding: '4px 0 8px', fontSize: 15, fontWeight: 800, color: '#8DC63F' }}>
                    Rp {buyNowPrice}{Number(buyNowPrice.replace(/\./g, '')) >= 1000000 && ` (${Math.round(Number(buyNowPrice.replace(/\./g, '')) / 1000000)}jt)`}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ═══ STEP 2: ADVANCED DETAILS (Kos / House / Universal) ═══ */}
        {step === 2 && (
          <div className={styles.form} style={{ paddingTop: 150 }}>

            {/* ── KOS-SPECIFIC FIELDS ── */}
            {propType === 'Kos' && (
              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
                <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Kos Details</h2>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Tier, gender, bed type & capacity</p>
                <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

                <div className={styles.inlineGroup}>
                  {/* Kos Tier */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Kos Tier</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                      {KOS_TIER_OPTIONS.map(t => (
                        <button key={t} onClick={() => setKosTier(t)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: kosTier === t ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: kosTier === t ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: kosTier === t ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* Gender Restriction */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Gender</span>
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      {KOS_GENDER_OPTIONS.map(g => (
                        <button key={g} onClick={() => setKosGender(g)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: kosGender === g ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: kosGender === g ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: kosGender === g ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{g}</button>
                      ))}
                    </div>
                  </div>

                  {/* Bed Type */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Bed Type</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                      {KOS_BED_TYPE_OPTIONS.map(b => (
                        <button key={b} onClick={() => setKosBedType(b)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: kosBedType === b ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: kosBedType === b ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: kosBedType === b ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{b}</button>
                      ))}
                    </div>
                  </div>

                  {/* Max Occupants */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Max Occupants</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => setKosMaxOccupants(String(Math.max(1, Number(kosMaxOccupants) - 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>-</button>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', minWidth: 16, textAlign: 'center' }}>{kosMaxOccupants}</span>
                      <button onClick={() => setKosMaxOccupants(String(Math.min(4, Number(kosMaxOccupants) + 1)))} style={{ width: 24, height: 24, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                    </div>
                  </div>

                  {/* Available Rooms */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Available Rooms</span>
                    <input className={`${styles.inlineInput} ${!kosAvailableRooms ? styles.inlineInputEmpty : ''}`} value={kosAvailableRooms} onChange={e => setKosAvailableRooms(e.target.value.replace(/[^0-9]/g, ''))} placeholder="5" inputMode="numeric" />
                    <span className={styles.inlineSuffix}>rooms</span>
                  </div>

                  {/* Available From */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Available From</span>
                    <input className={styles.inlineInput} type="date" value={kosAvailableFrom} onChange={e => setKosAvailableFrom(e.target.value)} />
                  </div>

                  {/* Minimum Stay */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Min Stay</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                      {KOS_MIN_STAY_OPTIONS.map(s => (
                        <button key={s} onClick={() => setKosMinStay(s)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: kosMinStay === s ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: kosMinStay === s ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: kosMinStay === s ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{s}</button>
                      ))}
                    </div>
                  </div>

                  {/* Deposit */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Deposit</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                    <input className={`${styles.inlineInput} ${!kosDepositAmount ? styles.inlineInputEmpty : ''}`} value={kosDepositAmount} onChange={e => setKosDepositAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="500.000" inputMode="decimal" />
                  </div>
                </div>
              </div>
            )}

            {/* ── KOS ROOM FACILITIES ── */}
            {propType === 'Kos' && (
              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
                <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Room Facilities</h2>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>In-room amenities</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {KOS_ROOM_FACILITIES.map(f => {
                    const active = kosRoomFacilities.includes(f)
                    return (
                      <button key={f} onClick={() => setKosRoomFacilities(prev => active ? prev.filter(x => x !== f) : [...prev, f])} style={{
                        padding: '12px 6px', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                        background: active ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)',
                        border: active ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)',
                        boxShadow: active ? '0 0 12px rgba(141,198,63,0.15)' : 'none',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{f}</div>
                      </button>
                    )
                  })}
                </div>

                <h3 style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', margin: '14px 0 8px' }}>Shared Facilities</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {KOS_SHARED_FACILITIES.map(f => {
                    const active = kosSharedFacilities.includes(f)
                    return (
                      <button key={f} onClick={() => setKosSharedFacilities(prev => active ? prev.filter(x => x !== f) : [...prev, f])} style={{
                        padding: '12px 6px', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                        background: active ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)',
                        border: active ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)',
                        boxShadow: active ? '0 0 12px rgba(141,198,63,0.15)' : 'none',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{f}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── KOS INCLUSIONS & RULES ── */}
            {propType === 'Kos' && (
              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
                <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Inclusions & Rules</h2>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>What is and isn't included in rent</p>
                <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

                <h3 style={{ fontSize: 11, fontWeight: 800, color: '#8DC63F', margin: '0 0 8px' }}>Included in Rent</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {KOS_INCLUDED_OPTIONS.map(o => {
                    const active = kosIncluded.includes(o)
                    return (
                      <button key={o} onClick={() => setKosIncluded(prev => active ? prev.filter(x => x !== o) : [...prev, o])} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: active ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: active ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: active ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    )
                  })}
                </div>

                <h3 style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', margin: '0 0 8px' }}>Excluded (Extra Cost)</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {KOS_EXCLUDED_OPTIONS.map(o => {
                    const active = kosExcluded.includes(o)
                    return (
                      <button key={o} onClick={() => setKosExcluded(prev => active ? prev.filter(x => x !== o) : [...prev, o])} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: active ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)', border: active ? '1.5px solid rgba(239,68,68,0.3)' : '1.5px solid rgba(255,255,255,0.08)', color: active ? '#EF4444' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    )
                  })}
                </div>

                <div className={styles.inlineGroup}>
                  {/* Guest Visiting Hours */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Guest Hours Until</span>
                    <input className={styles.inlineInput} type="time" value={kosGuestHours} onChange={e => setKosGuestHours(e.target.value)} />
                  </div>

                  {/* Couples/Opposite Gender */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Couples Allowed</span>
                    <button onClick={() => setKosCouplesAllowed(!kosCouplesAllowed)} style={{ background: 'none', border: 'none', color: kosCouplesAllowed ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                      {kosCouplesAllowed ? 'Yes' : 'No'}
                    </button>
                  </div>

                  {/* 24-hour Access */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>24-Hour Access</span>
                    <button onClick={() => setKos24HourAccess(!kos24HourAccess)} style={{ background: 'none', border: 'none', color: kos24HourAccess ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                      {kos24HourAccess ? 'Yes' : 'No'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── HOUSE/VILLA-SPECIFIC FIELDS ── */}
            {(propType === 'House' || propType === 'Villa') && (
              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
                <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Property Specifications</h2>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Land, building & infrastructure details</p>
                <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

                <div className={styles.inlineGroup}>
                  {/* Land Area */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Land Area</span>
                    <input className={`${styles.inlineInput} ${!landArea ? styles.inlineInputEmpty : ''}`} value={landArea} onChange={e => setLandArea(e.target.value.replace(/[^0-9]/g, ''))} placeholder="200" inputMode="numeric" />
                    <span className={styles.inlineSuffix}>m2</span>
                  </div>

                  {/* Building Area */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Building Area</span>
                    <input className={`${styles.inlineInput} ${!buildingArea ? styles.inlineInputEmpty : ''}`} value={buildingArea} onChange={e => setBuildingArea(e.target.value.replace(/[^0-9]/g, ''))} placeholder="150" inputMode="numeric" />
                    <span className={styles.inlineSuffix}>m2</span>
                  </div>

                  {/* Number of Floors */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Floors</span>
                    <input className={`${styles.inlineInput} ${!numFloors ? styles.inlineInputEmpty : ''}`} value={numFloors} onChange={e => setNumFloors(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2" inputMode="numeric" />
                  </div>

                  {/* Garages/Carports */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Garage/Carport</span>
                    <input className={`${styles.inlineInput} ${!numGarages ? styles.inlineInputEmpty : ''}`} value={numGarages} onChange={e => setNumGarages(e.target.value.replace(/[^0-9]/g, ''))} placeholder="1" inputMode="numeric" />
                  </div>

                  {/* Electricity Capacity */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Electricity</span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                      {ELECTRICITY_CAPACITY_OPTIONS.map(e => (
                        <button key={e} onClick={() => setElectricityCapacity(e)} style={{ padding: '5px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: electricityCapacity === e ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: electricityCapacity === e ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: electricityCapacity === e ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{e}</button>
                      ))}
                    </div>
                  </div>

                  {/* Water Type */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Water Source</span>
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      {WATER_TYPE_OPTIONS.map(w => (
                        <button key={w} onClick={() => setWaterType(w)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: waterType === w ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: waterType === w ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: waterType === w ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{w}</button>
                      ))}
                    </div>
                  </div>

                  {/* Certificate Type */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Certificate</span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                      {CERTIFICATE_TYPE_OPTIONS.map(c => (
                        <button key={c} onClick={() => setCertificateType(c)} style={{ padding: '5px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: certificateType === c ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: certificateType === c ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: certificateType === c ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{c}</button>
                      ))}
                    </div>
                  </div>

                  {/* Facing Direction */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Facing</span>
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      {FACING_DIRECTION_OPTIONS.map(d => (
                        <button key={d} onClick={() => setFacingDirection(d)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: facingDirection === d ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: facingDirection === d ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: facingDirection === d ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{d}</button>
                      ))}
                    </div>
                  </div>

                  {/* Year Built */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Year Built</span>
                    <input className={`${styles.inlineInput} ${!yearBuilt ? styles.inlineInputEmpty : ''}`} value={yearBuilt} onChange={e => setYearBuilt(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2020" inputMode="numeric" maxLength={4} />
                  </div>

                  {/* Access Road Width */}
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Road Width</span>
                    <input className={`${styles.inlineInput} ${!accessRoadWidth ? styles.inlineInputEmpty : ''}`} value={accessRoadWidth} onChange={e => setAccessRoadWidth(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="6" inputMode="decimal" />
                    <span className={styles.inlineSuffix}>meters</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── HOUSE/VILLA LOCATION FEATURES ── */}
            {(propType === 'House' || propType === 'Villa') && (
              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
                <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Location Features</h2>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Environment & accessibility</p>
                <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

                <div className={styles.inlineGroup}>
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Flood Free</span>
                    <button onClick={() => setFloodFree(!floodFree)} style={{ background: 'none', border: 'none', color: floodFree ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                      {floodFree ? 'Yes' : 'No'}
                    </button>
                  </div>
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Near Toll Road</span>
                    <button onClick={() => setNearTollRoad(!nearTollRoad)} style={{ background: 'none', border: 'none', color: nearTollRoad ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                      {nearTollRoad ? 'Yes' : 'No'}
                    </button>
                  </div>
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Near Public Transport</span>
                    <button onClick={() => setNearPublicTransport(!nearPublicTransport)} style={{ background: 'none', border: 'none', color: nearPublicTransport ? '#8DC63F' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0, flex: 1, textAlign: 'left' }}>
                      {nearPublicTransport ? 'Yes' : 'No'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── POWER SUPPLY (Gudang / Pabrik / Storage) ── */}
            {['Gudang', 'Pabrik', 'Storage'].includes(propType) && (
              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(250,204,21,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(250,204,21,0.06)', position: 'relative', zIndex: 1 }}>
                <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, color: '#FACC15', textShadow: '0 0 12px rgba(250,204,21,0.4)' }}>Power Supply</h2>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Electrical capacity and voltage for industrial use</p>
                <div className={styles.inlineGroup}>
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Voltage</span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                      {POWER_VOLTAGE_OPTIONS.map(v => (
                        <button key={v} onClick={() => setPowerSupplyVoltage(v)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: powerSupplyVoltage === v ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.03)', border: powerSupplyVoltage === v ? '1.5px solid rgba(250,204,21,0.3)' : '1.5px solid rgba(255,255,255,0.06)', color: powerSupplyVoltage === v ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Phase</span>
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      {POWER_PHASE_OPTIONS.map(ph => (
                        <button key={ph} onClick={() => setPowerSupplyPhase(ph)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', background: powerSupplyPhase === ph ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.03)', border: powerSupplyPhase === ph ? '1.5px solid rgba(250,204,21,0.3)' : '1.5px solid rgba(255,255,255,0.06)', color: powerSupplyPhase === ph ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>{ph}</button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.inlineField}>
                    <span className={styles.inlineLabel}>Capacity</span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                      {ELECTRICITY_KVA_OPTIONS.map(k => (
                        <button key={k} onClick={() => setElectricityCapacity(k)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: electricityCapacity === k ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.03)', border: electricityCapacity === k ? '1.5px solid rgba(250,204,21,0.3)' : '1.5px solid rgba(255,255,255,0.06)', color: electricityCapacity === k ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>{k}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── INTERIOR FEATURES (all types) ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Interior Features</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Rooms & indoor amenities</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Dining Room', val: diningRoom, set: setDiningRoom },
                  { label: 'Living Room', val: livingRoom, set: setLivingRoom },
                  { label: 'Storage Room', val: storageRoom, set: setStorageRoom },
                  { label: 'Maid Room', val: maidRoom, set: setMaidRoom },
                  { label: 'Maid Bathroom', val: maidBathroom, set: setMaidBathroom },
                  { label: 'Walk-in Closet', val: walkInCloset, set: setWalkInCloset },
                  { label: 'Smart Home', val: smartHome, set: setSmartHome },
                ].map(item => (
                  <button key={item.label} onClick={() => item.set(!item.val)} style={{ padding: '10px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', border: item.val ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)', background: item.val ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.val ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                  </button>
                ))}
              </div>

              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Kitchen Type</span>
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    {['Standard', 'Modern', 'Open'].map(o => (
                      <button key={o} onClick={() => setKitchenType(o)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: kitchenType === o ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: kitchenType === o ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: kitchenType === o ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Parking Car</span>
                  <input className={`${styles.inlineInput} ${!parkingCar ? styles.inlineInputEmpty : ''}`} value={parkingCar} onChange={e => setParkingCar(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" inputMode="numeric" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Parking Motorbike</span>
                  <input className={`${styles.inlineInput} ${!parkingMotorbike ? styles.inlineInputEmpty : ''}`} value={parkingMotorbike} onChange={e => setParkingMotorbike(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" inputMode="numeric" />
                </div>
              </div>
            </div>

            {/* ── EXTERIOR FEATURES (all types) ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Exterior Features</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Outdoor spaces</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Front Yard', val: frontYard, set: setFrontYard },
                  { label: 'Terrace/Patio', val: terrace, set: setTerrace },
                  { label: 'Gated Property', val: gatedProperty, set: setGatedProperty },
                  { label: 'Outdoor Kitchen/BBQ', val: outdoorKitchen, set: setOutdoorKitchen },
                ].map(item => (
                  <button key={item.label} onClick={() => item.set(!item.val)} style={{ padding: '10px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', border: item.val ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)', background: item.val ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.val ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── UTILITIES (all types) ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Utilities & Infrastructure</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Services available</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Internet', val: internetAvail, set: setInternetAvail },
                  { label: 'Cable TV', val: cableTv, set: setCableTv },
                  { label: 'Drainage System', val: drainageSystem, set: setDrainageSystem },
                  { label: 'Septic Tank', val: septicTank, set: setSepticTank },
                ].map(item => (
                  <button key={item.label} onClick={() => item.set(!item.val)} style={{ padding: '10px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', border: item.val ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)', background: item.val ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.val ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── SECURITY (all types) ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Security Features</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Safety & access control</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: '24h Security', val: security24h, set: setSecurity24h },
                  { label: 'Alarm System', val: alarmSystem, set: setAlarmSystem },
                  { label: 'Smart Lock', val: smartLock, set: setSmartLock },
                  { label: 'One Gate System', val: oneGateSystem, set: setOneGateSystem },
                ].map(item => (
                  <button key={item.label} onClick={() => item.set(!item.val)} style={{ padding: '10px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', border: item.val ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)', background: item.val ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.val ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── COMPLEX FACILITIES (all types) ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Building Facilities</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Shared complex amenities</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Elevator', val: elevator, set: setElevator },
                  { label: 'Gym', val: gym, set: setGym },
                  { label: 'Playground', val: playground, set: setPlayground },
                  { label: 'Clubhouse', val: clubhouse, set: setClubhouse },
                  { label: 'Jogging Track', val: joggingTrack, set: setJoggingTrack },
                  { label: 'Basement Parking', val: basementParking, set: setBasementParking },
                  { label: 'Shared Pool', val: sharedPool, set: setSharedPool },
                  { label: 'Mosque', val: mosque, set: setMosque },
                ].map(item => (
                  <button key={item.label} onClick={() => item.set(!item.val)} style={{ padding: '10px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', border: item.val ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)', background: item.val ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.val ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── ACCESS & ENVIRONMENT (all types) ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Location Features</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Surroundings & access</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Corner Lot', val: cornerLot, set: setCornerLot },
                  { label: 'Quiet Area', val: quietNeighborhood, set: setQuietNeighborhood },
                  { label: 'Near Main Road', val: nearMainRoad, set: setNearMainRoad },
                  { label: 'Near Schools', val: nearSchools, set: setNearSchools },
                  { label: 'Near Hospital', val: nearHospital, set: setNearHospital },
                  { label: 'Near Shopping', val: nearShopping, set: setNearShopping },
                ].map(item => (
                  <button key={item.label} onClick={() => item.set(!item.val)} style={{ padding: '10px 8px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit', border: item.val ? '1.5px solid rgba(141,198,63,0.3)' : '1.5px solid rgba(255,255,255,0.06)', background: item.val ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.val ? '#8DC63F' : 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                  </button>
                ))}
              </div>

              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>View Type</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                    {['No View', 'Sea View', 'Mountain View', 'City View', 'Garden View', 'Pool View'].map(o => (
                      <button key={o} onClick={() => setViewType(o)} style={{ padding: '5px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: viewType === o ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: viewType === o ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: viewType === o ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── CONDITION & STATUS (all types) ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Condition & Status</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Current state</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Renovation Year</span>
                  <input className={`${styles.inlineInput} ${!renovationYear ? styles.inlineInputEmpty : ''}`} value={renovationYear} onChange={e => setRenovationYear(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2023" inputMode="numeric" maxLength={4} />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Occupancy Status</span>
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    {['Vacant', 'Rented', 'Owner-Occupied'].map(o => (
                      <button key={o} onClick={() => setOccupancyStatus(o)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: occupancyStatus === o ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: occupancyStatus === o ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: occupancyStatus === o ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Construction & Quality ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(250,204,21,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(250,204,21,0.06)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, color: '#FACC15', textShadow: '0 0 12px rgba(250,204,21,0.4)' }}>Construction & Quality</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Build materials, structure type & finish level</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #FACC15, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Structure</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                    {['Reinforced Concrete', 'Brick', 'Wood', 'Steel Frame', 'Prefab'].map(o => (
                      <button key={o} onClick={() => setStructureType(o)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: structureType === o ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.03)', border: structureType === o ? '1.5px solid rgba(250,204,21,0.3)' : '1.5px solid rgba(255,255,255,0.06)', color: structureType === o ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Roof</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                    {['Clay Tile', 'Metal', 'Concrete', 'Thatch', 'Shingle'].map(o => (
                      <button key={o} onClick={() => setRoofType(o)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: roofType === o ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.03)', border: roofType === o ? '1.5px solid rgba(250,204,21,0.3)' : '1.5px solid rgba(255,255,255,0.06)', color: roofType === o ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Walls</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                    {['Plastered Brick', 'Exposed Brick', 'Concrete', 'Wood Panel', 'Glass'].map(o => (
                      <button key={o} onClick={() => setWallMaterial(o)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: wallMaterial === o ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.03)', border: wallMaterial === o ? '1.5px solid rgba(250,204,21,0.3)' : '1.5px solid rgba(255,255,255,0.06)', color: wallMaterial === o ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Flooring</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                    {['Ceramic', 'Marble', 'Granite', 'Wood/Parquet', 'Vinyl', 'Polished Concrete'].map(o => (
                      <button key={o} onClick={() => setFlooringType(o)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: flooringType === o ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.03)', border: flooringType === o ? '1.5px solid rgba(250,204,21,0.3)' : '1.5px solid rgba(255,255,255,0.06)', color: flooringType === o ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Foundation</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                    {['Pile', 'Strip', 'Raft', 'Pad', 'Unknown'].map(o => (
                      <button key={o} onClick={() => setFoundationType(o)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: foundationType === o ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.03)', border: foundationType === o ? '1.5px solid rgba(250,204,21,0.3)' : '1.5px solid rgba(255,255,255,0.06)', color: foundationType === o ? '#FACC15' : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Quality</span>
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    {['Standard', 'Premium', 'Luxury'].map(o => (
                      <button key={o} onClick={() => setBuildQuality(o)} style={{ flex: 1, padding: '10px 6px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', background: buildQuality === o ? (o === 'Luxury' ? 'rgba(250,204,21,0.15)' : o === 'Premium' ? 'rgba(141,198,63,0.12)' : 'rgba(255,255,255,0.06)') : 'rgba(255,255,255,0.03)', border: buildQuality === o ? (o === 'Luxury' ? '1.5px solid #FACC15' : o === 'Premium' ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.2)') : '1.5px solid rgba(255,255,255,0.06)', color: buildQuality === o ? (o === 'Luxury' ? '#FACC15' : o === 'Premium' ? '#8DC63F' : '#fff') : 'rgba(255,255,255,0.4)' }}>{o}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Warranty & Guarantees ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(96,165,250,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(96,165,250,0.06)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, color: '#60A5FA', textShadow: '0 0 12px rgba(96,165,250,0.4)' }}>Warranty & Guarantees</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Optional — adds trust and boosts conversions</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #60A5FA, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Structure</span>
                  <input className={styles.inlineInput} value={warrantyStructure} onChange={e => setWarrantyStructure(e.target.value)} placeholder="e.g. 10 years (until 2034)" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Roof</span>
                  <input className={styles.inlineInput} value={warrantyRoof} onChange={e => setWarrantyRoof(e.target.value)} placeholder="e.g. 5 years" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Waterproof</span>
                  <input className={styles.inlineInput} value={warrantyWaterproofing} onChange={e => setWarrantyWaterproofing(e.target.value)} placeholder="e.g. 2 years" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Electrical</span>
                  <input className={styles.inlineInput} value={warrantyElectrical} onChange={e => setWarrantyElectrical(e.target.value)} placeholder="e.g. 1 year" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Developer</span>
                  <input className={styles.inlineInput} value={warrantyDeveloper} onChange={e => setWarrantyDeveloper(e.target.value)} placeholder="e.g. Ciputra Group — 5 year guarantee" />
                </div>
              </div>
            </div>

            {/* ── UNIVERSAL FIELDS (all property types) ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08)', position: 'relative', zIndex: 1 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4)' }}>Media & Policies</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Video tour, floor plan & cancellation</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 10, overflow: 'hidden' }}><div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} /></div>

              {/* Video Tour Upload */}
              <VideoUpload listingRef={propRef} existingUrl={videoTourUrl} onVideoUploaded={(url) => setVideoTourUrl(url || '')} />

              <div className={styles.inlineGroup}>

                {/* Floor Plan Image URL */}
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Floor Plan URL</span>
                  <input className={`${styles.inlineInput} ${!floorPlanImage ? styles.inlineInputEmpty : ''}`} value={floorPlanImage} onChange={e => setFloorPlanImage(e.target.value)} placeholder="https://..." />
                </div>

                {/* Cancellation Policy */}
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Cancellation</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                    {CANCELLATION_POLICY_OPTIONS.map(p => (
                      <button key={p} onClick={() => setCancellationPolicy(p)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: cancellationPolicy === p ? 'rgba(141,198,63,0.15)' : 'rgba(255,255,255,0.03)', border: cancellationPolicy === p ? '1.5px solid rgba(141,198,63,0.4)' : '1.5px solid rgba(255,255,255,0.08)', color: cancellationPolicy === p ? '#8DC63F' : 'rgba(255,255,255,0.4)' }}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Check-in Time */}
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Check-in</span>
                  <input className={styles.inlineInput} type="time" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                </div>

                {/* Check-out Time */}
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Check-out</span>
                  <input className={styles.inlineInput} type="time" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══ STEP 3: RATES + TERMS ═══ */}
        {step === 3 && (
          <div className={styles.form} style={{ paddingTop: 70 }}>
            {/* Rental Rates */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Rental Rates</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Per night, weekly, monthly & yearly</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
              </div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Night</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!nightly ? styles.inlineInputEmpty : ''}`} value={nightly} onChange={e => priceChange('daily', e.target.value.replace(/[^0-9]/g, ''))} placeholder="500000" inputMode="numeric" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Week</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={weekly} onChange={e => priceChange('weekly', e.target.value.replace(/[^0-9]/g, ''))} placeholder={nightly ? Math.round(Number(nightly) * 7 * 0.85).toLocaleString('id-ID') : '3000000'} inputMode="numeric" autoComplete="new-password" />
                  {nightly && !weekly && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(nightly * 7 * 0.85).toLocaleString('id-ID')}</span>}
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Month</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={monthly} onChange={e => priceChange('monthly', e.target.value.replace(/[^0-9]/g, ''))} placeholder={nightly ? Math.round(Number(nightly) * 30 * 0.6).toLocaleString('id-ID') : '10000000'} inputMode="numeric" autoComplete="new-password" />
                  {nightly && !monthly && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(nightly * 30 * 0.6).toLocaleString('id-ID')}</span>}
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Per Year</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={yearly} onChange={e => setYearly(e.target.value.replace(/[^0-9]/g, ''))} placeholder={monthly ? Math.round(Number(monthly) * 12 * 0.85).toLocaleString('id-ID') : '100000000'} inputMode="numeric" autoComplete="new-password" />
                  {monthly && !yearly && <span className={styles.inlineSuffix} style={{ fontSize: 9 }}>~{Math.round(monthly * 12 * 0.85).toLocaleString('id-ID')}</span>}
                </div>
              </div>
            </div>

            {/* Security & Fees */}
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(141,198,63,0.08), inset 0 1px 0 rgba(141,198,63,0.05)' }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, textShadow: '0 0 12px rgba(141,198,63,0.4), 0 2px 8px rgba(0,0,0,0.5)' }}>Security & Fees</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 4px', fontWeight: 500 }}>Deposit, cleaning fee & late charges</p>
              <div style={{ position: 'relative', height: 2, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8DC63F, transparent)', animation: 'runGlow 3s ease-in-out infinite' }} />
              </div>
              <div className={styles.inlineGroup}>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Security Deposit</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!deposit ? styles.inlineInputEmpty : ''}`} value={deposit} onChange={e => priceChange('deposit', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="3.000.000" inputMode="decimal" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Cleaning Fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={styles.inlineInput} value={cleaningFee} onChange={e => setCleaningFee(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="200.000" inputMode="decimal" autoComplete="new-password" />
                </div>
                <div className={styles.inlineField}>
                  <span className={styles.inlineLabel}>Late Fee</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600, marginRight: 4 }}>Rp</span>
                  <input className={`${styles.inlineInput} ${!lateFee ? styles.inlineInputEmpty : ''}`} value={lateFee} onChange={e => priceChange('lateFee', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="100.000" inputMode="decimal" autoComplete="new-password" />
                  <span className={styles.inlineSuffix}>/hour</span>
                </div>
              </div>
            </div>

            {/* ── Rental Terms ── */}
            <RentalTermsSection ownerAgreementSaved={ownerAgreementSaved} localTermsEnabled={localTermsEnabled} setLocalTermsEnabled={setLocalTermsEnabled} touristTermsEnabled={touristTermsEnabled} setTouristTermsEnabled={setTouristTermsEnabled} showLocalTerms={showLocalTerms} setShowLocalTerms={setShowLocalTerms} showTouristTerms={showTouristTerms} setShowTouristTerms={setShowTouristTerms} />

            <AgreementEditorPopup show={showAgreementEditor} onClose={() => setShowAgreementEditor(false)} agreementEditTab={agreementEditTab} setAgreementEditTab={setAgreementEditTab} editLocalTerms={editLocalTerms} setEditLocalTerms={setEditLocalTerms} editTouristTerms={editTouristTerms} setEditTouristTerms={setEditTouristTerms} />

            {/* Deal Hunt toggle */}
            <div style={{ marginTop: 14 }}>
              <DealHuntToggle
                category="Property"
                isSale={!!buyNow}
                price={buyNow ? buyNowPrice : monthly || nightly}
                onToggle={(enabled, pct) => { setDealHuntEnabled(enabled); setDealHuntPct(pct) }}
              />
            </div>

          </div>
        )}

        {/* ═══ STEP 4: PREVIEW ═══ */}
        {step === 4 && (
          <div className={styles.form}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className={showroomStyles.refBadge}>REF: {propRef}</span>
              <span className={showroomStyles.statusBadge}>Ready to Publish</span>
            </div>
            <PreviewCard title={displayTitle} city={city} category="Property" subType={`${propType} · ${bedrooms}BR · ${bathrooms}BA${sizeSqm ? ` · ${sizeSqm}sqm` : ''}`} price={nightly || monthly} image={mainImage} tags={tags} />
            {buyNow && buyNowPrice && <div className={showroomStyles.buyNowPreview}><span>Buy Now: Rp {Number(buyNowPrice).toLocaleString('id-ID')}{negotiable ? ' · Negotiable' : ' · Fixed'}</span></div>}

            {/* Amenities preview */}
            {amenities.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16, padding: '12px 14px', marginTop: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: '#8DC63F', margin: '0 0 8px' }}>Amenities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {amenities.map(a => (
                    <span key={a} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 11, fontWeight: 700, color: '#8DC63F' }}>{AMENITY_ICONS[a]} {a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing preview */}
            <div style={{ display: 'grid', gridTemplateColumns: nightly && monthly && yearly ? '1fr 1fr 1fr 1fr' : nightly && monthly ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8, marginTop: 12 }}>
              {[
                nightly && { label: 'Night', price: nightly },
                weekly && { label: 'Week', price: weekly },
                monthly && { label: 'Month', price: monthly },
                yearly && { label: 'Year', price: yearly },
              ].filter(Boolean).map((p, pi) => (
                <div key={pi} style={{ padding: '10px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(141,198,63,0.1)', borderRadius: 12, textAlign: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', marginBottom: 4 }}>{p.label.toUpperCase()}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#8DC63F', whiteSpace: 'nowrap' }}>Rp {p.price}</div>
                </div>
              ))}
            </div>

            {/* ── Offer Settings ── */}
            <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1.5px solid rgba(250,204,21,0.2)', borderRadius: 20, padding: '16px 14px', boxShadow: '0 0 20px rgba(250,204,21,0.06)', marginTop: 14 }}>
              <h2 className={styles.inlineGroupTitle} style={{ paddingTop: 0, color: '#FACC15', textShadow: '0 0 12px rgba(250,204,21,0.4)' }}>Offer Settings</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '-4px 0 8px', fontWeight: 500 }}>Let buyers make offers on your property</p>

              {/* Enable offers toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Accept Offers</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Buyers can submit offers on your listing</div>
                </div>
                <div onClick={() => setOffersEnabled(!offersEnabled)} style={{ width: 44, height: 24, borderRadius: 12, background: offersEnabled ? 'rgba(141,198,63,0.3)' : 'rgba(255,255,255,0.06)', border: offersEnabled ? '1.5px solid #8DC63F' : '1.5px solid rgba(255,255,255,0.06)', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: offersEnabled ? '#8DC63F' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 2, left: offersEnabled ? 22 : 2, transition: 'all 0.2s' }} />
                </div>
              </div>

              {offersEnabled && (
                <div className={styles.inlineField} style={{ paddingTop: 14 }}>
                  <span className={styles.inlineLabel}>Min Price</span>
                  <input className={styles.inlineInput} value={minAcceptedPrice} onChange={e => setMinAcceptedPrice(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Lowest you'll consider (optional)" inputMode="numeric" />
                  {minAcceptedPrice && <span style={{ fontSize: 11, color: '#FACC15', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 }}>Rp {minAcceptedPrice}</span>}
                </div>
              )}
              {offersEnabled && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', margin: '6px 0 0', paddingLeft: 92 }}>Buyers below this amount can still offer — you'll see their budget for potential redirect</p>}
            </div>
          </div>
        )}
      </div>

      {/* My Listings Popup */}
      {showMyListings && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundImage: 'url(https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-11_13_56-pm.png)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏠</span>
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>My Listings</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{myListings.length} total</span>
              </div>
            </div>
            <button onClick={() => setShowMyListings(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', position: 'relative', zIndex: 1 }}>
            {myListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>🏠</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>No listings yet</span>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Your published listings will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 140 }}>
                {myListings.map((l, i) => (
                  <div key={l.ref || i} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1.5px solid rgba(141,198,63,0.15)', borderRadius: 16, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', gap: 12, padding: 12 }}>
                      {l.image ? (
                        <img src={l.image} alt="" onClick={() => setPreviewListingIdx(i)} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0, cursor: 'pointer', border: '1.5px solid rgba(255,215,0,0.2)', transition: 'border-color 0.2s' }} />
                      ) : (
                        <div onClick={() => setPreviewListingIdx(i)} style={{ width: 80, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24, cursor: 'pointer' }}>🏠</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title || 'Untitled'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{l.extra_fields?.propType} · {l.extra_fields?.bedrooms}BR · {l.extra_fields?.bathrooms}BA</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#8DC63F', marginTop: 4 }}>
                          {l.price_day ? `Rp ${l.price_day}/night` : l.price_month ? `Rp ${l.price_month}/month` : 'No price set'}
                        </div>
                      </div>
                      <div style={{ padding: '4px 10px', borderRadius: 8, background: l.status === 'live' ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${l.status === 'live' ? 'rgba(141,198,63,0.3)' : 'rgba(239,68,68,0.3)'}`, alignSelf: 'flex-start', animation: l.status === 'live' ? 'liveGlow 2s ease-in-out infinite' : 'none' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: l.status === 'live' ? '#8DC63F' : '#EF4444', letterSpacing: '0.05em', textTransform: 'uppercase', animation: l.status === 'live' ? 'livePulse 2s ease-in-out infinite' : 'none' }}>{l.status === 'live' ? 'LIVE' : 'OFFLINE'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, padding: '8px 10px' }}>
                      <button onClick={() => {
                        const updated = [...myListings]
                        updated[i] = { ...updated[i], status: updated[i].status === 'live' ? 'offline' : 'live' }
                        setMyListings(updated)
                        localStorage.setItem('indoo_my_property_listings', JSON.stringify(updated))
                      }} style={{ flex: 1, padding: '9px 0', background: '#FFD700', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: '0 2px 6px rgba(255,215,0,0.3)' }}>
                        {l.status === 'live' ? 'Offline' : 'Live'}
                      </button>
                      <button onClick={() => { setShowMyListings(false); onClose('edit', l) }} style={{ flex: 1, padding: '9px 0', background: '#8DC63F', border: 'none', borderRadius: 10, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: '0 2px 6px rgba(141,198,63,0.3)' }}>
                        Edit
                      </button>
                      <button onClick={() => {
                        const updated = myListings.filter((_, j) => j !== i)
                        setMyListings(updated)
                        localStorage.setItem('indoo_my_property_listings', JSON.stringify(updated))
                      }} style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#EF4444', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: 'inset 0 0 8px rgba(239,68,68,0.05)' }}>
                        Del
                      </button>
                    </div>

                    <div style={{ padding: '6px 12px 8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(141,198,63,0.4)' }}>{l.ref}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>{l.created_at ? new Date(l.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listing Preview Card */}
          {previewListingIdx !== null && myListings[previewListingIdx] && (() => {
            const pl = myListings[previewListingIdx]
            return (
              <div style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundImage: 'url(https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/chatgpt-image-apr-18-2026-11_13_56-pm.png)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setPreviewListingIdx(null)}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
                <div onClick={e => e.stopPropagation()} style={{
                  width: '100%', maxWidth: 380,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(141,198,63,0.2)', borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 20px rgba(141,198,63,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: pl.status === 'live' ? 'rgba(141,198,63,0.12)' : 'rgba(239,68,68,0.15)', border: `1px solid ${pl.status === 'live' ? 'rgba(141,198,63,0.25)' : 'rgba(239,68,68,0.3)'}`, fontSize: 9, fontWeight: 800, color: pl.status === 'live' ? '#8DC63F' : '#EF4444', letterSpacing: '0.04em', animation: pl.status === 'live' ? 'livePulse 2s ease-in-out infinite' : 'none' }}>{pl.status === 'live' ? 'LIVE' : 'OFFLINE'}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,215,0,0.5)' }}>{pl.ref}</span>
                    </div>
                    <button onClick={() => setPreviewListingIdx(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>

                  {pl.image ? (
                    <img src={pl.image} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏠</div>
                  )}

                  <div style={{ padding: '14px 14px 10px' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{pl.extra_fields?.propType} <span style={{ color: '#8DC63F' }}>{pl.extra_fields?.bedrooms}BR</span></div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {pl.extra_fields?.propType && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.propType}</span>}
                      {pl.extra_fields?.bedrooms && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.bedrooms} BR</span>}
                      {pl.extra_fields?.bathrooms && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{pl.extra_fields.bathrooms} BA</span>}
                      {pl.extra_fields?.amenities?.length > 0 && <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.15)', fontSize: 10, fontWeight: 700, color: '#8DC63F' }}>{pl.extra_fields.amenities.length} amenities</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '0 14px 14px', gap: 8 }}>
                    {[
                      { label: 'Night', price: pl.price_day },
                      { label: 'Week', price: pl.price_week },
                      { label: 'Month', price: pl.price_month },
                    ].map((p, pi) => (
                      <div key={pi} style={{ padding: '10px 6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(141,198,63,0.1)', borderRadius: 12, textAlign: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', marginBottom: 4 }}>{p.label.toUpperCase()}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: p.price ? '#8DC63F' : 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>{p.price ? `Rp ${p.price}` : '---'}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
                    <button onClick={() => {
                      const updated = [...myListings]
                      updated[previewListingIdx] = { ...updated[previewListingIdx], status: updated[previewListingIdx].status === 'live' ? 'offline' : 'live' }
                      setMyListings(updated)
                      localStorage.setItem('indoo_my_property_listings', JSON.stringify(updated))
                    }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#FFD700', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
                      {pl.status === 'live' ? 'Go Offline' : 'Go Live'}
                    </button>
                    <button onClick={() => { setPreviewListingIdx(null); setShowMyListings(false); onClose('edit', pl) }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: '#8DC63F', border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(141,198,63,0.3)' }}>
                      Edit
                    </button>
                    <button onClick={() => {
                      const updated = myListings.filter((_, j) => j !== previewListingIdx)
                      setMyListings(updated)
                      localStorage.setItem('indoo_my_property_listings', JSON.stringify(updated))
                      setPreviewListingIdx(null)
                    }} style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Del
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {step <= 4 && (
        <FormFooter step={step} onNext={() => step === 4 ? handleSubmit() : setStep(s => s + 1)} onDraft={() => {}} canNext={step === 0 ? !!propType : step === 1 ? !!title || !!autoTitle : step === 2 ? true : step === 3 ? !!(nightly || monthly) : true} submitting={submitting} nextLabel={step === 4 ? 'Publish Listing' : step === 3 ? 'Preview' : step === 2 ? 'Set Pricing' : step === 1 ? 'Advanced Details' : 'Next'} />
      )}
    </div>,
    document.body
  )
}
