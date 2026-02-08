'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    ArrowLeft, Settings, Save, RefreshCw,
    CheckCircle2, AlertCircle, Info, ChevronRight,
    TrendingUp, Percent, Coins, Receipt,
    Layout, Mail, Sparkles, ShieldCheck, BarChart3
} from "lucide-react";

import { useLogs } from '@/context/LogContext';
import { ConnectionError } from "@/components/ConnectionError";
import { apiClient } from '@/lib/api';

import DashboardLayout from '@/components/DashboardLayout';

export default function HostSettingsDashboard() {
    const router = useRouter();
    const { addLog } = useLogs();
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [error, setError] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-save logic
    useEffect(() => {
        if (!isDirty || !settings) return;

        const timer = setTimeout(() => {
            handleSave(true); // pass true to indicate it's an auto-save
        }, 1500);

        return () => clearTimeout(timer);
    }, [settings, isDirty]);

    const fetchData = async () => {
        try {
            setError(false);
            const hostId = 'demo_host_001';
            const sessionId = typeof window !== 'undefined' ? localStorage.getItem('demo-session-id') : null;

            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (sessionId) headers['x-session-id'] = sessionId;

            const [settingsData, templatesData] = await Promise.all([
                apiClient(`/host/${hostId}/settings`, { headers }),
                apiClient(`/host/templates`)
            ]);

            setSettings(settingsData);
            setTemplates(templatesData || []);
        } catch (err) {
            console.error("Failed to load settings data", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (isAuto = false) => {
        setSaving(true);
        try {
            const hostId = 'demo_host_001';
            const sessionId = typeof window !== 'undefined' ? localStorage.getItem('demo-session-id') : null;

            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (sessionId) headers['x-session-id'] = sessionId;

            await apiClient(`/host/${hostId}/settings`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(settings)
            });

            setIsDirty(false);
            addLog(
                `Host Settings ${isAuto ? 'Auto-Saved' : 'Synchronized'}`,
                'success'
            );

            if (!isAuto) await fetchData();
        } catch (err) {
            console.error("Save failed", err);
            addLog("Failed to persist settings to cluster", 'error');
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: string, value: any) => {
        setSettings({ ...settings, [key]: value });
        setIsDirty(true);
    };

    if (loading) return (
        <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center text-slate-900 dark:text-white">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-orange-600 opacity-50" />
                <p className="text-xs font-black uppercase tracking-widest opacity-50">Syncing Admin Node...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center text-slate-900 dark:text-white">
            <ConnectionError onRetry={fetchData} />
        </div>
    );

    const emailTemplates = Array.isArray(templates) ? templates.filter(t => t.template_type === 'email') : [];
    const landingTemplates = Array.isArray(templates) ? templates.filter(t => t.template_type === 'landing') : [];

    return (
        <DashboardLayout>
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Host Control Plane</h2>
                    <p className="text-slate-500 dark:text-gray-500 text-sm font-medium">Fine-tune the economics of your upgrade engine</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/templates')}
                        className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-gray-300 transition-all border border-slate-200 dark:border-white/10"
                    >
                        Visual Editor
                    </button>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving || settings.max_discount_pct >= 1}
                        className="px-8 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-600/30"
                    >
                        {saving ? "Deploying..." : "Sync Cluster"}
                    </button>
                </div>
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col: Core Economics */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Revenue Guardrails */}
                    <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Revenue Guardrails</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Min Revenue Lift per Night</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={settings.min_revenue_lift_eur_per_night}
                                        onChange={(e) => updateSetting('min_revenue_lift_eur_per_night', Number(e.target.value))}
                                        onBlur={() => isDirty && handleSave(true)}
                                        className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 text-slate-900 dark:text-white"
                                    />
                                    <span className="text-slate-400 dark:text-gray-500 font-bold">€</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Maximum Discount Allowed</label>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-xl font-black ${settings.max_discount_pct >= 1 ? 'text-red-500' : 'text-orange-400'}`}>
                                                {(settings.max_discount_pct * 100).toFixed(0)}%
                                            </span>
                                            {settings.max_discount_pct >= 1 && (
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Disabled</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-600">CAP</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="1" step="0.01"
                                        value={settings.max_discount_pct}
                                        onChange={(e) => updateSetting('max_discount_pct', Number(e.target.value))}
                                        className="w-full accent-orange-500 bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:pt-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Min ADR Improvement Ratio</label>
                                <input
                                    type="number" step="0.05"
                                    value={settings.min_adr_ratio}
                                    onChange={(e) => updateSetting('min_adr_ratio', Number(e.target.value))}
                                    onBlur={() => isDirty && handleSave(true)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Max ADR Multiplier</label>
                                <input
                                    type="number" step="0.25"
                                    value={settings.max_adr_multiplier}
                                    onChange={(e) => updateSetting('max_adr_multiplier', Number(e.target.value))}
                                    onBlur={() => isDirty && handleSave(true)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Template Orchestration */}
                    <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Layout className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Offer Templates</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-orange-500" />
                                    Active Email Template
                                </h3>
                                <select
                                    value={settings.active_email_template_id || ""}
                                    onChange={(e) => updateSetting('active_email_template_id', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer text-slate-900 dark:text-white"
                                >
                                    <option value="" className="bg-white dark:bg-[#111]">Auto-Generated (Default)</option>
                                    {emailTemplates.map(t => (
                                        <option key={t.template_id} value={t.template_id} className="bg-white dark:bg-[#111]">{t.template_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                    <Layout className="w-3.5 h-3.5 text-blue-500" />
                                    Active Landing Page
                                </h3>
                                <select
                                    value={settings.active_landing_template_id || ""}
                                    onChange={(e) => updateSetting('active_landing_template_id', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer text-slate-900 dark:text-white"
                                >
                                    <option value="" className="bg-white dark:bg-[#111]">Dynamic Showcase (Default)</option>
                                    {landingTemplates.map(t => (
                                        <option key={t.template_id} value={t.template_id} className="bg-white dark:bg-[#111]">{t.template_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Operational Identity */}
                    <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Operational Identity</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Host / Management Name</label>
                                <input
                                    type="text"
                                    value={settings.host_name || ""}
                                    onChange={(e) => updateSetting('host_name', e.target.value)}
                                    onBlur={() => isDirty && handleSave(true)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-green-500/50 text-slate-900 dark:text-white"
                                    placeholder="e.g. Blue Lagoon Rentals"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Host Contact Number</label>
                                <input
                                    type="text"
                                    value={settings.host_phone || ""}
                                    onChange={(e) => updateSetting('host_phone', e.target.value)}
                                    onBlur={() => isDirty && handleSave(true)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-green-500/50 text-slate-900 dark:text-white"
                                    placeholder="+34 600 000 000"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">PM Company Name</label>
                                <input
                                    type="text"
                                    value={settings.pm_company_name || ""}
                                    onChange={(e) => updateSetting('pm_company_name', e.target.value)}
                                    onBlur={() => isDirty && handleSave(true)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-green-500/50 text-slate-900 dark:text-white"
                                    placeholder="e.g. Vacation Pros"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Col: Operations & Stats */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Fee Structure */}
                    <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <h2 className="font-bold text-slate-900 dark:text-white">Fee Tracking</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-600">Channel Fee (%)</label>
                                <input
                                    type="number"
                                    value={settings.channel_fee_pct * 100}
                                    onChange={(e) => updateSetting('channel_fee_pct', Number(e.target.value) / 100)}
                                    onBlur={() => isDirty && handleSave(true)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-600">Change Fee (€)</label>
                                <input
                                    type="number"
                                    value={settings.change_fee_eur}
                                    onChange={(e) => updateSetting('change_fee_eur', Number(e.target.value))}
                                    onBlur={() => isDirty && handleSave(true)}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Live Analytics */}
                    <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <BarChart3 className="w-5 h-5 text-orange-500" />
                            <h2 className="font-bold text-slate-900 dark:text-white">MTD Analytics</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                                <div className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase mb-1">Offers Sent</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{settings.offers_sent_this_month || 0}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-orange-600/5 border border-orange-500/10">
                                <div className="text-[10px] font-bold text-orange-600 uppercase mb-1">Revenue Lift</div>
                                <div className="text-2xl font-black">€{(settings.revenue_lifted_this_month || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-gray-500 hover:text-red-500 dark:hover:text-white hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-all group shadow-sm"
                        onClick={async () => {
                            const hostId = 'demo_host_001';
                            const sessionId = typeof window !== 'undefined' ? localStorage.getItem('demo-session-id') : null;
                            const headers: HeadersInit = {};
                            if (sessionId) headers['x-session-id'] = sessionId;

                            await apiClient(`/host/${hostId}/settings/reset`, {
                                method: 'POST',
                                headers
                            });
                            fetchData();
                        }}
                    >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Reset Defaults</span>
                    </button>
                </div>
            </main>
        </DashboardLayout>
    );
}
