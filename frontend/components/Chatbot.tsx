'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { queryBot } from '@/lib/api';

interface Message {
    role: 'bot' | 'user';
    content: string;
    timestamp: Date;
}

interface ChatbotProps {
    offerId: string;
    propId: string;
    propName: string;
    guestName?: string;
}

export default function Chatbot({ offerId, propId, propName, guestName }: ChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'bot',
            content: `Hi ${guestName || 'there'}! I'm your concierge. Specialized in ${propName}. How can I help you compare this upgrade to your original choice?`,
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');

        const newMessage: Message = {
            role: 'user',
            content: userMsg,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
        setIsLoading(true);

        try {
            const response = await queryBot(offerId, propId, userMsg);

            const botMsg: Message = {
                role: 'bot',
                content: response.answer || "I'm sorry, I couldn't process that request.",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chatbot error:', error);
            const errorMsg: Message = {
                role: 'bot',
                content: "I'm having a bit of trouble connecting to my knowledge base. Please try again in a moment.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-2xl transition-all hover:scale-110 active:scale-95"
                >
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-black text-orange-600 shadow-sm ring-1 ring-orange-500/20">
                        1
                    </div>
                    <MessageCircle className="h-6 w-6 transition-transform group-hover:rotate-12" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="flex h-[500px] w-[350px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0A0A] shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600/20 text-orange-500">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Concierge AI</h3>
                                <p className="text-[10px] font-bold text-orange-500/80 uppercase tracking-tighter italic">Expert on {propName}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-orange-600 text-white rounded-tr-none'
                                            : 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none'
                                        }`}
                                >
                                    <div className="flex items-center gap-1.5 mb-1 opacity-50 uppercase text-[9px] font-black tracking-widest">
                                        {msg.role === 'bot' ? (
                                            <>
                                                <Sparkles className="h-2 w-2" />
                                                UpRez AI
                                            </>
                                        ) : (
                                            <>
                                                <User className="h-2 w-2" />
                                                You
                                            </>
                                        )}
                                    </div>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="rounded-2xl rounded-tl-none bg-white/5 border border-white/5 px-4 py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={handleSubmit}
                        className="border-t border-white/5 p-4 bg-white/[0.02]"
                    >
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about amenities, views, or value..."
                                className="w-full rounded-2xl border border-white/10 bg-[#111111] py-3 pl-4 pr-12 text-sm text-white placeholder-gray-600 focus:border-orange-500/50 focus:outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-orange-600 p-2 text-white transition-all hover:bg-orange-500 active:scale-95 disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
