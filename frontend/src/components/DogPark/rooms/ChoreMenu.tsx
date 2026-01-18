import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, CheckCircle, Coins, Trash2, Shovel } from 'lucide-react';
import { usePet } from '@/context/PetContext';
import { ACTIONS } from '@/config/gameConfig';

interface ChoreMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const CHORES = [
    {
        key: 'CHORE_DISHES',
        label: 'Wash Dishes',
        reward: 15, // Positive display
        energyCost: 10,
        icon: <Trash2 size={24} />, // or utensil icon? Trash2 isn't great. Maybe sparkle?
        color: '#60a5fa'
    },
    {
        key: 'CHORE_YARD',
        label: 'Clean Yard',
        reward: 25,
        energyCost: 20,
        icon: <Shovel size={24} />,
        color: '#4ade80'
    }
] as const;

export function ChoreMenu({ isOpen, onClose }: ChoreMenuProps) {
    const { performAction, pet } = usePet();

    const handleChore = async (choreKey: string) => {
        // We rely on performAction handling the "negative cost" as income
        // And energy deduction from config
        await performAction(choreKey as any);
        // Optional: show feedback or close
        // Let's keep open for spamming (with cooldown? logic is in backend usually or we throttle)
        // User asked for "simple 10-second cooldown so users can't spam".
        // Use local state for cooldown?
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ClipboardList className="text-yellow-400" />
                                Chore Board
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-white/50 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-slate-400 text-sm mb-4">
                                Complete chores to earn pocket money! Use energy to work.
                            </p>

                            {CHORES.map((chore) => (
                                <ChoreButton
                                    key={chore.key}
                                    chore={chore}
                                    onDoChore={() => handleChore(chore.key)}
                                    currentEnergy={pet?.stats.energy ?? 0}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function ChoreButton({ chore, onDoChore, currentEnergy }: { chore: any, onDoChore: () => void, currentEnergy: number }) {
    const [cooldown, setCooldown] = React.useState(0);
    const hasEnergy = currentEnergy >= chore.energyCost;

    React.useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleClick = () => {
        if (cooldown > 0 || !hasEnergy) return;
        onDoChore();
        setCooldown(10); // 10s cooldown
    };

    const disabled = cooldown > 0 || !hasEnergy;

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${disabled
                    ? 'bg-slate-700/50 border-transparent opacity-50 cursor-not-allowed'
                    : 'bg-slate-700 hover:bg-slate-600 border-white/5 hover:border-white/20'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-2xl">
                    {chore.icon}
                </div>
                <div className="text-left">
                    <div className="font-bold text-white">{chore.label}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                        Running Low? <span className="text-yellow-400">-{chore.energyCost} Energy</span>
                    </div>
                </div>
            </div>

            <div className="text-right">
                <div className="flex items-center gap-1 text-green-400 font-bold text-lg">
                    <Coins size={16} /> +${chore.reward}
                </div>
                {cooldown > 0 && (
                    <div className="text-xs text-orange-400 font-mono">
                        Wait {cooldown}s
                    </div>
                )}
            </div>
        </button>
    );
}
