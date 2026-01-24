'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    ArrowLeft, Settings, Cpu, Cloud,
    Activity, Box, Info, CheckCircle2, Sparkles
} from "lucide-react";

import { ConnectionError } from "@/components/ConnectionError";
import { apiClient } from '@/lib/api';

export default function SettingsPage() {
    const router = useRouter();
    const [useOpenAI, setUseOpenAI] = useState(false);
    const [localModel, setLocalModel] = useState("gemma3:latest");
    const [pmCompanyName, setPmCompanyName] = useState("@luxury_stays");
    const [availableModels, setAvailableModels] = useState<string[]>(["gemma3:latest"]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchSettings = async () => {
        try {
            setError(false);
            const hostId = 'demo_host_001';
            const data = await apiClient(`/api/host/${hostId}/settings`);
            setUseOpenAI(Boolean(data.use_openai_for_copy));
            setLocalModel(data.local_llm_model || "gemma3:latest");
            setPmCompanyName(data.pm_company_name || "@luxury_stays");

            // Fetch available models
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/demo/ollama-models`);
                if (res.ok) {
                    const modData = await res.json();
                    setAvailableModels(modData.models || ["gemma3:latest"]);
                }
            } catch (mErr) {
                console.warn("Could not fetch ollama models, using defaults");
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const hostId = 'demo_host_001'; // Assuming a fixed hostId for demo purposes
            await apiClient(`/api/host/${hostId}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    use_openai_for_copy: useOpenAI, // Changed to match backend field name
                    local_llm_model: localModel, // Changed to match backend field name
                    pm_company_name: pmCompanyName
                })
            });
            router.push('/demo'); // Redirect after successful save
        } catch (err) {
            console.error("Failed to save settings", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono uppercase tracking-widest text-xs antialiased text-opacity-50">
                Synchronizing AI Core...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <ConnectionError onRetry={fetchSettings} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500">
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.push('/demo')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push('/')}>
                        <img src="/up-rez-logo-white.svg" alt="UpRez Logo" className="h-7 w-auto" />
                        <div className="w-px h-4 bg-white/10 hidden sm:block" />
                        <h1 className="font-bold text-lg hidden sm:block tracking-tight text-white/50">AI Core</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white/5 rounded-full px-2">
                        <button
                            onClick={() => router.push('/dashboard/settings')}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4 text-orange-500" />
                            <span className="text-[10px] font-bold uppercase hidden sm:block">Admin</span>
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <button
                            onClick={() => router.push('/demo/settings')}
                            className="p-2 bg-white/10 rounded-full text-white flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-bold uppercase hidden sm:block font-black">AI Core</span>
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-2.5 bg-white text-black hover:bg-orange-500 hover:text-white rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? "Deploying..." : "Commit Changes"}
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto pt-32 pb-20 px-6 space-y-12">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Host Strategy</h2>
                        <p className="text-gray-400 text-sm">Select the primary intelligence engine for generating upgrade offers.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => setUseOpenAI(false)}
                            className={cn(
                                "p-8 rounded-[2.5rem] border text-left transition-all duration-300 group relative",
                                !useOpenAI ? "bg-white/5 border-orange-500/50 shadow-[0_0_50px_-20px_rgba(234,88,12,0.3)]" : "bg-transparent border-white/5 hover:border-white/10"
                            )}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", !useOpenAI ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400")}>
                                    <Cpu className="w-6 h-6" />
                                </div>
                                {!useOpenAI && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[8px] font-black uppercase tracking-wider">
                                        <Activity className="w-2.5 h-2.5" />
                                        Active
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-2">Local Infrastructure</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">Privacy-first execution routing through local GPU clusters via Ollama.</p>
                        </button>

                        <button
                            onClick={() => setUseOpenAI(true)}
                            className={cn(
                                "p-8 rounded-[2.5rem] border text-left transition-all duration-300 group relative",
                                useOpenAI ? "bg-white/5 border-blue-500/50 shadow-[0_0_50px_-20px_rgba(59,130,246,0.3)]" : "bg-transparent border-white/5 hover:border-white/10"
                            )}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", useOpenAI ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400")}>
                                    <Cloud className="w-6 h-6" />
                                </div>
                                {useOpenAI && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[8px] font-black uppercase tracking-wider">
                                        <Activity className="w-2.5 h-2.5" />
                                        Active
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-2">OpenAI (SaaS)</h3>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">Cloud-scale GPT-4o intelligence for maximum persuasion and semantic reach.</p>
                        </button>
                    </div>
                </section>

                <section className="space-y-6 pt-12 border-t border-white/5">
                    <div className="space-y-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Property Management Profile</h2>
                        <p className="text-gray-400 text-sm">Customize how your brand appears on guest-facing upgrade invitations.</p>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-2">Display Name</label>
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 focus-within:border-orange-500/50 transition-all">
                                <Settings className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={pmCompanyName}
                                    onChange={(e) => setPmCompanyName(e.target.value)}
                                    placeholder="e.g. Luxury Stays Mallorca"
                                    className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0 text-white placeholder:text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 px-2">
                            <Info className="w-4 h-4 text-blue-500/60 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                This name will replace "UpRez" in the email headers and landing page copy. Your brand remains front and center for the guest.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-6 pt-12 border-t border-white/5">
                    <div className="space-y-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Local Model Selection</h2>
                        <p className="text-gray-400 text-sm">Fine-tune the local execution by selecting an available LLM architecture.</p>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 relative">
                            <Box className="w-5 h-5 text-gray-400" />
                            <select
                                value={localModel}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalModel(e.target.value)}
                                disabled={useOpenAI}
                                className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed appearance-none"
                            >
                                {availableModels.map((m: string) => (
                                    <option key={m} value={m} className="bg-[#111] text-white">{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-start gap-3 px-2">
                            <Info className="w-4 h-4 text-orange-500/60 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                Dynamically scanning local port 11434...
                                {availableModels.length > 1 ? `${availableModels.length} models detected and ready for deployment.` : "Ensure Ollama is running to detect more models."}
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
