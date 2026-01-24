'use client';
import "./globals.css";
import Image from "next/image";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="antialiased min-h-screen bg-slate-950 text-white">
                {children}
            </body>
        </html>
    );
}
