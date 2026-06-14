const fs = require('fs');
const path = require('path');

const roles = ['breeder', 'seller', 'seller,breeder'];
const cities = [
  { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Surabaya', lat: -7.2504, lng: 112.7688 },
  { name: 'Semarang', lat: -6.9666, lng: 110.4166 },
  { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { name: 'Malang', lat: -7.9839, lng: 112.6214 },
  { name: 'Bogor', lat: -6.5971, lng: 106.7932 },
  { name: 'Depok', lat: -6.4025, lng: 106.7942 },
  { name: 'Tangerang', lat: -6.1702, lng: 106.6403 },
  { name: 'Bekasi', lat: -6.2383, lng: 106.9756 },
  { name: 'Sukabumi', lat: -6.9222, lng: 106.9237 },
  { name: 'Cirebon', lat: -6.7320, lng: 108.5523 },
  { name: 'Tasikmalaya', lat: -7.3195, lng: 108.2040 },
  { name: 'Purwokerto', lat: -7.4245, lng: 109.2302 },
  { name: 'Tegal', lat: -6.8694, lng: 109.1402 },
  { name: 'Pekalongan', lat: -6.8887, lng: 109.6753 },
  { name: 'Solo', lat: -7.5666, lng: 110.8266 },
  { name: 'Madiun', lat: -7.6298, lng: 111.5239 },
  { name: 'Kediri', lat: -7.8480, lng: 112.0165 },
  { name: 'Blitar', lat: -8.0983, lng: 112.1681 },
  { name: 'Tulungagung', lat: -8.0667, lng: 111.9000 },
  { name: 'Jember', lat: -8.1721, lng: 113.7000 },
  { name: 'Banyuwangi', lat: -8.2192, lng: 114.3692 }
];

const generateRandomCoord = (baseLat, baseLng) => {
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
};

const storeNames = ['Koi Center', 'Koi Farm', 'Koi Gallery', 'Koi Palace', 'Koi Store', 'Koi House', 'Aqua Koi', 'Royal Koi', 'Champion Koi', 'Nusantara Koi'];

let mitras = [];
// 60 random Java
for (let i = 1; i <= 60; i++) {
  const city = cities[Math.floor(Math.random() * cities.length)];
  const storeType = storeNames[Math.floor(Math.random() * storeNames.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const coord = generateRandomCoord(city.lat, city.lng);
  
  mitras.push({
    id: 'dummy-' + i,
    store_name: city.name + ' ' + storeType + ' ' + i,
    store_address: 'Jl. Raya ' + city.name + ' No.' + (Math.floor(Math.random() * 100) + 1) + ', Jawa',
    avatar_url: '',
    latitude: parseFloat(coord.lat.toFixed(4)),
    longitude: parseFloat(coord.lng.toFixed(4)),
    role: role
  });
}

// 20 specific to Bandung
const bandung = { name: 'Bandung', lat: -6.9175, lng: 107.6191 };
for (let i = 61; i <= 80; i++) {
  const storeType = storeNames[Math.floor(Math.random() * storeNames.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const coord = generateRandomCoord(bandung.lat, bandung.lng);
  
  mitras.push({
    id: 'dummy-' + i,
    store_name: 'Bandung ' + storeType + ' ' + i,
    store_address: 'Jl. Raya Bandung No.' + (Math.floor(Math.random() * 100) + 1) + ', Jawa Barat',
    avatar_url: '',
    latitude: parseFloat(coord.lat.toFixed(4)),
    longitude: parseFloat(coord.lng.toFixed(4)),
    role: role
  });
}

const fileContent = "import type { MitraProfile } from '@/components/GlobalMap';\n\nexport const dummyMitras: MitraProfile[] = " + JSON.stringify(mitras, null, 2).replace(/"([a-zA-Z0-9_]+)":/g, '$1:') + ";\n";

fs.writeFileSync(path.join(__dirname, '../lib/dummyData.ts'), fileContent);
console.log('Successfully generated 80 dummy mitras (60 in Java, 20 specific to Bandung).');
