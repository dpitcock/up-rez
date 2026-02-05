'use client';

import React from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

interface ConnectionErrorProps {
    onRetry?: () => void;
    error?: string;
}

export function ConnectionError({ onRetry, error }: ConnectionErrorProps) {
    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-700">
            <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-12 text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-8 border border-red-500/20 shadow-[0_0_50px_-5px_rgba(239,68,68,0.2)]">
                    <WifiOff className="w-10 h-10" />
                </div>

                <h2 className="text-3xl font-black tracking-tight mb-4 uppercase italic leading-tight text-white">
                    Database Connection Failed
                </h2>

                <div className="bg-red-500/10 text-red-400 p-6 rounded-3xl text-sm font-bold mb-8 border border-red-500/10 leading-relaxed shadow-inner">
                    We could not connect to the UpRez API. <br />
                    <span className="text-white">Action Required:</span> Ensure your PostgreSQL environment variables are configured and the database is reachable.
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-mono text-gray-500 break-all">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={onRetry}
                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-[0.15em] transition-all active:scale-95 shadow-xl"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Connection
                    </button>
                </div>
            </div>
        </div>
    );
}
