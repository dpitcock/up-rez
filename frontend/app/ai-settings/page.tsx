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
import DashboardLayout from '@/components/DashboardLayout';

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
            const data = await apiClient(`/host/${hostId}/settings`);
            setUseOpenAI(Boolean(data.use_openai_for_copy));
            setLocalModel(data.local_llm_model || "gemma3:latest");
            setPmCompanyName(data.pm_company_name || "@luxury_stays");

            // Fetch available models
            try {
                const modData = await apiClient('/demo/ollama-models');
                setAvailableModels(modData.models || ["gemma3:latest"]);
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
            await apiClient(`/host/${hostId}/settings`, {
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
            <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex items-center justify-center text-slate-400 font-mono uppercase tracking-widest text-xs antialiased">
                Synchronizing AI Core...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex items-center justify-center">
                <ConnectionError onRetry={fetchSettings} />
            </div>
        );
    }

    const subHeader = (
        <div className="flex flex-1 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h1 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">AI Logic Core</h1>
            </div>
            <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-600/20"
            >
                {saving ? "Deploying..." : "Commit Hub Changes"}
            </button>
        </div>
    );

    return (
        <DashboardLayout subHeader={subHeader}>
            <div className="max-w-3xl space-y-12 pb-20">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Host Strategy</h2>
                        <p className="text-slate-500 dark:text-gray-400 text-sm">Select the primary intelligence engine for generating upgrade offers.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => setUseOpenAI(false)}
                            className={cn(
                                "p-8 rounded-[2.5rem] border text-left transition-all duration-300 group relative",
                                !useOpenAI ? "bg-white dark:bg-white/5 border-orange-500/50 shadow-xl" : "bg-white dark:bg-transparent border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm"
                            )}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", !useOpenAI ? "bg-orange-500 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400")}>
                                    <Cpu className="w-6 h-6" />
                                </div>
                                {!useOpenAI && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[8px] font-black uppercase tracking-wider">
                                        <Activity className="w-2.5 h-2.5" />
                                        Active
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Local Infrastructure</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed font-medium">Privacy-first execution routing through local GPU clusters via Ollama.</p>
                        </button>

                        <button
                            onClick={() => setUseOpenAI(true)}
                            className={cn(
                                "p-8 rounded-[2.5rem] border text-left transition-all duration-300 group relative",
                                useOpenAI ? "bg-white dark:bg-white/5 border-blue-500/50 shadow-xl" : "bg-white dark:bg-transparent border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 shadow-sm"
                            )}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", useOpenAI ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-400")}>
                                    <Cloud className="w-6 h-6" />
                                </div>
                                {useOpenAI && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[8px] font-black uppercase tracking-wider">
                                        <Activity className="w-2.5 h-2.5" />
                                        Active
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">OpenAI (SaaS)</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed font-medium">Cloud-scale GPT-4o intelligence for maximum persuasion and semantic reach.</p>
                        </button>
                    </div>
                </section>

                <section className="space-y-6 pt-12 border-t border-slate-200 dark:border-white/5">
                    <div className="space-y-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Local Model Selection</h2>
                        <p className="text-slate-500 dark:text-gray-400 text-sm">Fine-tune the local execution by selecting an available LLM architecture.</p>
                    </div>

                    <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 relative">
                            <Box className="w-5 h-5 text-slate-400" />
                            <select
                                value={localModel}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocalModel(e.target.value)}
                                disabled={useOpenAI}
                                className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed appearance-none dark:text-white"
                            >
                                {availableModels.map((m: string) => (
                                    <option key={m} value={m} className="bg-white dark:bg-[#111] text-slate-900 dark:text-white">{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-start gap-3 px-2">
                            <Info className="w-4 h-4 text-orange-500/60 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-500 dark:text-gray-500 font-medium leading-relaxed">
                                Dynamically scanning local port 11434...
                                {availableModels.length > 1 ? `${availableModels.length} models detected and ready for deployment.` : "Ensure Ollama is running to detect more models."}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
