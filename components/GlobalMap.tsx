'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

export interface MitraProfile {
  id: string;
  store_name: string;
  store_address: string;
  avatar_url: string;
  latitude: number;
  longitude: number;
  role: string;
}

// Controller map untuk flyTo
function MapController({ selectedId, mitras }: { selectedId: string | null, mitras: MitraProfile[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedId) {
      const target = mitras.find(m => m.id === selectedId);
      if (target && target.latitude && target.longitude) {
        map.flyTo([target.latitude, target.longitude], 14, {
          duration: 1.5
        });
      }
    }
  }, [selectedId, mitras, map]);

  return null;
}

// Custom icons
const createIcon = (role: string) => {
  const isSeller = role?.includes('seller');
  const isBreeder = role?.includes('breeder');
  
  let bgColor = 'bg-gray-500'; // Default
  let iconSvg = '';
  
  if (isSeller && isBreeder) {
    bgColor = 'bg-orange-500';
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`;
  } else if (isBreeder) {
    bgColor = 'bg-blue-500';
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-waves"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
  } else if (isSeller) {
    bgColor = 'bg-purple-500';
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`;
  }

  const html = `<div class="${bgColor} w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg">${iconSvg}</div>`;

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function GlobalMapComponent({ mitraList, selectedId }: { mitraList: MitraProfile[], selectedId?: string | null }) {
  // Center default: Indonesia (jika kosong)
  const center: [number, number] = mitraList.length > 0 
    ? [mitraList[0].latitude, mitraList[0].longitude] 
    : [-2.548926, 118.014863];
  
  const zoom = mitraList.length > 0 ? 5 : 4;
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      markerRefs.current[selectedId]?.openPopup();
    }
  }, [selectedId]);

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%', zIndex: 10 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController selectedId={selectedId || null} mitras={mitraList} />
      
      {mitraList.map((mitra) => (
        <Marker 
          key={mitra.id} 
          position={[mitra.latitude, mitra.longitude]} 
          icon={createIcon(mitra.role)}
          ref={(ref) => {
            if (ref) {
              markerRefs.current[mitra.id] = ref;
            } else {
              delete markerRefs.current[mitra.id];
            }
          }}
        >
          <Popup>
            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                <img src={mitra.avatar_url || 'https://via.placeholder.com/150'} alt={mitra.store_name} className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200" />
                <div>
                  <h3 className="font-bold text-sm m-0 leading-tight text-gray-900">{mitra.store_name || 'Mitra KoiChain'}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mitra.role?.includes('breeder') && (
                        <span className="text-[9px] uppercase font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Breeder</span>
                    )}
                    {mitra.role?.includes('seller') && (
                        <span className="text-[9px] uppercase font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">Seller</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 m-0 line-clamp-2 leading-relaxed">{mitra.store_address}</p>
              <Link href={`/user/${mitra.id}`} className="mt-1 block text-center bg-gray-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-orange-600 transition shadow-sm">
                Kunjungi Profil
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
