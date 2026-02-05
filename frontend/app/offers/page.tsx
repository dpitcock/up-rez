'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useLogs } from '@/context/LogContext';
import { apiClient, listOffers, expireOffer } from '@/lib/api';
import {
    ExternalLink, Clock, Ban, CheckCircle2, XCircle,
    RefreshCcw, Database, Play, Layout, Box, Globe, Mail
} from 'lucide-react';
import Link from 'next/link';
import EmailPreviewModal from '@/components/EmailPreviewModal';

// Simple cn utility
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function OffersPage() {
    const router = useRouter();
    const { addLog } = useLogs();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<any>(null);

    const loadOffers = async () => {
        try {
            const data = await listOffers();
            setOffers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load offers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const handleAction = async (endpoint: string, method: string = 'POST', body?: any) => {
        setActionLoading(true);
        try {
            const data = await apiClient(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined
            });
            if (data) {
                addLog(data.message || "Action completed successfully", "success");
                await loadOffers();
            }
        } catch (err) {
            addLog("Network error occurred", "error");
        } finally {
            setActionLoading(false);
        }
    };



    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this offer? It will be marked as expired.")) return;
        try {
            await expireOffer(id);
            addLog("Offer canceled and marked as expired", "info");
            await loadOffers();
        } catch (err) {
            console.error("Failed to cancel offer", err);
            addLog("Failed to cancel offer", "error");
        }
    };

    const StatusBadge = ({ offer }: { offer: any }) => {
        const isPastExpiry = new Date(offer.expires_at) < new Date();
        const status = (offer.status === 'expired' || isPastExpiry) ? 'expired' : offer.status;

        if (status === 'accepted') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    Accepted
                </span>
            );
        }

        if (status === 'expired') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                    <XCircle className="w-3 h-3" />
                    Expired
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 uppercase tracking-wider animate-pulse">
                <Clock className="w-3 h-3" />
                Active
            </span>
        );
    };

    const subHeader = (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleAction('/demo/normalize-dates')}
                data-tooltip="Normalize Dates"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-orange-500/10 hover:text-orange-500 transition-all border border-slate-200 dark:border-white/10 group relative"
            >
                <RefreshCcw className="w-4 h-4" />
            </button>
            <button
                onClick={() => handleAction('/demo/reset-data')}
                data-tooltip="Reset Database"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all border border-slate-200 dark:border-white/10 group relative"
            >
                <Database className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-2" />
            <button
                onClick={() => handleAction('/demo/frontend-build')}
                data-tooltip="Rebuild Layout Templates"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 transition-all border border-slate-200 dark:border-white/10 group relative"
            >
                <Play className="w-4 h-4" />
            </button>
            <button
                onClick={() => router.push('/tower')}
                data-tooltip="Intelligence Hub (Tower)"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-500 transition-all border border-slate-200 dark:border-white/10 group relative"
            >
                <Box className="w-4 h-4" />
            </button>

        </div>
    );

    return (
        <DashboardLayout subHeader={subHeader}>
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Sent Offers</h2>
                    <p className="text-slate-500 dark:text-gray-500 text-sm font-medium">Review and manage guest upgrade invitations</p>
                </div>
                <button
                    onClick={loadOffers}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 hover:text-orange-500 transition-colors flex items-center gap-2"
                >
                    <RefreshCcw className={cn("w-3 h-3", loading && "animate-spin")} />
                    Refresh Cluster
                </button>
            </div>

            {loading ? (
                <div className="py-40 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto opacity-50"></div>
                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Loading Offer Ledger...</p>
                </div>
            ) : offers.length === 0 ? (
                <div className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] border border-slate-200 dark:border-white/5 p-20 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
                        <span className="text-3xl">🎁</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Invitations</h3>
                    <p className="text-slate-500 dark:text-gray-500 mb-8 max-w-sm mx-auto text-sm">Deploy the orchestration engine to generate your first high-conversion upgrade offer.</p>
                    <Link
                        href="/demo"
                        className="inline-flex items-center px-8 py-4 bg-slate-900 dark:bg-orange-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-black dark:hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20"
                    >
                        Initialize Demo
                    </Link>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">Guest</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">Property</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">Expires</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {offers.map((offer) => (
                                    <tr key={offer.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{offer.guest_name}</div>
                                            <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono tracking-tighter uppercase">{offer.id.slice(0, 12)}</div>
                                            {offer.status === 'accepted' && offer.upgrade_at && (
                                                <div className="mt-2 text-[8px] font-black uppercase text-green-600 tracking-widest flex items-center gap-1">
                                                    <CheckCircle2 className="w-2 h-2" />
                                                    Finalized {new Date(offer.upgrade_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm text-slate-600 dark:text-gray-300 font-bold italic tracking-tight uppercase mb-1">{offer.prop_name}</div>
                                            {offer.status === 'accepted' && offer.original_prop_name && (
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Upgraded from: <span className="text-slate-500 line-through decoration-slate-300 decoration-1">{offer.original_prop_name}</span>
                                                    </div>
                                                    <div className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                                                        Revenue Lift: +€{Math.round(offer.payment_amount - (offer.original_total_paid || 0))}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge offer={offer} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-slate-900 dark:text-gray-300">
                                                {new Date(offer.expires_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">
                                                {new Date(offer.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOffer(offer);
                                                        setShowPreview(true);
                                                    }}
                                                    className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm border border-slate-200 dark:border-white/5"
                                                    data-tooltip="Email Preview"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                                <Link
                                                    href={`/offer/${offer.id}`}
                                                    target="_blank"
                                                    className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 dark:hover:text-white transition-all shadow-sm border border-slate-200 dark:border-white/5"
                                                    data-tooltip="Public Page"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>

                                                {/* Cancel Button: Only if Active (using same logic as StatusBadge) */}
                                                {(() => {
                                                    const isPastExpiry = new Date(offer.expires_at) < new Date();
                                                    const computedStatus = (offer.status === 'expired' || isPastExpiry) ? 'expired' : offer.status;
                                                    return computedStatus === 'active' && (
                                                        <button
                                                            onClick={() => handleCancel(offer.id)}
                                                            className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-white/5"
                                                            data-tooltip="Cancel Offer"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <EmailPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                offer={selectedOffer}
            />
        </DashboardLayout>
    );
}
