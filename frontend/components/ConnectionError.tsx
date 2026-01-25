'use client';

import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, Sparkles, X } from 'lucide-react';

interface ConnectionErrorProps {
    onRetry?: () => void;
    error?: string;
    onEnableOpenAI?: () => void;
}

export function ConnectionError({ onRetry, error, onEnableOpenAI }: ConnectionErrorProps) {
    const isOpenAIAllowed = process.env.NEXT_PUBLIC_USE_OPENAI === 'true';
    const isClientOnly = process.env.NEXT_PUBLIC_DEMO_MODE === 'client_only';

    if (isClientOnly) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#050505]/95 backdrop-blur-2xl flex items-center justify-center p-6">
                <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mx-auto mb-8 border border-orange-500/20 shadow-[0_0_50px_-5px_rgba(249,115,22,0.2)]">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-4 uppercase italic leading-tight text-white">
                        Mock System Active
                    </h2>
                    <div className="bg-orange-500/10 text-orange-400 p-6 rounded-3xl text-sm font-bold mb-8 border border-orange-500/10 leading-relaxed">
                        The frontend is running in <span className="text-white">Standalone Mock Mode</span>. <br />
                        Data is being served from local snapshots for demonstration purposes.
                    </div>
                    <button
                        onClick={onRetry}
                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-[0.15em] transition-all active:scale-95 shadow-xl"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Ledger
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-700">
            <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-12 text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-8 border border-red-500/20 shadow-[0_0_50px_-5px_rgba(239,68,68,0.2)]">
                    <WifiOff className="w-10 h-10" />
                </div>

                <h2 className="text-3xl font-black tracking-tight mb-4 uppercase italic leading-tight text-white">
                    Local Cluster Connection Failed
                </h2>

                <div className="bg-red-500/10 text-red-400 p-6 rounded-3xl text-sm font-bold mb-8 border border-red-500/10 leading-relaxed shadow-inner">
                    The backend is not running on your local machine. <br />
                    <span className="text-white">Action Required:</span> Run the FastAPI server and ensure the <span className="text-orange-500">NGROK</span> connection is active.
                </div>

                {isOpenAIAllowed && (
                    <div className="mb-10 p-8 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 text-left relative group hover:bg-blue-500/10 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-sm font-black text-blue-400 uppercase tracking-widest italic">OpenAI Suggestion</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mb-6 font-medium">
                            Cloud processing is configured. You can bypass local LLM issues by switching to OpenAI for marketing copy generation.
                        </p>
                        <button
                            onClick={onEnableOpenAI}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                        >
                            Activate Cloud Generation
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={onRetry}
                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-[0.15em] transition-all active:scale-95 shadow-xl"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Re-scan Connection
                    </button>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5">
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Diagnostic Target</span>
                        <div className="px-4 py-2 bg-black rounded-lg border border-white/5">
                            <code className="text-[10px] text-orange-200/50 font-mono break-all leading-tight">
                                {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
