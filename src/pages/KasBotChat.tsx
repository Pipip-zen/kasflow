import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, Sparkles, Trash2, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { sendMessage, type ChatMessage, type ChatHistory } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';

export default function KasBotChat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
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
        if (!text.trim() || !user) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setLoadingStatus('KasBot sedang berpikir...');

        const newHistory = [...chatHistory, { role: 'user' as const, parts: [{ text }] }];
        setChatHistory(newHistory);

        try {
            const responseText = await sendMessage(text, newHistory, user.id);

            const aiMessage: ChatMessage = {
                role: 'model',
                content: responseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            setChatHistory(prev => [...prev, { role: 'model' as const, parts: [{ text: responseText }] }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: 'model',
                content: "Maaf, terjadi kesalahan saat memproses permintaan Anda.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestedQuestions = [
        "💰 Siapa yang belum bayar bulan ini?",
        "📊 Berapa total kas yang terkumpul?",
        "📈 Analisis pola pembayaran",
        "📧 Kirim reminder ke yang belum bayar"
    ];

    const WelcomeState = () => (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <Bot className="w-10 h-10 text-green-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Halo! Saya KasBot 👋</h2>
                <p className="text-gray-500 mt-2">Asisten AI untuk membantu kamu kelola kas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                {suggestedQuestions.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(q)}
                        className="p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-green-500 hover:bg-green-50 transition-all text-sm text-gray-700 shadow-sm"
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b bg-white z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-gray-900">KasBot — AI Assistant</h1>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase tracking-wider">AI</span>
                        </div>
                        <p className="text-xs text-gray-500">Powered by Gemini</p>
                    </div>
                </div>

                {messages.length > 0 && (
                    <Button variant="ghost" size="icon" onClick={handleClearChat} title="Hapus Percakapan" className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                {messages.length === 0 ? (
                    <WelcomeState />
                ) : (
                    <div className="space-y-6 max-w-3xl mx-auto pb-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                                    {msg.role === 'model' && (
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center mt-1">
                                            <Bot className="w-4 h-4 text-green-600" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`px-4 py-3 rounded-2xl ${msg.role === 'user'
                                                ? 'bg-green-600 text-white rounded-tr-sm'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                                                }`}
                                        >
                                            {msg.role === 'model' ? (
                                                <div className="prose prose-sm prose-green max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-gray-400 mt-1 px-1">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center mt-1">
                                        <Bot className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <div className="px-5 py-4 bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm">
                                            <div className="flex gap-1.5 items-center h-4">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-gray-500 mt-1.5 ml-1 font-medium italic">
                                            {loadingStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* INPUT AREA */}
            <div className="p-4 bg-white border-t">
                <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tanya sesuatu tentang kas kamu..."
                        disabled={isLoading}
                        className="pr-12 py-6 rounded-xl border-gray-300 focus-visible:ring-green-500 bg-gray-50"
                        maxLength={500}
                    />
                    <div className="absolute right-14 text-[10px] text-gray-400 pointer-events-none">
                        {input.length}/500
                    </div>
                    <Button
                        size="icon"
                        className="h-12 w-12 rounded-xl bg-green-600 hover:bg-green-700 mx-1 shrink-0"
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-gray-400">Tekan Enter untuk mengirim. AI dapat membuat kesalahan, periksa saran kritikal.</span>
                </div>
            </div>
        </div>
    );
}
