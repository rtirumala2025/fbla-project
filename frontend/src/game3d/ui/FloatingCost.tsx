import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FloatingCostProps {
    id: string;
    text: string;
    x: number;
    y: number;
}

export const FloatingCost: React.FC<{ cost: FloatingCostProps | null }> = ({ cost }) => {
    return (
        <AnimatePresence>
            {cost && (
                <motion.div
                    key={cost.id}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 0.95, y: -25 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                        position: 'fixed',
                        left: cost.x,
                        top: cost.y,
                        transform: 'translate(-50%, -50%)',
                        fontWeight: 700,
                        fontSize: '20px',
                        pointerEvents: 'none',
                        zIndex: 60,
                        color: 'rgba(255,255,255,0.95)',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    }}
                >
                    {cost.text}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
