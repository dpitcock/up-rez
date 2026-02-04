'use client';

import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import {
    Calendar,
    User,
    Home,
    Tag,
    ChevronRight,
    Search,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    Clock
} from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';

interface Booking {
    id: string;
    guest_name: string;
    guest_email: string;
    prop_name: string;
    arrival_date: string;
    departure_date: string;
    status: string;
    total_paid: number;
    nights: number;
}

export default function ReservationsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await apiClient('/bookings');
            setBookings(data);
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(b =>
        b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
        b.prop_name.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return "bg-green-500/10 text-green-500 border-green-500/20";
            case 'upgraded':
                return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            case 'cancelled':
                return "bg-red-500/10 text-red-500 border-red-500/20";
            default:
                return "bg-slate-100 text-slate-500 border-slate-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return <CheckCircle2 className="w-3 h-3" />;
            case 'upgraded':
                return <Tag className="w-3 h-3" />;
            case 'cancelled':
                return <XCircle className="w-3 h-3" />;
            default:
                return <Clock className="w-3 h-3" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 dark:border-white/5 pb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-gray-500">Live Inventory Manager</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                            Reservations
                        </h1>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right w-full md:w-auto">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search guests or properties..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600">Guest / ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600">Property</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600">Stay Dates</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 text-right">Value</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-8 py-6 h-20 bg-slate-50/20 dark:bg-white/[0.01]"></td>
                                        </tr>
                                    ))
                                ) : filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-400 dark:text-gray-600 font-bold uppercase italic text-sm">
                                            No reservations found matching your criteria
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-xs italic">
                                                        {booking.guest_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{booking.guest_name}</div>
                                                        <div className="text-[10px] font-black text-slate-400 dark:text-gray-600 tracking-widest">{booking.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Home className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-600 dark:text-gray-400">{booking.prop_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                                                        <span>{new Date(booking.arrival_date).toLocaleDateString()}</span>
                                                        <ChevronRight className="w-3 h-3 text-slate-400" />
                                                        <span>{new Date(booking.departure_date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{booking.nights} Nights</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                                                    getStatusStyle(booking.status)
                                                )}>
                                                    {getStatusIcon(booking.status)}
                                                    {booking.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right font-black italic text-slate-900 dark:text-white">
                                                €{booking.total_paid.toFixed(2)}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
