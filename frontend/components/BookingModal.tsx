'use client';

import { useState, useEffect } from 'react';
import { X, Save, Calendar, User, Mail, Home, Users } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Property {
    id: string;
    name: string;
    location: string;
    beds: number;
    baths: number;
    list_nightly_rate: number;
    type?: string;
}

interface BookingFormData {
    prop_id: string;
    guest_name: string;
    guest_email: string;
    arrival_date: string;
    departure_date: string;
    guests: number;
    total_paid: number;
    status: string;
}

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    booking?: any;
    mode: 'create' | 'edit';
    existingBookings: any[];
}

export default function BookingModal({ isOpen, onClose, onSave, booking, mode, existingBookings }: BookingModalProps) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<BookingFormData>({
        prop_id: '',
        guest_name: '',
        guest_email: '',
        arrival_date: '',
        departure_date: '',
        guests: 1,
        total_paid: 0,
        status: 'confirmed'
    });

    // Fetch properties only when dates are selected (availability filtering)
    useEffect(() => {
        if (isOpen && formData.arrival_date && formData.departure_date) {
            fetchProperties();
        } else if (isOpen) {
            // Clear properties if dates are removed
            setProperties([]);
        }
    }, [isOpen, formData.arrival_date, formData.departure_date]);

    // Reset property selection if dates change (availability may change)
    useEffect(() => {
        if (mode === 'create' && (formData.arrival_date || formData.departure_date)) {
            setFormData(prev => ({ ...prev, prop_id: '' }));
        }
    }, [formData.arrival_date, formData.departure_date, mode]);

    // Populate form when editing
    useEffect(() => {
        if (booking && mode === 'edit') {
            setFormData({
                prop_id: booking.prop_id,
                guest_name: booking.guest_name,
                guest_email: booking.guest_email,
                arrival_date: booking.arrival_date.split('T')[0],
                departure_date: booking.departure_date.split('T')[0],
                guests: booking.guests || 1,
                total_paid: booking.total_paid,
                status: booking.status
            });
        } else if (mode === 'create') {
            // Reset form for create mode
            setFormData({
                prop_id: '',
                guest_name: '',
                guest_email: '',
                arrival_date: '',
                departure_date: '',
                guests: 1,
                total_paid: 0,
                status: 'confirmed'
            });
        }
    }, [booking, mode]);

    // Auto-calculate total price when property or dates change
    useEffect(() => {
        if (mode === 'create' && formData.prop_id && formData.arrival_date && formData.departure_date) {
            const selectedProperty = properties.find(p => p.id === formData.prop_id);
            if (selectedProperty) {
                const nights = calculateNights();
                if (nights > 0) {
                    const totalPrice = selectedProperty.list_nightly_rate * nights;
                    setFormData(prev => ({ ...prev, total_paid: totalPrice }));
                }
            }
        }
    }, [formData.prop_id, formData.arrival_date, formData.departure_date, properties, mode]);

    const fetchProperties = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (formData.arrival_date) queryParams.set('arrival_date', formData.arrival_date);
            if (formData.departure_date) queryParams.set('departure_date', formData.departure_date);

            const data = await apiClient(`/properties?${queryParams.toString()}`);
            setProperties(data);
        } catch (err) {
            console.error('Failed to fetch properties:', err);
            setError('Failed to load properties');
        }
    };

    const calculateNights = () => {
        if (formData.arrival_date && formData.departure_date) {
            const arrival = new Date(formData.arrival_date);
            const departure = new Date(formData.departure_date);
            const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
            return nights > 0 ? nights : 0;
        }
        return 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'create') {
                await apiClient('/bookings', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            } else {
                await apiClient(`/bookings/${booking.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(formData)
                });
            }
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save booking');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const nights = calculateNights();
    const nightlyRate = nights > 0 ? (formData.total_paid / nights).toFixed(2) : '0.00';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-white/5">
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                            {mode === 'create' ? 'Create New Booking' : 'Edit Booking'}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-gray-600 font-bold uppercase tracking-widest mt-1">
                            {mode === 'create' ? 'Add a new reservation' : `Booking ID: ${booking?.id}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-red-500 text-sm font-bold">
                            {error}
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 mb-2">
                                <Calendar className="w-3 h-3" />
                                Arrival Date
                            </label>
                            <input
                                type="date"
                                value={formData.arrival_date}
                                onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                                required
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 mb-2">
                                <Calendar className="w-3 h-3" />
                                Departure Date
                            </label>
                            <input
                                type="date"
                                value={formData.departure_date}
                                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                                required
                                min={formData.arrival_date}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Property Selection */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 mb-2">
                            <Home className="w-3 h-3" />
                            Property
                        </label>
                        <select
                            value={formData.prop_id}
                            onChange={(e) => setFormData({ ...formData, prop_id: e.target.value })}
                            required
                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        >
                            <option value="">Select a property...</option>
                            {properties.filter(prop => {
                                if (!formData.arrival_date || !formData.departure_date) return true;
                                if (prop.id === formData.prop_id) return true; // Always show currently selected property

                                const newStart = new Date(formData.arrival_date);
                                const newEnd = new Date(formData.departure_date);

                                // Check if property is booked in the requested period
                                const isBooked = existingBookings.some(b => {
                                    if (b.prop_id !== prop.id) return false;
                                    if (b.status === 'cancelled') return false;
                                    if (mode === 'edit' && b.id === booking?.id) return false; // Ignore current booking being edited

                                    const existingStart = new Date(b.arrival_date);
                                    const existingEnd = new Date(b.departure_date);

                                    return newStart < existingEnd && newEnd > existingStart;
                                });

                                return !isBooked;
                            }).map((prop) => (
                                <option key={prop.id} value={prop.id}>
                                    {prop.name}
                                </option>
                            ))}
                        </select>
                        {formData.arrival_date && formData.departure_date && (
                            <p className="text-[10px] text-slate-400 mt-2 ml-1">
                                Showing only available properties for selected dates
                            </p>
                        )}
                    </div>

                    {/* Guest Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 mb-2">
                                <User className="w-3 h-3" />
                                Guest Name
                            </label>
                            <input
                                type="text"
                                value={formData.guest_name}
                                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                                required
                                minLength={2}
                                placeholder="John Doe"
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 mb-2">
                                <Mail className="w-3 h-3" />
                                Guest Email
                            </label>
                            <input
                                type="email"
                                value={formData.guest_email}
                                onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                                required
                                placeholder="john@example.com"
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Guests */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 mb-2">
                            <Users className="w-3 h-3" />
                            Number of Guests
                        </label>
                        <input
                            type="number"
                            value={formData.guests}
                            onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                            required
                            min={1}
                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>

                    {/* Nights Display */}
                    {nights > 0 && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl px-4 py-3">
                            <p className="text-sm font-bold text-blue-600">
                                {nights} night{nights !== 1 ? 's' : ''} • €{nightlyRate}/night
                            </p>
                        </div>
                    )}



                    {/* Payment and Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 mb-2 block">
                                Total Paid (€)
                            </label>
                            <input
                                type="number"
                                value={formData.total_paid}
                                onChange={(e) => setFormData({ ...formData, total_paid: parseFloat(e.target.value) || 0 })}
                                required
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                readOnly={mode === 'create'}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all read-only:bg-slate-50 dark:read-only:bg-white/[0.02] read-only:cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-600 mb-2 block">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                            >
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="upgraded">Upgraded</option>
                            </select>
                        </div>
                    </div>


                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-slate-200 dark:border-white/5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Booking
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
