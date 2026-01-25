'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Database, Activity, TrendingUp, Clock,
    ArrowLeft, ExternalLink, Zap, Shield,
    BarChart3, Globe, Layers, CheckCircle2,
    Cloud, Server
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { useLogs } from '@/context/LogContext';

export default function TowerIntelligenceHub() {
    const router = useRouter();
    const { addLog } = useLogs();
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

    const handleRunPipelines = async () => {
        setLoading(true);
        addLog("Manually triggering regional feature pipeline...", "info");
        try {
            await apiClient('/demo/tower/run', { method: 'POST' });
            await fetchStats();
            addLog("Feature Pipeline refresh COMPLETE", "success");
        } catch (err) {
            console.error("Failed to run Tower pipelines", err);
            addLog("Feature Pipeline execution failed", "error");
            setLoading(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-blue-600 dark:text-blue-500 font-black uppercase tracking-[0.2em] text-[10px]">Syncing with Tower Cloud...</p>
            </div>
        );
    }

    const subHeader = (
        <div className="flex items-center gap-4 w-full justify-between">
            <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Node Tower-01: Madrid Cluster</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live Feature Stream
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout subHeader={subHeader}>
            <div className="space-y-10">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-white/5 pb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Database className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-gray-500 italic">Advanced Feature Intelligence</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                            Market Analysis
                        </h1>
                    </div>

                    <a
                        href="https://app.tower.dev"
                        target="_blank"
                        data-tooltip="Open Project Tower Console"
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 group"
                    >
                        Project Tower Console
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </div>

                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 relative overflow-hidden group shadow-sm">
                        <div className="absolute top-0 right-0 p-8 text-blue-500/5 group-hover:text-blue-500/10 transition-colors pointer-events-none">
                            <TrendingUp className="w-24 h-24 rotate-12" />
                        </div>
                        <div className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Market Pressure</div>
                        <div className="text-5xl font-black mb-2 tracking-tighter italic text-slate-900 dark:text-white">1.45<span className="text-blue-500 text-2xl ml-1">x</span></div>
                        <p className="text-slate-500 dark:text-gray-400 text-sm">Targeting <span className="text-slate-900 dark:text-white font-bold italic">PMI Airport Hub</span> based on regional 2024 seasonality.</p>
                    </div>

                    <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 relative overflow-hidden group shadow-sm">
                        <div className="absolute top-0 right-0 p-8 text-orange-500/5 group-hover:text-orange-500/10 transition-colors pointer-events-none">
                            <Clock className="w-24 h-24 -rotate-12" />
                        </div>
                        <div className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Goldilocks Window</div>
                        <div className="text-5xl font-black mb-2 tracking-tighter italic text-slate-900 dark:text-white">D-14</div>
                        <p className="text-slate-500 dark:text-gray-400 text-sm">Peak conversion discovered via <span className="text-orange-600 font-bold italic">Dynamic Ranking</span> automation.</p>
                    </div>

                    <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-blue-500/20 rounded-[2rem] p-8 relative overflow-hidden group shadow-sm dark:shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 text-green-600/5 dark:text-green-500/5 group-hover:text-green-500/10 transition-colors pointer-events-none">
                            <Shield className="w-24 h-24" />
                        </div>
                        <div className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Feature Health</div>
                        <div className="text-5xl font-black mb-2 tracking-tighter italic text-green-600 dark:text-green-500">A+</div>
                        <p className="text-slate-500 dark:text-gray-400 text-sm">Supplied with <span className="text-slate-900 dark:text-white font-bold italic">12 engineered features</span> from the unified Feature Store.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Hub Demand Monitoring */}
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Globe className="w-5 h-5" />
                                </div>
                                Regional Hub Hub Monitor
                            </h2>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left border-b border-slate-100 dark:border-white/5">
                                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600">Airport</th>
                                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600">Region</th>
                                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 text-center">Multiplier</th>
                                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                        {stats?.hub_demand.map((hub: any) => (
                                            <tr key={hub.airport} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className="py-6 font-mono text-blue-500 font-black">{hub.airport}</td>
                                                <td className="py-6 text-sm font-bold text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{hub.city}</td>
                                                <td className="py-6">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="font-black text-lg text-slate-900 dark:text-white">{hub.multiplier}x</span>
                                                        <div className="w-8 h-1 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${(hub.multiplier - 1) * 200}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 text-right">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                                        hub.status === 'peak' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                            hub.status === 'high' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                                                "bg-green-500/10 text-green-500 border-green-500/20"
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
                        <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                "Goldilocks" Conversion Windows
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {stats?.timing_insights.map((insight: any) => (
                                    <div key={insight.tier_transition} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 hover:border-orange-500/30 transition-all group">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 mb-4">{insight.tier_transition}</div>
                                        <div className="text-4xl font-black mb-1 italic tracking-tighter text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">Day {insight.peak_day}</div>
                                        <div className="text-[10px] text-orange-600 font-bold mb-4 uppercase tracking-wider">Peak Propensity Point</div>
                                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500 dark:text-gray-500 font-bold">Optimal Window</span>
                                                <span className="text-slate-900 dark:text-white font-black font-mono">{insight.optimal_window}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500 dark:text-gray-500 font-bold">Exp. Conversion</span>
                                                <span className="text-green-600 font-black">{insight.success_rate}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Feature Store Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Layers className="w-5 h-5" />
                                </div>
                                Context Store
                            </h2>
                            <p className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-8 leading-loose">Engineered context fed directly to AI Rankers for prioritized matching.</p>

                            <div className="space-y-6">
                                {stats?.feature_store.top_features.map((feature: any) => (
                                    <div key={feature.name} className="space-y-2 group">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{feature.name}</span>
                                            <span className="text-[8px] font-black uppercase text-slate-400 dark:text-gray-600 tracking-widest bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">{feature.type}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000" style={{ width: `${feature.importance * 100}%` }} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] text-slate-400 dark:text-gray-700 font-black uppercase tracking-widest italic">Importance Weight</span>
                                            <span className="text-[10px] text-blue-500 font-mono font-black">{Math.round(feature.importance * 100)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleRunPipelines}
                                data-tooltip="Refresh Node Pipeline"
                                data-tooltip-pos="top"
                                className="w-full mt-10 py-5 rounded-2xl bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/10 flex items-center justify-center gap-3 group active:scale-95"
                            >
                                <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform text-orange-500" />
                                Refresh Node Pipeline
                            </button>
                        </section>

                        <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-600 mb-6 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-green-500" />
                                Distributed Pipeline Health
                            </h2>
                            <div className="space-y-4">
                                {Object.entries(stats?.pipeline_status || {}).map(([name, status]: [string, any]) => (
                                    <div key={name} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-white/5 last:border-0">
                                        <span className="text-xs font-bold text-slate-500 dark:text-gray-400 capitalize">{name.replace('_', ' ')}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-slate-400 dark:text-gray-600 font-mono uppercase italic">{status}</span>
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Architecture Note */}
                <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 py-16 px-8 rounded-[3rem] shadow-sm dark:shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32 group-hover:bg-blue-600/20 transition-all duration-1000" />
                    <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-500 text-[9px] font-black uppercase tracking-[0.3em]">
                            Distributed Lakehouse Sync
                        </div>
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Powered by Continuous Intelligence</h3>
                        <p className="text-slate-500 dark:text-gray-400 text-lg leading-relaxed font-medium">
                            UpRez doesn't rely on generic heuristics. We use <span className="text-slate-900 dark:text-white font-bold italic underline decoration-blue-500/50">Tower.dev</span> to manage a distributed
                            data pond, ingesting regional seasonality indexes and historical offer patterns. Our AI Agents query this live feature store
                            to ensure every upgrade offer is backed by real-time market pressure and proven psychological conversion periods.
                        </p>
                        <div className="flex items-center justify-center gap-8 pt-4">
                            <Server className="w-8 h-8 text-slate-200 dark:text-white/20" />
                            <div className="h-px w-20 bg-slate-100 dark:bg-white/5" />
                            <Cloud className="w-8 h-8 text-blue-500/40" />
                            <div className="h-px w-20 bg-slate-100 dark:bg-white/5" />
                            <Database className="w-8 h-8 text-slate-200 dark:text-white/20" />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
