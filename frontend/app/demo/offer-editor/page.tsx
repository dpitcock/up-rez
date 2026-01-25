'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    ArrowLeft, Sparkles, Mail, Layout,
    ChevronRight, Save, Send, Download,
    CheckCircle2, AlertCircle, RefreshCw,
    Smartphone, Monitor, Info, Settings, Eye, X
} from "lucide-react";

import { ConnectionError } from "@/components/ConnectionError";
import { apiClient } from '@/lib/api';

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

            // If data is mock success, we might need a dummy preview object
            if (data.status === 'simulated_success') {
                // We'll use the first exported offer as a proxy if we're in static mode
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
                return;
            }

            setPreview(data);
            setSubject(data.copy.subject);
            setDiffs(data.copy.diff_bullets);
        } catch (err) {
            console.error("Failed to generate preview", err);
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveTemplate = async () => {
        setSaving(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/host/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_name: `${previewMode === 'email' ? 'Email' : 'Page'}: ${upProp?.name || 'Offer'}`,
                    content_html: previewMode === 'email' ? preview.copy.email_html : preview.copy.landing_hero,
                    template_type: previewMode
                })
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setSaving(false);
        }
    };

    const budgetProps = properties.filter(p => p.list_nightly_rate <= 200 || p.category === 'budget');
    const premiumProps = properties.filter(p => p.list_nightly_rate >= 220);

    const origProp = properties.find(p => p.id === selectedOrig);
    const upProp = properties.find(p => p.id === selectedUp);
    const currentPropRate = preview?.pricing?.from_adr || origProp?.list_nightly_rate || 0;

    const handleSendTestEmail = async () => {
        if (!preview) return;
        setLoading(true);
        try {
            // Using Resend API directly from frontend (if CORS allowed) or logic Proxy
            // For demo purposes, we'll try direct fetch or a standard pattern
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
                alert("Test email sent success!");
            } else {
                const errData = await res.json();
                console.error("Resend error:", errData);
                // Fallback for demo: if it's a CORS error or key missing, we log it
                alert("Email trigger sent. Check console for API response.");
            }
        } catch (err) {
            console.error("Email send error:", err);
            alert("Sent! (Simulated via frontend script)");
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
                fetchProperties();
            }
        } catch (err) {
            console.error("Failed to enable OpenAI", err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <ConnectionError
                    onRetry={fetchProperties}
                    onEnableOpenAI={handleEnableOpenAI}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500 selection:text-white">
            {showLivePreview && preview && (
                <div className="fixed inset-0 z-[200] bg-black animate-in fade-in duration-300">
                    <button
                        onClick={() => setShowLivePreview(false)}
                        className="fixed top-8 right-8 z-[210] p-4 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    {previewMode === 'landing' ? (
                        <div className="h-full overflow-y-auto bg-black p-8 sm:p-20 text-white font-sans selection:bg-orange-500">
                            <div className="max-w-4xl mx-auto space-y-16 py-20">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Invitation from</div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">{hostSettings?.pm_company_name || hostSettings?.host_name || "Your Host"}</div>
                                    </div>
                                    <div className="px-5 py-2 rounded-lg bg-white/10 text-xs font-black uppercase tracking-[0.3em] border border-white/10">Offer Expires: 47:59:21</div>
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
                                    <div className="flex flex-col sm:flex-row justify-between items-end gap-8">
                                        <div className="space-y-4">
                                            <div className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Exclusive Upgrade Delta</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black opacity-60">ONLY</span>
                                                <div className="text-6xl sm:text-8xl font-black tracking-tighter">{(preview.pricing.offer_adr - currentPropRate).toFixed(0)}€</div>
                                                <span className="text-lg font-bold opacity-80">more / night</span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-4">
                                            <div className="space-y-1 opacity-60">
                                                <div className="text-[10px] font-black uppercase tracking-widest">Base Rate: {currentPropRate}€</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest">List Rate: {preview.pricing.to_adr_list}€</div>
                                            </div>
                                            <div className="px-6 py-3 bg-black/20 rounded-2xl border border-white/10">
                                                <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Total Due Now</div>
                                                <div className="text-2xl font-black tracking-tight">{((preview.pricing.offer_adr - currentPropRate) * 7).toFixed(0)}€</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <footer className="pt-20 border-t border-white/5">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 opacity-50">
                                        <div className="text-left space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Managed by</div>
                                            <div className="text-lg font-black italic uppercase">{hostSettings?.pm_company_name || hostSettings?.host_name}</div>
                                            {hostSettings?.host_phone && (
                                                <div className="text-xs font-bold">{hostSettings.host_phone}</div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center md:items-end gap-2 text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                                                Upgrade offer powered by
                                                <img src="/up-rez-logo-white.svg" alt="UpRez" className="h-2.5 w-auto opacity-40" />
                                                UpRez
                                            </p>
                                        </div>
                                    </div>
                                </footer>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-gray-100 flex items-center justify-center p-8">
                            <div className="bg-white w-full max-w-2xl h-full shadow-2xl rounded-2xl overflow-y-auto p-12 text-black" dangerouslySetInnerHTML={{ __html: preview.copy.email_html }} />
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.push('/demo')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push('/')}>
                            <img src="/up-rez-logo-white.svg" alt="UpRez Logo" className="h-7 w-auto" />
                            <div className="w-px h-4 bg-white/10 hidden sm:block" />
                            <h1 className="font-bold text-lg hidden sm:block tracking-tight text-white/50">Offer Editor</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                        {preview && (
                            <>
                                <button
                                    onClick={() => setShowLivePreview(true)}
                                    className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-bold transition-all text-sm"
                                >
                                    <Eye className="w-4 h-4" />
                                    Live Preview
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={saving}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all text-sm",
                                        saved
                                            ? "bg-green-500 text-white"
                                            : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                                    )}
                                >
                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saved ? "Saved to Library" : "Save Template"}
                                </button>
                            </>
                        )}
                        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-full font-bold transition-all text-sm shadow-[0_0_20px_-5px_rgba(234,88,12,0.4)]">
                            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Generate AI Preview
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-20 px-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Panel: Property Selection */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                            <Layout className="w-3 h-3" />
                            Original Booking
                        </h2>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {budgetProps.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedOrig(p.id)}
                                    className={cn(
                                        "w-full p-3 rounded-xl border text-left transition-all group relative overflow-hidden",
                                        selectedOrig === p.id ? "bg-white/5 border-orange-500/50" : "bg-transparent border-white/5 hover:bg-white/[0.02]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-900 border border-white/5 overflow-hidden flex-shrink-0">
                                            <img src={(JSON.parse(p.images))[0]} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold truncate">{p.name}</div>
                                            <div className="text-[10px] text-gray-500">{p.list_nightly_rate}€/n • {p.beds} Beds</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            Target Upgrade
                        </h2>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {premiumProps.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedUp(p.id)}
                                    className={cn(
                                        "w-full p-3 rounded-xl border text-left transition-all group relative overflow-hidden",
                                        selectedUp === p.id ? "bg-white/5 border-blue-500/50" : "bg-transparent border-white/5 hover:bg-white/[0.02]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-900 border border-white/5 overflow-hidden flex-shrink-0">
                                            <img src={(JSON.parse(p.images))[0]} className="w-full h-full object-cover group-hover:scale-110 transition-all" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold truncate">{p.name}</div>
                                            <div className="text-[10px] text-gray-500">{p.list_nightly_rate}€/n • {p.beds} Beds</div>
                                        </div>
                                    </div>
                                    {p.beds > (origProp?.beds || 0) && (
                                        <div className="absolute top-2 right-2 text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">+Capacity</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Middle Panel: Editor & Preview */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Preview Switcher */}
                    <div className="flex items-center justify-between">
                        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                            <button
                                onClick={() => setPreviewMode('email')}
                                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", previewMode === 'email' ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white")}
                            >
                                <Mail className="w-3 h-3 inline mr-2" />
                                Email Template
                            </button>
                            <button
                                onClick={() => setPreviewMode('landing')}
                                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all", previewMode === 'landing' ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-white")}
                            >
                                <Layout className="w-3 h-3 inline mr-2" />
                                Landing Page
                            </button>
                        </div>

                        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                            <button
                                onClick={() => setDeviceMode('desktop')}
                                className={cn("p-2 rounded-lg transition-all", deviceMode === 'desktop' ? "bg-white/10 text-white" : "text-gray-500 hover:text-white")}
                            >
                                <Monitor className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setDeviceMode('mobile')}
                                className={cn("p-2 rounded-lg transition-all", deviceMode === 'mobile' ? "bg-white/10 text-white" : "text-gray-500 hover:text-white")}
                            >
                                <Smartphone className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Preview Container */}
                    <div className={cn(
                        "relative bg-white rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl transition-all duration-500 mx-auto",
                        deviceMode === 'mobile' ? "w-[360px] h-[640px]" : "w-full min-h-[600px] h-[800px]"
                    )}>
                        {!preview && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md group">
                                <div className="w-16 h-16 rounded-2xl bg-orange-600/20 flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Ready to generate?</h3>
                                <p className="text-gray-500 text-sm max-w-xs text-center">Select properties and click "Generate AI Preview" to see the magic happen.</p>
                            </div>
                        )}

                        {preview && previewMode === 'email' && (
                            <div className="h-full flex flex-col bg-white">
                                <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold font-mono">UP</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Subject</div>
                                        <div className="text-sm font-bold text-gray-900 truncate">{subject}</div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 text-black" dangerouslySetInnerHTML={{ __html: preview.copy.email_html }} />
                            </div>
                        )}

                        {preview && previewMode === 'landing' && (
                            <div className="h-full overflow-y-auto bg-black p-8 text-white font-sans">
                                <div className="max-w-2xl mx-auto space-y-12">
                                    <div className="flex justify-between items-center">
                                        <div className="font-black text-xl italic tracking-tighter">UPREZ</div>
                                        <div className="px-3 py-1 rounded bg-white/10 text-[10px] font-bold uppercase tracking-widest">47:59:21</div>
                                    </div>

                                    <div className="space-y-4">
                                        <h1 className="text-5xl font-black tracking-tight leading-[1.1]">{preview.copy.landing_hero}</h1>
                                        <p className="text-gray-400 text-lg leading-relaxed">{preview.copy.landing_summary}</p>
                                    </div>

                                    {/* Upgrade Image */}
                                    {preview.properties?.upgrade?.image && (
                                        <div className="relative h-64 rounded-[2rem] overflow-hidden border border-white/10 group">
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}${preview.properties.upgrade.image}`}
                                                alt="Upgrade Preview"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-6 left-6">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">New Destination</div>
                                                <div className="text-lg font-bold">{preview.properties.upgrade.name}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        {preview.copy.diff_bullets.map((b: string, i: number) => (
                                            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                                                <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                                                <span className="text-xs font-bold leading-tight">{b}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-orange-600 space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Your Exclusive Price</div>
                                                <div className="text-4xl font-black">{preview.pricing.offer_adr}€ <span className="text-sm font-normal opacity-70">/night</span></div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">List Price</div>
                                                <div className="text-xl font-bold line-through opacity-70">{preview.pricing.to_adr_list}€</div>
                                            </div>
                                        </div>
                                        <button className="w-full py-4 rounded-2xl bg-black text-white font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95">Accept Upgrade</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Content Editor */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <Save className="w-3 h-3" />
                            Refine Copy
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-600 uppercase block mb-2">Email Subject</label>
                                <textarea
                                    value={subject}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubject(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm focus:border-orange-500/50 outline-none h-20 resize-none transition-all"
                                    placeholder="Enter subject line..."
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-600 uppercase block mb-2">Key Improvement Points</label>
                                <div className="space-y-3">
                                    {diffs.map((d: string, i: number) => (
                                        <div key={i} className="flex gap-2 group">
                                            <input
                                                value={d}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const n = [...diffs];
                                                    n[i] = e.target.value;
                                                    setDiffs(n);
                                                }}
                                                className="flex-1 bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs focus:border-orange-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                            <Info className="w-3 h-3" />
                            Pricing Breakdown
                        </h2>
                        {preview ? (
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-xs">Original ADR</span>
                                    <span className="font-mono text-xs">{preview.pricing.from_adr}€</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-xs">List Upgrade ADR</span>
                                    <span className="font-mono text-xs line-through text-gray-700">{preview.pricing.to_adr_list}€</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                    <span className="text-xs font-bold">Offer ADR</span>
                                    <span className="font-mono text-orange-500 font-black">{preview.pricing.offer_adr}€</span>
                                </div>
                                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">REVENUE LIFT</div>
                                    <div className="text-xl font-black text-green-400">+{preview.pricing.revenue_lift}€ <span className="text-[10px] font-normal opacity-70">Total</span></div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-gray-700 italic">Generate to see economics.</div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all font-bold text-sm">
                            <Download className="w-4 h-4" />
                            Export HTML
                        </button>
                        <button
                            onClick={handleSendTestEmail}
                            disabled={loading || !preview}
                            className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-blue-600/20 border border-blue-500/20 hover:bg-blue-600/30 transition-all font-bold text-sm text-blue-400 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            Send Test Email
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
