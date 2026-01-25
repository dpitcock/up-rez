'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LandingHero } from '@/components/landing-hero';
import { PropertyCarousel } from '@/components/property-carousel';

export default function MarketingHome() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500 selection:text-white overflow-hidden">

            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.svg" alt="UpRez" width={32} height={32} className="w-8 h-8" />
                        <span className="font-bold text-xl tracking-tight text-white">UpRez</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.push('/settings')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                            Log In
                        </button>
                        <button onClick={() => router.push('/demo')} className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <LandingHero />

            {/* Dashboard Preview - Glassmorphism */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 mb-32">
                <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden aspect-[16/9] group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    {/* Mock UI */}
                    <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="bg-[#111] p-6 rounded-xl border border-white/5 flex flex-col items-center">
                                <div className="h-1.5 w-16 bg-red-500/50 rounded-full mb-3 " />
                                <div className="text-2xl font-bold text-white mb-1">Booked</div>
                                <div className="text-xs uppercase tracking-widest text-gray-500">Standard Room</div>
                            </div>
                            <div className="bg-[#111] p-6 rounded-xl border border-white/5 flex flex-col items-center transform scale-110 shadow-xl border-orange-500/20">
                                <div className="h-1.5 w-16 bg-orange-500 rounded-full mb-3 animate-pulse" />
                                <div className="text-2xl font-bold text-white mb-1">Offer Sent</div>
                                <div className="text-xs uppercase tracking-widest text-orange-400">AI Match Found</div>
                            </div>
                            <div className="bg-[#111] p-6 rounded-xl border border-white/5 flex flex-col items-center">
                                <div className="h-1.5 w-16 bg-green-500/50 rounded-full mb-3" />
                                <div className="text-2xl font-bold text-white mb-1">Empty</div>
                                <div className="text-xs uppercase tracking-widest text-gray-500">Premium Suite</div>
                            </div>
                        </div>

                        <div className="mt-16 bg-gradient-to-r from-orange-500/10 to-orange-500/20 border border-orange-500/20 px-8 py-4 rounded-full backdrop-blur-md">
                            <p className="text-orange-200 font-mono">Potential Revenue Lift: <span className="text-orange-400 font-bold ml-2">+$5,630/mo</span></p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Property Carousel Visualization */}
            <PropertyCarousel />

            {/* Bento Grid Features */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 hover:border-white/10 transition-colors group">
                        <h3 className="text-2xl font-bold mb-4 group-hover:text-orange-400 transition-colors">Automated Upgrades</h3>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                            Turn cancellations into cash. When a premium unit sits empty, our AI automatically offers it to guests booked in lower-tier units. No manual work required.
                        </p>
                        <div className="mt-8 flex gap-2">
                            <span className="px-3 py-1 rounded bg-white/5 text-xs text-gray-400">Auto-Email</span>
                            <span className="px-3 py-1 rounded bg-white/5 text-xs text-gray-400">SMS</span>
                            <span className="px-3 py-1 rounded bg-white/5 text-xs text-gray-400">Landing Page</span>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 hover:border-white/10 transition-colors relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-[50px] group-hover:bg-orange-600/20 transition-all" />
                        <h3 className="text-2xl font-bold mb-4">Smart Pricing</h3>
                        <p className="text-gray-400 text-lg">
                            We never cannibalize revenue. Upgrade pricing is dynamic, calculating the perfect discount on the <i>difference</i>.
                        </p>
                        <div className="mt-auto pt-8">
                            <div className="text-4xl font-mono text-white font-bold">40%</div>
                            <div className="text-sm text-gray-500">Avg. Discount</div>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 hover:border-white/10 transition-colors relative overflow-hidden group">
                        <h3 className="text-2xl font-bold mb-4">Perfect Timing</h3>
                        <p className="text-gray-400 text-lg">
                            Our engine waits for the perfect moment: 7 days before arrival, when excitement is high and impulse buys happen.
                        </p>
                        <div className="mt-8 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-orange-500 w-3/4 h-full" />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Booked</span>
                            <span className="text-orange-400 font-bold">Offer Sent</span>
                            <span>Arrival</span>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 hover:border-white/10 transition-colors flex items-center justify-between group">
                        <div>
                            <h3 className="text-2xl font-bold mb-4 group-hover:text-orange-400 transition-colors">The UpRez Engine</h3>
                            <p className="text-gray-400 text-lg max-w-md">
                                Built on Next.js 16 and powered by OpenAI. Fast, reliable, and intelligent.
                            </p>
                        </div>
                        <div className="hidden md:flex gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all">⚛️</div>
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all">🤖</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Math / Impact */}
            <section className="py-32 border-t border-white/5 bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-16 tracking-tight">The math works.</h2>

                    <div className="grid md:grid-cols-3 gap-8 items-center max-w-4xl mx-auto">
                        <div className="bg-[#111] p-8 rounded-2xl border border-white/5">
                            <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-2">Original</p>
                            <p className="text-4xl font-bold text-white">€3,500</p>
                        </div>
                        <div className="text-orange-500 text-6xl font-black">+</div>
                        <div className="bg-orange-600 p-8 rounded-2xl shadow-[0_20px_50px_-12px_rgba(234,88,12,0.3)] transform scale-110 relative z-10">
                            <p className="text-orange-100 uppercase text-xs font-bold tracking-widest mb-2">New Total</p>
                            <p className="text-5xl font-bold text-white">€9,130</p>
                        </div>
                    </div>

                    <p className="mt-16 text-gray-500 max-w-2xl mx-auto">
                        "We saw a 3-5% conversion rate immediately. Guests love the upgrade because it feels like a deal, and we fill our premium inventory."
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-black">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center opacity-50 text-sm">
                    <div className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="UpRez" width={20} height={20} className="w-5 h-5 grayscale opacity-50" />
                        <span className="font-bold">UpRez</span>
                    </div>
                    <p>Berlin AI Hackathon 2026</p>
                </div>
            </footer>
        </div>
    );
}
