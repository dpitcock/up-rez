import React from 'react';
import { BaseBlockProps } from './types';
import { ChevronRight } from 'lucide-react';

interface PricingCardProps extends BaseBlockProps {
    fee: string | number;
    cta_text?: string;
    cta_url?: string;
}

export const PricingCard = ({ fee, cta_text = "Upgrade Now", cta_url = "#", mode }: PricingCardProps) => {
    const isEmail = mode === 'email';

    if (isEmail) {
        return (
            <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                backgroundColor: '#ffffff',
                textAlign: 'center',
                margin: '24px 0'
            }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Exclusive Upgrade Deal
                </div>
                <div style={{ fontSize: '36px', fontWeight: '900', color: '#ea580c', marginBottom: '4px' }}>
                    +€{fee}<span style={{ fontSize: '16px', color: '#9ca3af', fontWeight: 'normal' }}>/night</span>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <a href={cta_url} style={{
                        display: 'inline-block',
                        backgroundColor: '#ea580c',
                        color: '#ffffff',
                        padding: '16px 32px',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}>
                        {cta_text.toUpperCase()} &rarr;
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-orange-600/10 border border-orange-500/20 rounded-3xl p-8 relative overflow-hidden text-center group hover:bg-orange-600/20 transition-all">
            <div className="relative z-10 space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-orange-500">The Exclusive Deal</p>
                <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-black text-white italic">+€{fee}</span>
                    <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">per night</span>
                </div>
                <div className="pt-6">
                    <a
                        href={cta_url}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-sm tracking-widest rounded-2xl transition-all shadow-lg shadow-orange-600/20 group-hover:scale-105"
                    >
                        {cta_text}
                        <ChevronRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
};
