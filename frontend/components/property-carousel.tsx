'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const UPGRADES = [
    {
        from: {
            name: "Budget Beach Apt",
            image: "/properties/prop_xsf7c1.png",
            price: 150,
            features: ["1 Bed", "Standard WiFi", "Basic Kitchen"]
        },
        to: {
            name: "Lux Beach House",
            image: "/properties/prop_wd9nox.png",
            price: 420,
            features: ["4 Beds", "Private Pool", "Beach Access", "BBQ Patio"],
            deal: "€280 Special Offer"
        }
    },
    {
        from: {
            name: "City Studio",
            image: "/properties/prop_3nrojh.png",
            price: 120,
            features: ["Studio", "City View", "Small Desk"]
        },
        to: {
            name: "Modern Penthouse",
            image: "/properties/prop_c88oq1.png",
            price: 320,
            features: ["3 Beds", "Rooftop Terrace", "Old Town View", "Gym Access"],
            deal: "€240 Special Offer"
        }
    },
    {
        from: {
            name: "Family 2BR Apt",
            image: "/properties/prop_odd9x1.png",
            price: 220,
            features: ["2 Beds", "Balcony", "Full Kitchen"]
        },
        to: {
            name: "Mid-Tier Villa",
            image: "/properties/prop_8b867z.png",
            price: 450,
            features: ["3 Beds", "Private Pool", "Garden", "Fireplace"],
            deal: "€310 Special Offer"
        }
    }
];

export function PropertyCarousel() {
    const [current, setCurrent] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const next = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrent((prev) => (prev + 1) % UPGRADES.length);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const prev = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrent((prev) => (prev - 1 + UPGRADES.length) % UPGRADES.length);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    useEffect(() => {
        const timer = setInterval(next, 8000);
        return () => clearInterval(timer);
    }, []);

    const item = UPGRADES[current];

    return (
        <div className="relative w-full max-w-6xl mx-auto py-20 px-6">
            <div className="text-center mb-16 space-y-4">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">The Upgrade Flow</h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">See how UpRez transforms low-margin placeholders into high-value experiences.</p>
            </div>

            <div className="relative group">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* From Property */}
                    <div className="lg:col-span-4 opacity-50 blur-[1px] scale-95 transition-all duration-700">
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] overflow-hidden">
                            <div className="relative h-48">
                                <img src={item.from.image} alt={item.from.name} className="w-full h-full object-cover grayscale" />
                                <div className="absolute inset-0 bg-black/40" />
                            </div>
                            <div className="p-6">
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-1">Standard Booking</span>
                                <h3 className="text-lg font-bold mb-4">{item.from.name}</h3>
                                <div className="space-y-2">
                                    {item.from.features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                            <div className="w-1 h-1 rounded-full bg-gray-700" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Arrow / Connector */}
                    <div className="lg:col-span-1 flex flex-col items-center justify-center py-4">
                        <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 animate-pulse">
                            <ArrowRight className="w-6 h-6" />
                        </div>
                    </div>

                    {/* To Property */}
                    <div className="lg:col-span-7">
                        <div className="bg-[#0A0A0A] border border-orange-500/30 rounded-[3rem] overflow-hidden shadow-[0_0_80px_-20px_rgba(234,88,12,0.2)]">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="relative h-[300px] md:h-auto">
                                    <img src={item.to.image} alt={item.to.name} className="w-full h-full object-cover" />
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-orange-600 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl">Premium Unlock</div>
                                </div>
                                <div className="p-8 md:p-10 flex flex-col">
                                    <span className="text-xs font-black uppercase text-orange-500 tracking-[0.2em] block mb-2">Upgrade Opportunity</span>
                                    <h3 className="text-3xl font-black tracking-tight leading-none mb-6">{item.to.name}</h3>

                                    <div className="space-y-3 mb-8">
                                        {item.to.features.map((f, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                <span className="text-sm font-bold text-gray-300">{f}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Revenue Impact</div>
                                            <div className="text-2xl font-black text-white">{item.to.deal}</div>
                                        </div>
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                                            <ArrowRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4 mt-12">
                    <button onClick={prev} className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        {UPGRADES.map((_, i) => (
                            <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", current === i ? "w-8 bg-orange-500" : "w-1.5 bg-white/10")} />
                        ))}
                    </div>
                    <button onClick={next} className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
