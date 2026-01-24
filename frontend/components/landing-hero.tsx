'use client';

import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

export function LandingHero() {
    const router = useRouter();

    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
            {/* Background Image with Masking */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/properties/prop_g0ppb2.png"
                    alt="Luxury Property Background"
                    className="w-full h-full object-cover opacity-70 scale-105 animate-slow-zoom"
                />
                {/* Visual Overlays for Legibility - Toned down for visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] opacity-60" />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-8 backdrop-blur-md animate-in fade-in zoom-in duration-1000">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-xs font-medium text-orange-200 tracking-wide uppercase">AI Revenue Engine</span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] italic uppercase animate-in slide-in-from-bottom-8 duration-700">
                    Don't leave money <br />
                    <span className={cn(
                        "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600",
                        "animate-pulse duration-[3000ms]"
                    )}>
                        on the table.
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed font-medium animate-in slide-in-from-bottom-8 duration-700 delay-150 drop-shadow-lg">
                    Cheaper properties book fast. Premium ones sit empty. <br className="hidden md:block" />
                    UpRez automatically upsells your guests into higher-tier units.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                    <button
                        onClick={() => router.push('/demo')}
                        className={cn(
                            "w-full sm:w-auto px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-black text-xs uppercase tracking-widest transition-all",
                            "hover:scale-105 shadow-[0_0_60px_-10px_rgba(234,88,12,0.6)] active:scale-95"
                        )}
                    >
                        Start Revenue Engine
                    </button>
                    <button className={cn(
                        "w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20",
                        "rounded-full font-black text-xs uppercase tracking-widest transition-all backdrop-blur-xl active:scale-95"
                    )}>
                        View Case Study
                    </button>
                </div>
            </div>
        </section>
    );
}
