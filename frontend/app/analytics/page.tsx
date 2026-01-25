'use client';
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
    return (
        <DashboardLayout>
            <div className="mb-10">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Performance</h2>
                <p className="text-slate-500 dark:text-gray-500 text-sm font-medium">Revenue lift and conversion metrics</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
                {[
                    { label: 'Total Revenue Lift', value: '€0.00', change: '+0%' },
                    { label: 'Conversion Rate', value: '0.0%', change: '+0%' },
                    { label: 'Avg. Upgrade Value', value: '€0', change: '+0%' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 text-orange-600/5 group-hover:text-orange-600/10 transition-colors pointer-events-none">
                            <TrendingUp className="w-12 h-12" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-600 mb-2">{stat.label}</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">{stat.value}</p>
                        <span className="text-[10px] font-black text-green-600 bg-green-500/10 dark:bg-green-500/10 px-2 py-1 rounded-md mt-4 inline-block uppercase tracking-widest">
                            {stat.change} vs last month
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] shadow-sm border border-slate-200 dark:border-white/5 p-8 text-center py-32">
                <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
                    <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Metrics Ledger Empty</h3>
                <p className="text-slate-500 dark:text-gray-500 max-w-sm mx-auto text-sm italic font-medium">
                    Detailed optimization charts will populate here as the AI orchestration engine processes live booking patterns.
                </p>
            </div>
        </DashboardLayout>
    );
}
