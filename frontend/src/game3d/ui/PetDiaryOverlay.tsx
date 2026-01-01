import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import dayjs from 'dayjs';

export interface PetDiaryEntry {
    id: string;
    entry_text: string;
    mood?: string;
    created_at: string;
    note?: string;
}

const MOOD_EXPRESSIONS: Record<string, { emoji: string; color: string }> = {
    happy: { emoji: '😊', color: '#FFD700' },
    excited: { emoji: '🤩', color: '#FF69B4' },
    content: { emoji: '😌', color: '#98FB98' },
    playful: { emoji: '😄', color: '#FFA500' },
    sleepy: { emoji: '😴', color: '#DDA0DD' },
    tired: { emoji: '😪', color: '#B8B8B8' },
    hungry: { emoji: '🤤', color: '#FFB347' },
    sad: { emoji: '😢', color: '#87CEEB' },
    sick: { emoji: '🤒', color: '#90EE90' },
    angry: { emoji: '😠', color: '#FF6B6B' },
    anxious: { emoji: '😰', color: '#E0E0E0' },
    bored: { emoji: '😑', color: '#C0C0C0' },
    default: { emoji: '🐾', color: '#FFD700' },
};

export const PetDiaryOverlay: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    diary: PetDiaryEntry[];
    loading?: boolean;
}> = ({ isOpen, onClose, diary, loading }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-hidden shadow-2xl"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <span className="text-2xl">📔</span>
                                    Pet Diary
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {loading ? (
                                    <div className="text-center py-10 text-white/50">Loading memories...</div>
                                ) : diary.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="text-6xl mb-4 block opacity-50">
                                            📝
                                        </span>
                                        <p className="text-white/70 font-medium mb-1 text-lg">No memories yet!</p>
                                        <p className="text-white/40">Care for your pet to write new entries~</p>
                                    </div>
                                ) : (
                                    diary.map((entry) => (
                                        <motion.div
                                            key={entry.id}
                                            className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-2xl" title={entry.mood}>
                                                    {MOOD_EXPRESSIONS[entry.mood || 'default']?.emoji || '🐾'}
                                                </span>
                                                <span className="text-xs text-white/50 font-medium bg-black/20 px-2 py-1 rounded-full">
                                                    {dayjs(entry.created_at).format('MMM D, h:mm A')}
                                                </span>
                                            </div>
                                            <p className="text-white/80 text-sm leading-relaxed font-sans">
                                                {entry.note || entry.entry_text || 'No note recorded.'}
                                            </p>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
