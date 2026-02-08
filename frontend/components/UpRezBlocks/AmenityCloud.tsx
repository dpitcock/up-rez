import React from 'react';
import { BaseBlockProps } from './types';
import { CheckCircle2 } from 'lucide-react';

interface AmenityCloudProps extends BaseBlockProps {
    items: string[];
}

export const AmenityCloud = ({ items = [], mode }: AmenityCloudProps) => {
    const isEmail = mode === 'email';

    if (isEmail) {
        return (
            <div style={{ padding: '0 20px' }}>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                    {items.slice(0, 5).map((item, i) => (
                        <li key={i} style={{ marginBottom: '12px', fontSize: '15px', color: '#374151', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#ea580c', marginRight: '8px', fontSize: '18px' }}>✓</span> {item}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-3 justify-center">
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                    {item}
                </div>
            ))}
        </div>
    );
};
