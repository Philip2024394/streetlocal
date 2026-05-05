/**
 * Vehicle Directory Service
 * Directory of vehicle models — user picks a model, then sees rental listings for that model.
 */

// ── Motor Bike Directory ─────────────────────────────────────────────────────
export const BIKE_DIRECTORY = [
  { id: 'honda_beat',       name: 'Honda Beat',           cc: 110,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasdadasdaadasdsadfsdsasdaasdasdadsasddasd-removebg-preview.png?updatedAt=1776100590953', listings: 24, priceFrom: 50000, priceTo: 75000 },
  { id: 'honda_vario125',   name: 'Honda Vario 125',      cc: 125,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasdadasdaadasdsadfsdsasdaasdasdadsasddasdasdas-removebg-preview.png?updatedAt=1776100954578', listings: 18, priceFrom: 60000, priceTo: 85000 },
  { id: 'honda_scoopy',     name: 'Honda Scoopy',         cc: 110,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasdadasdaadasdsadfsdsasdaasdasdadsasddasdasdasasdas-removebg-preview.png?updatedAt=1776101014459', listings: 15, priceFrom: 55000, priceTo: 80000 },
  { id: 'honda_vario160',   name: 'Honda Vario 160',      cc: 160,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasdadasdaadasdsadfsdsasdaasdasdadsasddasdasdasasdasadsd-removebg-preview.png?updatedAt=1776101092921', listings: 12, priceFrom: 75000, priceTo: 100000 },
  { id: 'honda_vario160r',  name: 'Honda Vario 160 Red',  cc: 160,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasdadasdaadasdsadfsdsasdaasdasdadsasddasdasdasasdasadsdasdasd-removebg-preview.png?updatedAt=1776101251798', listings: 10, priceFrom: 75000, priceTo: 100000 },
  { id: 'honda_pcx',        name: 'Honda PCX 160',        cc: 160,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledsdfasdfdddfsdfsdsdfsdfadsasdadasdaadasdsadfsdsasdaasdasdadsasddasdasdasasdasadsdasdasdasdas-removebg-preview.png?updatedAt=1776101322497', listings: 9, priceFrom: 100000, priceTo: 150000 },
  { id: 'honda_adv',        name: 'Honda ADV 160',        cc: 160,  type: 'Adventure',   image: 'https://ik.imagekit.io/nepgaxllc/mm-removebg-preview.png?updatedAt=1776101447952', listings: 6, priceFrom: 120000, priceTo: 175000 },
  { id: 'yamaha_nmax',      name: 'Yamaha NMAX 155',      cc: 155,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/mm11-removebg-preview.png?updatedAt=1776101563522', listings: 21, priceFrom: 85000, priceTo: 125000 },
  { id: 'yamaha_xmax',      name: 'Yamaha XMAX 250',      cc: 250,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/mm11s-removebg-preview.png?updatedAt=1776101715884', listings: 4, priceFrom: 175000, priceTo: 250000 },
  { id: 'yamaha_xsr',       name: 'Yamaha XSR 155',       cc: 155,  type: 'Retro Sport', image: 'https://ik.imagekit.io/nepgaxllc/mm11sf-removebg-preview.png?updatedAt=1776101864381', listings: 3, priceFrom: 150000, priceTo: 200000 },
  { id: 'yamaha_fazio',     name: 'Yamaha Fazio',         cc: 125,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/mm11sfdf-removebg-preview.png?updatedAt=1776102121505', listings: 8, priceFrom: 60000, priceTo: 85000 },
  { id: 'kawasaki_ninja',   name: 'Kawasaki Ninja 250',   cc: 250,  type: 'Sport',       image: 'https://ik.imagekit.io/nepgaxllc/mm11sfdfdd-removebg-preview.png?updatedAt=1776102249211', listings: 7, priceFrom: 200000, priceTo: 350000 },
  { id: 'kawasaki_versys',  name: 'Kawasaki Versys-X 250',cc: 250,  type: 'Adventure',   image: 'https://ik.imagekit.io/nepgaxllc/mm11sfdfdddsd-removebg-preview.png?updatedAt=1776102436462', listings: 2, priceFrom: 250000, priceTo: 400000 },
  { id: 'vespa_px',         name: 'Vespa PX 150',         cc: 150,  type: 'Classic',     image: 'https://ik.imagekit.io/nepgaxllc/mm11sfdfdddsddsfsdf-removebg-preview.png?updatedAt=1776102499535', listings: 5, priceFrom: 150000, priceTo: 250000 },
  { id: 'harley_softail',   name: 'Harley-Davidson Softail', cc: 1450, type: 'Cruiser',  image: 'https://ik.imagekit.io/nepgaxllc/mm11sfdfdddsddsfsdfdsd-removebg-preview.png?updatedAt=1776102622618', listings: 1, priceFrom: 750000, priceTo: 1500000 },
  { id: 'royal_enfield',    name: 'Royal Enfield 650',    cc: 650,  type: 'Classic',     image: 'https://ik.imagekit.io/nepgaxllc/mm11sfdfdddsddsfsdfdsddasdas-removebg-preview.png?updatedAt=1776102744981', listings: 2, priceFrom: 350000, priceTo: 500000 },
  { id: 'honda_cb150r',     name: 'Honda CB150R',         cc: 150,  type: 'Naked Sport', image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23asdaasdaasdassasaasdasdasdaasdassdfsdfasd-removebg-preview.png', listings: 8, priceFrom: 100000, priceTo: 150000 },
  { id: 'suzuki_gsxr',      name: 'Suzuki GSX-R150',      cc: 150,  type: 'Sport',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23asdaasdaasdassasaasdasdasdaasdassdf-removebg-preview.png', listings: 5, priceFrom: 120000, priceTo: 175000 },
  { id: 'vespa_sprint',     name: 'Vespa Sprint 150',     cc: 150,  type: 'Classic',     image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23asdaasdaasdassasaasdasdasdaasdas-removebg-preview.png', listings: 4, priceFrom: 150000, priceTo: 225000 },
  { id: 'kawasaki_klx',     name: 'Kawasaki KLX 150',     cc: 150,  type: 'Trail',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23asdaasdaasdassasaasdasdasda-removebg-preview.png', listings: 3, priceFrom: 150000, priceTo: 250000 },
  { id: 'honda_crf',        name: 'Honda CRF 150L',       cc: 150,  type: 'Trail',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23asdaasdaasdassasaasdasd-removebg-preview.png', listings: 3, priceFrom: 150000, priceTo: 225000 },
  { id: 'honda_genio',      name: 'Honda Genio',          cc: 110,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23asdaasdaasdassasa-removebg-preview.png', listings: 14, priceFrom: 50000, priceTo: 70000 },
  { id: 'yamaha_r15',       name: 'Yamaha R15 V4',        cc: 155,  type: 'Sport',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23asdaasdaasdas-removebg-preview.png', listings: 4, priceFrom: 150000, priceTo: 225000 },
  { id: 'honda_cbr',        name: 'Honda CBR 150R',       cc: 150,  type: 'Sport',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23asdaasda-removebg-preview.png', listings: 6, priceFrom: 120000, priceTo: 175000 },
  { id: 'suzuki_nex',       name: 'Suzuki Nex II',        cc: 125,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23asda-removebg-preview.png', listings: 11, priceFrom: 45000, priceTo: 65000 },
  { id: 'yamaha_mio',       name: 'Yamaha Mio',           cc: 125,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss23-removebg-preview.png', listings: 16, priceFrom: 50000, priceTo: 75000 },
  { id: 'yamaha_aerox',     name: 'Yamaha Aerox 155',     cc: 155,  type: 'Matic',       image: 'https://ik.imagekit.io/nepgaxllc/Untitledasdss2-removebg-preview.png', listings: 11, priceFrom: 90000, priceTo: 135000 },
]

// ── Car Directory ────────────────────────────────────────────────────────────
export const CAR_DIRECTORY = [
  { id: 'honda_brio',     name: 'Honda Brio',         cc: 1200, type: 'City Car',  seats: 5,  image: 'https://ik.imagekit.io/nepgaxllc/Untitledddadddssdsdasd-removebg-preview.png?updatedAt=1776106640023', listings: 20, priceFrom: 200000, priceTo: 300000 },
  { id: 'toyota_agya',    name: 'Toyota Agya',        cc: 1200, type: 'City Car',  seats: 5,  image: 'https://ik.imagekit.io/nepgaxllc/Untitledddadddssdsdasddasd-removebg-preview.png?updatedAt=1776106927539', listings: 14, priceFrom: 180000, priceTo: 275000 },
  { id: 'daihatsu_ayla',  name: 'Daihatsu Ayla',      cc: 1000, type: 'City Car',  seats: 5,  image: 'https://ik.imagekit.io/nepgaxllc/Untitledddadddssdsdasddasdfsdf-removebg-preview.png?updatedAt=1776107084764', listings: 11, priceFrom: 175000, priceTo: 250000 },
  { id: 'honda_jazz',     name: 'Honda Jazz',         cc: 1500, type: 'Hatchback', seats: 5,  image: 'https://ik.imagekit.io/nepgaxllc/Untitledddadddssdsdasddasdfsdfdsfs-removebg-preview.png?updatedAt=1776107175516', listings: 12, priceFrom: 280000, priceTo: 400000 },
  { id: 'toyota_agya_g',  name: 'Toyota Agya GR',     cc: 1200, type: 'City Car',  seats: 5,  image: 'https://ik.imagekit.io/nepgaxllc/Untitledddadddssdsdasddasdfsdfdsfsdasd-removebg-preview.png?updatedAt=1776107406058', listings: 8, priceFrom: 200000, priceTo: 300000 },
  { id: 'toyota_avanza',  name: 'Toyota Avanza',      cc: 1300, type: 'MPV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdas-removebg-preview.png?updatedAt=1776107472964', listings: 32, priceFrom: 300000, priceTo: 450000 },
  { id: 'daihatsu_xenia', name: 'Daihatsu Xenia',     cc: 1300, type: 'MPV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasds-removebg-preview.png?updatedAt=1776107723482', listings: 22, priceFrom: 275000, priceTo: 400000 },
  { id: 'suzuki_ertiga',  name: 'Suzuki Ertiga',      cc: 1500, type: 'MPV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdas-removebg-preview.png?updatedAt=1776107822326', listings: 15, priceFrom: 325000, priceTo: 475000 },
  { id: 'mitsubishi_xpander', name: 'Mitsubishi Xpander', cc: 1500, type: 'MPV',  seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdas-removebg-preview.png?updatedAt=1776108152466', listings: 19, priceFrom: 350000, priceTo: 500000 },
  { id: 'honda_mobilio',  name: 'Honda Mobilio',      cc: 1500, type: 'MPV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasd-removebg-preview.png?updatedAt=1776108325099', listings: 10, priceFrom: 300000, priceTo: 425000 },
  { id: 'datsun_go',      name: 'Datsun GO+',         cc: 1200, type: 'MPV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsads-removebg-preview.png?updatedAt=1776108679588', listings: 9, priceFrom: 225000, priceTo: 325000 },
  { id: 'daihatsu_sigra',  name: 'Daihatsu Sigra',    cc: 1200, type: 'MPV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssad-removebg-preview.png?updatedAt=1776108757006', listings: 13, priceFrom: 250000, priceTo: 375000 },
  { id: 'suzuki_xl7',     name: 'Suzuki XL7',         cc: 1500, type: 'SUV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsd-removebg-preview.png?updatedAt=1776108985190', listings: 7, priceFrom: 375000, priceTo: 550000 },
  { id: 'nissan_livina',  name: 'Nissan Grand Livina',cc: 1500, type: 'MPV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasda-removebg-preview.png?updatedAt=1776109066348', listings: 6, priceFrom: 275000, priceTo: 400000 },
  { id: 'toyota_innova',  name: 'Toyota Kijang Innova', cc: 2000, type: 'MPV',    seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadas-removebg-preview.png?updatedAt=1776109728149', listings: 18, priceFrom: 400000, priceTo: 600000 },
  { id: 'toyota_alphard', name: 'Toyota Alphard',     cc: 2500, type: 'Premium',   seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassds-removebg-preview.png?updatedAt=1776109786877', listings: 5, priceFrom: 1200000, priceTo: 2500000 },
  { id: 'toyota_alphard_b', name: 'Toyota Alphard Black', cc: 2500, type: 'Premium', seats: 7, image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdas-removebg-preview.png?updatedAt=1776109926864', listings: 3, priceFrom: 1500000, priceTo: 3000000 },
  { id: 'hyundai_stargazer', name: 'Hyundai Stargazer', cc: 1500, type: 'MPV',    seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassads-removebg-preview.png?updatedAt=1776110023108', listings: 6, priceFrom: 375000, priceTo: 525000 },
  { id: 'hyundai_h1',     name: 'Hyundai H-1',        cc: 2500, type: 'Van',       seats: 12, image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasd-removebg-preview.png?updatedAt=1776110098189', listings: 4, priceFrom: 600000, priceTo: 900000 },
  { id: 'daihatsu_terios', name: 'Daihatsu Terios',   cc: 1500, type: 'SUV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfas-removebg-preview.png?updatedAt=1776110448904', listings: 8, priceFrom: 325000, priceTo: 475000 },
  { id: 'daihatsu_terios_s', name: 'Daihatsu Terios Silver', cc: 1500, type: 'SUV', seats: 7, image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfassdfsd-removebg-preview.png?updatedAt=1776110538872', listings: 5, priceFrom: 325000, priceTo: 475000 },
  { id: 'honda_brv',      name: 'Honda BR-V',         cc: 1500, type: 'SUV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfassdfsdasda-removebg-preview.png?updatedAt=1776110828488', listings: 7, priceFrom: 350000, priceTo: 500000 },
  { id: 'toyota_fortuner', name: 'Toyota Fortuner',   cc: 2400, type: 'SUV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfassdfsdasdads-removebg-preview.png?updatedAt=1776110885983', listings: 8, priceFrom: 600000, priceTo: 1000000 },
  { id: 'mitsubishi_pajero', name: 'Mitsubishi Pajero Sport', cc: 2400, type: 'SUV', seats: 7, image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfassdfsdasdadsdsasd-removebg-preview.png?updatedAt=1776111125486', listings: 4, priceFrom: 650000, priceTo: 1100000 },
  { id: 'hyundai_tucson',  name: 'Hyundai Tucson',    cc: 2000, type: 'SUV',       seats: 5,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfassdfsdasdadsdsasdasda-removebg-preview.png?updatedAt=1776111213187', listings: 3, priceFrom: 500000, priceTo: 800000 },
  { id: 'honda_crv',      name: 'Honda CR-V',         cc: 2000, type: 'SUV',       seats: 7,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfassdfsdasdadsdsasdasdaasdas-removebg-preview.png?updatedAt=1776111362516', listings: 6, priceFrom: 550000, priceTo: 850000 },
  { id: 'daihatsu_granmax', name: 'Daihatsu Gran Max MB', cc: 1500, type: 'Van',   seats: 9,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfassdfsdasdadsdsasdasdaasdasasda-removebg-preview.png?updatedAt=1776111419654', listings: 12, priceFrom: 250000, priceTo: 375000 },
  { id: 'suzuki_apv',     name: 'Suzuki APV',         cc: 1500, type: 'Van',       seats: 8,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfassdfsdasdadsdsasdasdaasdasasdadfs-removebg-preview.png?updatedAt=1776111549635', listings: 9, priceFrom: 275000, priceTo: 400000 },
  { id: 'suzuki_apv_arena', name: 'Suzuki APV Arena',  cc: 1500, type: 'Van',      seats: 8,  image: 'https://ik.imagekit.io/nepgaxllc/sdasdsdasdasasdasddsadssadsdfsdasdadassdsasdassadsasdsdfassdfsdasdadsdsasdasdaasdasasdadfsasdasd-removebg-preview.png?updatedAt=1776111632534', listings: 7, priceFrom: 250000, priceTo: 375000 },
  { id: 'suzuki_apv_lux',  name: 'Suzuki APV Luxury',  cc: 1500, type: 'Van',     seats: 8,  image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsad-removebg-preview.png?updatedAt=1776112170052', listings: 5, priceFrom: 300000, priceTo: 425000 },
]

// ── Bus Directory ────────────────────────────────────────────────────────────
export const BUS_DIRECTORY = [
  { id: 'toyota_hiace',    name: 'Toyota HiAce',          cc: 2500, type: 'Minibus',  seats: 16, image: 'https://ik.imagekit.io/nepgaxllc/00000000dd-removebg-preview.png?updatedAt=1776111940549', listings: 6, priceFrom: 800000, priceTo: 1200000 },
  { id: 'toyota_hiace_y',  name: 'Toyota HiAce Commuter', cc: 2500, type: 'Minibus',  seats: 16, image: 'https://ik.imagekit.io/nepgaxllc/00000000-removebg-preview.png?updatedAt=1776111708976', listings: 4, priceFrom: 850000, priceTo: 1300000 },
]

// ── Truck Directory ──────────────────────────────────────────────────────────
export const TRUCK_DIRECTORY = [
  { id: 'isuzu_traga',     name: 'Isuzu Traga Box',       cc: 2800, type: 'Box Truck',  payload: '2.5 ton', image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasdasdasada-removebg-preview.png?updatedAt=1776113199000', listings: 11, priceFrom: 400000, priceTo: 600000 },
  { id: 'mitsubishi_colt', name: 'Mitsubishi Colt Diesel', cc: 4000, type: 'Box Truck',  payload: '5 ton',   image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasdasda-removebg-preview.png?updatedAt=1776112890251', listings: 8, priceFrom: 500000, priceTo: 750000 },
  { id: 'suzuki_carry',    name: 'Suzuki Carry Pickup',   cc: 1500, type: 'Pickup',     payload: '750 kg',  image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasd-removebg-preview.png?updatedAt=1776112751249', listings: 19, priceFrom: 200000, priceTo: 300000 },
  { id: 'daihatsu_granmax', name: 'Daihatsu Gran Max',    cc: 1500, type: 'Pickup',     payload: '1 ton',   image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasda-removebg-preview.png?updatedAt=1776112671299', listings: 16, priceFrom: 225000, priceTo: 325000 },
  { id: 'isuzu_elf',       name: 'Isuzu Elf NHR',        cc: 2800, type: 'Flatbed',    payload: '2.5 ton', image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsas-removebg-preview.png?updatedAt=1776112006481', listings: 9, priceFrom: 375000, priceTo: 550000 },
  { id: 'mitsubishi_colt_r', name: 'Mitsubishi Colt Diesel Flatbed', cc: 4000, type: 'Flatbed', payload: '5 ton', image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdf-removebg-preview.png?updatedAt=1776112326488', listings: 6, priceFrom: 450000, priceTo: 700000 },
  { id: 'toyota_hilux',    name: 'Toyota Hilux',          cc: 2400, type: 'Double Cab', payload: '1 ton',   image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasdasdasadaadsda-removebg-preview.png?updatedAt=1776113355563', listings: 8, priceFrom: 500000, priceTo: 800000 },
  { id: 'mitsubishi_triton', name: 'Mitsubishi Triton',   cc: 2400, type: 'Double Cab', payload: '1 ton',   image: 'https://ik.imagekit.io/nepgaxllc/00000000dddsasdsadsdfsdfasdaasdasdasadaadsdaasdasd-removebg-preview.png?updatedAt=1776113412743', listings: 5, priceFrom: 550000, priceTo: 850000 },
]

export function getDirectory(type) {
  if (type === 'Motorcycles') return BIKE_DIRECTORY
  if (type === 'Cars') return CAR_DIRECTORY
  if (type === 'Trucks') return TRUCK_DIRECTORY
  if (type === 'Buses') return BUS_DIRECTORY
  return []
}
