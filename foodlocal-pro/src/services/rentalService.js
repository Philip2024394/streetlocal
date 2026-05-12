/**
 * Rental Service — fetches marketplace listings from Supabase.
 * Falls back to DEMO_LISTINGS when Supabase is unavailable (demo mode).
 */
import { supabase } from '@/lib/supabase'

export const RENTAL_CATEGORIES = [
  { id: 'all',          label: 'All',           emoji: '🏷️' },
  { id: 'Motorcycles',  label: 'Motorcycles',   emoji: '🏍️' },
  { id: 'Cars',         label: 'Cars',          emoji: '🚗' },
  { id: 'Trucks',       label: 'Trucks',        emoji: '🚛' },
  { id: 'Buses',        label: 'Buses',         emoji: '🚌' },
  { id: 'Property',     label: 'Property',      emoji: '🏠' },
  { id: 'Electronics',  label: 'Electronics',   emoji: '📷' },
  { id: 'Fashion',      label: 'Fashion',       emoji: '👗' },
  { id: 'Audio & Sound',label: 'Audio & Sound', emoji: '🔊' },
  { id: 'Party & Event',label: 'Party & Event', emoji: '🎉' },
]

// ─── Demo fallback data (used when Supabase is null / demo mode) ───
export const DEMO_LISTINGS = [
  {"id":"00af49f5","title":"Canon EOS 200D Mark II - DSLR Lengkap","description":"Kamera DSLR Canon EOS 200D Mark II. Lengkap dengan lensa kit 18-55mm, charger, kartu memori 64GB, tas kamera.","category":"Electronics","sub_category":"Camera","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":150000,"price_week":850000,"price_month":2800000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"],"features":["Lensa kit 18-55mm","Memory card 64GB","Tas kamera","Charger"],"rating":4.7,"review_count":12,"view_count":89,"extra_fields":{"brand":"Canon","model":"EOS 200D Mark II"}},
  {"id":"18836211","title":"Villa Tepi Pantai Bali - 3 Kamar","description":"Villa mewah tepi pantai di Seminyak, Bali. 3 kamar tidur, 3 kamar mandi, kolam renang pribadi, view laut.","category":"Property","sub_category":"Villa","city":"Bali","address":"Seminyak, Kuta, Bali","price_day":1500000,"price_week":9000000,"price_month":30000000,"condition":"new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=800&q=80"],"features":["Kolam renang","View laut","Dapur lengkap","AC semua kamar","Staff 24 jam"],"rating":4.9,"review_count":34,"view_count":245,"extra_fields":{"bedrooms":3,"bathrooms":3,"toilets":3,"pool":true,"parking":2,"property_type":"Villa"}},
  {"id":"26588984","title":"Honda Beat 2022 - Hitam Mulus","description":"Motor matic Honda Beat tahun 2022 kondisi sangat mulus, kilometer rendah. Cocok untuk harian di kota. Sudah service rutin, ban baru. Helm disediakan.","category":"Motorcycles","sub_category":"Matic","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":75000,"price_week":450000,"price_month":1500000,"condition":"like_new","status":"active","owner_type":"owner","images":["https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledasdadaa.png","https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledasdadaa.png"],"features":["Helm 2 buah","Jas hujan","Service rutin","STNK asli"],"rating":4.8,"review_count":23,"view_count":312,"buy_now":{"price":"12000000","negotiable":true},"extra_fields":{"cc":110,"year":2022,"brand":"Honda","transmission":"matic","helmet_count":2,"delivery_available":true}},
  {"id":"2f39d2a5","title":"Toyota Avanza 2020 - 7 Seater","description":"Mobil keluarga Toyota Avanza 2020, 7 penumpang, AC dingin, audio lengkap. Cocok untuk liburan keluarga.","category":"Cars","sub_category":"MPV","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":350000,"price_week":2100000,"price_month":7000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80"],"features":["AC dingin","Musik Bluetooth","GPS","Asuransi"],"rating":4.6,"review_count":18,"view_count":156,"buy_now":{"price":"185000000","negotiable":true},"extra_fields":{"year":2020,"brand":"Toyota","model":"Avanza","seats":7,"transmission":"manual","driver_available":true}},
  {"id":"437cb0ca","title":"Kebaya Pengantin Adat Jawa Putih Emas","description":"Kebaya pengantin adat Jawa putih emas, beludru premium. Tersedia ukuran S-XL. Include kain jarik, selendang, dan aksesoris lengkap.","category":"Fashion","sub_category":"Kebaya","city":"Yogyakarta","address":"Malioboro, Yogyakarta","price_day":500000,"price_week":null,"price_month":null,"condition":"like_new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80"],"features":["Termasuk jarik","Selendang","Aksesoris","Dry clean"],"rating":4.9,"review_count":8,"view_count":67,"extra_fields":{"size":"S-XL","material":"Beludru","occasion":"Pernikahan Adat"}},
  {"id":"74a93124","title":"Honda Jazz 2019 - Hatchback Sport","description":"Honda Jazz sporty 2019, transmisi CVT, AC, audio. Kondisi terawat, tidak pernah banjir.","category":"Cars","sub_category":"Hatchback","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":280000,"price_week":1680000,"price_month":5500000,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80"],"features":["AC dingin","Bluetooth","Kamera mundur","Asuransi all risk"],"rating":4.5,"review_count":15,"view_count":198,"extra_fields":{"year":2019,"brand":"Honda","model":"Jazz","seats":5,"transmission":"cvt","delivery_available":true}},
  {"id":"a8eaba86","title":"Yamaha NMAX 2021 - Putih Sport","description":"NMAX 2021 kondisi prima, sudah dipasang aksesoris lengkap. Nyaman untuk touring maupun harian.","category":"Motorcycles","sub_category":"Matic","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":120000,"price_week":700000,"price_month":2400000,"condition":"good","status":"active","owner_type":"owner","images":["https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledasdadaa.png"],"features":["Helm 2 buah","Jas hujan","Box belakang","GPS tracker"],"rating":4.7,"review_count":19,"view_count":267,"extra_fields":{"cc":155,"year":2021,"brand":"Yamaha","transmission":"matic","helmet_count":2,"delivery_available":true}},
  {"id":"af272948","title":"Sound System 5000W - DJ Setup Komplit","description":"Paket sound system komplit untuk event, pesta, atau konser kecil. Subwoofer 18 inch x2, speaker full range, mixer 16 channel, mic wireless x4. Include operator.","category":"Audio & Sound","sub_category":"Speaker","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":3500000,"price_week":null,"price_month":null,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80"],"features":["Include operator","Subwoofer 18 x2","Mixer 16ch","Mic wireless x4","Antar-jemput"],"rating":4.8,"review_count":6,"view_count":45,"extra_fields":{"brand":"JBL/Yamaha","power_watts":5000}},
  {"id":"c776bed7","title":"Kos Premium AC Wifi di Sleman","description":"Kamar kos nyaman di Sleman Yogyakarta. Full furnished, AC, wifi kencang, dapur bersama, parkir motor.","category":"Property","sub_category":"Kos","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":120000,"price_week":700000,"price_month":2000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"],"features":["AC","Wifi 50Mbps","Kamar mandi dalam","Dapur bersama","Parkir motor"],"rating":4.4,"review_count":9,"view_count":134,"extra_fields":{"bedrooms":1,"bathrooms":1,"toilets":1,"parking":1,"property_type":"Kos","wifi_included":true}},
  {"id":"e1c35d8f","title":"Tenda Pesta 10x20m - 200 Orang","description":"Sewa tenda pesta ukuran 10x20 meter, bisa menampung 200 orang. Include pemasangan dan lampu.","category":"Party & Event","sub_category":"Tenda","city":"Yogyakarta","address":"Sleman, DIY Yogyakarta","price_day":2500000,"price_week":15000000,"price_month":null,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80"],"features":["Include pasang & bongkar","Lampu dekorasi","Alas karpet","Antar-jemput"],"rating":4.6,"review_count":11,"view_count":78,"extra_fields":{"capacity":200,"setup_included":true}},
  {"id":"c1","title":"Toyota Innova Reborn 2023 - Premium","description":"Toyota Kijang Innova Reborn diesel 2023. Interior kulit, Captain seat, TV headrest. Cocok untuk keluarga atau bisnis.","category":"Cars","sub_category":"MPV","city":"Bali","address":"Kuta, Bali","price_day":500000,"price_week":3000000,"price_month":10000000,"condition":"like_new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80","https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80"],"features":["Captain seat","AC double blower","GPS","Asuransi all risk"],"rating":4.9,"review_count":42,"view_count":520,"extra_fields":{"year":2023,"brand":"Toyota","model":"Innova","seats":7,"transmission":"automatic","withDriver":true,"driverFee":"200000"}},
  {"id":"c2","title":"Honda Brio 2024 - City Car Irit","description":"Honda Brio 2024 matic, irit BBM. Cocok untuk keliling kota. Kondisi seperti baru.","category":"Cars","sub_category":"City Car","city":"Yogyakarta","address":"Sleman, DIY","price_day":200000,"price_week":1200000,"price_month":4000000,"condition":"new","status":"active","owner_type":"owner","images":["https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledasdadaa.png","https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80","https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"],"features":["AC dingin","Bluetooth","Kamera mundur","Sensor parkir"],"rating":4.7,"review_count":28,"view_count":340,"extra_fields":{"year":2024,"brand":"Honda","model":"Brio","seats":5,"transmission":"automatic"}},
  {"id":"c3","title":"Mitsubishi Xpander 2023 - 7 Seat","description":"Xpander Cross 2023 kondisi prima. Interior luas, bagasi besar. Cocok touring keluarga.","category":"Cars","sub_category":"MPV","city":"Bali","address":"Seminyak, Bali","price_day":400000,"price_week":2400000,"price_month":8000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80","https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80","https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80","https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80"],"features":["Sunroof","Cruise control","AC auto","USB charger"],"rating":4.8,"review_count":35,"view_count":410,"extra_fields":{"year":2023,"brand":"Mitsubishi","model":"Xpander","seats":7,"transmission":"automatic","withDriver":true}},
  {"id":"c4","title":"Suzuki Ertiga 2022 - Keluarga","description":"Ertiga GX 2022, 7 penumpang, matic, AC double blower. Bersih dan terawat.","category":"Cars","sub_category":"MPV","city":"Jakarta","address":"Jakarta Selatan","price_day":300000,"price_week":1800000,"price_month":6000000,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80"],"features":["AC double","Audio Bluetooth","Asuransi"],"rating":4.5,"review_count":16,"view_count":180,"extra_fields":{"year":2022,"brand":"Suzuki","model":"Ertiga","seats":7,"transmission":"automatic"}},
  {"id":"c5","title":"Toyota Fortuner 2022 - SUV Premium","description":"Fortuner VRZ 4x2 diesel, kondisi mewah. Cocok untuk perjalanan jauh atau acara penting.","category":"Cars","sub_category":"SUV","city":"Bali","address":"Denpasar, Bali","price_day":800000,"price_week":5000000,"price_month":16000000,"condition":"like_new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80","https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80","https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80"],"features":["Kulit asli","Cruise control","360 camera","Asuransi all risk"],"rating":4.9,"review_count":22,"view_count":380,"buy_now":{"price":"520000000","negotiable":false},"extra_fields":{"year":2022,"brand":"Toyota","model":"Fortuner","seats":7,"transmission":"automatic","withDriver":true,"driverFee":"250000"}},
  {"id":"m3","title":"Honda PCX 160 2024 - Premium Matic","description":"PCX 160 ABS 2024 kondisi baru, fitur lengkap. Smart key, USB charger, LED DRL.","category":"Motorcycles","sub_category":"Matic","city":"Bali","address":"Canggu, Bali","price_day":150000,"price_week":900000,"price_month":3000000,"condition":"new","status":"active","owner_type":"owner","images":["https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledasdadaa.png","https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledasdadaa.png"],"features":["Smart key","Helm 2 buah","Jas hujan","USB charger","ABS"],"rating":4.8,"review_count":31,"view_count":420,"extra_fields":{"cc":160,"year":2024,"brand":"Honda","transmission":"matic","helmet_count":2,"delivery_available":true}},
  {"id":"m4","title":"Kawasaki Ninja 250 2023 - Sport","description":"Ninja 250 SE 2023, motor sport untuk pengalaman riding maksimal di Bali.","category":"Motorcycles","sub_category":"Sport","city":"Bali","address":"Seminyak, Bali","price_day":250000,"price_week":1500000,"price_month":5000000,"condition":"good","status":"active","owner_type":"owner","images":["https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledasdadaa.png","https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledasdadaa.png","https://fjvafjkzvygkhiwjuvla.supabase.co/storage/v1/object/public/assets/untitledasdadaa.png"],"features":["Helm 2 buah","Jas hujan","ABS dual channel","Slipper clutch"],"rating":4.7,"review_count":14,"view_count":290,"extra_fields":{"cc":250,"year":2023,"brand":"Kawasaki","transmission":"manual","helmet_count":2,"delivery_available":true}},
  {"id":"t1","title":"Toyota HiAce Commuter 2022 - 16 Seat","description":"HiAce Commuter 16 penumpang, AC, entertainment system. Cocok untuk tour group atau antar jemput.","category":"Buses","sub_category":"Minibus","city":"Bali","address":"Denpasar, Bali","price_day":900000,"price_week":5500000,"price_month":18000000,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80","https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"],"features":["AC","TV/Entertainment","16 Seat","Luggage space"],"rating":4.6,"review_count":8,"view_count":120,"extra_fields":{"year":2022,"brand":"Toyota","model":"HiAce","seats":16,"withDriver":true,"driverFee":"300000"}},
  {"id":"tr1","title":"Suzuki Carry Pickup 2023","description":"Carry pickup 2023 untuk pindahan atau angkut barang. Bersih dan terawat.","category":"Trucks","sub_category":"Pickup","city":"Yogyakarta","address":"Sleman, DIY","price_day":200000,"price_week":1200000,"price_month":4000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"],"features":["Terpal","Tali pengaman","Box opsional"],"rating":4.4,"review_count":6,"view_count":85,"extra_fields":{"year":2023,"brand":"Suzuki","model":"Carry","payload":"750 kg","withDriver":true}},
  {"id":"ph1","title":"Rumah Minimalis 3KT Sleman","description":"Rumah baru minimalis modern dekat kampus UGM. SHM, 2 lantai, garasi, taman.","category":"Property","sub_category":"House","city":"Yogyakarta","address":"Jl. Kaliurang KM 8, Sleman","price_day":null,"price_week":null,"price_month":null,"condition":"new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600"],"features":["AC 3 unit","Water Heater","CCTV","Taman","Garasi"],"rating":4.8,"review_count":5,"view_count":234,"buy_now":850000000,"extra_fields":{"bedrooms":3,"bathrooms":2,"toilets":2,"land_area":"150 m²","building_area":"100 m²","floors":2,"garage":1,"parking":2,"certificate":"SHM","furnished":"Semi Furnished","facing":"Selatan","year_built":2024,"property_type":"House"}},
  {"id":"ph2","title":"Rumah Furnished 4KT Dekat Malioboro","description":"Rumah fully furnished, 10 menit ke Malioboro. Hak Pakai — cocok expatriat. Akses mudah.","category":"Property","sub_category":"House","city":"Yogyakarta","address":"Jl. Prawirotaman, Yogyakarta","price_day":null,"price_week":null,"price_month":8000000,"price_6month":42000000,"price_year":78000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600"],"features":["AC","Water Heater","WiFi","Garden","CCTV","Parkir 2 mobil"],"rating":4.7,"review_count":12,"view_count":445,"extra_fields":{"bedrooms":4,"bathrooms":3,"toilets":3,"land_area":"200 m²","building_area":"180 m²","floors":2,"garage":2,"parking":3,"certificate":"Hak Pakai · 25yr","furnished":"Fully Furnished","facing":"Timur","year_built":2020,"property_type":"House","foreigner_eligible":true}},
  {"id":"pk1","title":"Kos Putri AC WiFi Dekat UGM","description":"Kos eksklusif putri, full furnished, KM dalam, AC, WiFi. 5 menit ke kampus UGM. Deposit 1 bulan.","category":"Property","sub_category":"Kos","city":"Yogyakarta","address":"Jl. Colombo No. 15, Caturtunggal","price_day":null,"price_week":null,"price_month":1500000,"price_3month":4050000,"price_6month":7650000,"price_year":14400000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600","https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600"],"features":["AC","WiFi 50Mbps","KM Dalam","Parkir Motor","Dapur Bersama","CCTV","Laundry"],"rating":4.6,"review_count":28,"view_count":890,"extra_fields":{"bedrooms":1,"bathrooms":1,"toilets":1,"parking":1,"property_type":"Kos","gender":"Putri","room_size":"12 m²","available_rooms":3,"certificate":"SHM","deposit":"Rp 1.500.000","min_duration":"6 bulan"}},
  {"id":"pk2","title":"Kos Campur Furnished Dekat UNY","description":"Kos campur furnished, wifi kencang, parkir luas. Dekat UNY dan pusat kota.","category":"Property","sub_category":"Kos","city":"Yogyakarta","address":"Jl. Gejayan, Yogyakarta","price_day":null,"price_week":null,"price_month":1200000,"price_3month":3240000,"price_6month":6120000,"price_year":11520000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600"],"features":["WiFi","Parkir Motor","Parkir Mobil","Dapur Bersama","Ruang Tamu"],"rating":4.3,"review_count":15,"view_count":560,"extra_fields":{"bedrooms":1,"bathrooms":1,"toilets":1,"parking":1,"property_type":"Kos","gender":"Campur","room_size":"10 m²","available_rooms":5,"certificate":"SHM","deposit":"Rp 1.200.000","min_duration":"3 bulan"}},
  {"id":"pf1","title":"Pabrik 3000m² Kawasan Industri Sentolo","description":"Pabrik siap operasi, loading dock, akses kontainer, daya 200kVA. Kawasan industri resmi, HGB 18 tahun.","category":"Property","sub_category":"Factory","city":"Kulon Progo, Yogyakarta","address":"Kawasan Industri Sentolo","price_day":null,"price_week":null,"price_month":null,"price_6month":400000000,"price_year":750000000,"price_2year":1350000000,"price_5year":3000000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600"],"features":["Loading Dock","Truck Access","IPAL","Security 24h","CCTV","Water Supply"],"rating":4.5,"review_count":3,"view_count":123,"extra_fields":{"land_area":"5.000 m²","building_area":"3.000 m²","power":"200 kVA","ceiling_height":"8m","certificate":"HGB · 18yr","zoning":"Industri","property_type":"Factory"}},
  {"id":"pf2","title":"Gudang 1500m² Akses Tol Jogja","description":"Gudang besar akses langsung tol Jogja-Solo. Cocok distribusi, e-commerce fulfillment.","category":"Property","sub_category":"Factory","city":"Sleman, Yogyakarta","address":"Jl. Ringroad Utara, Sleman","price_day":null,"price_week":null,"price_month":35000000,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600"],"features":["Akses Tol","Parkir Truk","CCTV","Security"],"rating":4.4,"review_count":6,"view_count":98,"buy_now":5500000000,"extra_fields":{"land_area":"2.000 m²","building_area":"1.500 m²","power":"100 kVA","ceiling_height":"6m","certificate":"HGB · 25yr","zoning":"Komersial","property_type":"Factory"}},
  {"id":"pv1","title":"Villa Mewah Pool View Sawah","description":"Villa fully furnished, private pool, pemandangan sawah. Cocok liburan keluarga atau investasi.","category":"Property","sub_category":"Villa","city":"Sleman, Yogyakarta","address":"Jl. Palagan KM 12, Sleman","price_day":1500000,"price_week":9000000,"price_month":15000000,"price_year":150000000,"condition":"new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600","https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600","https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600"],"features":["Private Pool","AC","WiFi","Garden","BBQ Area","Staff","Parking"],"rating":4.9,"review_count":34,"view_count":567,"extra_fields":{"bedrooms":4,"bathrooms":3,"toilets":4,"land_area":"500 m²","building_area":"250 m²","pool":true,"parking":3,"view":"Rice Field","guest_capacity":8,"certificate":"HGB · 22yr","furnished":"Fully Furnished","property_type":"Villa"}},
  {"id":"pv2","title":"Villa Minimalis 2KT Pool Kaliurang","description":"Villa modern minimalis dengan pool, dekat kawasan wisata Kaliurang. Cocok weekend getaway.","category":"Property","sub_category":"Villa","city":"Sleman, Yogyakarta","address":"Kaliurang KM 20, Sleman","price_day":1200000,"price_week":7000000,"price_month":12000000,"price_year":120000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600"],"features":["Pool","Mountain View","AC","WiFi","BBQ","Parking"],"rating":4.7,"review_count":19,"view_count":340,"buy_now":2800000000,"extra_fields":{"bedrooms":2,"bathrooms":2,"toilets":2,"land_area":"300 m²","building_area":"150 m²","pool":true,"parking":2,"view":"Mountain","guest_capacity":6,"certificate":"SHM","furnished":"Fully Furnished","property_type":"Villa"}},
  {"id":"pt1","title":"Tanah Strategis 500m² Dekat Jalan Utama","description":"Tanah strategis di pinggir jalan utama Sleman. SHM, zona residensial, kontur datar. Cocok rumah atau investasi.","category":"Property","sub_category":"Tanah","city":"Sleman, Yogyakarta","address":"Jl. Kaliurang KM 10, Sleman","price_day":null,"price_week":null,"price_month":null,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600","https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=600"],"features":["SHM","Akses Jalan Aspal","Listrik Tersedia","Air PDAM"],"rating":4.6,"review_count":3,"view_count":189,"buy_now":1200000000,"extra_fields":{"land_area":"500 m²","certificate":"SHM","zoning":"Residential","land_shape":"Regular","land_contour":"Flat","road_access":"Asphalt","road_width":"8m","facing":"South","electricity_available":true,"water_available":true,"imb_ready":true,"property_type":"Tanah"}},
  {"id":"pr1","title":"Ruko 3 Lantai Jalan Malioboro","description":"Ruko strategis 3 lantai di kawasan Malioboro. Cocok retail, F&B, atau kantor. SHM, AC terpasang.","category":"Property","sub_category":"Ruko","city":"Yogyakarta","address":"Jl. Malioboro No. 45, Yogyakarta","price_day":null,"price_week":null,"price_month":25000000,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600","https://images.unsplash.com/photo-1497366216548-37526070297c?w=600"],"features":["3 Lantai","AC","Parkir","CCTV","Loading Dock"],"rating":4.5,"review_count":7,"view_count":234,"buy_now":3500000000,"extra_fields":{"floors":3,"land_area":"75 m²","building_area":"200 m²","certificate":"SHM","electricity":"5500W","water":"PDAM","parking":2,"business_type":"Mixed","commercial_zone":true,"facing":"East","ac_installed":true,"loading_dock":false,"property_type":"Ruko"}},
  {"id":"pg1","title":"Gudang 2000m² Kawasan Industri Sleman","description":"Gudang modern 2000m² di kawasan industri. Loading dock, akses truk, ceiling 8m. Cocok logistik atau gudang e-commerce.","category":"Property","sub_category":"Gudang","city":"Sleman, Yogyakarta","address":"Kawasan Industri Sleman","price_day":null,"price_week":null,"price_month":40000000,"condition":"good","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600","https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600"],"features":["Loading Dock","Akses Truk","Security 24h","CCTV","Fire System"],"rating":4.3,"review_count":4,"view_count":112,"extra_fields":{"land_area":"3.000 m²","building_area":"2.000 m²","ceiling_height":"8m","loading_dock":true,"truck_access":true,"electricity_capacity":"200 kVA","three_phase":true,"fire_system":true,"security_guard":true,"certificate":"HGB","zoning":"Industrial","property_type":"Gudang"}},
  {"id":"ppb1","title":"Pabrik Garmen 5000m² + Kantor","description":"Pabrik garmen lengkap dengan area kantor, IPAL, daya 200kVA. Izin lingkungan lengkap. Kapasitas 300 pekerja.","category":"Property","sub_category":"Pabrik","city":"Klaten, Jawa Tengah","address":"Kawasan Industri Klaten","price_day":null,"price_week":null,"price_month":null,"condition":"good","status":"active","owner_type":"agent","images":["https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600"],"features":["IPAL","Loading Dock","Akses Kontainer","Security","Kantor","Parkir Luas"],"rating":4.2,"review_count":2,"view_count":67,"buy_now":12000000000,"extra_fields":{"land_area":"8.000 m²","building_area":"5.000 m²","ceiling_height":"10m","loading_dock":true,"truck_access":true,"electricity_capacity":"200 kVA","three_phase":true,"ipal":true,"environmental_permit":true,"office_area":"500 m²","worker_capacity":300,"crane_capacity":"5 ton","water_supply":"Both","fire_system":true,"security_guard":true,"certificate":"HGU","zoning":"Industrial","property_type":"Pabrik"}},
  {"id":"pa1","title":"Apartemen Studio Furnished BSD","description":"Studio apartment fully furnished di BSD City. Dekat AEON Mall, akses tol langsung. Pool, gym, security 24h.","category":"Property","sub_category":"Apartment","city":"Tangerang","address":"BSD City, Tangerang Selatan","price_day":null,"price_week":null,"price_month":3500000,"condition":"like_new","status":"active","owner_type":"owner","images":["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600"],"features":["Pool","Gym","Security 24h","AC","WiFi","Parking"],"rating":4.5,"review_count":18,"view_count":320,"extra_fields":{"bedrooms":1,"bathrooms":1,"building_area":"25 m²","certificate":"SHMSRS","furnished":"Fully Furnished","floor":"12","parking":1,"property_type":"Apartment","pool":true}},
]

// ─── Helpers ───
export function fmtIDR(n) {
  if (!n) return '-'
  return `Rp ${Number(n).toLocaleString('id-ID')}`
}

export function getConditionLabel(c) {
  const map = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair' }
  return map[c] || c
}

// ─── In-memory cache for Supabase results ───
let _cache = { listings: null, ts: 0 }
const CACHE_TTL = 30_000 // 30s

function isCacheValid() {
  return _cache.listings && (Date.now() - _cache.ts < CACHE_TTL)
}

// ─── Supabase queries ───

/**
 * Fetch all active listings from Supabase.
 * Returns array of listing objects. Falls back to DEMO_LISTINGS in demo mode.
 */
export async function fetchListings() {
  if (!supabase) return DEMO_LISTINGS.filter(l => l.status === 'active')
  if (isCacheValid()) return _cache.listings

  const { data, error } = await supabase
    .from('rental_listings')
    .select('*')
    .in('status', ['active', 'live'])
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[rentalService] Supabase fetch failed, using demo data:', error.message)
    return DEMO_LISTINGS.filter(l => l.status === 'active')
  }

  _cache = { listings: data, ts: Date.now() }
  return data
}

/**
 * Fetch listings by category from Supabase.
 */
export async function fetchListingsByCategory(catId) {
  if (catId === 'all') return fetchListings()
  if (!supabase) return DEMO_LISTINGS.filter(l => l.status === 'active' && l.category === catId)

  const { data, error } = await supabase
    .from('rental_listings')
    .select('*')
    .eq('category', catId)
    .in('status', ['active', 'live'])
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[rentalService] category fetch failed:', error.message)
    return DEMO_LISTINGS.filter(l => l.status === 'active' && l.category === catId)
  }
  return data
}

/**
 * Search listings by text query (title, description, category, city, features).
 */
export async function fetchSearchListings(query) {
  if (!query.trim()) return fetchListings()
  if (!supabase) {
    const q = query.toLowerCase()
    return DEMO_LISTINGS.filter(l =>
      l.status === 'active' && (
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        (l.sub_category || '').toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        (l.features || []).some(f => f.toLowerCase().includes(q))
      )
    )
  }

  const { data, error } = await supabase
    .from('rental_listings')
    .select('*')
    .in('status', ['active', 'live'])
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,city.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[rentalService] search failed:', error.message)
    return []
  }
  return data
}

/**
 * Create a new listing in Supabase.
 */
export async function createListing(listing) {
  if (!supabase) {
    console.warn('[rentalService] No Supabase — listing saved locally only')
    return { data: listing, error: null }
  }

  const { data, error } = await supabase
    .from('rental_listings')
    .insert(listing)
    .select()
    .single()

  if (!error) _cache.listings = null // invalidate cache
  return { data, error }
}

/**
 * Update an existing listing.
 */
export async function updateListing(id, updates) {
  if (!supabase) return { data: { id, ...updates }, error: null }

  const { data, error } = await supabase
    .from('rental_listings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (!error) _cache.listings = null
  return { data, error }
}

/**
 * Delete a listing.
 */
export async function deleteListing(id) {
  if (!supabase) return { error: null }

  const { error } = await supabase
    .from('rental_listings')
    .delete()
    .eq('id', id)

  if (!error) _cache.listings = null
  return { error }
}

/**
 * Fetch listings owned by a specific user.
 */
export async function fetchMyListings(ownerId) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('rental_listings')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[rentalService] fetchMyListings failed:', error.message)
    return []
  }
  return data
}

/**
 * Increment view count for a listing.
 */
export async function incrementViewCount(id) {
  if (!supabase) return
  await supabase.rpc('increment_view_count', { listing_id: id }).catch(() => {})
}

// ─── Synchronous fallbacks (for components that haven't migrated to async) ───
// These keep backward compatibility during the transition.

export function getListings() {
  return DEMO_LISTINGS.filter(l => l.status === 'active')
}

export function getListingsByCategory(catId) {
  if (catId === 'all') return getListings()
  return getListings().filter(l => l.category === catId)
}

export function searchListings(query) {
  if (!query.trim()) return getListings()
  const q = query.toLowerCase()
  return getListings().filter(l =>
    l.title.toLowerCase().includes(q) ||
    l.description.toLowerCase().includes(q) ||
    l.category.toLowerCase().includes(q) ||
    (l.sub_category || '').toLowerCase().includes(q) ||
    l.city.toLowerCase().includes(q) ||
    (l.features || []).some(f => f.toLowerCase().includes(q))
  )
}
