/**
 * AgilityGameWindow.tsx
 * 
 * Floating window for the Agility Center building.
 * Features: Embedded mini-game, score tracking, coin rewards
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Target, Timer, Coins, RefreshCw, X, Star, HelpCircle } from 'lucide-react';
import { BuildingInteractionWindow } from './BuildingInteractionWindow';
import { usePet } from '@/context/PetContext';
import { minigameService } from '@/services/minigameService';
import type { GameStartResponse } from '@/types/game';
import './building-windows.css';

interface AgilityGameWindowProps {
    isOpen: boolean;
    onClose: () => void;
    onGameComplete?: (score: number, coinsEarned: number) => void;
}

// Game targets that move across the screen
interface GameTarget {
    id: string;
    x: number;
    y: number;
    speed: number;
    direction: number;
    size: number;
    points: number;
    icon: string;
}

const TARGET_ICONS = ['🎾', '🦴', '🥏', '⭐'];
const GAME_DURATION = 30; // seconds

export function AgilityGameWindow({
    isOpen,
    onClose,
    onGameComplete
}: AgilityGameWindowProps) {
    const { pet, updateHighScore, getHighScore, increaseStat } = usePet();
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'complete'>('menu');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [targets, setTargets] = useState<GameTarget[]>([]);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isLoadingHighScore, setIsLoadingHighScore] = useState(false);
    const [gameSession, setGameSession] = useState<GameStartResponse | null>(null);
    const [isStartingGame, setIsStartingGame] = useState(false);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();
    const lastSpawnRef = useRef(0);
    const [demoFeedback, setDemoFeedback] = useState<{ message: string, emoji: string } | null>(null);


    // Load high score from Supabase
    useEffect(() => {
        if (isOpen && pet) {
            setIsLoadingHighScore(true);
            getHighScore('agility').then(score => {
                setHighScore(score);
                setIsLoadingHighScore(false);
            });
        }
    }, [isOpen, pet, getHighScore]);

    // Reset game when window closes
    useEffect(() => {
        if (!isOpen) {
            setGameState('menu');
            resetGameState();
        }
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isOpen]);

    // Game timer
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (gameState === 'playing' && timeLeft <= 0) {
            endGame();
        }
    }, [gameState, timeLeft]);

    // Game loop for moving targets
    useEffect(() => {
        if (gameState !== 'playing') return;

        const gameLoop = (timestamp: number) => {
            // Spawn new targets - slower spawn rate to avoid clustering
            if (timestamp - lastSpawnRef.current > 1500) {
                spawnTarget();
                lastSpawnRef.current = timestamp;
            }

            // Move existing targets
            setTargets(prev => {
                return prev
                    .map(target => ({
                        ...target,
                        x: target.x + target.speed * target.direction,
                        y: target.y + Math.sin(timestamp / 300 + target.id.charCodeAt(0)) * 0.5
                    }))
                    .filter(target => target.x > -10 && target.x < 110); // Remove off-screen targets
            });

            animationFrameRef.current = requestAnimationFrame(gameLoop);
        };

        animationFrameRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [gameState]);

    const resetGameState = () => {
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setTargets([]);
        setCombo(0);
        setMaxCombo(0);
        setHits(0);
        setMisses(0);
    };

    const startGame = useCallback(async () => {
        setIsStartingGame(true);
        resetGameState();

        try {
            // Start a game session via backend API
            const session = await minigameService.startRound({
                gameType: 'fetch', // 'agility' maps to 'fetch' game type
                preferredDifficulty: 'normal',
                practiceMode: false,
            });
            setGameSession(session);
            console.log('Game session started:', session.session_id);
        } catch (error) {
            console.warn('Failed to start game session, proceeding locally:', error);
            // Continue without session - will create one on submit
            setGameSession(null);
        }

        setGameState('playing');
        lastSpawnRef.current = 0;
        setIsStartingGame(false);
    }, []);


    const spawnTarget = useCallback(() => {
        // Limit max targets on screen to prevent overcrowding
        setTargets(prev => {
            if (prev.length >= 5) return prev;

            const isFromLeft = Math.random() > 0.5;
            const isBonusTarget = Math.random() > 0.85;

            // Find a Y position that's not too close to existing targets
            let y = 10 + Math.random() * 60;
            const minDistance = 25; // Minimum 25% vertical distance between targets

            for (let i = 0; i < 10; i++) {
                const tooClose = prev.some(t => Math.abs(t.y - y) < minDistance);
                if (!tooClose) break;
                y = 10 + Math.random() * 60;
            }

            const newTarget: GameTarget = {
                id: `target-${Date.now()}-${Math.random()}`,
                x: isFromLeft ? -5 : 105,
                y,
                speed: 0.08 + Math.random() * 0.07, // Comfortable speed: 0.08-0.15
                direction: isFromLeft ? 1 : -1,
                size: isBonusTarget ? 180 : 100 + Math.random() * 50, // Very big: 100-150px, bonus 180px
                points: isBonusTarget ? 50 : 10,
                icon: isBonusTarget ? '⭐' : TARGET_ICONS[Math.floor(Math.random() * TARGET_ICONS.length)]
            };

            return [...prev, newTarget];
        });
    }, []);

    const handleTargetClick = useCallback((targetId: string, points: number) => {
        setTargets(prev => prev.filter(t => t.id !== targetId));

        const comboMultiplier = 1 + Math.min(combo, 10) * 0.1;
        const earnedPoints = Math.floor(points * comboMultiplier);

        setScore(prev => prev + earnedPoints);
        setCombo(prev => {
            const newCombo = prev + 1;
            setMaxCombo(max => Math.max(max, newCombo));
            return newCombo;
        });
        setHits(prev => prev + 1);
    }, [combo]);

    const handleMiss = useCallback(() => {
        setCombo(0);
        setMisses(prev => prev + 1);
    }, []);

    const endGame = useCallback(async () => {
        setGameState('complete');

        // Check high score
        if (score > highScore) {
            setHighScore(score);
            await updateHighScore('agility', score);
        } else {
            // Still track it for total games played etc
            await updateHighScore('agility', score);
        }

        // Boost pet happiness on game completion (Agility training is fun!)
        if (score > 0) {
            await increaseStat('happiness', Math.min(10, Math.floor(score / 50)));
        }

        // Calculate coins earned (1 coin per 50 points as fallback)
        let coinsEarned = Math.floor(score / 50);

        // Submit score to backend using minigameService (with session_id if available)
        try {
            const result = await minigameService.submitResult({
                session_id: gameSession?.session_id,
                score: score,
                durationSeconds: GAME_DURATION - timeLeft,
                difficulty: (gameSession?.difficulty as 'easy' | 'normal' | 'hard') || 'normal',
                gameType: 'fetch', // 'agility' maps to 'fetch' game type
                metadata: {
                    hits,
                    misses,
                    maxCombo,
                },
            });

            coinsEarned = result.reward?.coins || coinsEarned;
            console.log('Game score submitted:', result.message);
        } catch (error) {
            console.warn('Failed to submit game score to backend:', error);
            // Continue with local calculation
        }

        // Clear session after submission
        setGameSession(null);
        onGameComplete?.(score, coinsEarned);
    }, [score, highScore, onGameComplete, gameSession, timeLeft, hits, misses, maxCombo, updateHighScore, increaseStat]);


    const coinsEarned = Math.floor(score / 50);

    return (
        <BuildingInteractionWindow
            isOpen={isOpen}
            onClose={onClose}
            title="Agility Center"
            icon={<Target />}
            width={600}
            minHeight={500}
        >
            <AnimatePresence mode="wait">
                {gameState === 'menu' && (
                    <motion.div
                        key="menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: 'calc(100vh - 140px)',
                            gap: 24,
                            padding: '0 20px'
                        }}
                    >
                        {/* Header */}
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ margin: '0 0 8px', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                🎯 Agility Training
                            </h2>
                            <p style={{ color: '#94a3b8', margin: 0 }}>
                                Train your reflexes and earn coins!
                            </p>
                        </div>

                        {/* Main Content - Two Column Layout */}
                        <div style={{
                            display: 'flex',
                            flex: 1,
                            gap: 24,
                            minHeight: 0
                        }}>
                            {/* Left Column - AI Tutorial Chat */}
                            <div style={{
                                flex: 1,
                                background: 'rgba(30, 30, 40, 0.8)',
                                borderRadius: 16,
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}>
                                {/* AI Chat Header */}
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'rgba(99, 102, 241, 0.2)',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10
                                }}>
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        🤖
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Pet Assistant</div>
                                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>● Online</div>
                                    </div>
                                </div>

                                {/* AI Chat Messages */}
                                <div style={{
                                    flex: 1,
                                    padding: 16,
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12
                                }}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        style={{
                                            background: 'rgba(99, 102, 241, 0.15)',
                                            borderRadius: 12,
                                            padding: 14,
                                            maxWidth: '90%'
                                        }}
                                    >
                                        <p style={{ margin: '0 0 10px', fontWeight: 600 }}>👋 Welcome to Agility Training!</p>
                                        <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.5 }}>
                                            This game tests your reflexes! Here's how to play:
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        style={{
                                            background: 'rgba(99, 102, 241, 0.15)',
                                            borderRadius: 12,
                                            padding: 14,
                                            maxWidth: '90%'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '1.2rem' }}>1️⃣</span>
                                                <span><strong>Click targets</strong> as they fly across the screen</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '1.2rem' }}>2️⃣</span>
                                                <span><strong>Build combos</strong> by hitting targets in a row</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '1.2rem' }}>3️⃣</span>
                                                <span><strong>Watch for ⭐</strong> bonus targets = 50 points!</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '1.2rem' }}>4️⃣</span>
                                                <span><strong>30 seconds</strong> to score as high as you can!</span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                        style={{
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            borderRadius: 12,
                                            padding: 14,
                                            maxWidth: '90%'
                                        }}
                                    >
                                        <p style={{ margin: 0, color: '#a7f3d0' }}>
                                            💰 <strong>Earn 1 coin per 50 points!</strong> Your high score: <span style={{ color: '#fbbf24' }}>{highScore}</span>
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Chat Input */}
                                <div style={{
                                    padding: 12,
                                    borderTop: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        gap: 8,
                                        marginBottom: 8,
                                        flexWrap: 'wrap'
                                    }}>
                                        <button
                                            onClick={() => alert('Tip: Build combos by hitting targets quickly in a row. Each combo increases your multiplier up to 10x!')}
                                            style={{
                                                background: 'rgba(99, 102, 241, 0.2)',
                                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                                borderRadius: 8,
                                                padding: '6px 10px',
                                                fontSize: '0.75rem',
                                                color: '#a5b4fc',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            💡 Tips
                                        </button>
                                        <button
                                            onClick={() => alert('Bonus ⭐ targets are worth 50 points! They\'re larger and gold-colored. Regular targets are worth 10 points.')}
                                            style={{
                                                background: 'rgba(99, 102, 241, 0.2)',
                                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                                borderRadius: 8,
                                                padding: '6px 10px',
                                                fontSize: '0.75rem',
                                                color: '#a5b4fc',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ⭐ Bonus?
                                        </button>
                                        <button
                                            onClick={() => alert('You earn 1 coin for every 50 points you score. So 200 points = 4 coins!')}
                                            style={{
                                                background: 'rgba(99, 102, 241, 0.2)',
                                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                                borderRadius: 8,
                                                padding: '6px 10px',
                                                fontSize: '0.75rem',
                                                color: '#a5b4fc',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            💰 Rewards?
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type="text"
                                            placeholder="Ask a question..."
                                            style={{
                                                flex: 1,
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 8,
                                                padding: '8px 12px',
                                                color: 'white',
                                                fontSize: '0.9rem'
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    alert('Great question! Check the tips above or just click Start Training to begin. I\'ll be here if you need help!');
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Demo Area */}
                            <div style={{
                                flex: 1,
                                background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.2))',
                                borderRadius: 16,
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {/* Demo Label */}
                                <div style={{
                                    position: 'absolute',
                                    top: 12,
                                    left: 12,
                                    background: 'rgba(0,0,0,0.5)',
                                    padding: '4px 12px',
                                    borderRadius: 20,
                                    fontSize: '0.8rem',
                                    color: '#a5b4fc'
                                }}>
                                    🎬 Demo Preview
                                </div>

                                {/* Demo Targets */}
                                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                    {/* Animated demo targets - big and slow like actual game */}
                                    <motion.button
                                        animate={{
                                            left: ['-20%', '120%']
                                        }}
                                        transition={{
                                            duration: 8,
                                            repeat: Infinity,
                                            ease: 'linear'
                                        }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => {
                                            setDemoFeedback({ message: 'Nice! You got it!', emoji: '🎉' });
                                            setTimeout(() => setDemoFeedback(null), 2000);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '15%',
                                            width: 100,
                                            height: 100,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '2.5rem',
                                            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🎾
                                    </motion.button>
                                    <motion.button
                                        animate={{
                                            left: ['120%', '-20%']
                                        }}
                                        transition={{
                                            duration: 10,
                                            repeat: Infinity,
                                            ease: 'linear',
                                            delay: 0.5
                                        }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => {
                                            setDemoFeedback({ message: 'Bonus target! 50 points!', emoji: '⭐' });
                                            setTimeout(() => setDemoFeedback(null), 2000);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '40%',
                                            width: 130,
                                            height: 130,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '3.5rem',
                                            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ⭐
                                    </motion.button>
                                    <motion.button
                                        animate={{
                                            left: ['-20%', '120%']
                                        }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            ease: 'linear',
                                            delay: 1
                                        }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => {
                                            setDemoFeedback({ message: 'Great reflexes!', emoji: '👍' });
                                            setTimeout(() => setDemoFeedback(null), 2000);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '60%',
                                            width: 90,
                                            height: 90,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '2rem',
                                            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🦴
                                    </motion.button>

                                    {/* Click instruction */}
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            textAlign: 'center',
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        <div style={{ fontSize: '3rem', marginBottom: 8 }}>👆</div>
                                        <div style={{ fontSize: '1rem', color: '#a5b4fc', fontWeight: 600 }}>Click targets!</div>
                                    </motion.div>

                                    {/* Demo feedback toast */}
                                    <AnimatePresence>
                                        {demoFeedback && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 60,
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    background: 'rgba(16, 185, 129, 0.9)',
                                                    borderRadius: 12,
                                                    padding: '12px 24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                                                }}
                                            >
                                                <span style={{ fontSize: '1.5rem' }}>{demoFeedback.emoji}</span>
                                                <span style={{ fontWeight: 600, color: 'white' }}>{demoFeedback.message}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Ground */}
                                <div style={{
                                    height: 40,
                                    background: 'linear-gradient(180deg, #065f46, #047857)'
                                }} />
                            </div>
                        </div>

                        {/* Start Button */}
                        <div style={{ textAlign: 'center', paddingBottom: 20 }}>
                            <motion.button
                                className="building-btn building-btn-primary"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                style={{
                                    padding: '16px 48px',
                                    fontSize: '1.2rem',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none'
                                }}
                            >
                                <Target size={24} style={{ marginRight: 10 }} />
                                Start Training!
                            </motion.button>
                            <p style={{ margin: '12px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                Press ESC to exit at any time
                            </p>
                        </div>
                    </motion.div>
                )}

                {gameState === 'playing' && (
                    <motion.div
                        key="playing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: 'calc(100vh - 140px)',
                            padding: 0
                        }}
                    >
                        {/* Game HUD */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 12
                        }}>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Score</span>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{score}</div>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Combo</span>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        color: combo > 5 ? '#f59e0b' : combo > 0 ? '#10b981' : '#e2e8f0'
                                    }}>
                                        {combo > 0 ? `${combo}x` : '-'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Time</span>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: timeLeft <= 10 ? '#ef4444' : '#e2e8f0'
                                }}>
                                    {timeLeft}s
                                </div>
                            </div>
                        </div>

                        {/* Timer Bar */}
                        <div style={{
                            height: 6,
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: 3,
                            overflow: 'hidden',
                            marginBottom: 12
                        }}>
                            <motion.div
                                style={{
                                    height: '100%',
                                    background: timeLeft <= 10
                                        ? '#ef4444'
                                        : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                    borderRadius: 3
                                }}
                                animate={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Game Area - Full Screen */}
                        <div
                            ref={gameAreaRef}
                            onClick={handleMiss}
                            style={{
                                position: 'relative',
                                flex: 1,
                                background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.2))',
                                borderRadius: 12,
                                overflow: 'hidden',
                                cursor: 'crosshair',
                                margin: '0 -32px -28px -32px'
                            }}
                        >
                            {/* Ground */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 40,
                                background: 'linear-gradient(180deg, #065f46, #047857)'
                            }} />

                            {/* Targets */}
                            {targets.map(target => (
                                <motion.button
                                    key={target.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTargetClick(target.id, target.points);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: `${target.x}%`,
                                        top: `${target.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        width: target.size,
                                        height: target.size,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: target.points > 10
                                            ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                                            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: target.size * 0.5,
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.8 }}
                                >
                                    {target.icon}
                                </motion.button>
                            ))}

                            {/* Combo indicator */}
                            <AnimatePresence>
                                {combo > 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        style={{
                                            position: 'absolute',
                                            top: 10,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                            padding: '4px 12px',
                                            borderRadius: 20,
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                            color: '#000'
                                        }}
                                    >
                                        🔥 {combo}x COMBO!
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {gameState === 'complete' && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', padding: 20 }}
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}
                        >
                            <Trophy size={48} color="#000" />
                        </motion.div>

                        <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem' }}>
                            Training Complete!
                        </h3>

                        {score > highScore && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                style={{
                                    color: '#fbbf24',
                                    fontWeight: 700,
                                    marginBottom: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8
                                }}
                            >
                                <Star /> NEW HIGH SCORE! <Star />
                            </motion.div>
                        )}

                        {/* Stats */}
                        <div className="building-stats" style={{ marginBottom: 20 }}>
                            <div className="building-stat">
                                <div className="building-stat-value">{score}</div>
                                <div className="building-stat-label">Score</div>
                            </div>
                            <div className="building-stat">
                                <div className="building-stat-value">{maxCombo}x</div>
                                <div className="building-stat-label">Max Combo</div>
                            </div>
                            <div className="building-stat">
                                <div className="building-stat-value">{hits}</div>
                                <div className="building-stat-label">Hits</div>
                            </div>
                            <div className="building-stat">
                                <div className="building-stat-value" style={{ color: '#10b981' }}>
                                    +{coinsEarned}
                                </div>
                                <div className="building-stat-label">Coins</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                className="building-btn building-btn-secondary"
                                onClick={onClose}
                            >
                                <X size={16} style={{ marginRight: 8 }} />
                                Exit
                            </button>
                            <button
                                className="building-btn building-btn-primary"
                                onClick={startGame}
                            >
                                <RefreshCw size={16} style={{ marginRight: 8 }} />
                                Play Again
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </BuildingInteractionWindow>
    );
}

export default AgilityGameWindow;
