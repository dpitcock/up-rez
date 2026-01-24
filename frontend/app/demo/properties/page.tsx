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
            setProperties(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch properties", err);
        }
    };

    const filtered = properties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.push('/demo')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <Layout className="w-6 h-6 text-orange-500" />
                            <h1 className="font-bold text-xl tracking-tight">Property Catalog</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group hidden md:block w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search properties or categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-all"
                            />
                        </div>
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
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(p => {
                        const imgs = JSON.parse(p.images);
                        return (
                            <div
                                key={p.id}
                                onClick={() => setSelectedProp(p)}
                                className="group bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden cursor-pointer hover:border-orange-500/30 transition-all hover:-translate-y-1 active:scale-[0.98]"
                            >
                                <div className="aspect-[4/3] overflow-hidden relative">
                                    <img
                                        src={imgs[0]}
                                        alt={p.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                        {p.category}
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h3 className="font-bold text-lg group-hover:text-orange-500 transition-colors">{p.name}</h3>
                                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                                            <MapPin className="w-3 h-3 text-orange-600" />
                                            Mallorca, Spain
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-4 text-gray-400 text-xs font-medium">
                                            <span className="flex items-center gap-1.5"><Bed className="w-3.5 h-3.5" /> {p.beds}</span>
                                            <span className="flex items-center gap-1.5"><Euro className="w-3.5 h-3.5" /> {p.list_nightly_rate}</span>
                                        </div>
                                        <button className="p-2 bg-white/5 rounded-full group-hover:bg-orange-600 group-hover:text-white transition-all">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Detail Overlay */}
            {selectedProp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedProp(null)}
                    />
                    <div className="relative w-full max-w-5xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSelectedProp(null)}
                            className="absolute top-6 right-6 z-10 p-3 bg-black/40 hover:bg-black/60 rounded-full border border-white/10 backdrop-blur-md transition-all"
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
                                    <h2 className="text-4xl font-black tracking-tight leading-tight">{selectedProp.name}</h2>
                                    <p className="text-gray-400 leading-relaxed max-w-md">
                                        High-caliber property optimized for elite rental performance.
                                        Equipped with premium amenities and strategically located to maximize yield.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-1">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Standard Rate</div>
                                        <div className="text-xl font-black">{selectedProp.list_nightly_rate}€ <span className="text-xs font-normal text-gray-500">/ night</span></div>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-1">
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Capacity</div>
                                        <div className="text-xl font-black">{selectedProp.beds} <span className="text-xs font-normal text-gray-500">Double Beds</span></div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5 flex-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Technical Details</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Internal ID</span>
                                            <span className="font-mono text-orange-500">{selectedProp.id}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Optimization Rank</span>
                                            <span className="text-green-400 font-bold">Top 5% Tier</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Last Synced</span>
                                            <span className="text-gray-300">Just now</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push('/demo/offer-editor')}
                                    className="w-full py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-orange-900/20"
                                >
                                    Select as Target
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
