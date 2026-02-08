'use client';

import { useState, useEffect } from 'react';
import { fetchOffer, apiClient } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, Home, Users, Bed, Bath, Maximize, Layers, Monitor, Volume2, Waves, ShieldCheck, Sparkles } from 'lucide-react';
import { ConnectionError } from "@/components/ConnectionError";
import Chatbot from '@/components/Chatbot';
import { cn } from '@/lib/utils';
import { getSessionId } from '@/lib/session';
import { EasyRenderer } from '@/components/EasyRenderer';
import { getOfferContext, defaultTemplate } from '@/lib/templateUtils';

export default function OfferPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<boolean>(false);

    const [activeIndex, setActiveIndex] = useState(0);
    const [showDetails, setShowDetails] = useState(true);
    const [generatingOptionId, setGeneratingOptionId] = useState<string | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string>('');

    useEffect(() => {
        setCurrentSessionId(getSessionId());
    }, []);

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



    const handleOptionClick = async (option: any, index: number) => {
        if (!option.ai_copy) {
            setGeneratingOptionId(option.prop_id);
            try {
                const response = await apiClient(`/offers/${id}/generate-option`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prop_id: option.prop_id })
                });

                if (response && response.status === 'ok') {
                    // Update the local offer state with the new AI copy for that option
                    const updatedOptions = [...offer.options];
                    updatedOptions[index] = {
                        ...updatedOptions[index],
                        ai_copy: response.ai_copy,
                        headline: response.ai_copy.landing_hero || updatedOptions[index].headline,
                        summary: response.ai_copy.landing_summary || updatedOptions[index].summary
                    };
                    setOffer({ ...offer, options: updatedOptions });
                }
            } catch (err) {
                console.error("Failed to generate option copy", err);
            } finally {
                setGeneratingOptionId(null);
            }
        }

        setActiveIndex(index);
        setShowDetails(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };



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
                    <Link href="/demo" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all transform hover:scale-105">
                        Return to Dashboard
                    </Link>
                </div>
            </main>
        );
    }

    const { original_booking, options, status, expires_at } = offer;

    if (status === 'accepted') {
        const isOwnAcceptance = offer.session_id === currentSessionId;

        return (
            <main className="min-h-screen bg-[#050505] flex items-center justify-center p-8 text-white">
                <div className={cn(
                    "max-w-2xl w-full rounded-[3rem] p-16 text-center border space-y-8 shadow-[0_0_100px_-20px_rgba(0,0,0,0.15)]",
                    isOwnAcceptance
                        ? "border-green-500/20 bg-green-500/[0.02] shadow-[0_0_100px_-20px_rgba(34,197,94,0.15)]"
                        : "border-red-500/20 bg-red-500/[0.02] shadow-[0_0_100px_-20px_rgba(239,68,68,0.15)]"
                )}>
                    <div className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center mx-auto border shadow-inner",
                        isOwnAcceptance
                            ? "bg-green-600/10 border-green-500/20"
                            : "bg-red-600/10 border-red-500/20"
                    )}>
                        {isOwnAcceptance ? (
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        ) : (
                            <Clock className="w-12 h-12 text-red-500" />
                        )}
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-tight">
                            {isOwnAcceptance ? "Upgrade" : "Offer"} <br />
                            <span className={isOwnAcceptance ? "text-green-500" : "text-red-500"}>
                                {isOwnAcceptance ? "Confirmed!" : "Already Claimed"}
                            </span>
                        </h1>
                        <p className="text-gray-400 text-lg font-medium italic max-w-md mx-auto">
                            {isOwnAcceptance
                                ? `You have successfully upgraded your stay at ${original_booking.prop_name}. We can't wait to host you in your new luxury space.`
                                : `This exclusive upgrade for ${original_booking.prop_name} has already been claimed by another guest. High-demand units like these move quickly!`}
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link href="/demo" className="inline-flex items-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all transform hover:scale-105">
                            Return to Dashboard
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

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
                        <Link href="/demo" className="inline-flex items-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] transition-all transform hover:scale-105">
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

                {/* MAIN CONTENT AREA - Powered by Easyblocks */}
                <div className="space-y-20">
                    <EasyRenderer
                        templateJson={offer.template || defaultTemplate}
                        mode="landing"
                        data={getOfferContext(offer, original_booking, options)}
                    />
                </div>

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
                                    onClick={() => handleOptionClick(opt, optIndex)}
                                    className={cn(
                                        "group cursor-pointer bg-[#0A0A0A] border rounded-[2rem] overflow-hidden transition-all transform hover:-translate-y-1 shadow-2xl",
                                        generatingOptionId === opt.prop_id ? "border-orange-500/50 scale-[0.98]" : "border-white/5 hover:border-white/20"
                                    )}
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
                                                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 italic">
                                                        {opt.ai_copy ? "Only Upgrade" : "Secret Deal"}
                                                    </p>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {generatingOptionId === opt.prop_id ? (
                                                            <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                                                        ) : !opt.ai_copy ? (
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-lg font-black text-white/40">???</span>
                                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">See More</span>
                                                            </div>
                                                        ) : (
                                                            <p className="text-lg font-black text-white">+€{Math.round((opt.pricing?.revenue_lift || 0) / (opt.pricing?.nights || 1))}<span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-1">/nt</span></p>
                                                        )}
                                                    </div>
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
        </main >
    );
}
