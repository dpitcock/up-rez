'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    RefreshCcw, Database,
    Play, Sparkles, Layout,
    Globe, Clock,
    ArrowRight,
    Zap,
    Box,
    Terminal,
    ChevronRight,
    Search,
    Filter,
    X,
    Mail
} from "lucide-react";

import { ConnectionError } from "@/components/ConnectionError";
import { apiClient } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { useLogs } from '@/context/LogContext';
import EmailPreviewModal from '@/components/EmailPreviewModal';
import OfferSuccessDialog from '@/components/OfferSuccessDialog';

interface ReadyBooking {
    id: string;
    guest_name: string;
    prop_name: string;
    arrival_date: string;
}

export default function DemoPage() {
    const router = useRouter();
    const { addLog } = useLogs();
    const [status, setStatus] = useState<any>(null);
    const [readyBookings, setReadyBookings] = useState<{ cron_ready: ReadyBooking[], cancellation_ready: ReadyBooking[] }>({
        cron_ready: [],
        cancellation_ready: []
    });
    const [selectedCron, setSelectedCron] = useState<string>("");
    const [selectedCancel, setSelectedCancel] = useState<string>("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewOffer, setPreviewOffer] = useState<any>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successOfferId, setSuccessOfferId] = useState<string>('');
    const [sessionId, setSessionId] = useState<string>("");
    const [successGuestName, setSuccessGuestName] = useState<string>('');

    useEffect(() => {
        setSessionId(localStorage.getItem('uprez_session_id') || "");
        refreshData();
    }, []);

    const refreshData = async () => {
        try {
            setError(false);
            const [statusData, readyData] = await Promise.all([
                apiClient(`/demo/status`),
                apiClient(`/demo/ready-bookings`)
            ]);

            setStatus(statusData);
            setReadyBookings(readyData);
        } catch (err) {
            console.error("Failed to refresh demo data", err);
            setError(true);
        }
    };

    const handleAction = async (endpoint: string, method: string = 'POST', body?: any) => {
        setLoading(true);
        const isTrigger = endpoint.includes('trigger');

        if (isTrigger) {
            addLog("AI Engine analyzing inventory availability...", "info");
        }

        try {
            const data = await apiClient(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined
            });

            if (data) {
                if (data.offer_id) {
                    addLog(`Offer generated! Preparing preview...`, "success");

                    setSuccessOfferId(data.offer_id);
                    const bookingId = body?.booking_id;
                    const guest = readyBookings.cron_ready.find((b: ReadyBooking) => b.id === bookingId) ||
                        readyBookings.cancellation_ready.find((b: ReadyBooking) => b.id === bookingId);
                    if (guest) setSuccessGuestName(guest.guest_name);

                    setShowSuccessDialog(true);
                } else {
                    addLog(data.message || "Action completed successfully", "success");
                }
                if (endpoint.includes('reset')) {
                    addLog("Inventory re-indexed.", "info");
                    await new Promise(r => setTimeout(r, 500));
                }
                await refreshData();
            }
        } catch (err) {
            addLog("Network error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleViewEmail = async (offerId: string) => {
        try {
            addLog("Fetching offer template details...", "info");
            const offerDetails = await apiClient(`/offers/${offerId}`);
            if (offerDetails) {
                setPreviewOffer(offerDetails);
                setShowPreview(true);
                setShowSuccessDialog(false);
            }
        } catch (err) {
            addLog("Failed to fetch offer details for preview", "error");
        }
    };



    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <ConnectionError
                    onRetry={refreshData}
                />
            </div>
        );
    }

    const subHeader = (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleAction('/demo/reset-data')}
                data-tooltip="Reset Database"
                className={cn(
                    "p-2.5 rounded-xl transition-all border group relative overflow-hidden",
                    readyBookings.cron_ready.length === 0 && !loading
                        ? "bg-orange-500/20 text-orange-600 border-orange-500/50 animate-pulse scale-110 shadow-[0_0_20px_rgba(234,88,12,0.3)]"
                        : "bg-slate-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 border-slate-200 dark:border-white/10"
                )}
            >
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]",
                    readyBookings.cron_ready.length === 0 && "animate-[shimmer_2s_infinite]"
                )} />
                <Database className={cn("w-4 h-4 relative z-10", loading && "animate-spin")} />
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-2" />
            <button
                onClick={() => router.push('/tower')}
                data-tooltip="Intelligence Hub (Tower)"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-500 transition-all border border-slate-200 dark:border-white/10"
            >
                <Box className="w-4 h-4" />
            </button>

        </div>
    );

    return (
        <DashboardLayout subHeader={subHeader}>
            <div className="space-y-10">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-white/5 pb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-gray-500">Local Orchestration Node</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                            Demo Center
                        </h1>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                        <div className="px-5 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-600 block mb-0.5">Session ID</span>
                            <span className="text-xs font-mono text-orange-600 truncate max-w-[120px] block">
                                {sessionId ? sessionId.slice(0, 8) : '...'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Interaction Area */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* 1. Automated Cron Simulation */}
                        <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Window-Based Triggers</h2>
                                        <p className="text-sm text-slate-500 dark:text-gray-500">Simulate periodic automated inventory scans</p>
                                    </div>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Queue: {readyBookings.cron_ready.length}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 block ml-2">Target High-Propensity Booking</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <select
                                            value={selectedCron}
                                            onChange={(e) => setSelectedCron(e.target.value)}
                                            className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer text-slate-900 dark:text-white placeholder:text-slate-400"
                                        >
                                            <option value="">Select a ready booking...</option>
                                            {readyBookings.cron_ready.map(b => (
                                                <option key={b.id} value={b.id}>{b.guest_name} - {b.prop_name} ({b.id})</option>
                                            ))}
                                        </select>
                                        <button
                                            disabled={!selectedCron || loading}
                                            onClick={() => handleAction('/demo/trigger', 'POST', { type: 'cron', booking_id: selectedCron })}
                                            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black uppercase text-xs px-8 py-4 rounded-2xl transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                            Run Logic
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Cancellation Event Simulation */}
                        <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Reactive Triggers</h2>
                                        <p className="text-sm text-slate-500 dark:text-gray-500">Simulate incoming cancellation events</p>
                                    </div>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Queue: {readyBookings.cancellation_ready.length}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 block ml-2">Simulate Guest Cancellation At</label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <select
                                        value={selectedCancel}
                                        onChange={(e) => setSelectedCancel(e.target.value)}
                                        className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer text-slate-900 dark:text-white placeholder:text-slate-400"
                                    >
                                        <option value="">Select booking to cancel...</option>
                                        {readyBookings.cancellation_ready.map(b => (
                                            <option key={b.id} value={b.id}>{b.guest_name} at {b.prop_name}</option>
                                        ))}
                                    </select>
                                    <button
                                        disabled={!selectedCancel || loading}
                                        onClick={() => handleAction('/demo/trigger', 'POST', { type: 'cancellation', booking_id: selectedCancel })}
                                        className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black uppercase text-xs px-8 py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                        Trigger
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Panel: AI & System Stats */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Node Stats */}
                        <div className="bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm dark:shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 dark:bg-orange-600/10 blur-[60px] -mr-10 -mt-10 group-hover:bg-orange-600/20 transition-all duration-700" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <Terminal className="w-5 h-5 text-orange-500" />
                                    <h3 className="font-black uppercase tracking-widest text-xs text-slate-400 dark:text-gray-500">Node Stats</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-4 rounded-2xl">
                                            <div className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase mb-1">Active Offers</div>
                                            <div className="text-2xl font-black italic">{status?.active_offers || 0}</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-4 rounded-2xl">
                                            <div className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase mb-1">Real-time Conv</div>
                                            <div className="text-2xl font-black italic text-orange-500">{status?.conversion_rate || 0}%</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-gray-600">DEMO PIPELINE STATUS</span>
                                            <span className="text-[8px] font-black text-green-500 tracking-[0.2em]">HEALTHY</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full w-[85%] bg-orange-600 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Preview Modal */}
            <EmailPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                offer={previewOffer}
            />

            {/* Success Dialog (OpenAI Mode) */}
            <OfferSuccessDialog
                isOpen={showSuccessDialog}
                onClose={() => setShowSuccessDialog(false)}
                onViewEmail={() => handleViewEmail(successOfferId)}
                offerId={successOfferId}
                guestName={successGuestName}
                emailEnabled={status?.email_enabled}
                contactEmail={status?.contact_email}
            />
        </DashboardLayout>
    );
}
