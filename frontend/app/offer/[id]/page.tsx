'use client';

import { useState, useEffect } from 'react';
import { fetchOffer, apiClient } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, Home, Users, Bed, Bath, Maximize, Layers, Monitor, Volume2, Waves, ShieldCheck, Sparkles } from 'lucide-react';
import { ConnectionError } from "@/components/ConnectionError";
import Chatbot from '@/components/Chatbot';

export default function OfferPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<boolean>(false);

    const [activeIndex, setActiveIndex] = useState(0);
    const [showDetails, setShowDetails] = useState(true);

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

    const handleEnableOpenAI = async () => {
        try {
            await apiClient('/demo/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    use_openai: true,
                    local_model: "gemma3:latest"
                })
            });
            loadOffer();
        } catch (err) {
            console.error("Failed to enable OpenAI", err);
        }
    };

    useEffect(() => {
        const enableOpenAI = async () => {
            try {
                await apiClient('/demo/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        use_openai: true,
                        local_model: "gemma3:latest"
                    })
                });
            } catch (err) {
                console.error("Failed to enable OpenAI", err);
            }
        };
        enableOpenAI();
    }, []);

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
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all transform hover:scale-105">
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
                <div className="max-w-2xl w-full rounded-[3rem] p-16 text-center border border-orange-500/20 bg-orange-500/[0.02] space-y-8 shadow-[0_0_100px_-20px_rgba(234,88,12,0.15)]">
                    <div className="w-24 h-24 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/20 shadow-inner">
                        <Clock className="w-12 h-12 text-orange-500" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-tight">
                            You weren't <br />
                            <span className="text-orange-500">fast enough!</span>
                        </h1>
                        <p className="text-gray-400 text-lg font-medium italic max-w-md mx-auto">
                            The exclusive upgrade window for your stay at <strong>{original_booking.prop_name}</strong> has closed. High-demand units like these move quickly.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link href="/dashboard" className="inline-flex items-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all transform hover:scale-105">
                            Return to Dashboard
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const currentOption = options[activeIndex] || options[0];
    const otherOptions = options.filter((_: any, i: number) => i !== activeIndex);

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
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
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <div className="flex bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-fit items-center gap-2 mb-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Invitation from</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">{offer.host_info?.pm_name || "Your Host"}</div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none">
                            Elevate<br />Your Stay
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl">
                            {original_booking.guest_name}, custom upgrades curated for your stay at <span className="text-white font-bold">{original_booking.prop_name}</span>.
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

                {/* MAIN CONTENT AREA */}
                <div className="space-y-20">
                    {/* HERO FOCUS OFFER VIEW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Offer Logic & CTA */}
                        <div className="space-y-8">
                            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-10">
                                <div>
                                    <h3 className="text-xs font-black uppercase text-gray-500 tracking-[0.2em] mb-4">Why this upgrade?</h3>
                                    <p className="text-2xl text-white font-black leading-tight italic uppercase tracking-tighter mb-4">
                                        {currentOption.headline || "Elevated Experience"}
                                    </p>
                                    <p className="text-lg text-gray-400 font-medium leading-relaxed italic">"{currentOption.summary}"</p>
                                </div>

                                {/* Incremental Price Deal Box */}
                                <div className="bg-orange-600/10 border border-orange-500/20 rounded-3xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Sparkles className="w-16 h-16 text-orange-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">The Exclusive Deal</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white italic">+€{currentOption.pricing?.extra_per_night || 0}</span>
                                            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">per night</span>
                                        </div>
                                        <p className="mt-4 text-xs text-gray-400 font-medium max-w-[200px]">
                                            Upgrade your entire {original_booking.nights}-night stay for just <span className="text-white font-bold">€{currentOption.pricing?.total_extra || 0}</span> today.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {currentOption.diffs?.slice(0, 3).map((diff: string, i: number) => (
                                        <div key={i} className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-200">{diff}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => router.push(`/pay/${id}?option=${currentOption.prop_id}`)}
                                        className="w-full py-6 rounded-3xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] shadow-[0_20px_50px_-12px_rgba(234,88,12,0.4)] flex items-center justify-center gap-3"
                                    >
                                        Accept Upgrade
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => setShowDetails(!showDetails)}
                                        className="w-full py-4 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        {showDetails ? "Hide Property Details" : "Explore Full Property Details & Gallery"}
                                        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showDetails ? 'rotate-90' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Property Image Focus */}
                        <div className="relative group lg:h-full">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 rounded-[3rem] pointer-events-none" />
                            <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                                {currentOption.images?.[0] ? (
                                    <Image
                                        src={getImageUrl(currentOption.images[0]) || ""}
                                        alt={currentOption.prop_name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center italic text-gray-500">
                                        Preview visual loading...
                                    </div>
                                )}
                            </div>

                            {/* Floating Metadata */}
                            <div className="absolute bottom-10 left-10 z-20">
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">{currentOption.prop_name}</h2>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white">
                                        {currentOption.location}
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-orange-600 border border-orange-500 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                                        Top Choice
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLLAPSIBLE DATA-READY PROPERTY SPEC SHEET */}
                    {showDetails && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-700 space-y-12 bg-white/[0.01] border border-white/5 rounded-[3rem] p-12">
                            <div className="flex items-center justify-between border-b border-white/10 pb-8">
                                <div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-orange-500">Property Specifications</h3>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Verified unit data & host requirements</p>
                                </div>
                                <div className="hidden md:flex gap-4">
                                    <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        ID: {currentOption.prop_id}
                                    </div>
                                    <div className="px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest text-orange-500">
                                        {currentOption.category?.replace(/_/g, ' ') || "Luxury"} Tier
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-16">
                                {/* Core Data Specs */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-12 gap-x-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Max Guests</p>
                                        </div>
                                        <p className="font-bold text-xl">{currentOption.max_guests || 0} Pax</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Bed className="w-4 h-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Bedrooms</p>
                                        </div>
                                        <p className="font-bold text-xl">{currentOption.bedrooms || 0} Units</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Bath className="w-4 h-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Bathrooms</p>
                                        </div>
                                        <p className="font-bold text-xl">{currentOption.baths || 0} Rooms</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Maximize className="w-4 h-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Living Area</p>
                                        </div>
                                        <p className="font-bold text-xl">{currentOption.size_sqm || 0} m²</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Layers className="w-4 h-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Elevation</p>
                                        </div>
                                        <p className="font-bold text-xl">{currentOption.floor === 0 ? 'Ground' : `${currentOption.floor}th`} Lv</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <ShieldCheck className="w-4 h-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Accessibility</p>
                                        </div>
                                        <p className="font-bold text-xl">{currentOption.elevator ? 'Elevator' : 'Stairs Only'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                    {/* Suitability Matrix */}
                                    <div className="space-y-8">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-3">
                                            <div className="h-px w-8 bg-white/10" />
                                            Guest Suitability Matrix
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(currentOption.suitability || {}).map(([key, value]: [string, any]) => (
                                                <div key={key} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${value ? 'border-green-500/10 bg-green-500/[0.02] text-green-500' : 'border-white/5 bg-white/[0.01] text-gray-600'}`}>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {key.replace(/([A-Z])/g, ' $1').replace(/Allowed/g, '')}
                                                    </span>
                                                    {value ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 opacity-30" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Operational Rules */}
                                    <div className="space-y-8">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-3">
                                            <div className="h-px w-8 bg-white/10" />
                                            House Rules & Operations
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {Object.entries(currentOption.house_rules || {}).map(([key, value]: [string, any]) => (
                                                <div key={key} className="flex justify-between items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    <span className="text-xs font-bold text-white italic">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Amenities Cloud */}
                                <div className="space-y-8">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-3">
                                        <div className="h-px w-8 bg-white/10" />
                                        Extended Amenity Profile
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {currentOption.amenities?.map((amn: string, i: number) => (
                                            <div key={i} className="px-6 py-3 border border-white/5 rounded-2xl bg-white/[0.01] text-[10px] font-bold uppercase tracking-widest hover:border-orange-500/30 transition-all hover:bg-orange-500/5 cursor-default flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.8)]" />
                                                {amn.replace(/_/g, ' ')}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {currentOption.description_long && (
                                    <div className="space-y-6 pt-12 border-t border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Unit Narrative</h4>
                                        <p className="text-gray-400 leading-relaxed max-w-4xl italic text-lg font-medium">"{currentOption.description_long}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* OTHER OPTIONS SECTION */}
                    <div className="space-y-10 pt-20 border-t border-white/5">
                        <div className="text-center">
                            <h3 className="text-2xl font-black italic uppercase tracking-tight mb-2">View other alternatives</h3>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Your curated shortlist of pre-approved upgrades</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {otherOptions.map((opt: any) => {
                                const optIndex = options.indexOf(opt);
                                return (
                                    <div
                                        key={opt.prop_id}
                                        onClick={() => {
                                            setActiveIndex(optIndex);
                                            setShowDetails(false); // Reset details when switching properties
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="group cursor-pointer bg-[#0A0A0A] border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all transform hover:-translate-y-1"
                                    >
                                        <div className="relative h-56 overflow-hidden">
                                            <img
                                                src={getImageUrl(opt.images[0]) || ""}
                                                className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                                                alt={opt.prop_name}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent group-hover:via-transparent transition-all" />
                                            <div className="absolute bottom-6 left-6 right-6">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <h4 className="font-black italic uppercase text-xl leading-none">{opt.prop_name}</h4>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{opt.beds} Bed · {opt.location?.split(',')[0] || "Luxury Unit"}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 italic">Only Upgrade</p>
                                                        <p className="text-lg font-black text-white">+€{Math.round(opt.pricing.offer_adr - (original_booking.current_adr || 0))}<span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">/nt</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
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
                        <p className="text-gray-700 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3">
                            Upgrade offer powered by
                            <img src="/logo.svg" alt="UpRez" className="h-4 w-auto opacity-40 hover:opacity-100 transition-opacity" />
                        </p>
                    </div>
                </div>
            </footer>

            {/* AI Concierge Chatbot - Optimized for active option */}
            <Chatbot
                offerId={id}
                propId={currentOption.prop_id}
                propName={currentOption.prop_name}
                offer={offer}
                guestName={original_booking.guest_name}
            />
        </main>
    );
}
