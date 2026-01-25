'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type LogType = 'info' | 'success' | 'error';

export interface LogEntry {
    msg: string;
    type: LogType;
    time: string;
    link?: string;
}

interface LogContextType {
    logs: LogEntry[];
    addLog: (msg: string, type?: LogType, link?: string) => void;
    clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: ReactNode }) {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = useCallback((msg: string, type: LogType = 'info', link?: string) => {
        setLogs(prev => [
            {
                msg,
                type,
                time: new Date().toLocaleTimeString(),
                link
            },
            ...prev
        ].slice(0, 20)); // Keep more logs since it's global now
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    return (
        <LogContext.Provider value={{ logs, addLog, clearLogs }}>
            {children}
        </LogContext.Provider>
    );
}

export function useLogs() {
    const context = useContext(LogContext);
    if (context === undefined) {
        throw new Error('useLogs must be used within a LogProvider');
    }
    return context;
}
