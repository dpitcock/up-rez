'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { listOffers, expireOffer } from '@/lib/api';
import { ExternalLink, Clock, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function OffersPage() {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadOffers = async () => {
        try {
            const data = await listOffers();
            setOffers(data);
        } catch (err) {
            console.error("Failed to load offers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const handleExpire = async (id: string) => {
        if (!confirm("Are you sure you want to expire this offer manually?")) return;
        try {
            await expireOffer(id);
            loadOffers();
        } catch (err) {
            console.error("Failed to expire offer", err);
        }
    };

    const StatusBadge = ({ offer }: { offer: any }) => {
        const isPastExpiry = new Date(offer.expires_at) < new Date();
        const status = (offer.status === 'expired' || isPastExpiry) ? 'expired' : offer.status;

        if (status === 'accepted') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    Accepted
                </span>
            );
        }

        if (status === 'expired') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                    <XCircle className="w-3 h-3" />
                    Expired
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 uppercase tracking-wider animate-pulse">
                <Clock className="w-3 h-3" />
                Active
            </span>
        );
    };

    return (
        <DashboardLayout>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 uppercase italic tracking-tight">Sent Offers</h2>
                    <p className="text-gray-500 text-sm">Review and manage guest upgrade invitations</p>
                </div>
                <button
                    onClick={loadOffers}
                    className="text-xs font-black uppercase tracking-widest text-orange-600 hover:text-orange-700"
                >
                    Refresh List
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                </div>
            ) : offers.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <span className="text-2xl">🎁</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Sent Offers</h3>
                    <p className="text-gray-500 mb-6 text-sm">Trigger the demo to generate your first upgrade invitation.</p>
                    <Link
                        href="/demo"
                        className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-black transition-all"
                    >
                        Go to Demo
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Guest</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Original Property</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-[10px) font-black uppercase tracking-[0.2em] text-gray-400">Expires</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {offers.map((offer) => (
                                    <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{offer.guest_name}</div>
                                            <div className="text-[10px] text-gray-400 font-medium font-mono">{offer.id.slice(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 font-medium">{offer.prop_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge offer={offer} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-500">
                                                {new Date(offer.expires_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                {new Date(offer.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                <Link
                                                    href={`/offer/${offer.id}`}
                                                    target="_blank"
                                                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                                                    title="View Public Page"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                {new Date(offer.expires_at) > new Date() && offer.status !== 'expired' && (
                                                    <button
                                                        onClick={() => handleExpire(offer.id)}
                                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                        title="Expire Immediately"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
