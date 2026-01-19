/**
 * PetRunGameWindow.tsx
 * 
 * "Chrome Dino" style endless runner mini-game.
 * Features: Your pet as the character, obstacle dodging, coin rewards
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Trophy, Coins, Heart, Zap } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { useFinancial } from '@/context/FinancialContext';
import './building-windows.css';

interface PetRunGameWindowProps {
    isOpen: boolean;
    onClose: () => void;
    onGameComplete?: (score: number, coinsEarned: number) => void;
    petEmoji?: string;
}

// Game state
type GameState = 'idle' | 'playing' | 'gameover';

// Obstacle types
interface Obstacle {
    id: string;
    x: number;
    type: 'rock' | 'tree' | 'hurdle';
    height: number;
    passed: boolean;
}

// Collectible coins
interface Coin {
    id: string;
    x: number;
    y: number;
    collected: boolean;
}

const GROUND_Y = 300;
const PET_SIZE = 60;
const JUMP_VELOCITY = -18;
const GRAVITY = 0.8;
const GAME_SPEED_INITIAL = 6;
const GAME_SPEED_INCREMENT = 0.002; // Speed increases over time
const OBSTACLE_SPAWN_RATE = 0.015; // Probability per frame
const COIN_SPAWN_RATE = 0.008;

const OBSTACLE_EMOJIS: Record<string, string> = {
    rock: '🪨',
    tree: '🌲',
    hurdle: '🚧',
};

const PET_EMOJIS: Record<string, string> = {
    dog: '🐕',
    cat: '🐈',
    panda: '🐼',
};

export function PetRunGameWindow({
    isOpen,
    onClose,
    onGameComplete,
    petEmoji,
}: PetRunGameWindowProps) {
    const { pet, updateHighScore, getHighScore } = usePet();
    const { refreshBalance } = useFinancial();

    // Game state
    const [gameState, setGameState] = useState<GameState>('idle');
    const [score, setScore] = useState(0);
    const [coinsCollected, setCoinsCollected] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Pet physics
    const [petY, setPetY] = useState(GROUND_Y);
    const [isJumping, setIsJumping] = useState(false);
    const velocityRef = useRef(0);

    // Game objects
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [coins, setCoins] = useState<Coin[]>([]);
    const [gameSpeed, setGameSpeed] = useState(GAME_SPEED_INITIAL);

    // Animation frame
    const gameLoopRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);

    // Get the pet emoji
    const activePetEmoji = petEmoji || PET_EMOJIS[pet?.species || 'dog'] || '🐕';

    // Load high score
    useEffect(() => {
        if (isOpen) {
            getHighScore('pet_run').then(setHighScore);
        }
    }, [isOpen, getHighScore]);

    // Jump handler
    const handleJump = useCallback(() => {
        if (gameState === 'idle') {
            // Start game on first jump
            setGameState('playing');
            setScore(0);
            setCoinsCollected(0);
            setObstacles([]);
            setCoins([]);
            setGameSpeed(GAME_SPEED_INITIAL);
            setPetY(GROUND_Y);
            velocityRef.current = 0;
        }

        if (gameState === 'playing' && !isJumping && petY >= GROUND_Y - 5) {
            velocityRef.current = JUMP_VELOCITY;
            setIsJumping(true);
        }
    }, [gameState, isJumping, petY]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                handleJump();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleJump]);

    // Game loop
    useEffect(() => {
        if (!isOpen || gameState !== 'playing') {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
            return;
        }

        const gameLoop = (timestamp: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = timestamp;
            const delta = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;

            // Update physics
            velocityRef.current += GRAVITY;
            let newY = petY + velocityRef.current;

            // Ground collision
            if (newY >= GROUND_Y) {
                newY = GROUND_Y;
                velocityRef.current = 0;
                setIsJumping(false);
            }
            setPetY(newY);

            // Update game speed
            setGameSpeed(prev => prev + GAME_SPEED_INCREMENT);

            // Spawn obstacles
            if (Math.random() < OBSTACLE_SPAWN_RATE) {
                const types: Obstacle['type'][] = ['rock', 'tree', 'hurdle'];
                const type = types[Math.floor(Math.random() * types.length)];
                const height = type === 'hurdle' ? 40 : type === 'rock' ? 35 : 50;

                setObstacles(prev => [...prev, {
                    id: `obs_${Date.now()}_${Math.random()}`,
                    x: 500,
                    type,
                    height,
                    passed: false,
                }]);
            }

            // Spawn coins
            if (Math.random() < COIN_SPAWN_RATE) {
                setCoins(prev => [...prev, {
                    id: `coin_${Date.now()}_${Math.random()}`,
                    x: 500,
                    y: GROUND_Y - 80 - Math.random() * 60,
                    collected: false,
                }]);
            }

            // Move obstacles
            setObstacles(prev => {
                const updated = prev.map(obs => ({
                    ...obs,
                    x: obs.x - gameSpeed,
                })).filter(obs => obs.x > -100);

                // Check for score (obstacles passed)
                updated.forEach(obs => {
                    if (!obs.passed && obs.x < 50) {
                        obs.passed = true;
                        setScore(s => s + 10);
                    }
                });

                return updated;
            });

            // Move coins
            setCoins(prev => prev.map(coin => ({
                ...coin,
                x: coin.x - gameSpeed,
            })).filter(coin => coin.x > -50 && !coin.collected));

            // Collision detection - Pet hitbox
            const petLeft = 50;
            const petRight = petLeft + PET_SIZE - 15;
            const petTop = newY - PET_SIZE + 10;
            const petBottom = newY;

            // Check obstacle collision
            for (const obs of obstacles) {
                const obsLeft = obs.x;
                const obsRight = obs.x + 40;
                const obsTop = GROUND_Y - obs.height;
                const obsBottom = GROUND_Y;

                if (
                    petRight > obsLeft &&
                    petLeft < obsRight &&
                    petBottom > obsTop &&
                    petTop < obsBottom
                ) {
                    // Collision! Game over
                    setGameState('gameover');
                    return;
                }
            }

            // Check coin collection
            setCoins(prev => prev.map(coin => {
                if (coin.collected) return coin;

                const coinLeft = coin.x;
                const coinRight = coin.x + 30;
                const coinTop = coin.y - 15;
                const coinBottom = coin.y + 15;

                if (
                    petRight > coinLeft &&
                    petLeft < coinRight &&
                    petBottom > coinTop &&
                    petTop < coinBottom
                ) {
                    setCoinsCollected(c => c + 1);
                    return { ...coin, collected: true };
                }
                return coin;
            }));

            // Increment score over time
            setScore(s => s + 1);

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [isOpen, gameState, petY, gameSpeed, obstacles]);

    // Handle game over
    useEffect(() => {
        if (gameState === 'gameover') {
            const finalCoins = coinsCollected + Math.floor(score / 50);

            // Save high score
            if (score > highScore) {
                setHighScore(score);
                updateHighScore('pet_run', score, finalCoins);
            }

            // Notify parent
            if (onGameComplete) {
                onGameComplete(score, finalCoins);
            }
        }
    }, [gameState, score, coinsCollected, highScore, updateHighScore, onGameComplete]);

    // Reset game
    const resetGame = () => {
        setGameState('idle');
        setScore(0);
        setCoinsCollected(0);
        setObstacles([]);
        setCoins([]);
        setPetY(GROUND_Y);
        velocityRef.current = 0;
        setGameSpeed(GAME_SPEED_INITIAL);
        lastTimeRef.current = 0;
    };

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            resetGame();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-2xl bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/30 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <Zap size={16} className="text-yellow-300" />
                                <span className="text-white font-bold">{score}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <Coins size={16} className="text-yellow-400" />
                                <span className="text-white font-bold">{coinsCollected}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <Trophy size={16} className="text-yellow-400" />
                                <span className="text-white text-sm">Best: {highScore}</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                            >
                                <X size={18} className="text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Game Canvas */}
                    <div
                        className="relative w-full h-[400px] overflow-hidden cursor-pointer select-none"
                        onClick={handleJump}
                        onTouchStart={handleJump}
                    >
                        {/* Clouds */}
                        <div className="absolute top-16 left-[10%] text-4xl opacity-70 animate-pulse">☁️</div>
                        <div className="absolute top-24 left-[40%] text-3xl opacity-60">☁️</div>
                        <div className="absolute top-12 left-[70%] text-5xl opacity-80">☁️</div>

                        {/* Sun */}
                        <div className="absolute top-8 right-12 text-6xl animate-pulse">☀️</div>

                        {/* Ground */}
                        <div
                            className="absolute left-0 right-0 h-20 bg-gradient-to-b from-green-500 to-green-700"
                            style={{ top: GROUND_Y }}
                        >
                            {/* Ground texture */}
                            <div className="absolute inset-0 opacity-30" style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 40px)'
                            }} />
                        </div>

                        {/* Pet */}
                        <motion.div
                            className="absolute text-5xl"
                            style={{
                                left: 50,
                                top: petY - PET_SIZE,
                                transform: isJumping ? 'rotate(-10deg)' : 'rotate(0deg)',
                            }}
                            animate={{
                                scale: isJumping ? 1.1 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            {activePetEmoji}
                            {/* Running particles */}
                            {gameState === 'playing' && !isJumping && (
                                <motion.div
                                    className="absolute -left-4 bottom-0 text-xl opacity-50"
                                    animate={{ x: [-10, -20], opacity: [0.5, 0] }}
                                    transition={{ duration: 0.3, repeat: Infinity }}
                                >
                                    💨
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Obstacles */}
                        {obstacles.map(obs => (
                            <div
                                key={obs.id}
                                className="absolute text-4xl"
                                style={{
                                    left: obs.x,
                                    top: GROUND_Y - obs.height,
                                }}
                            >
                                {OBSTACLE_EMOJIS[obs.type]}
                            </div>
                        ))}

                        {/* Coins */}
                        {coins.filter(c => !c.collected).map(coin => (
                            <motion.div
                                key={coin.id}
                                className="absolute text-2xl"
                                style={{
                                    left: coin.x,
                                    top: coin.y,
                                }}
                                animate={{ y: [0, -5, 0], rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            >
                                🪙
                            </motion.div>
                        ))}

                        {/* Idle State Overlay */}
                        {gameState === 'idle' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="text-7xl mb-4"
                                >
                                    {activePetEmoji}
                                </motion.div>
                                <h2 className="text-3xl font-black text-white drop-shadow-lg mb-2">Pet Run!</h2>
                                <p className="text-white/80 text-lg mb-6">Tap or press SPACE to jump</p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleJump}
                                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl transition-shadow"
                                >
                                    <Play size={24} fill="white" />
                                    Start Running!
                                </motion.button>
                            </motion.div>
                        )}

                        {/* Game Over Overlay */}
                        {gameState === 'gameover' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="text-6xl mb-4"
                                >
                                    💥
                                </motion.div>
                                <h2 className="text-3xl font-black text-white drop-shadow-lg mb-2">Game Over!</h2>

                                <div className="flex gap-6 my-4">
                                    <div className="text-center">
                                        <p className="text-white/60 text-sm">Score</p>
                                        <p className="text-3xl font-black text-white">{score}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white/60 text-sm">Coins</p>
                                        <p className="text-3xl font-black text-yellow-400">
                                            +{coinsCollected + Math.floor(score / 50)}
                                        </p>
                                    </div>
                                </div>

                                {score >= highScore && score > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-full mb-4"
                                    >
                                        <Trophy size={20} />
                                        <span className="font-bold">New High Score!</span>
                                    </motion.div>
                                )}

                                <div className="flex gap-3 mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={resetGame}
                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full shadow-lg"
                                    >
                                        Play Again
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        className="px-6 py-3 bg-white/20 text-white font-bold rounded-full"
                                    >
                                        Exit
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="p-4 bg-gradient-to-t from-green-600 to-green-500 text-center">
                        <p className="text-white/90 text-sm">
                            {gameState === 'playing'
                                ? '🎮 Tap or press SPACE to jump over obstacles!'
                                : '🏃 Help your pet run as far as possible!'}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default PetRunGameWindow;
