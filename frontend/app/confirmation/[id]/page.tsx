'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Home, Mail, ArrowRight, Sparkles, MapPin, Calendar, Users } from 'lucide-react';
import { fetchOffer } from '@/lib/api';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function ConfirmationPage() {
    const params = useParams();
    const id = params.id as string;
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchOffer(id);
                setOffer(data);
                // Trigger confetti on success
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#EA580C', '#ffffff', '#111111']
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return null;

    const originalProp = offer?.original_booking;
    const upgradeProp = offer?.options[0]; // Assuming the primary option was selected

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-orange-500 py-20 px-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-orange-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-16 animate-in zoom-in duration-700">
                    <div className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_-10px_rgba(234,88,12,0.5)]">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-4">
                        You're<br />Going Up.
                    </h1>
                    <p className="text-orange-500 font-black uppercase tracking-[0.3em] text-xs">Upgrade Confirmed</p>
                </div>

                {/* Status Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl transition-all hover:border-white/20">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <Home className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">New Reservation</div>
                                <div className="text-lg font-bold">{upgradeProp?.prop_name}</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
                                <Calendar className="w-4 h-4 text-orange-500/50" />
                                {originalProp?.arrival_date} — {originalProp?.departure_date}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
                                <Users className="w-4 h-4 text-orange-500/50" />
                                {originalProp?.guests} Guests
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl flex flex-col justify-between transition-all hover:border-white/20">
                        <div>
                            <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Confirmation Number</div>
                            <div className="text-3xl font-black italic tracking-tight">{offer?.confirmation_number || "UREZ-DEMO-001"}</div>
                        </div>
                        <div className="pt-6 border-t border-white/5 mt-6">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-green-500">
                                <Sparkles className="w-3 h-3" />
                                System processing in real-time
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-10 mb-16 relative overflow-hidden">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-600 mb-10">Next Steps</h3>
                    <div className="space-y-12 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5"></div>

                        {[
                            { title: "Upgrade Accepted", desc: "Your selection has been locked in.", status: "complete" },
                            { title: "Payment Processed", desc: "Balance charge authorized successfully.", status: "complete" },
                            { title: "Reservation Sync", desc: "Updating our property management system...", status: "pending" },
                            { title: "Access Details", desc: "Check-in instructions arriving via email.", status: "pending" }
                        ].map((step, idx) => (
                            <div key={idx} className="flex gap-8 relative">
                                <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border ${step.status === 'complete'
                                    ? 'bg-orange-600 border-orange-500 shadow-[0_0_15px_-2px_rgba(234,88,12,0.6)]'
                                    : 'bg-black border-white/10'
                                    }`}>
                                    {step.status === 'complete' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <div>
                                    <div className={`text-sm font-black uppercase tracking-widest mb-1 ${step.status === 'complete' ? 'text-white' : 'text-gray-600'}`}>
                                        {step.title}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">{step.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <Link href="/demo" className="px-10 py-5 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-orange-600 hover:text-white transition-all active:scale-95 flex items-center gap-3">
                        <Home className="w-4 h-4" />
                        Go to Dashboard
                    </Link>
                    <button className="text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 group">
                        <Mail className="w-4 h-4" />
                        Resend Receipt
                        <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </main>
    );
}
