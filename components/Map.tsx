'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Memperbaiki issue icon default Leaflet di React
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface MapProps {
  position: [number, number] | null;
  onPositionChange?: (pos: [number, number]) => void;
  readOnly?: boolean;
}

function LocationMarker({ position, setPosition, readOnly }: any) {
  useMapEvents({
    click(e) {
      if (!readOnly && setPosition) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      icon={icon} 
      draggable={!readOnly} 
      eventHandlers={{
        dragend: (e) => {
            if (readOnly || !setPosition) return;
            const marker = e.target;
            const pos = marker.getLatLng();
            setPosition([pos.lat, pos.lng]);
        }
      }} 
    />
  );
}

export default function MapComponent({ position, onPositionChange, readOnly = false }: MapProps) {
  // Default ke Jakarta Pusat jika tidak ada koordinat
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(position);

  useEffect(() => {
    if (position) setCurrentPosition(position);
  }, [position]);

  const handlePositionChange = (pos: [number, number]) => {
    setCurrentPosition(pos);
    if (onPositionChange) onPositionChange(pos);
  };

  return (
    <MapContainer 
      center={currentPosition || [-6.200000, 106.816666]} 
      zoom={position ? 15 : 11} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem', zIndex: 10 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={currentPosition} setPosition={handlePositionChange} readOnly={readOnly} />
    </MapContainer>
  );
}
