'use client';

import React from 'react';
import { X, CheckCircle, Mail, FileText, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

interface OfferSuccessDialogProps {
    isOpen: boolean;
    onClose: () => void;
    offerId: string;
    guestName?: string;
    emailEnabled?: boolean;
    contactEmail?: string;
    onViewEmail: () => void;
}

export default function OfferSuccessDialog({
    isOpen,
    onClose,
    offerId,
    guestName,
    emailEnabled,
    contactEmail,
    onViewEmail
}: OfferSuccessDialogProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
            <div
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-green-500/20 text-green-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Success!</h3>
                            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-widest">Offer Generated & Sent</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Status Items */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">
                                    {emailEnabled ? 'Email Delivered' : 'Email Mocked'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                                    {emailEnabled
                                        ? `Check ${contactEmail || 'inbox'} for demo`
                                        : (guestName ? `To: ${guestName}` : 'Sent to guest')}
                                </p>
                            </div>
                            <CheckCircle className={cn("w-5 h-5 ml-auto", emailEnabled ? "text-green-500" : "text-slate-300")} />
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">Landing Page Live</p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                                    Offer ID: {offerId?.slice(0, 12)}...
                                </p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => {
                                window.open(`/offer/${offerId}`, '_blank');
                                onClose();
                            }}
                            className="w-full py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all transform hover:scale-[1.02] shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3"
                        >
                            View Offer Landing Page
                            <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                            onClick={onViewEmail}
                            className="w-full py-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white transition-all transform hover:scale-[1.02] border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3"
                        >
                            <Mail className="w-4 h-4" />
                            Preview Email
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl font-bold text-sm text-slate-600 dark:text-gray-400 transition-all border border-slate-200 dark:border-white/10"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 text-center">
                    <p className="text-[8px] font-black uppercase text-green-500 tracking-[0.2em]">
                        ✓ {process.env.NEXT_PUBLIC_USE_OPENAI === 'true' ? 'OpenAI-Powered' : 'Template-Based'} Generation Complete
                    </p>
                </div>
            </div>
        </div>
    );
}
