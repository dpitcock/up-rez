'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    ArrowLeft, Layout, Search, Filter,
    Bed, Bath, Maximize2, MapPin,
    Euro, Star, Info, X, ChevronRight, Settings, Sparkles
} from "lucide-react";

import { apiClient } from "@/lib/api";
import DashboardLayout from '@/components/DashboardLayout';

interface Property {
    id: string;
    name: string;
    list_nightly_rate: number;
    beds: number;
    category: string;
    images: string; // JSON string
}

export default function PropertiesDemoPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const data = await apiClient(`/demo/properties`);
            if (Array.isArray(data)) {
                setProperties(data);
            } else {
                console.warn("Properties API returned non-array data:", data);
                setProperties([]);
            }
        } catch (err) {
            console.error("Failed to fetch properties", err);
            setProperties([]); // Fallback to empty
        } finally {
            setLoading(false);
        }
    };

    const filtered = properties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const subHeader = (
        <div className="flex flex-1 items-center justify-between gap-4">
            <div className="relative group flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-11 pr-4 text-xs focus:outline-none focus:border-orange-500/50 transition-all dark:text-white"
                />
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => router.push('/settings')}
                    className="p-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all text-slate-500 dark:text-gray-400"
                    data-tooltip="Host Admin Center"
                    data-tooltip-pos="bottom"
                >
                    <Settings className="w-4 h-4" />
                </button>
                <button
                    onClick={() => router.push('/ai-settings')}
                    className="p-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all text-slate-500 dark:text-gray-400"
                    data-tooltip="AI Core Settings"
                    data-tooltip-pos="bottom"
                >
                    <Sparkles className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    return (
        <DashboardLayout subHeader={subHeader}>
            <div className="space-y-8 pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(p => {
                        const imgs = JSON.parse(p.images);
                        return (
                            <div
                                key={p.id}
                                onClick={() => setSelectedProp(p)}
                                className="group bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden cursor-pointer hover:border-orange-500/30 transition-all hover:-translate-y-1 active:scale-[0.98] shadow-sm hover:shadow-xl dark:hover:shadow-orange-900/10"
                            >
                                <div className="aspect-[4/3] overflow-hidden relative">
                                    <img
                                        src={imgs[0]}
                                        alt={p.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 text-white">
                                        {p.category}
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h3 className="font-bold text-lg group-hover:text-orange-500 transition-colors text-slate-900 dark:text-white">{p.name}</h3>
                                        <div className="flex items-center gap-1 text-slate-500 dark:text-gray-500 text-xs mt-1">
                                            <MapPin className="w-3 h-3 text-orange-600" />
                                            Mallorca, Spain
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-4 text-slate-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5"><Bed className="w-3.5 h-3.5" /> {p.beds}</span>
                                            <span className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white"><Euro className="w-3.5 h-3.5" /> {p.list_nightly_rate}</span>
                                        </div>
                                        <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-full group-hover:bg-orange-600 group-hover:text-white transition-all text-slate-400">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Detail Overlay */}
                {selectedProp && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                        <div
                            className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm"
                            onClick={() => setSelectedProp(null)}
                        />
                        <div className="relative w-full max-w-5xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setSelectedProp(null)}
                                className="absolute top-6 right-6 z-10 p-3 bg-white/10 dark:bg-black/40 hover:bg-slate-100 dark:hover:bg-black/60 rounded-full border border-slate-200 dark:border-white/10 backdrop-blur-md transition-all text-slate-500 dark:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-[85vh] overflow-y-auto lg:overflow-hidden">
                                <div className="relative h-64 lg:h-full group">
                                    <img
                                        src={JSON.parse(selectedProp.images)[0]}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent lg:hidden" />
                                </div>

                                <div className="p-8 sm:p-12 overflow-y-auto space-y-8 flex flex-col">
                                    <div className="space-y-4">
                                        <div className="inline-flex px-4 py-1.5 rounded-full bg-orange-600/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                            {selectedProp.category} Listing
                                        </div>
                                        <h2 className="text-4xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">{selectedProp.name}</h2>
                                        <p className="text-slate-500 dark:text-gray-400 leading-relaxed max-w-md">
                                            High-caliber property optimized for elite rental performance.
                                            Equipped with premium amenities and strategically located to maximize yield.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-1">
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-gray-500 font-bold">Standard Rate</div>
                                            <div className="text-xl font-black text-slate-900 dark:text-white">{selectedProp.list_nightly_rate}€ <span className="text-xs font-normal text-slate-400 dark:text-gray-500">/ night</span></div>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-1">
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-gray-500 font-bold">Capacity</div>
                                            <div className="text-xl font-black text-slate-900 dark:text-white">{selectedProp.beds} <span className="text-xs font-normal text-slate-400 dark:text-gray-500">Double Beds</span></div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5 flex-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Technical Details</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 dark:text-gray-400">Internal ID</span>
                                                <span className="font-mono text-orange-500 uppercase font-black text-[10px]">{selectedProp.id}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 dark:text-gray-400">Optimization Rank</span>
                                                <span className="text-green-500 font-black uppercase text-[10px]">Top 5% Tier</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 dark:text-gray-400">Last Synced</span>
                                                <span className="text-slate-900 dark:text-gray-300 font-bold uppercase text-[10px]">Just now</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => router.push('/templates')}
                                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-orange-900/20 text-white"
                                    >
                                        Select as Target
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
