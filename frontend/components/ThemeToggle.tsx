'use client';

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "p-2 rounded-xl transition-all duration-300",
                "bg-slate-100 dark:bg-white/5",
                "text-slate-600 dark:text-gray-400",
                "hover:bg-slate-200 dark:hover:bg-white/10",
                "border border-slate-200 dark:border-white/10",
                className
            )}
            data-tooltip={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 transition-transform hover:rotate-45" />
            ) : (
                <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
            )}
        </button>
    );
}
