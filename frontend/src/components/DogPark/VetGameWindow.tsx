/**
 * VetGameWindow.tsx
 * 
 * Floating window for the Vet Clinic building.
 * Features: Pet health display, health check mini-game, treatment options
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Heart, Zap, Droplet, Sparkles, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { BuildingInteractionWindow } from './BuildingInteractionWindow';
import { minigameService } from '@/services/minigameService';
import type { GameStartResponse } from '@/types/game';
import './building-windows.css';


interface PetHealth {
    health: number;
    happiness: number;
    energy: number;
    cleanliness: number;
}

interface VetGameWindowProps {
    isOpen: boolean;
    onClose: () => void;
    petName?: string;
    petHealth?: PetHealth;
    onHealthCheck?: (healthBoost: number) => void;
    walletBalance?: number;
}

// Reaction game targets
const BODY_PARTS = [
    { id: 'head', label: 'Head', x: 50, y: 15, icon: '🧠' },
    { id: 'heart', label: 'Heart', x: 45, y: 35, icon: '❤️' },
    { id: 'lungs', label: 'Lungs', x: 55, y: 35, icon: '🫁' },
    { id: 'stomach', label: 'Stomach', x: 50, y: 50, icon: '🍃' },
    { id: 'paws', label: 'Paws', x: 50, y: 75, icon: '🐾' },
];

const VET_VISIT_COST = 25;

export function VetGameWindow({
    isOpen,
    onClose,
    petName = 'Your pet',
    petHealth = { health: 75, happiness: 80, energy: 60, cleanliness: 70 },
    onHealthCheck,
    walletBalance = 100
}: VetGameWindowProps) {
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'complete'>('idle');
    const [currentTarget, setCurrentTarget] = useState<typeof BODY_PARTS[0] | null>(null);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(0);
    const [totalRounds] = useState(5);
    const [timeLeft, setTimeLeft] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [healthBoost, setHealthBoost] = useState(0);
    const [showPayment, setShowPayment] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [gameSession, setGameSession] = useState<GameStartResponse | null>(null);
    const [isStartingGame, setIsStartingGame] = useState(false);


    // Reset game when window closes
    useEffect(() => {
        if (!isOpen) {
            setGameState('idle');
            setScore(0);
            setRound(0);
            setCurrentTarget(null);
            setFeedback(null);
            setHealthBoost(0);
            setShowPayment(false);
        }
    }, [isOpen]);

    // Game timer
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setTimeout(() => {
                setTimeLeft(prev => prev - 100);
            }, 100);
            return () => clearTimeout(timer);
        } else if (gameState === 'playing' && timeLeft <= 0 && currentTarget) {
            handleMiss();
        }
    }, [gameState, timeLeft]);

    const startGame = useCallback(async () => {
        setIsStartingGame(true);
        setScore(0);
        setRound(0);

        try {
            // Start a game session via backend API
            const session = await minigameService.startRound({
                gameType: 'reaction', // Vet game is a reaction-type game
                preferredDifficulty: 'normal',
                practiceMode: false,
            });
            setGameSession(session);
            console.log('Vet game session started:', session.session_id);
        } catch (error) {
            console.warn('Failed to start vet game session, proceeding locally:', error);
            setGameSession(null);
        }

        setGameState('playing');
        setIsStartingGame(false);
        nextRound();
    }, []);


    const nextRound = useCallback(() => {
        if (round >= totalRounds) {
            endGame();
            return;
        }

        const randomTarget = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)];
        setCurrentTarget(randomTarget);
        setTimeLeft(2000); // 2 seconds to click
        setRound(prev => prev + 1);
        setFeedback(null);
    }, [round, totalRounds]);

    const handleClick = useCallback((partId: string) => {
        if (gameState !== 'playing' || !currentTarget) return;

        if (partId === currentTarget.id) {
            // Correct!
            const timeBonus = Math.floor(timeLeft / 100);
            setScore(prev => prev + 100 + timeBonus);
            setFeedback('correct');
        } else {
            // Wrong!
            setFeedback('wrong');
        }

        setTimeout(nextRound, 500);
    }, [gameState, currentTarget, timeLeft, nextRound]);

    const handleMiss = useCallback(() => {
        setFeedback('wrong');
        setTimeout(nextRound, 500);
    }, [nextRound]);

    const endGame = useCallback(async () => {
        setGameState('complete');
        // Calculate health boost based on score
        const maxScore = totalRounds * 200; // 200 per round max
        const percentage = score / maxScore;
        const boost = Math.floor(percentage * 30); // Up to 30% health boost
        setHealthBoost(boost);

        // Submit score to backend using minigameService
        try {
            const result = await minigameService.submitResult({
                session_id: gameSession?.session_id,
                score: score,
                durationSeconds: totalRounds * 2, // Approximate duration (2 sec per round)
                difficulty: (gameSession?.difficulty as 'easy' | 'normal' | 'hard') || 'normal',
                gameType: 'reaction',
                metadata: {
                    rounds: totalRounds,
                    healthBoost: boost,
                },
            });
            console.log('Vet game score submitted:', result.message);
        } catch (error) {
            console.warn('Failed to submit vet game score:', error);
        }

        // Clear session after submission
        setGameSession(null);
    }, [score, totalRounds, gameSession]);


    const handlePayment = useCallback(async () => {
        setIsPaying(true);

        try {
            // Call backend to process payment and apply health boost
            const response = await fetch('/api/pets/health-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    health_boost: healthBoost,
                    game_score: score,
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Payment failed');
            }

            const data = await response.json();
            console.log('Health check completed:', data.message);

            onHealthCheck?.(healthBoost);
            onClose();
        } catch (error: any) {
            console.error('Health check payment failed:', error);
            // Show error but still close for demo purposes
            alert(error.message || 'Payment failed. Please try again.');
        } finally {
            setIsPaying(false);
            setShowPayment(false);
        }
    }, [healthBoost, score, onHealthCheck, onClose]);

    const canAfford = walletBalance >= VET_VISIT_COST;

    return (
        <BuildingInteractionWindow
            isOpen={isOpen}
            onClose={onClose}
            title="Vet Clinic"
            icon={<Stethoscope />}
            width={500}
            minHeight={480}
        >
            <AnimatePresence mode="wait">
                {gameState === 'idle' && !showPayment && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: 'calc(100vh - 140px)',
                            gap: 20
                        }}
                    >
                        {/* Header */}
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ margin: '0 0 8px', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                🏥 Vet Clinic
                            </h2>
                            <p style={{ color: '#94a3b8', margin: 0 }}>
                                {petName}'s Health Checkup
                            </p>
                        </div>

                        {/* Main Content - Two Column Layout */}
                        <div style={{
                            display: 'flex',
                            flex: 1,
                            gap: 20,
                            minHeight: 0
                        }}>
                            {/* Left Column - AI Tutorial */}
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
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10
                                }}>
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        👨‍⚕️
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Dr. Pet</div>
                                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>● Ready to help</div>
                                    </div>
                                </div>

                                {/* Tutorial Messages */}
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
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            borderRadius: 12,
                                            padding: 14,
                                            maxWidth: '90%'
                                        }}
                                    >
                                        <p style={{ margin: '0 0 10px', fontWeight: 600 }}>👋 Welcome to the Vet Clinic!</p>
                                        <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.5 }}>
                                            Let me show you how the health check works:
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        style={{
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            borderRadius: 12,
                                            padding: 14,
                                            maxWidth: '90%'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '1.2rem' }}>1️⃣</span>
                                                <span><strong>Watch for the glowing body part</strong></span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '1.2rem' }}>2️⃣</span>
                                                <span><strong>Click it quickly!</strong> (2 seconds)</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '1.2rem' }}>3️⃣</span>
                                                <span>Complete <strong>5 rounds</strong> to finish</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '1.2rem' }}>4️⃣</span>
                                                <span>Higher score = more <strong>health boost!</strong></span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                        style={{
                                            background: 'rgba(251, 191, 36, 0.15)',
                                            borderRadius: 12,
                                            padding: 14,
                                            maxWidth: '90%'
                                        }}
                                    >
                                        <p style={{ margin: 0, color: '#fde68a' }}>
                                            💰 <strong>Treatment cost: 25 coins</strong><br />
                                            <span style={{ fontSize: '0.85rem', color: '#fbbf24' }}>Paid after completing the checkup</span>
                                        </p>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Right Column - Pet Health & Demo */}
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16
                            }}>
                                {/* Pet Stats */}
                                <div style={{
                                    background: 'rgba(30, 30, 40, 0.8)',
                                    borderRadius: 16,
                                    padding: 16,
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ marginBottom: 12, fontWeight: 600 }}>{petName}'s Current Stats</div>
                                    <div className="building-stats" style={{ marginBottom: 0 }}>
                                        <StatBar icon={<Heart />} label="Health" value={petHealth.health} color="#ef4444" />
                                        <StatBar icon={<Sparkles />} label="Happy" value={petHealth.happiness} color="#f59e0b" />
                                    </div>
                                </div>

                                {/* Demo Preview */}
                                <div style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.15))',
                                    borderRadius: 16,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
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
                                        color: '#a7f3d0'
                                    }}>
                                        🎬 Demo Preview
                                    </div>

                                    {/* Pet silhouette with animated spots */}
                                    <div style={{ position: 'relative', fontSize: '5rem', opacity: 0.7 }}>
                                        🐕
                                        {/* Animated glowing spots */}
                                        <motion.div
                                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            style={{
                                                position: 'absolute',
                                                top: '10%',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: 30,
                                                height: 30,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)'
                                            }}
                                        />
                                        <motion.div
                                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                            style={{
                                                position: 'absolute',
                                                top: '40%',
                                                left: '45%',
                                                width: 30,
                                                height: 30,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)'
                                            }}
                                        />
                                    </div>

                                    <div style={{
                                        position: 'absolute',
                                        bottom: 16,
                                        textAlign: 'center',
                                        color: '#a7f3d0',
                                        fontSize: '0.9rem'
                                    }}>
                                        Click the glowing spots!
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Start Button */}
                        <div style={{ textAlign: 'center', paddingBottom: 16 }}>
                            <motion.button
                                className="building-btn building-btn-success"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={startGame}
                                style={{
                                    padding: '16px 48px',
                                    fontSize: '1.2rem'
                                }}
                            >
                                <Stethoscope size={24} style={{ marginRight: 10 }} />
                                Start Health Check
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
                            alignItems: 'center',
                            height: 'calc(100vh - 180px)',
                            textAlign: 'center'
                        }}
                    >
                        {/* Game Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 16
                        }}>
                            <div>Round {round}/{totalRounds}</div>
                            <div style={{ fontWeight: 700 }}>Score: {score}</div>
                        </div>

                        {/* Timer Bar */}
                        <div style={{
                            height: 8,
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: 4,
                            overflow: 'hidden',
                            marginBottom: 16
                        }}>
                            <motion.div
                                style={{
                                    height: '100%',
                                    background: timeLeft > 500 ? '#10b981' : '#ef4444',
                                    borderRadius: 4
                                }}
                                animate={{ width: `${(timeLeft / 2000) * 100}%` }}
                                transition={{ duration: 0.1 }}
                            />
                        </div>

                        {/* Instruction */}
                        <div style={{
                            fontSize: '1.25rem',
                            marginBottom: 20,
                            fontWeight: 600
                        }}>
                            Quick! Check the <span style={{ color: '#a5b4fc' }}>{currentTarget?.label}</span>!
                        </div>

                        {/* Pet Body with clickable areas */}
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: 400,
                            flex: 1,
                            minHeight: 350,
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                            borderRadius: 16,
                            border: '2px solid rgba(255,255,255,0.1)'
                        }}>
                            {/* Pet silhouette */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '5rem',
                                opacity: 0.3
                            }}>
                                🐕
                            </div>

                            {/* Clickable body parts */}
                            {BODY_PARTS.map(part => (
                                <motion.button
                                    key={part.id}
                                    onClick={() => handleClick(part.id)}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        position: 'absolute',
                                        left: `${part.x}%`,
                                        top: `${part.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        width: 60,
                                        height: 60,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: currentTarget?.id === part.id
                                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                            : 'rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        boxShadow: currentTarget?.id === part.id
                                            ? '0 0 25px rgba(99, 102, 241, 0.6)'
                                            : 'none',
                                        animation: currentTarget?.id === part.id
                                            ? 'pulse 1s infinite'
                                            : 'none'
                                    }}
                                >
                                    {part.icon}
                                </motion.button>
                            ))}

                            {/* Feedback overlay */}
                            <AnimatePresence>
                                {feedback && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: feedback === 'correct'
                                                ? 'rgba(16, 185, 129, 0.3)'
                                                : 'rgba(239, 68, 68, 0.3)',
                                            borderRadius: 16
                                        }}
                                    >
                                        <span style={{ fontSize: '3rem' }}>
                                            {feedback === 'correct' ? '✓' : '✗'}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {gameState === 'complete' && !showPayment && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            style={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                fontSize: '3rem'
                            }}
                        >
                            <Stethoscope size={48} color="white" />
                        </motion.div>

                        <h3 style={{ margin: '0 0 8px' }}>Health Check Complete!</h3>
                        <p style={{ color: '#94a3b8', marginBottom: 20 }}>
                            Score: <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{score}</span>
                        </p>

                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 20
                        }}>
                            <div style={{ marginBottom: 12 }}>
                                Health Boost Available:
                                <span style={{
                                    color: '#10b981',
                                    fontWeight: 700,
                                    marginLeft: 8
                                }}>
                                    +{healthBoost}%
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                Vet visit cost: <span style={{ color: '#fbbf24' }}>{VET_VISIT_COST} 💰</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                className="building-btn building-btn-secondary"
                                onClick={() => {
                                    setGameState('idle');
                                    setScore(0);
                                    setRound(0);
                                }}
                            >
                                <RefreshCw size={16} style={{ marginRight: 8 }} />
                                Try Again
                            </button>
                            <button
                                className="building-btn building-btn-success"
                                onClick={() => setShowPayment(true)}
                                disabled={!canAfford}
                            >
                                Apply Treatment ({VET_VISIT_COST} 💰)
                            </button>
                        </div>

                        {!canAfford && (
                            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 12 }}>
                                Insufficient funds! Need {VET_VISIT_COST - walletBalance} more coins
                            </p>
                        )}
                    </motion.div>
                )}

                {showPayment && (
                    <motion.div
                        key="payment"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', padding: 20 }}
                    >
                        <h3>Confirm Treatment</h3>
                        <p style={{ color: '#94a3b8' }}>
                            Apply +{healthBoost}% health boost to {petName}?
                        </p>
                        <p style={{ color: '#fbbf24', fontSize: '1.25rem', fontWeight: 700 }}>
                            Cost: {VET_VISIT_COST} 💰
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
                            <button
                                className="building-btn building-btn-secondary"
                                onClick={() => setShowPayment(false)}
                                disabled={isPaying}
                            >
                                Cancel
                            </button>
                            <button
                                className="building-btn building-btn-success"
                                onClick={handlePayment}
                                disabled={isPaying}
                            >
                                {isPaying ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </BuildingInteractionWindow>
    );
}

// Helper component for stat bars
function StatBar({
    icon,
    label,
    value,
    color
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="building-stat" style={{ minWidth: 80 }}>
            <div style={{ color, marginBottom: 4 }}>{icon}</div>
            <div style={{
                height: 6,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                overflow: 'hidden',
                marginBottom: 4
            }}>
                <motion.div
                    style={{ height: '100%', background: color, borderRadius: 3 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{label}</div>
        </div>
    );
}

export default VetGameWindow;
