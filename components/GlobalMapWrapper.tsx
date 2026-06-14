'use client';
import dynamic from 'next/dynamic';
import type { MitraProfile } from './GlobalMap';

// Dynamic import map global
const GlobalMap = dynamic(() => import('./GlobalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 shadow-inner">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-3"></div>
      <p className="text-gray-400 font-medium text-sm">Memuat Peta Seluruh Mitra...</p>
    </div>
  )
});

import { dummyMitras } from '@/lib/dummyData';

export default function GlobalMapWrapper(props: { mitraList: MitraProfile[], selectedId?: string | null }) {
  // Gabungkan data asli dari database dan data dummy
  const combinedMitraList = [...props.mitraList, ...dummyMitras];

  return <GlobalMap {...props} mitraList={combinedMitraList} />;
}
