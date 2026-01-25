'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    ArrowLeft, Sparkles, Mail, Layout,
    ChevronRight, Save, Send, Download,
    CheckCircle2, AlertCircle, RefreshCw,
    Smartphone, Monitor, Info, Settings, Eye, X,
    ChevronDown, Home, ArrowUpCircle
} from "lucide-react";

import { ConnectionError } from "@/components/ConnectionError";
import { apiClient } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { useLogs } from '@/context/LogContext';

interface Property {
    id: string;
    name: string;
    list_nightly_rate: number;
    beds: number;
    category: string;
    images: string; // JSON string
}

export default function OfferEditorPage() {
    const router = useRouter();
    const { addLog } = useLogs();
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedOrig, setSelectedOrig] = useState<string>("prop_xsf7c1");
    const [selectedUp, setSelectedUp] = useState<string>("prop_8b867z");
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<boolean>(false);
    const [previewMode, setPreviewMode] = useState<'email' | 'landing'>('email');
    const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('desktop');

    // Editable fields
    const [subject, setSubject] = useState("");
    const [diffs, setDiffs] = useState<string[]>([]);

    const [showLivePreview, setShowLivePreview] = useState(false);
    const [hostSettings, setHostSettings] = useState<any>(null);

    useEffect(() => {
        fetchProperties();
        fetchHostSettings();
    }, []);

    const fetchHostSettings = async () => {
        try {
            const hostId = 'demo_host_001';
            const data = await apiClient(`/api/host/${hostId}/settings`);
            setHostSettings(data);
        } catch (err) {
            console.error("Failed to fetch host settings", err);
        }
    };

    const fetchProperties = async () => {
        try {
            setError(false);
            const data = await apiClient(`/demo/properties`);
            setProperties(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch properties", err);
            setError(true);
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        addLog("Generating AI personalization payload...", "info");
        try {
            const data = await apiClient(`/demo/offer-preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    original_prop_id: selectedOrig,
                    upgrade_prop_id: selectedUp,
                    guest_name: "Alice Weber",
                    adults: 2,
                    children: 1,
                    has_car: true
                })
            });

            if (data.status === 'simulated_success') {
                const fallbackData = await (await fetch('/demo-data.json')).json();
                const proxyOffer = Object.values(fallbackData.offers)[0] as any;
                setPreview({
                    copy: {
                        landing_hero: "Luxury Beachfront Upgrade",
                        landing_summary: "Experience total privacy with premium amenities.",
                        subject: "Alice, we have a special upgrade for you",
                        email_html: "<h1>Upgrade Unlocked</h1>",
                        diff_bullets: ["Private infinity pool", "Direct beach access", "Chef-style kitchen"]
                    },
                    pricing: proxyOffer.options[0].pricing
                });
                setSubject("Alice, we have a special upgrade for you");
                setDiffs(["Private infinity pool", "Direct beach access", "Chef-style kitchen"]);
                addLog("AI Copy generation success (Simulated)", "success");
                return;
            }

            setPreview(data);
            setSubject(data.copy.subject);
            setDiffs(data.copy.diff_bullets);
            addLog("AI Preview generated successfully", "success");
        } catch (err) {
            console.error("Failed to generate preview", err);
            addLog("Failed to generate AI content", "error");
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveTemplate = async () => {
        setSaving(true);
        try {
            await apiClient('/api/host/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_name: `${previewMode === 'email' ? 'Email' : 'Page'}: ${upProp?.name || 'Offer'}`,
                    content_html: previewMode === 'email' ? preview.copy.email_html : preview.copy.landing_hero,
                    template_type: previewMode
                })
            });
            setSaved(true);
            addLog("Template saved to Host Library", "success");
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Save failed", err);
            addLog("Error saving template", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!preview) return;
        setGenerating(true);
        addLog("Sending test email to Admin...", "info");
        try {
            const isClientOnly = process.env.NEXT_PUBLIC_DEMO_MODE === 'client_only';
            if (isClientOnly) {
                await new Promise(r => setTimeout(r, 1000));
                addLog("Test email simulated success", "success");
                setGenerating(false);
                return;
            }

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RESEND_API_KEY || 're_not_set'}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: "UpRez <dpitcock.dev+up-rez@gmail.com>",
                    to: ["dpitcock.dev+up-rez@gmail.com"],
                    subject: subject,
                    html: preview.copy.email_html
                })
            });

            if (res.ok) {
                addLog("Test email delivered via Resend", "success");
            } else {
                addLog("Email API error (check backend)", "error");
            }
        } catch (err) {
            console.error("Email send error:", err);
            addLog("Local email transmission simulated", "success");
        } finally {
            setGenerating(false);
        }
    };

    const budgetProps = properties.filter(p => p.list_nightly_rate <= 200 || p.category === 'budget');
    const premiumProps = properties.filter(p => p.list_nightly_rate >= 220);

    const origProp = properties.find(p => p.id === selectedOrig);
    const upProp = properties.find(p => p.id === selectedUp);
    const currentPropRate = preview?.pricing?.from_adr || origProp?.list_nightly_rate || 0;

    const SubHeader = (
        <div className="flex flex-1 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                {/* Original Selection */}
                <div className="relative flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    <select
                        value={selectedOrig}
                        onChange={(e) => setSelectedOrig(e.target.value)}
                        className="bg-transparent text-[11px] font-black uppercase tracking-wider outline-none cursor-pointer appearance-none pr-4"
                    >
                        {budgetProps.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-gray-700" />

                {/* Upgrade Selection */}
                <div className="relative flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
                    <ArrowUpCircle className="w-3.5 h-3.5 text-orange-600" />
                    <select
                        value={selectedUp}
                        onChange={(e) => setSelectedUp(e.target.value)}
                        className="bg-transparent text-[11px] font-black uppercase tracking-wider outline-none cursor-pointer appearance-none pr-4"
                    >
                        {premiumProps.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-xl font-black text-[10px] uppercase tracking-widest text-white transition-all shadow-lg shadow-orange-600/20"
                >
                    {generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Build AI Payload
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                <button
                    onClick={() => setShowLivePreview(true)}
                    disabled={!preview}
                    data-tooltip="Full-screen Experience Preview"
                    data-tooltip-pos="bottom"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all text-slate-500 dark:text-gray-400 disabled:opacity-30"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={handleSaveTemplate}
                    disabled={saving || !preview}
                    data-tooltip="Save to Host Library"
                    data-tooltip-pos="bottom"
                    className={cn(
                        "p-2.5 rounded-xl border transition-all disabled:opacity-30",
                        saved
                            ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.4)]"
                            : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400"
                    )}
                >
                    {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );

    return (
        <DashboardLayout subHeader={SubHeader}>
            {showLivePreview && preview && (
                <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-500">
                    <button
                        onClick={() => setShowLivePreview(false)}
                        className="fixed top-8 right-8 z-[110] p-4 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-xl transition-all"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <div className="h-full overflow-y-auto bg-black p-8 sm:p-20 text-white font-sans selection:bg-orange-500">
                        <div className="max-w-4xl mx-auto space-y-16 py-20">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Invitation from</div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">{hostSettings?.pm_company_name || "Your Host"}</div>
                                </div>
                                <div className="px-5 py-2 rounded-lg bg-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] border border-orange-500/20">Offer Expires: 47:59:21</div>
                            </div>
                            <div className="space-y-8">
                                <h1 className="text-7xl sm:text-8xl font-black tracking-tighter leading-[0.9]">{preview.copy.landing_hero}</h1>
                                <p className="text-gray-400 text-2xl leading-relaxed max-w-2xl">{preview.copy.landing_summary}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {diffs.map((b: string, i: number) => (
                                    <div key={i} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-start gap-5 hover:bg-white/[0.08] transition-all">
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 mt-0.5 border border-green-500/20">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <span className="text-lg font-bold leading-tight">{b}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-12 sm:p-16 rounded-[3.5rem] bg-orange-600 space-y-10 shadow-[0_40px_100px_-20px_rgba(234,88,12,0.4)]">
                                <div className="flex flex-col sm:flex-row justify-between items-end gap-8 text-white">
                                    <div className="space-y-4">
                                        <div className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Exclusive Upgrade Delta</div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black opacity-60">ONLY</span>
                                            <div className="text-6xl sm:text-8xl font-black tracking-tighter">{(preview.pricing.offer_adr - currentPropRate).toFixed(0)}€</div>
                                            <span className="text-lg font-bold opacity-80">more / night</span>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-4">
                                        <div className="space-y-1 opacity-60 font-black uppercase text-[10px] tracking-widest">
                                            <div>Base Rate: {currentPropRate}€</div>
                                            <div>List Rate: {preview.pricing.to_adr_list}€</div>
                                        </div>
                                        <div className="px-6 py-3 bg-black/20 rounded-2xl border border-white/10">
                                            <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Total Due Now</div>
                                            <div className="text-2xl font-black tracking-tight">{((preview.pricing.offer_adr - currentPropRate) * 7).toFixed(0)}€</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Editor Settings (Left) */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <Settings className="w-5 h-5 text-orange-600" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Visual Configuration</h2>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Preview Channel</label>
                                <div className="flex p-1 bg-slate-50 dark:bg-white/5 rounded-[1.25rem] border border-slate-200 dark:border-white/10">
                                    <button
                                        onClick={() => setPreviewMode('email')}
                                        className={cn("flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", previewMode === 'email' ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xl shadow-black/10" : "text-slate-400 hover:text-slate-600 dark:hover:text-gray-300")}
                                    >
                                        <Mail className="w-3.5 h-3.5 inline mr-2" />
                                        Email
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('landing')}
                                        className={cn("flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", previewMode === 'landing' ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xl shadow-black/10" : "text-slate-400 hover:text-slate-600 dark:hover:text-gray-300")}
                                    >
                                        <Layout className="w-3.5 h-3.5 inline mr-2" />
                                        Landing
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Device Simulation</label>
                                <div className="flex p-1 bg-slate-50 dark:bg-white/5 rounded-[1.25rem] border border-slate-200 dark:border-white/10">
                                    <button
                                        onClick={() => setDeviceMode('desktop')}
                                        className={cn("flex-1 p-3 rounded-xl transition-all flex items-center justify-center", deviceMode === 'desktop' ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xl shadow-black/10" : "text-slate-400")}
                                    >
                                        <Monitor className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeviceMode('mobile')}
                                        className={cn("flex-1 p-3 rounded-xl transition-all flex items-center justify-center", deviceMode === 'mobile' ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xl shadow-black/10" : "text-slate-400")}
                                    >
                                        <Smartphone className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <Info className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Economics</h2>
                        </div>

                        {!preview ? (
                            <p className="text-xs italic text-slate-400 dark:text-gray-700">Awaiting AI generation...</p>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Base ADR</span>
                                        <span className="text-lg font-black italic">{preview.pricing.from_adr}€</span>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">List Upgrade</span>
                                        <span className="text-lg font-black italic line-through text-slate-300 dark:text-gray-800">{preview.pricing.to_adr_list}€</span>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
                                    <div className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-1">Total Revenue Lift</div>
                                    <div className="text-3xl font-black italic text-green-500 tracking-tighter">+{preview.pricing.revenue_lift}€</div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                                    <button
                                        onClick={handleSendTestEmail}
                                        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-600/20 transition-all font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/5 group"
                                    >
                                        <Send className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Send Test Email
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* Live Sandbox (Center/Right) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className={cn(
                        "relative bg-white dark:bg-[#0D0D0D] rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl transition-all duration-700 mx-auto",
                        deviceMode === 'mobile' ? "w-[360px] h-[640px]" : "w-full min-h-[700px] h-[900px]"
                    )}>
                        {!preview && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-black/60 backdrop-blur-md">
                                <div className="w-16 h-16 rounded-2xl bg-orange-600/20 flex items-center justify-center text-orange-600 mb-6 animate-pulse">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Awaiting Generation</h3>
                                <p className="text-slate-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest mt-2 px-12 text-center leading-loose">Configure upgrade properties in the sub-header and trigger AI build</p>
                            </div>
                        )}

                        {preview && previewMode === 'email' && (
                            <div className="h-full flex flex-col bg-white">
                                <div className="p-6 border-b border-slate-100 flex items-center gap-6 bg-slate-50">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center text-xl font-black italic shadow-lg shadow-orange-600/30">U</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 leading-none">AI Subject Optimization</div>
                                        <input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="text-lg font-bold text-slate-900 truncate bg-transparent w-full outline-none focus:text-orange-600 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-12 text-black bg-white">
                                    <div className="max-w-2xl mx-auto border border-slate-100 shadow-sm rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: preview.copy.email_html }} />
                                </div>
                            </div>
                        )}

                        {preview && previewMode === 'landing' && (
                            <div className="h-full overflow-y-auto bg-black p-12 text-white font-sans selection:bg-orange-600">
                                <div className="max-w-3xl mx-auto space-y-12">
                                    <div className="flex justify-between items-center opacity-40">
                                        <div className="font-black text-lg italic tracking-tighter uppercase">UPREZ</div>
                                        <div className="px-3 py-1 rounded bg-white/10 text-[10px] font-black uppercase tracking-widest">Session Active</div>
                                    </div>

                                    <div className="space-y-6">
                                        <h1 className="text-6xl font-black tracking-tighter leading-[1.0]">{preview.copy.landing_hero}</h1>
                                        <p className="text-gray-400 text-xl font-medium leading-relaxed max-w-xl">{preview.copy.landing_summary}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {preview.copy.diff_bullets.map((b: string, i: number) => (
                                            <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-start gap-4 hover:bg-white/[0.08] transition-all group">
                                                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform"><CheckCircle2 className="w-4 h-4" /></div>
                                                <span className="text-sm font-bold leading-tight text-gray-200">{b}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-10 rounded-[3rem] bg-orange-600 space-y-8 shadow-2xl">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Offer Nightly ADR</div>
                                                <div className="text-5xl font-black italic">{preview.pricing.offer_adr}€ <span className="text-sm font-normal opacity-70 not-italic">/night</span></div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Premium Value</div>
                                                <div className="text-2xl font-black line-through opacity-40 italic">{preview.pricing.to_adr_list}€</div>
                                            </div>
                                        </div>
                                        <button className="w-full py-5 rounded-2xl bg-black text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                            Confirm Instant Upgrade
                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
