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

import { ConnectionError } from "@/components/ConnectionError";
import { apiClient } from '@/lib/api';

export default function HostSettingsDashboard() {
    const router = useRouter();
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setError(false);
            const hostId = 'demo_host_001';
            const [settingsData, templatesData] = await Promise.all([
                apiClient(`/api/host/${hostId}/settings`),
                apiClient(`/api/host/templates`)
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

    const handleSave = async () => {
        setSaving(true);
        try {
            const hostId = 'demo_host_001';
            await apiClient(`/api/host/${hostId}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            await fetchData();
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading Admin Core...</div>;

    if (error) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
            <ConnectionError onRetry={fetchData} />
        </div>
    );

    const emailTemplates = templates.filter(t => t.template_type === 'email');
    const landingTemplates = templates.filter(t => t.template_type === 'landing');

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.push('/demo')} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6 text-orange-500" />
                        <h1 className="font-bold text-xl tracking-tight">Host Admin Center</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/demo/offer-editor')}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold text-gray-300 transition-all"
                    >
                        Visual Editor
                    </button>
                    <div className="flex items-center bg-white/5 rounded-full px-2">
                        <button
                            onClick={() => router.push('/dashboard/settings')}
                            className="p-2 bg-white/10 rounded-full text-white flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4 text-orange-500" />
                            <span className="text-[10px] font-bold uppercase hidden sm:block font-black">Admin</span>
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <button
                            onClick={() => router.push('/demo/settings')}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-bold uppercase hidden sm:block">AI Core</span>
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="ml-2 px-8 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? "Deploying..." : "Sync Cluster"}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto pt-32 pb-20 px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col: Core Economics */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Revenue Guardrails */}
                    <section className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">Revenue Guardrails</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Min Revenue Lift per Night</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={settings.min_revenue_lift_eur_per_night}
                                        onChange={(e) => setSettings({ ...settings, min_revenue_lift_eur_per_night: Number(e.target.value) })}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50"
                                    />
                                    <span className="text-gray-500 font-bold">€</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Maximum Discount Allowed</label>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-black text-orange-400">{(settings.max_discount_pct * 100).toFixed(0)}%</span>
                                        <span className="text-[10px] text-gray-600">CAP</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="0.5" step="0.05"
                                        value={settings.max_discount_pct}
                                        onChange={(e) => setSettings({ ...settings, max_discount_pct: Number(e.target.value) })}
                                        className="w-full accent-orange-500"
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
                                    onChange={(e) => setSettings({ ...settings, min_adr_ratio: Number(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Max ADR Multiplier</label>
                                <input
                                    type="number" step="0.25"
                                    value={settings.max_adr_multiplier}
                                    onChange={(e) => setSettings({ ...settings, max_adr_multiplier: Number(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Template Orchestration */}
                    <section className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Layout className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">Offer Templates</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-orange-500" />
                                    Active Email Template
                                </h3>
                                <select
                                    value={settings.active_email_template_id || ""}
                                    onChange={(e) => setSettings({ ...settings, active_email_template_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-[#111]">Auto-Generated (Default)</option>
                                    {emailTemplates.map(t => (
                                        <option key={t.template_id} value={t.template_id} className="bg-[#111]">{t.template_name}</option>
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
                                    onChange={(e) => setSettings({ ...settings, active_landing_template_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-[#111]">Dynamic Showcase (Default)</option>
                                    {landingTemplates.map(t => (
                                        <option key={t.template_id} value={t.template_id} className="bg-[#111]">{t.template_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Operational Identity */}
                    <section className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold">Operational Identity</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Host / Management Name</label>
                                <input
                                    type="text"
                                    value={settings.host_name || ""}
                                    onChange={(e) => setSettings({ ...settings, host_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-green-500/50"
                                    placeholder="e.g. Blue Lagoon Rentals"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Host Contact Number</label>
                                <input
                                    type="text"
                                    value={settings.host_phone || ""}
                                    onChange={(e) => setSettings({ ...settings, host_phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-green-500/50"
                                    placeholder="+34 600 000 000"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Col: Operations & Stats */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Fee Structure */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <h2 className="font-bold">Fee Tracking</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-600">Channel Fee (%)</label>
                                <input
                                    type="number"
                                    value={settings.channel_fee_pct * 100}
                                    onChange={(e) => setSettings({ ...settings, channel_fee_pct: Number(e.target.value) / 100 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-600">Change Fee (€)</label>
                                <input
                                    type="number"
                                    value={settings.change_fee_eur}
                                    onChange={(e) => setSettings({ ...settings, change_fee_eur: Number(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Live Analytics */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <BarChart3 className="w-5 h-5 text-orange-500" />
                            <h2 className="font-bold">MTD Analytics</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">Offers Sent</div>
                                <div className="text-2xl font-black">{settings.offers_sent_this_month || 0}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-orange-600/5 border border-orange-500/10">
                                <div className="text-[10px] font-bold text-orange-600 uppercase mb-1">Revenue Lift</div>
                                <div className="text-2xl font-black">€{(settings.revenue_lifted_this_month || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/5 text-gray-500 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all group"
                        onClick={async () => {
                            const hostId = 'demo_host_001';
                            await apiClient(`/api/host/${hostId}/settings/reset`, { method: 'POST' });
                            fetchData();
                        }}
                    >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">Reset Defaults</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
