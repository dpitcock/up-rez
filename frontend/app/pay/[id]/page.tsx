'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, CreditCard, Lock, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchOffer, apiClient } from '@/lib/api';

export default function PayPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchOffer(id);
                setOffer(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleMockPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Simulate network delay
        await new Promise(r => setTimeout(r, 2000));

        try {
            // Match the property ID of the first (primary) option for this demo
            const res = await apiClient(`/offers/${id}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prop_id: offer.options[0].prop_id })
            });

            if (res.success) {
                router.push(`/confirmation/${id}`);
            }
        } catch (err) {
            console.error("Payment failed", err);
            setProcessing(false);
        }
    };

    if (loading) return null;

    const selectedOption = offer?.options[0];
    const balanceDue = (selectedOption?.pricing.offer_total - offer?.original_booking.current_total) || 0;

    return (
        <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 selection:bg-orange-500">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-xl">
                {/* Header */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest mb-6">
                        <Lock className="w-3 h-3 text-orange-500" />
                        Secure Encrypted Checkout
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-4">
                        Secure<br />Payment
                    </h1>
                    <p className="text-gray-500 text-sm">Review your upgrade balance and finalize your stay.</p>
                </div>

                {/* Summary Card */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-2xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <div className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">Upgrade To</div>
                            <div className="text-xl font-bold text-white">{selectedOption?.prop_name}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Total Due</div>
                            <div className="text-3xl font-black italic">€{balanceDue.toFixed(0)}</div>
                        </div>
                    </div>

                    <form onSubmit={handleMockPayment} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4 mb-2 block">Card Details</label>
                                <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 transition-all focus-within:border-orange-500/50">
                                    <CreditCard className="w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        defaultValue="•••• •••• •••• 4242"
                                        disabled
                                        className="bg-transparent border-none focus:ring-0 text-white font-mono w-full"
                                    />
                                    <ShieldCheck className="w-5 h-5 text-green-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest block mb-1">Expiry</label>
                                    <input type="text" defaultValue="09/27" disabled className="bg-transparent border-none p-0 focus:ring-0 text-white font-mono" />
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                                    <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest block mb-1">CVC</label>
                                    <input type="text" defaultValue="•••" disabled className="bg-transparent border-none p-0 focus:ring-0 text-white font-mono" />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-6 rounded-2xl bg-white text-black font-black uppercase text-sm tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Authorize Payment
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Badges */}
                <div className="flex items-center justify-center gap-8 opacity-30 grayscale hover:opacity-50 transition-opacity">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4 w-auto" alt="PayPal" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3 w-auto" alt="Visa" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6 w-auto" alt="Mastercard" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-5 w-auto" alt="Stripe" />
                </div>
            </div>
        </main>
    );
}
