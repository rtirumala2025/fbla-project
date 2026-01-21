import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Coins, Bot, Gamepad2, ShoppingBag, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Sparkles size={24} />
                                </div>
                                <h2 className="text-2xl font-bold">How to Play</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto">
                            <div className="space-y-8">
                                {/* Core Needs */}
                                <section className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                                        <Heart size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Care for Your Pet</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            Your pet has needs like <span className="font-semibold text-pink-600">Hunger</span>,
                                            <span className="font-semibold text-indigo-600">Energy</span>, and
                                            <span className="font-semibold text-blue-600">Cleanliness</span>.
                                            Feed them tasty meals, let them rest, and keep them clean to earn Happy Points!
                                        </p>
                                    </div>
                                </section>

                                {/* Economy */}
                                <section className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                                        <Coins size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Earn & Shop</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            Play <span className="font-semibold text-amber-600">Mini-games</span> like Fetch or Puzzle
                                            to earn coins. Use your hard-earned cash at the <span className="font-semibold text-emerald-600">Shop</span>
                                            to buy premium food, toys, and cool accessories for your pet.
                                        </p>
                                    </div>
                                </section>

                                {/* AI Assistant */}
                                <section className="flex gap-4">
                                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Bot size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Your Intelligent Guide</h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            Need help? Chat with <span className="font-semibold text-indigo-600">Scout</span>, your AI assistant.
                                            Scout can give you advice, answer questions about the game, and even
                                            <span className="font-semibold italic"> navigate you to different rooms</span> if you ask!
                                        </p>
                                        <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-700 font-medium">
                                            Try saying: "Take me to the shop" or "Let's play a game!"
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-10 flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/pet-game');
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Got it, let's play!
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default HowToPlayModal;
