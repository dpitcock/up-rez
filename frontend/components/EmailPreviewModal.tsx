'use client';

import React from 'react';
import { X, Mail, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EasyRenderer } from '@/components/EasyRenderer';
import { getOfferContext, defaultTemplate } from '@/lib/templateUtils';

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
                        <EasyRenderer
                            templateJson={offer.template || defaultTemplate}
                            mode="email"
                            data={getOfferContext(offer, offer.original_booking, options)}
                        />
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
