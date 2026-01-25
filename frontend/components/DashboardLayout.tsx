'use client';

import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

import { ThemeToggle } from './ThemeToggle';

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Demo', href: '/demo', icon: '⚡' },
        { name: 'Offers', href: '/dashboard/offers', icon: '🎁' },
        { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
        { name: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050505] transition-colors duration-300">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 bg-white dark:bg-[#0A0A0A] border-r border-slate-200 dark:border-white/5 shadow-xl lg:shadow-none`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100 dark:border-white/5">
                        <Image src="/logo.svg" alt="UpRez Logo" width={32} height={32} />
                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">UpRez</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        router.push(item.href);
                                        setSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${isActive
                                        ? 'bg-orange-600/10 text-orange-600 font-bold shadow-sm ring-1 ring-orange-600/20'
                                        : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                    <span className="text-sm uppercase tracking-widest font-black">{item.name}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-white/5">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-orange-600 dark:hover:text-orange-500 transition-colors rounded-xl hover:bg-orange-600/5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Exit Dashboard
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Top header */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 sm:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                {navigation.find(item => pathname.startsWith(item.href))?.name || 'Dashboard'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-6">
                            <ThemeToggle />
                            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-white/5">
                                <div className="text-right hidden sm:block">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Demo Host</div>
                                    <div className="text-[10px] text-orange-600 font-bold uppercase tracking-tighter">Premium Partner</div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-orange-600 shadow-lg shadow-orange-600/30 flex items-center justify-center text-white font-black text-xs italic">
                                    DH
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
