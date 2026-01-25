import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LogProvider } from "@/context/LogContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 font-sans">
                <ThemeProvider>
                    <LogProvider>
                        {children}
                    </LogProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
