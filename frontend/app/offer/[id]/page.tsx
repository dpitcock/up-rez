'use client';

import { useState, useEffect } from 'react';
import { fetchOffer } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, Home } from 'lucide-react';
import { ConnectionError } from "@/components/ConnectionError";

export default function OfferPage() {
    const params = useParams();
    const id = params.id as string;

    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<boolean>(false);

    const loadOffer = async () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        try {
            const data = await fetchOffer(id);
            setOffer(data);
        } catch (err) {
            console.error("Failed to load offer", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOffer();
    }, [id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4 shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)]"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Decrypting Invitation...</p>
                </div>
            </main>
        );
    }

    const handleEnableOpenAI = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/demo/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    use_openai: true,
                    local_model: "gemma3:latest"
                })
            });
            if (res.ok) {
                loadOffer();
            }
        } catch (err) {
            console.error("Failed to enable OpenAI", err);
        }
    };

    if (error) {
        return (
            <main className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
                <ConnectionError
                    onRetry={loadOffer}
                    onEnableOpenAI={handleEnableOpenAI}
                />
            </main>
        );
    }

    if (!offer) {
        return (
            <main className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
                <div className="max-w-2xl w-full rounded-[3rem] p-12 text-center border border-white/5 bg-white/[0.02]">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4 italic uppercase">Link Expired</h1>
                    <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">This upgrade invitation has either expired or been withdrawn. Your original booking remains confirmed.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all transform hover:scale-105">
                        Return to Dashboard
                    </Link>
                </div>
            </main>
        );
    }

    const { original_booking, options, status, expires_at } = offer;

    if (status === 'expired') {
        return (
            <main className="min-h-screen bg-[#050505] flex items-center justify-center p-8 text-white">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
                        <Clock className="w-10 h-10 text-orange-500" />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase">Offer Expired</h1>
                    <p className="text-gray-400">This exclusive upgrade window closed on {new Date(expires_at).toLocaleDateString()}.</p>
                    <Link href="/" className="block py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                        Back to Home
                    </Link>
                </div>
            </main>
        );
    }

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;

        // Strip leading slash if present to avoid double slashes with baseUrl
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

        // If local, baseUrl is empty, so it returns "/properties/..."
        // If deployed, NEXT_PUBLIC_FRONTEND_URL should be set (e.g. https://up-rez.vercel.app)
        const baseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || '').replace(/\/$/, '');
        return `${baseUrl}${cleanPath}`;
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-orange-500">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <div className="flex bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-fit items-center gap-2 mb-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Invitation from</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">{offer.host_info?.pm_name || "Your Host"}</div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            Exclusive Member Upgrade
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none">
                            Elevate<br />Your Stay
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl">
                            {original_booking.guest_name}, we've unlocked premium properties for your upcoming trip to <span className="text-white font-bold">{original_booking.prop_name}</span>.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl min-w-[300px]">
                        <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                            <Clock className="w-3.5 h-3.5" />
                            Offer Deadline
                        </div>
                        <div className="text-2xl font-black mb-1 leading-none">
                            {new Date(expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-orange-500 font-bold uppercase tracking-widest">
                            at {new Date(expires_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Current Details Ribbon */}
                <div className="bg-[#0A0A0A] border-y border-white/5 py-8 mb-20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-1 px-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Current Base</div>
                            <div className="text-sm font-bold truncate">{original_booking.prop_name}</div>
                        </div>
                        <div className="space-y-1 px-4 border-l border-white/5">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Duration</div>
                            <div className="text-sm font-bold">{original_booking.nights} Nights</div>
                        </div>
                        <div className="space-y-1 px-4 border-l border-white/5">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Locked Rate</div>
                            <div className="text-sm font-bold text-orange-500">€{original_booking.current_adr}</div>
                        </div>
                        <div className="space-y-1 px-4 border-l border-white/5">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">Confirmed Total</div>
                            <div className="text-sm font-bold">€{original_booking.current_total}</div>
                        </div>
                    </div>
                </div>

                {/* Upgrade Options Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {options.map((option: any, idx: number) => (
                        <div key={option.prop_id} className="group flex flex-col h-full bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-orange-500/30 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(234,88,12,0.15)]">
                            {/* Image Header */}
                            <div className="relative h-72 overflow-hidden bg-white/5">
                                {(() => {
                                    const imgs = typeof option.images === 'string' ? JSON.parse(option.images) : option.images;
                                    const thumb = Array.isArray(imgs) ? imgs[0] : null;

                                    return thumb ? (
                                        <img
                                            src={getImageUrl(thumb) || ""}
                                            alt={option.prop_name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Home className="w-12 h-12 text-white/10" />
                                        </div>
                                    );
                                })()}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"></div>

                                {idx === 0 && (
                                    <div className="absolute top-6 right-6 px-4 py-2 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                        Editor's Choice
                                    </div>
                                )}

                                <div className="absolute bottom-6 left-8 right-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{option.prop_name}</h3>
                                    <div className="text-orange-500 text-xs font-black uppercase tracking-widest mt-1 italic">{option.headline}</div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 flex-1 flex flex-col">
                                <p className="text-gray-400 text-sm leading-relaxed mb-8 mb-auto">
                                    {option.summary}
                                </p>

                                <div className="space-y-6">
                                    {/* Highlights */}
                                    <div className="space-y-3">
                                        {option.diffs?.slice(0, 3).map((diff: string, i: number) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                                <span className="text-xs font-medium text-gray-300">{diff}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Price Card */}
                                    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Upgrade Rate</div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-4xl font-black tracking-tight text-white">€{option.pricing.offer_adr}</span>
                                                    <span className="text-gray-500 text-[10px] font-bold uppercase mb-2">/ night</span>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                                                -{Math.round((1 - option.pricing.offer_adr / option.pricing.to_adr_list) * 100)}%
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                            <div className="text-[10px] font-bold text-gray-500 uppercase">Total Difference</div>
                                            <div className="text-sm font-black text-white">+€{option.pricing.offer_total - original_booking.current_total}</div>
                                        </div>
                                    </div>

                                    <button className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-orange-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3">
                                        Confirm Upgrade
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-left space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Managed by</div>
                        <div className="text-lg font-black italic uppercase">{offer.host_info?.pm_name}</div>
                        {offer.host_info?.phone && (
                            <div className="text-xs text-gray-500 font-bold">{offer.host_info.phone}</div>
                        )}
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <p className="text-gray-700 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                            Upgrade offer powered by
                            <img src="/up-rez-logo-white.svg" alt="UpRez" className="h-2.5 w-auto opacity-20 grayscale" />
                            UpRez
                        </p>
                        <p className="text-[8px] text-gray-800 font-medium uppercase tracking-widest">Technological partner for luxury hospitality</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
