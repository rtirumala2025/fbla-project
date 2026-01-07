import React, { useRef, useEffect } from 'react';
import { useAIAssistant } from '../../contexts/AIAssistantContext';
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const AIAssistantWidget: React.FC = () => {
    const { isOpen, toggleOpen, messages, sendMessage, isLoading, currentContext } = useAIAssistant();
    const [inputValue, setInputValue] = React.useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const message = inputValue;
        setInputValue('');
        await sendMessage(message);
    };

    const getWelcomeMessage = (page: string) => {
        switch (page) {
            case 'pet-game':
                return "Hi! I'm your pet care assistant. Ask me anything about caring for your pet, managing your budget, or understanding the game!";
            case 'budget':
                return "Need help understanding your expenses? Ask me about budgeting tips or how to track your spending!";
            case 'shop':
                return "Looking to buy something? I can help you decide what your pet needs most!";
            case 'settings':
                return "Need help with settings? I'm here to guide you!";
            default:
                return "Welcome! I can help you understand your pet's status and how to play.";
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: '50%', y: '50%', top: '100%', left: '100%' }}
                        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%', top: '50%', left: '50%' }}
                        exit={{ opacity: 0, scale: 0.9, x: '50%', y: '50%', top: '100%', left: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed z-[60] w-[95vw] md:w-[85vw] max-w-[1400px] h-[85vh] max-h-[900px] bg-slate-900/60 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden text-white"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-600/80 flex items-center justify-center shadow-lg border border-white/20">
                                    <Bot size={22} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-2xl text-white tracking-wide">AI Assistant</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <p className="text-base text-indigo-200 font-medium">Llama 4 Scout Online</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={toggleOpen}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-white/60">
                                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                                        <Sparkles className="text-indigo-400" size={40} />
                                    </div>
                                    <p className="text-3xl font-light max-w-2xl leading-relaxed text-indigo-100/90 tracking-wide">
                                        {getWelcomeMessage(currentContext.currentPage)}
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div
                                    key={msg.timestamp + idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-xl leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-900/20'
                                            : 'bg-white/10 backdrop-blur-md border border-white/5 text-white/90 rounded-bl-none'
                                            }`}
                                    >
                                        <div className="prose prose-invert prose-lg max-w-none 
                                            prose-p:leading-relaxed prose-p:mb-4 last:prose-p:mb-0
                                            prose-headings:font-bold prose-headings:text-indigo-200 prose-headings:mb-3 prose-headings:mt-6 first:prose-headings:mt-0
                                            prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                                            prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                                            prose-li:mb-2 prose-li:text-white/90
                                            prose-strong:text-white prose-strong:font-semibold
                                            prose-a:text-indigo-300 prose-a:underline hover:prose-a:text-indigo-200
                                            prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-black/30 prose-code:text-indigo-200 prose-code:font-mono prose-code:text-base
                                            prose-pre:p-4 prose-pre:rounded-xl prose-pre:bg-black/40 prose-pre:backdrop-blur-sm prose-pre:border prose-pre:border-white/10 prose-pre:my-4">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="text-white/90" {...props} />,
                                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-3 text-white" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-2 text-white" {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 text-white" {...props} />,
                                                    code: ({ node, inline, ...props }: any) => (
                                                        inline
                                                            ? <code className="px-1.5 py-0.5 rounded bg-black/20 text-indigo-200 font-mono text-base" {...props} />
                                                            : <code className="block p-4 rounded-xl bg-black/30 text-indigo-100 font-mono text-sm overflow-x-auto border border-white/10 my-3" {...props} />
                                                    ),
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/5 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm shrink-0">
                            <div className="relative flex items-center group">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Ask for help..."
                                    className="w-full h-[80px] pl-8 pr-20 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-400/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-400/50 transition-all text-white placeholder:text-white/30 outline-none text-2xl"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="absolute right-3 p-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOpen}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${isOpen
                    ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/25'
                    }`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </motion.button>
        </div >
    );
};

export default AIAssistantWidget;
