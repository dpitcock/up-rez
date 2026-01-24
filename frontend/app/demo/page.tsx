'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    Zap, RefreshCcw, Database,
    Play, Settings, Activity,
    CheckCircle2, AlertCircle, Clock, Sparkles, Layout
} from "lucide-react";

import { ConnectionError } from "@/components/ConnectionError";
import { apiClient } from '@/lib/api';

interface ReadyBooking {
    id: string;
    guest_name: string;
    prop_name: string;
    arrival_date: string;
}

export default function DemoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<any>(null);
    const [readyBookings, setReadyBookings] = useState<{ cron_ready: ReadyBooking[], cancellation_ready: ReadyBooking[] }>({
        cron_ready: [],
        cancellation_ready: []
    });
    const [logs, setLogs] = useState<{ msg: string, type: 'info' | 'success' | 'error', time: string }[]>([]);
    const [selectedCron, setSelectedCron] = useState<string>("");
    const [selectedCancel, setSelectedCancel] = useState<string>("");
    const [error, setError] = useState(false);

    useEffect(() => {
        refreshData();
    }, []);

    const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLogs(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    };

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
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}${endpoint}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined
            });
            const data = await res.json();
            if (res.ok) {
                addLog(data.message || "Action completed successfully", "success");
                await refreshData();
            } else {
                addLog(data.detail || "Action failed", "error");
            }
        } catch (err) {
            addLog("Network error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleTrigger = async (type: 'cron' | 'cancellation') => {
        const bookingId = type === 'cron' ? selectedCron : selectedCancel;
        setLoading(true);
        addLog(`Triggering ${type} orchestration...`, 'info');

        try {
            const data = await apiClient(`/demo/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, booking_id: bookingId })
            });

            if (data.status === 'simulated_success') {
                addLog(`Simulated ${type} success (Static Demo Mode)`, 'success');
            } else {
                addLog(`Successfully triggered ${type} automation. Check Host Dashboard for results.`, 'success');
            }
            refreshData();
        } catch (err) {
            addLog(`Failed to trigger ${type}. Engine may be offline.`, 'error');
        } finally {
            setLoading(false);
        }
    };

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
                refreshData();
            }
        } catch (err) {
            console.error("Failed to enable OpenAI", err);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <ConnectionError
                    onRetry={refreshData}
                    onEnableOpenAI={handleEnableOpenAI}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-lg cursor-pointer" onClick={() => router.push('/')}>
                        <img src="/up-rez-logo-white.svg" alt="UpRez Logo" className="h-8 w-auto" />
                        UpRez Demo
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            status?.demo_ready ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                            {status?.demo_ready ? "System Ready" : "Run Normalize"}
                        </div>
                        <div className="flex items-center bg-white/5 rounded-full px-2">
                            <button
                                onClick={() => router.push('/dashboard/settings')}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white flex items-center gap-2"
                                title="Host Admin Center"
                            >
                                <Settings className="w-4 h-4 text-orange-500" />
                                <span className="text-[10px] font-bold uppercase hidden sm:block">Admin</span>
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <button
                                onClick={() => router.push('/demo/settings')}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white flex items-center gap-2"
                                title="AI Core Settings"
                            >
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                <span className="text-[10px] font-bold uppercase hidden sm:block">AI Core</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pt-24 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left: Global Controls & Stats */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Header */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                        <h1 className="text-2xl font-bold mb-2">Control Panel</h1>
                        <p className="text-gray-500 text-sm mb-6">Manage demo data state and global triggers.</p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleAction('/demo/normalize-dates')}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/50 hover:bg-white/10 transition-all text-sm group"
                            >
                                <RefreshCcw className="w-5 h-5 text-orange-500 group-hover:rotate-180 transition-transform duration-500" />
                                Normalize
                            </button>
                            <button
                                onClick={() => handleAction('/demo/reset-data')}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/50 hover:bg-white/10 transition-all text-sm group"
                            >
                                <Database className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                                Reset DB
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                                onClick={() => router.push('/demo/offer-editor')}
                                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-orange-600/10 border border-orange-500/30 hover:bg-orange-600/20 text-orange-400 transition-all text-sm font-bold group"
                            >
                                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Templates
                            </button>
                            <button
                                onClick={() => router.push('/demo/properties')}
                                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-400 transition-all text-sm font-bold group"
                            >
                                <Layout className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Properties
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                            <Activity className="w-3 h-3" />
                            Live Metrics
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">7-Day Bookings</span>
                                <span className="font-mono text-orange-500 font-bold">{status?.cron_ready_count || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Cancellable Pairs</span>
                                <span className="font-mono text-orange-500 font-bold">{status?.cancellation_ready_count || 0}</span>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <span className="text-[10px] text-gray-600 block mb-1">LAST SYNC</span>
                                <span className="text-xs text-gray-400 font-mono italic">{status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'Never'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Log */}
                    <div className="bg-black/40 border border-white/5 rounded-3xl p-6 overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                            <Clock className="w-3 h-3" />
                            Activity Log
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {logs.length === 0 && <div className="text-gray-700 text-xs italic">Waiting for events...</div>}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div className={cn(
                                        "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                                        log.type === 'success' ? "bg-green-500" : log.type === 'error' ? "bg-red-500" : "bg-blue-500"
                                    )} />
                                    <div>
                                        <div className="text-[11px] text-gray-500 font-mono">{log.time}</div>
                                        <div className="text-xs text-gray-300 leading-relaxed">{log.msg}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Triggers */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Cron Section */}
                    <section className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-orange-500/10 group-hover:text-orange-500/20 transition-colors pointer-events-none">
                            <Clock className="w-32 h-32 rotate-12" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <Zap className="w-6 h-6" />
                            </div>
                            Cron Trigger (7-Day Window)
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-lg">Simulate the automated daily scan that finds bookings exactly 7 days from arrival and generates personalized offers.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {readyBookings.cron_ready.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setSelectedCron(b.id)}
                                    className={cn(
                                        "p-4 rounded-2xl border text-left transition-all",
                                        selectedCron === b.id
                                            ? "bg-orange-600/10 border-orange-500/50"
                                            : "bg-white/5 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="font-bold text-sm text-white mb-1 truncate">{b.guest_name}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{b.prop_name}</div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-orange-400/80">
                                        <Clock className="w-3 h-3" />
                                        {b.arrival_date}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={!selectedCron || loading}
                            onClick={() => handleAction(`/demo/trigger/cron?booking_id=${selectedCron}`)}
                            className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all shadow-[0_0_30px_-10px_rgba(234,88,12,0.5)] flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            {loading ? "Processing AI Offer..." : "Trigger Cron Offer"}
                        </button>
                    </section>

                    {/* Cancellation Section */}
                    <section className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-blue-500/10 group-hover:text-blue-500/20 transition-colors pointer-events-none">
                            <Activity className="w-32 h-32 -rotate-12" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            Property Cancellation
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-lg">Simulate a high-tier booking cancellation. Watch the system instantly re-allocate the inventory to an overlapping guest.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                            {readyBookings.cancellation_ready.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setSelectedCancel(b.id)}
                                    className={cn(
                                        "p-4 rounded-2xl border text-left transition-all",
                                        selectedCancel === b.id
                                            ? "bg-blue-600/10 border-blue-500/50"
                                            : "bg-white/5 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="font-bold text-sm text-white mb-1 truncate">{b.prop_name}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Premium Booking</div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400/80">
                                        <Clock className="w-3 h-3" />
                                        Overlap Check: OK
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={!selectedCancel || loading}
                            onClick={() => handleAction(`/demo/trigger/cancellation?booking_id=${selectedCancel}`)}
                            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all shadow-[0_0_30px_-10px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 active:scale-95"
                        >
                            <AlertCircle className="w-5 h-5" />
                            {loading ? "Cancelling & Re-assigning..." : "Cancel & Trigger Instant Upsell"}
                        </button>
                    </section>

                </div>
            </main>
        </div>
    );
}
