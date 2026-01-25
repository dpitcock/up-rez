'use client';

import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useLogs } from '@/context/LogContext';
import { apiClient } from '@/lib/api';
import {
    LayoutDashboard, Gift, Settings, BarChart3,
    ArrowLeft, LogOut, Activity, Clock,
    Menu, X, LineChart, Cpu, ShieldCheck, Layout, Home, Sparkles
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: React.ReactNode;
    subHeader?: React.ReactNode;
}

export default function DashboardLayout({ children, subHeader }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { logs } = useLogs();
    const [stats, setStats] = useState<any>(null);
    const [lastSync, setLastSync] = useState<string>("");

    const navigation = [
        { name: 'Demo Center', href: '/demo', icon: Cpu },
        { name: 'Managed Offers', href: '/offers', icon: Gift },
        { name: 'Templates', href: '/templates', icon: Layout },
        { name: 'Properties', href: '/properties', icon: Home },
        { name: 'Performance', href: '/analytics', icon: LineChart },
        { name: 'Market Analysis', href: '/tower', icon: BarChart3 },
        { name: 'AI Settings', href: '/ai-settings', icon: Sparkles },
        { name: 'Host Settings', href: '/settings', icon: Settings },
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiClient('/demo/status');
                setStats(data);
                setLastSync(new Date().toLocaleTimeString());
            } catch (err) {
                console.error("Sidebar stats fetch failed", err);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Poll metrics
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm animate-in fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Top Global Header */}
            <header className="fixed top-0 right-0 left-0 z-50 h-16 bg-white dark:bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 px-4 sm:px-8 transition-all">
                <div className="h-full flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            data-tooltip="Open Menu"
                            data-tooltip-pos="bottom"
                            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-400"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')} data-tooltip="Go to Home" data-tooltip-pos="bottom">
                            <img src="/logo.svg" alt="UpRez Logo" className="h-8 w-auto group-hover:scale-105 transition-transform" />
                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase group-hover:text-orange-500 transition-colors">UpRez</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Core Online</span>
                        </div>

                        <ThemeToggle />

                        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block" />

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <div className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Admin Hub</div>
                                <div className="text-[10px] text-orange-600 font-bold uppercase tracking-tighter">Enterprise Partner</div>
                            </div>
                            <div
                                onClick={() => router.push('/')}
                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
                                data-tooltip="Logout Session"
                                data-tooltip-pos="bottom"
                            >
                                <LogOut className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex pt-16 h-screen overflow-hidden">
                {/* Unified Sidebar */}
                <aside
                    className={cn(
                        "fixed lg:static inset-y-0 left-0 z-50 w-72 h-full bg-white dark:bg-[#0A0A0A] border-r border-slate-200 dark:border-white/5 transition-transform duration-300 transform",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    )}
                >
                    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto no-scrollbar">
                        {/* Main Navigation */}
                        <nav className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => {
                                            router.push(item.href);
                                            setSidebarOpen(false);
                                        }}
                                        data-tooltip={item.name}
                                        data-tooltip-pos="right"
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all group",
                                            isActive
                                                ? "bg-orange-600 text-white shadow-xl shadow-orange-600/20 font-bold"
                                                : "text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-orange-500")} />
                                        <span className="text-[11px] uppercase tracking-[0.1em] font-black">{item.name}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="w-full h-px bg-slate-100 dark:bg-white/5 my-2" />

                        {/* LIVE METRICS SECTION - Styled as per Image */}
                        <div className="bg-slate-50 dark:bg-[#0D0D0D] border border-slate-200 dark:border-white/5 rounded-3xl p-6 space-y-6">
                            <div className="flex items-center gap-2 text-slate-400 dark:text-gray-500">
                                <Activity className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Metrics</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm font-bold text-slate-600 dark:text-gray-500 group-hover:text-slate-900 dark:group-hover:text-gray-300 transition-colors">7-Day Bookings</span>
                                    <span className="text-lg font-black text-orange-600">{stats?.cron_ready_count || 5}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-sm font-bold text-slate-600 dark:text-gray-500 group-hover:text-slate-900 dark:group-hover:text-gray-300 transition-colors">Cancellable Pairs</span>
                                    <span className="text-lg font-black text-orange-600">{stats?.cancellation_ready_count || 3}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-white/5 opacity-40">
                                <div className="text-[8px] font-black uppercase tracking-widest mb-1">Last Sync</div>
                                <div className="text-[11px] font-mono italic">{lastSync || 'Connecting...'}</div>
                            </div>
                        </div>

                        {/* ACTIVITY LOG SECTION - Styled as per Image */}
                        <div className="flex-1 min-h-0 bg-slate-50 dark:bg-[#0D0D0D] border border-slate-200 dark:border-white/5 rounded-3xl p-6 flex flex-col">
                            <div className="flex items-center gap-2 text-slate-400 dark:text-gray-500 mb-6 shrink-0">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Activity Log</span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {logs.length === 0 ? (
                                    <p className="text-xs italic text-slate-400 dark:text-gray-700">Waiting for events...</p>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="space-y-1 group border-l-2 border-slate-200 dark:border-white/5 pl-3 transition-colors hover:border-orange-500">
                                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 dark:text-gray-600">
                                                <span>{log.type}</span>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">{log.time}</span>
                                            </div>
                                            <p className={cn(
                                                "text-[11px] font-bold leading-tight",
                                                log.type === 'error' ? "text-red-500" : log.type === 'success' ? "text-green-500" : "text-slate-600 dark:text-gray-400"
                                            )}>
                                                {log.msg}
                                            </p>
                                            {log.link && (
                                                <button
                                                    onClick={() => router.push(log.link!)}
                                                    className="text-[9px] font-black uppercase text-orange-600 hover:text-orange-500 flex items-center gap-1 mt-0.5"
                                                >
                                                    View Action <ArrowLeft className="w-2 h-2 rotate-180" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main page content area */}
                <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#050505]">
                    {/* Sub-header Toolbar (Optional) */}
                    {subHeader && (
                        <div className="h-14 sm:h-16 shrink-0 bg-white dark:bg-[#0D0D0D] border-b border-slate-200 dark:border-white/5 flex items-center px-4 sm:px-8">
                            <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
                                {subHeader}
                            </div>
                        </div>
                    )}

                    {/* Content Scroll Area */}
                    <main className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
                        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
