'use client';

import React from 'react';
import { X, Mail, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmailPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    offer: any;
}

export default function EmailPreviewModal({ isOpen, onClose, offer }: EmailPreviewModalProps) {
    const router = useRouter();

    if (!isOpen || !offer) return null;

    // Robust data access
    const options = offer.options || offer.top3 || [];
    const firstOption = options[0];
    const guestName = offer.original_booking?.guest_name || offer.guest_name || 'Guest';
    const originalPropName = offer.original_booking?.prop_name || offer.prop_name || 'Original Property';
    const emailSubject = offer.email_subject || `✨ Your Stay at ${originalPropName} just got an upgrade!`;

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        // Handle both /properties/prop_id.png and properties/prop_id.png
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        const baseUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3030').replace(/\/$/, '');
        return `${baseUrl}${cleanPath}`;
    };

    // If images array is empty, fallback to ID-based path
    const rawImagePath = firstOption?.images?.[0] || (firstOption?.prop_id ? `/properties/${firstOption.prop_id}.png` : null);
    const previewImageUrl = getImageUrl(rawImagePath);

    // Debugging image path
    if (isOpen && firstOption) {
        console.log('EmailPreviewModal Debug:', {
            propName: firstOption.prop_name,
            rawImagePath,
            resolvedUrl: previewImageUrl,
            pricing: firstOption.pricing,
            aiCopy: firstOption?.ai_copy
        });
    }

    const extraPerNight = firstOption?.pricing?.nights
        ? (firstOption.pricing.revenue_lift / firstOption.pricing.nights)
        : (firstOption?.pricing?.offer_adr - firstOption?.pricing?.from_adr);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-10">
            <div
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-4xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Mail App Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Email Generated</h3>
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-widest">Guest Delivery Simulation</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Email Headers */}
                    <div className="space-y-4 pb-8 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="w-16 font-bold text-slate-400 dark:text-gray-500 uppercase text-[10px] tracking-widest">From</span>
                            <span className="text-slate-900 dark:text-slate-200 font-medium italic">UpRez Orchestrator &lt;concierge@up-rez.ai&gt;</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="w-16 font-bold text-slate-400 dark:text-gray-500 uppercase text-[10px] tracking-widest">To</span>
                            <span className="text-slate-900 dark:text-slate-200 font-bold">{guestName} &lt;{offer.original_booking?.guest_email || 'guest@example.com'}&gt;</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="w-16 font-bold text-slate-400 dark:text-gray-500 uppercase text-[10px] tracking-widest">Subject</span>
                            <span className="text-orange-600 font-black italic uppercase tracking-tight">{emailSubject}</span>
                        </div>
                    </div>

                    {/* Email Content Mockup */}
                    <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 rounded-3xl p-10 space-y-8 max-w-2xl mx-auto shadow-sm text-slate-900 dark:text-white">
                        {previewImageUrl && (
                            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-white/10 group">
                                <img
                                    src={previewImageUrl}
                                    alt="Property Preview"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                                <div className="absolute bottom-4 left-6">
                                    <p className="text-white font-black italic uppercase tracking-widest text-sm shadow-sm">{firstOption?.prop_name}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                                {firstOption?.ai_copy?.email_title || firstOption?.headline || "Elevate Your Experience"}
                            </h4>
                            <p className="text-slate-600 dark:text-gray-400 leading-relaxed italic">
                                {firstOption?.ai_copy?.email_content ? (
                                    firstOption.ai_copy.email_content
                                ) : (
                                    <>
                                        Hello {guestName.split(' ')[0]},<br /><br />
                                        We noticed your upcoming stay at <strong>{originalPropName}</strong> and wanted to offer you something special.
                                        Based on your preferences, we've curated an exclusive upgrade opportunity for your dates.
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {firstOption?.ai_copy?.email_selling_points && (
                                <ul className="space-y-2 mb-6">
                                    {firstOption.ai_copy.email_selling_points.map((point: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-400 italic">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-orange-500/10 flex flex-col items-center justify-center text-orange-600 font-black text-xs italic p-2">
                                    <span className="text-lg font-black text-orange-500">+€{Math.round(extraPerNight || 0)}/night</span>
                                    {firstOption?.pricing?.revenue_lift && (
                                        <span className="text-[10px] text-gray-400 text-center mt-1">
                                            €{firstOption.pricing.revenue_lift.toFixed(0)} total for {firstOption.pricing.nights || 0} nights
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold uppercase text-xs">{firstOption?.prop_name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-widest">
                                        {firstOption?.ai_copy?.email_title || firstOption?.headline || firstOption?.summary}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                router.push(`/offer/${offer.id}`);
                                onClose();
                            }}
                            className="w-full py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all transform hover:scale-[1.02] shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3"
                        >
                            View Personalized Upgrades
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <p className="text-[10px] text-center text-slate-400 dark:text-gray-600 font-bold uppercase tracking-[0.2em]">
                            Special offer valid for 48 hours only
                        </p>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="px-8 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
                    <span>ID: {offer.id}</span>
                    <span className="text-green-500">Rendered via Client-Side Logic Core</span>
                </div>
            </div>
        </div>
    );
}
