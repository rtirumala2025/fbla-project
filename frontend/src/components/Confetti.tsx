/**
 * Confetti.tsx
 * 
 * Simple confetti explosion component for badge unlocks.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
    show: boolean;
}

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function Confetti({ show }: ConfettiProps) {
    const [particles, setParticles] = useState<Array<{
        id: number;
        x: number;
        color: string;
        delay: number;
        size: number;
    }>>([]);

    useEffect(() => {
        if (show) {
            const newParticles = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: randomBetween(10, 90),
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                delay: randomBetween(0, 0.3),
                size: randomBetween(8, 16),
            }));
            setParticles(newParticles);
        } else {
            setParticles([]);
        }
    }, [show]);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{
                                y: -20,
                                x: `${p.x}vw`,
                                opacity: 1,
                                rotate: 0,
                                scale: 1
                            }}
                            animate={{
                                y: '110vh',
                                opacity: [1, 1, 0],
                                rotate: randomBetween(-360, 360),
                                scale: [1, 1.2, 0.8]
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: randomBetween(2, 3.5),
                                delay: p.delay,
                                ease: 'easeOut'
                            }}
                            style={{
                                position: 'absolute',
                                width: p.size,
                                height: p.size,
                                backgroundColor: p.color,
                                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}

export default Confetti;
