'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function OffersPage() {
    return (
        <DashboardLayout>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Active Offers</h2>
                <p className="text-gray-600">Track sent offers and guest engagement</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 text-center py-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🎁</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Offers</h3>
                    <p className="text-gray-500 mb-6">
                        Trigger the demo to generate your first upgrade offer.
                    </p>
                    <a
                        href="/demo"
                        className="inline-block px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        Go to Demo
                    </a>
                </div>
            </div>
        </DashboardLayout>
    );
}
