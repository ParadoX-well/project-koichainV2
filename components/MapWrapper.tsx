'use client';
import dynamic from 'next/dynamic';

interface MapProps {
  position: [number, number] | null;
  onPositionChange?: (pos: [number, number]) => void;
  readOnly?: boolean;
}

// Menonaktifkan Server-Side Rendering untuk Leaflet karena membutuhkan objek window
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-3"></div>
      <p className="text-gray-400 font-medium text-sm">Memuat Peta Interaktif...</p>
    </div>
  )
});

export default function MapWrapper(props: MapProps) {
  return <Map {...props} />;
}
