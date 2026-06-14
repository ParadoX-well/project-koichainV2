'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import GlobalMapWrapper from '@/components/GlobalMapWrapper';
import type { MitraProfile } from '@/components/GlobalMap';
import { Loader2, Map as MapIcon, Users } from 'lucide-react';

export default function MapsMitra() {
  const [mitraList, setMitraList] = useState<MitraProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMitra() {
      // Ambil profile yang bukan user biasa, dan koordinatnya tidak null
      const { data, error } = await supabase
        .from('profiles')
        .select('id, store_name, store_address, avatar_url, latitude, longitude, role')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('role', 'user');

      if (data) {
        setMitraList(data as MitraProfile[]);
      } else {
        console.error("Gagal mengambil data mitra:", error);
      }
      setLoading(false);
    }
    fetchMitra();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col h-screen">
      <Navbar />

      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full gap-6 h-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <MapIcon className="text-orange-600" size={32} /> Peta Mitra KoiChain
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Temukan toko dan farm ikan koi terdekat yang telah terverifikasi resmi.</p>
          </div>
          <div className="bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 w-fit">
            <div className="bg-gradient-to-br from-orange-100 to-pink-100 p-2.5 rounded-xl text-orange-600">
              <Users size={24} />
            </div>
            <div className="pr-2">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total Mitra Aktif</p>
              <p className="font-black text-2xl leading-none mt-1 text-gray-900">{mitraList.length}</p>
            </div>
          </div>
        </div>

        {/* Kotak Peta */}
        <div className="flex-1 bg-white p-2 sm:p-3 rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden relative min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-gray-50/50 backdrop-blur-sm z-20">
              <Loader2 className="animate-spin text-orange-500" size={32} />
              <p className="text-sm font-bold text-gray-500">Menyinkronkan data lokasi...</p>
            </div>
          ) : (
            <div className="w-full h-full rounded-3xl overflow-hidden">
               <GlobalMapWrapper mitraList={mitraList} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
