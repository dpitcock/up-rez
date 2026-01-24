'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Database, Activity, TrendingUp, Clock,
    ArrowLeft, ExternalLink, Zap, Shield,
    BarChart3, Globe, Layers, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function TowerIntelligenceHub() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await apiClient('/demo/tower/stats');
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch Tower stats", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-blue-600 dark:text-blue-500 font-black uppercase tracking-[0.2em] text-[10px]">Syncing with Tower Cloud...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white selection:bg-blue-500 pb-20 transition-colors duration-300">
            {/* Header */}
            <nav className="border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50 transition-colors">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-gray-500 hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <Database className="w-4 h-4 text-blue-500" />
                                <h1 className="text-xl font-bold tracking-tight">Tower Intelligence Hub</h1>
                            </div>
                            <p className="text-gray-500 text-xs uppercase tracking-widest font-black italic">Managed AI Feature Store & Lakehouse</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Tower Live
                        </div>
                        <a
                            href="https://app.tower.dev"
                            target="_blank"
                            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-lg shadow-blue-600/20 group"
                        >
                            <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </a>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pt-12 space-y-12">

                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-blue-500/5 group-hover:text-blue-500/10 transition-colors pointer-events-none">
                            <TrendingUp className="w-24 h-24 rotate-12" />
                        </div>
                        <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Market Pressure</div>
                        <div className="text-5xl font-black mb-2 tracking-tighter italic">1.45<span className="text-blue-500 text-2xl ml-1">x</span></div>
                        <p className="text-gray-400 text-sm">Targeting <span className="text-white font-bold italic">PMI Airport Hub</span> based on regional 2024 seasonality index.</p>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-orange-500/5 group-hover:text-orange-500/10 transition-colors pointer-events-none">
                            <Clock className="w-24 h-24 -rotate-12" />
                        </div>
                        <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Goldilocks Window</div>
                        <div className="text-5xl font-black mb-2 tracking-tighter italic">D-14</div>
                        <p className="text-gray-400 text-sm">Discovered peak conversion for <span className="text-orange-500 font-bold italic">Premium Units</span> via Tower automation.</p>
                    </div>

                    <div className="bg-[#111111] border border-blue-500/20 rounded-[2rem] p-8 relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,0,0,1)]">
                        <div className="absolute top-0 right-0 p-8 text-green-500/5 group-hover:text-green-500/10 transition-colors pointer-events-none">
                            <Shield className="w-24 h-24" />
                        </div>
                        <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Feature Health</div>
                        <div className="text-5xl font-black mb-2 tracking-tighter italic text-green-500">A+</div>
                        <p className="text-gray-400 text-sm">AI Agent Context supplied with 12 engineered features from the <span className="text-white font-bold italic">Feature Store</span>.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Hub Demand Monitoring */}
                    <div className="lg:col-span-8 space-y-6">
                        <section className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 overflow-hidden">
                            <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Globe className="w-5 h-5" />
                                </div>
                                Regional Hub Demand Monitor
                            </h2>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left border-b border-white/5">
                                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Airport</th>
                                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Region</th>
                                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-center">Multiplier</th>
                                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {stats?.hub_demand.map((hub: any) => (
                                            <tr key={hub.airport} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="py-6 font-mono text-blue-400 font-bold">{hub.airport}</td>
                                                <td className="py-6 text-sm text-gray-300 group-hover:text-white transition-colors">{hub.city}</td>
                                                <td className="py-6">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="font-black text-lg">{hub.multiplier}x</span>
                                                        <div className="w-8 h-1 bg-gray-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500" style={{ width: `${(hub.multiplier - 1) * 200}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 text-right">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                                                        hub.status === 'peak' ? "bg-red-500/10 text-red-500" :
                                                            hub.status === 'high' ? "bg-orange-500/10 text-orange-500" :
                                                                "bg-green-500/10 text-green-500"
                                                    )}>
                                                        {hub.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Timing Optimization */}
                        <section className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 overflow-hidden">
                            <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                "Goldilocks" Timing Optimization
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {stats?.timing_insights.map((insight: any) => (
                                    <div key={insight.tier_transition} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-orange-500/30 transition-all">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-4">{insight.tier_transition}</div>
                                        <div className="text-3xl font-black mb-1 italic tracking-tighter">Day {insight.peak_day}</div>
                                        <div className="text-[10px] text-orange-500 font-bold mb-4">Peak Conversion Point</div>
                                        <div className="space-y-3 pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-gray-500">Optimal Window</span>
                                                <span className="text-white font-bold font-mono">{insight.optimal_window}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-gray-500">Exp. Success Rate</span>
                                                <span className="text-green-500 font-black">{insight.success_rate}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Feature Store Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <section className="bg-blue-600/5 border border-blue-500/20 rounded-[2rem] p-8">
                            <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Layers className="w-5 h-5" />
                                </div>
                                Feature Store
                            </h2>
                            <p className="text-gray-500 text-xs mb-8">Engineered context fed directly to AI Agents for prioritized ranking.</p>

                            <div className="space-y-6">
                                {stats?.feature_store.top_features.map((feature: any) => (
                                    <div key={feature.name} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-300">{feature.name}</span>
                                            <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest bg-white/5 px-1.5 py-0.5 rounded">{feature.type}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${feature.importance * 100}%` }} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest italic">Importance Score</span>
                                            <span className="text-[10px] text-blue-400 font-mono font-bold">{Math.round(feature.importance * 100)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 group">
                                <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
                                Refresh Feature Pipeline
                            </button>
                        </section>

                        <section className="bg-black/40 border border-white/5 rounded-[2rem] p-8">
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-600 mb-6 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-green-500" />
                                Pipeline Health
                            </h2>
                            <div className="space-y-4">
                                {Object.entries(stats?.pipeline_status || {}).map(([name, status]: [string, any]) => (
                                    <div key={name} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400 capitalize">{name.replace('_', ' ')}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-600 font-mono uppercase">{status}</span>
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <div className="text-[9px] text-gray-700 font-black uppercase tracking-[0.2em] mb-2">Last Sync Timestamp</div>
                                <div className="text-[10px] font-mono text-gray-500 italic truncate">{stats?.last_sync}</div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Architecture Note */}
                <div className="bg-[#0A0A0A] border-y border-white/5 py-12 px-6 rounded-[2rem]">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                            Best Use of Tower Challenge
                        </div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter italic leading-none">Powered by Fresh Data</h3>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            UpRez doesn't rely on generic heuristics. We use <span className="text-white font-bold italic">Tower.dev</span> to manage a distributed
                            data pond, ingesting regional seasonality indexes and historical offer patterns. Our AI Agents query this live feature store
                            to ensure every upgrade offer is backed by real-time market pressure and proven psychological conversion windows.
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
}
