import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, Sparkles, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { sendMessage, type ChatMessage, type ChatHistory } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

// Map of function names to human-readable labels
const FUNCTION_LABELS: Record<string, string> = {
    get_unpaid_members: 'Data anggota belum bayar diambil',
    get_payment_summary: 'Ringkasan kas diambil',
    analyze_payment_pattern: 'Analisis pola pembayaran selesai',
    get_late_members: 'Data anggota telat diambil',
    send_reminder: 'Reminder berhasil terkirim',
    create_bill: 'Tagihan baru berhasil dibuat',
    close_bill: 'Tagihan berhasil ditutup',
};

type ExtendedMessage = ChatMessage & {
    functionCalled?: string;
    isError?: boolean;
};

export default function KasBotChat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ExtendedMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('KasBot sedang berpikir...');
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleClearChat = () => {
        setMessages([]);
        setChatHistory([]);
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim() || !user || isLoading) return;

        const userMessage: ExtendedMessage = {
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setLoadingStatus('KasBot sedang berpikir...');

        const newHistory: ChatHistory[] = [
            ...chatHistory,
            { role: 'user', parts: [{ text }] }
        ];
        setChatHistory(newHistory);

        try {
            const responseText = await sendMessage(
                text,
                newHistory,
                user.id,
                (fnName: string) => {
                    const label = FUNCTION_LABELS[fnName];
                    setLoadingStatus(label ? `Mengambil data: ${label}...` : 'Memproses...');
                }
            );

            const aiMessage: ExtendedMessage = {
                role: 'model',
                content: responseText,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);
            setChatHistory(prev => [
                ...prev,
                { role: 'model', parts: [{ text: responseText }] },
            ]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'model',
                    content:
                        'Maaf, saya mengalami gangguan saat ini. Coba lagi ya! 🙏',
                    timestamp: new Date(),
                    isError: true,
                },
            ]);
        } finally {
            setIsLoading(false);
            setLoadingStatus('KasBot sedang berpikir...');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ---------- WELCOME STATE ----------
    const suggestedQuestions = [
        '💰 Siapa yang belum bayar bulan ini?',
        '📊 Berapa total kas yang terkumpul?',
        '📈 Analisis pola pembayaran',
        '📧 Kirim reminder ke yang belum bayar',
    ];

    const WelcomeState = () => (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4 py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <Bot className="w-10 h-10 text-green-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Halo! Saya KasBot 👋</h2>
                <p className="text-gray-500 mt-2">Asisten AI untuk membantu kamu kelola kas</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedQuestions.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(q)}
                        className="p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-green-500 hover:bg-green-50 transition-all text-sm text-gray-700 shadow-sm active:scale-95"
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );

    // ---------- BUBBLE COMPONENT ----------
    const MessageBubble = ({ msg, index }: { msg: ExtendedMessage; index: number }) => {
        const isUser = msg.role === 'user';

        return (
            <div
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-${isUser ? 'right' : 'left'}-4 duration-300`}
                style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
            >
                <div className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
                    {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center mt-1 shadow-sm">
                            <Bot className="w-4 h-4 text-green-600" />
                        </div>
                    )}

                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}>
                        {/* Function called chip */}
                        {msg.functionCalled && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full text-[11px] text-green-700 font-medium">
                                <CheckCircle className="w-3 h-3" />
                                {FUNCTION_LABELS[msg.functionCalled] || msg.functionCalled}
                            </div>
                        )}

                        {/* Error chip */}
                        {msg.isError && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full text-[11px] text-red-700 font-medium">
                                <XCircle className="w-3 h-3" />
                                Terjadi gangguan
                            </div>
                        )}

                        {/* Bubble */}
                        <div
                            className={`px-4 py-3 rounded-2xl transition-all ${isUser
                                ? 'bg-green-600 text-white rounded-tr-sm'
                                : msg.isError
                                    ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                                }`}
                        >
                            {!isUser ? (
                                <div className="prose prose-sm prose-green max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-pre:rounded-lg prose-code:before:content-none prose-code:after:content-none prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-headings:text-gray-800">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                            )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[11px] text-gray-400 px-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // ---------- LOADING INDICATOR ----------
    const LoadingBubble = () => (
        <div className="flex justify-start animate-in fade-in-0 slide-in-from-left-4 duration-300">
            <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center mt-1 shadow-sm">
                    <Bot className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex flex-col items-start gap-1">
                    <div className="px-5 py-4 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm">
                        <div className="flex gap-1.5 items-center h-4">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                    <span className="text-[11px] text-gray-500 ml-1 font-medium italic animate-pulse">
                        {loadingStatus}
                    </span>
                </div>
            </div>
        </div>
    );

    // ---------- RENDER ----------
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] bg-white md:rounded-xl shadow-sm md:border border-gray-200 overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b bg-white z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-gray-900">KasBot — AI Assistant</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase tracking-wider">
                                AI
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">Powered by Gemini • Data real-time</p>
                    </div>
                </div>

                {messages.length > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearChat}
                        title="Hapus Percakapan"
                        className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                {messages.length === 0 ? (
                    <WelcomeState />
                ) : (
                    <div className="space-y-5 max-w-3xl mx-auto pb-4">
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} index={i} />
                        ))}
                        {isLoading && <LoadingBubble />}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Loading ref when in welcome state */}
                {messages.length === 0 && isLoading && (
                    <div className="max-w-3xl mx-auto pb-4">
                        <LoadingBubble />
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* INPUT AREA */}
            <div className="p-3 md:p-4 bg-white border-t shrink-0">
                <div className="max-w-3xl mx-auto flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tanya sesuatu tentang kas kamu..."
                            disabled={isLoading}
                            className="py-6 pr-14 rounded-xl border-gray-300 focus-visible:ring-green-500 bg-gray-50 disabled:opacity-60"
                            maxLength={500}
                        />
                        <span
                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none transition-colors ${input.length >= 450 ? 'text-orange-400' : 'text-gray-400'
                                }`}
                        >
                            {input.length}/500
                        </span>
                    </div>
                    <Button
                        size="icon"
                        className="h-12 w-12 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 shrink-0 transition-all"
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
                <p className="text-center text-[10px] text-gray-400 mt-2">
                    Enter untuk kirim • Shift+Enter baris baru • AI dapat membuat kesalahan
                </p>
            </div>
        </div>
    );
}
