import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { PetGame2Action } from '../core/SceneManager';

interface SuccessIndicator {
    id: string;
    action: PetGame2Action | string; // Allow string for inventory items
    message: string;
}

export const SuccessToast: React.FC<{
    indicator: SuccessIndicator;
    onComplete: () => void;
}> = ({ indicator, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const getStyle = (action: string) => {
        if (action === 'feed') return { bg: 'linear-gradient(135deg, #F59E0B, #EA580C)', emoji: '🍖' };
        if (action === 'play') return { bg: 'linear-gradient(135deg, #10B981, #059669)', emoji: '🎉' };
        if (action === 'bathe') return { bg: 'linear-gradient(135deg, #06B6D4, #0284C7)', emoji: '✨' };
        if (action === 'rest') return { bg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', emoji: '💤' };
        return { bg: 'linear-gradient(135deg, #6366F1, #4F46E5)', emoji: '✨' };
    };

    const style = getStyle(indicator.action);

    return (
        <motion.div
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-white font-bold text-base shadow-xl pointer-events-none"
            style={{
                background: style.bg,
                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            }}
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', damping: 18, stiffness: 250 }}
        >
            <div className="flex items-center gap-2">
                <span>{style.emoji}</span>
                <span>{indicator.message}</span>
            </div>
        </motion.div>
    );
};
