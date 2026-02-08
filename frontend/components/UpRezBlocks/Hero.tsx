import React from 'react';
import { BaseBlockProps } from './types';

interface HeroProps extends BaseBlockProps {
    headline: string;
    subheadline?: string;
    image?: string;
}

export const Hero = ({ headline, subheadline, image, mode }: HeroProps) => {
    const isEmail = mode === 'email';

    // Email-safe styling
    const containerStyle: React.CSSProperties = isEmail ? {
        backgroundColor: '#000000',
        color: '#ffffff',
        padding: '40px',
        borderRadius: '16px',
        marginBottom: '24px',
        textAlign: 'center'
    } : {};

    const imageStyle: React.CSSProperties = isEmail ? {
        width: '100%',
        height: 'auto',
        borderRadius: '8px',
        marginBottom: '20px'
    } : {};

    if (isEmail) {
        return (
            <div style={containerStyle}>
                {image && <img src={image} alt="Hero" style={imageStyle} />}
                <h1 style={{ fontSize: '28px', margin: '0 0 16px 0', lineHeight: '1.2' }}>{headline}</h1>
                <p style={{ fontSize: '16px', margin: '0', opacity: 0.8 }}>{subheadline}</p>
            </div>
        );
    }

    // Rich Landing Page Render (Tailwind + Interactivity)
    return (
        <div className="relative group overflow-hidden rounded-[2.5rem] bg-black text-white p-12 md:p-20 text-center">
            {image && (
                <div className="absolute inset-0">
                    <img src={image} alt="Hero" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2s]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
            )}
            <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none text-white">
                    {headline}
                </h1>
                {subheadline && (
                    <p className="text-xl md:text-2xl text-gray-200 font-medium italic leading-relaxed">
                        {subheadline}
                    </p>
                )}
            </div>
        </div>
    );
};
