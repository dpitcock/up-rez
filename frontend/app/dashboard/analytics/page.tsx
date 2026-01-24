'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function AnalyticsPage() {
    return (
        <DashboardLayout>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
                <p className="text-gray-600">Revenue lift and conversion metrics</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Total Revenue Lift', value: '€0.00', change: '+0%' },
                    { label: 'Conversion Rate', value: '0.0%', change: '+0%' },
                    { label: 'Avg. Upgrade Value', value: '€0', change: '+0%' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                            {stat.change} vs last month
                        </span>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-500">
                    Detailed charts will appear here once you have active booking data.
                </p>
            </div>
        </DashboardLayout>
    );
}
