/**
 * Carrier tracking URLs for Indonesian delivery services.
 * Pass tracking number to get a direct link to the carrier's tracking page.
 */

const TRACKING_URLS = {
  jne:          (n) => `https://www.jne.co.id/id/tracking/trace?AWB=${n}`,
  jnt_express:  (n) => `https://jet.co.id/track?no=${n}`,
  jnt:          (n) => `https://jet.co.id/track?no=${n}`,
  sicepat:      (n) => `https://www.sicepat.com/checkAwb?awb=${n}`,
  ninja:        (n) => `https://www.ninjaxpress.co/id-id/tracking?id=${n}`,
  pos_indo:     (n) => `https://www.posindonesia.co.id/id/tracking?barcode=${n}`,
  pos_indo_intl:(n) => `https://www.posindonesia.co.id/id/tracking?barcode=${n}`,
  tiki:         (n) => `https://tiki.id/id/tracking?consignmentNo=${n}`,
  lion_parcel:  (n) => `https://www.lionparcel.com/tracking/${n}`,
  antaraja:     (n) => `https://anteraja.id/tracking/${n}`,
  wahana:       (n) => `https://www.wahana.com/tracking?awb=${n}`,
  idexpress:    (n) => `https://idexpress.com/tracking?awb=${n}`,
  sap:          (n) => `https://www.sap-express.id/tracking?awb=${n}`,
  jnt_cargo:    (n) => `https://jet.co.id/track?no=${n}`,
  lion_air:     (n) => `https://www.lionparcel.com/tracking/${n}`,
  dhl:          (n) => `https://www.dhl.com/id-id/home/tracking.html?tracking-id=${n}`,
  fedex:        (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
}

const CARRIER_LABELS = {
  jne: 'JNE', jnt_express: 'J&T Express', jnt: 'J&T', sicepat: 'SiCepat',
  ninja: 'Ninja Xpress', pos_indo: 'Pos Indonesia', tiki: 'TIKI',
  lion_parcel: 'Lion Parcel', antaraja: 'Anteraja', wahana: 'Wahana',
  idexpress: 'IDExpress', sap: 'SAP Express', jnt_cargo: 'J&T Cargo',
  lion_air: 'Lion Air', dhl: 'DHL', fedex: 'FedEx', pos_indo_intl: 'Pos Indonesia',
}

export function getTrackingUrl(carrierKey, trackingNumber) {
  const fn = TRACKING_URLS[carrierKey]
  if (!fn || !trackingNumber) return null
  return fn(trackingNumber.trim())
}

export function getCarrierLabel(carrierKey) {
  return CARRIER_LABELS[carrierKey] ?? carrierKey
}

export const CARRIER_OPTIONS = Object.entries(CARRIER_LABELS).map(([key, label]) => ({ key, label }))
