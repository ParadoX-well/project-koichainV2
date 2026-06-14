'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, MapPin, BadgeCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import GlobalMapWrapper from './GlobalMapWrapper';

export default function PartnerShowcase() {
    const [partners, setPartners] = useState<any[]>([]);
    const [allMitras, setAllMitras] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPartners() {

            const { data: profiles } = await supabase
                .from('profiles')
                .select(`
                    id, full_name, store_name, store_address, role, avatar_url, total_transfers, latitude, longitude,
                    user_wallets ( wallet_address )
                `)
                .eq('is_banned', false)
                .in('role', ['breeder', 'seller', 'seller,breeder']);

            if (profiles) {
                // Untuk map global, kita perlu yang ada latitude & longitude
                const validMitras = profiles.filter(p => p.latitude && p.longitude);
                setAllMitras(validMitras);

                const { data: allKois } = await supabase
                    .from('koi_certificates')
                    .select('wallet_address, breeder_id');
                
                const countByWallet: Record<string, number> = {};
                const countByBreeder: Record<string, number> = {};

                if (allKois) {
                    allKois.forEach(k => {
                        if (k.wallet_address) {
                            const addr = k.wallet_address.toLowerCase();
                            countByWallet[addr] = (countByWallet[addr] || 0) + 1;
                        }
                        if (k.breeder_id) {
                            countByBreeder[k.breeder_id] = (countByBreeder[k.breeder_id] || 0) + 1;
                        }
                    });
                }

                const partnersWithCount = profiles.map(p => {
                    let totalKoi = 0;
                    if (p.user_wallets && Array.isArray(p.user_wallets)) {
                        p.user_wallets.forEach((w: any) => {
                            if (w.wallet_address) {
                                totalKoi += countByWallet[w.wallet_address.toLowerCase()] || 0;
                            }
                        });
                    }
                    // Hitung total poin gabungan (minting + transfer) sebagai penentu Top Rank
                    const mintCount = countByBreeder[p.id] || 0;
                    const transferCount = p.total_transfers || 0;
                    const totalScore = mintCount + transferCount;

                    return { ...p, koi_count: totalKoi, mint_count: mintCount, total_score: totalScore };
                });

                // Urutkan berdasarkan total score tertinggi dan ambil 4 teratas
                const topPartners = partnersWithCount
                    .sort((a, b) => b.total_score - a.total_score)
                    .slice(0, 4);

                setPartners(topPartners);
            }
            setLoading(false);
        };

        fetchPartners();
    }, []);

    if (loading || partners.length === 0) return null;

    return (
        <section className="py-24 bg-white relative overflow-hidden" id="partner-showcase">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0 transform translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 animate-fade-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 mb-6 shadow-lg shadow-orange-600/20">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4">Top Breeder & Top Seller</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        Pemegang puncak klasemen Mitra terbaik yang mencetak dan memperdagangkan koi unggulan di ekosistem KoiChain.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Left: Cards */}
                    <div className="col-span-1 lg:col-span-1 flex flex-col gap-4">
                        {partners.map((p, idx) => (
                            <div 
                                key={p.id} 
                                onClick={() => setSelectedId(p.id)}
                                className={`group bg-white rounded-3xl border ${selectedId === p.id ? 'border-orange-500 shadow-orange-500/20 shadow-xl' : 'border-gray-100 shadow-sm hover:border-orange-200 hover:shadow-xl'} p-5 transition-all duration-300 transform cursor-pointer animate-fade-up`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full overflow-hidden flex items-center justify-center font-bold text-gray-500 text-lg shadow-inner border border-white shrink-0">
                                        {p.avatar_url ? (
                                            <img src={p.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            p.store_name ? p.store_name.charAt(0).toUpperCase() : p.full_name?.charAt(0).toUpperCase() || '?'
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-bold text-gray-900 text-base truncate">{p.store_name || p.full_name}</h3>
                                            <BadgeCheck className="text-blue-500 shrink-0" size={16} />
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {p.role?.includes('breeder') && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">Breeder</span>
                                            )}
                                            {p.role?.includes('seller') && (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold border border-purple-100">Seller</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-3 border-t border-gray-50">
                                    <div className="flex items-center justify-between text-xs font-bold mb-3">
                                        <div className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                            {p.mint_count || 0} Minting
                                        </div>
                                        <div className="text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                                            {p.total_transfers || 0} Transfer
                                        </div>
                                    </div>
                                    <Link href={`/user/${p.id}`} className="block w-full py-2 bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl text-center text-xs font-bold transition">
                                        Lihat Profil
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Map */}
                    <div className="col-span-1 lg:col-span-2 rounded-[2rem] overflow-hidden border border-gray-200 shadow-xl min-h-[500px] relative bg-gray-50 z-10">
                        {allMitras.length > 0 ? (
                           <GlobalMapWrapper mitraList={allMitras} selectedId={selectedId} />
                        ) : (
                           <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold">Belum ada mitra dengan lokasi yang diset.</div>
                        )}
                        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow border border-gray-100 text-xs font-bold text-gray-600 flex items-center gap-3">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div> Breeder</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-purple-500 rounded-full border border-white"></div> Seller</div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-orange-500 rounded-full border border-white"></div> Keduanya</div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link 
                        href="/mitra" 
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg border border-gray-200"
                    >
                        Semua Mitra <ArrowRight size={20} className="text-orange-400" />
                    </Link>
                    <Link 
                        href="/maps" 
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                    >
                        <MapPin size={20} className="text-orange-400" /> Peta Mitra Penuh
                    </Link>
                </div>
            </div>
        </section>
    );
}
