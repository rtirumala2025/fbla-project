import React, { useMemo } from 'react';
import type { PetStats } from '@/types/pet';
import type { PetGame2Action, ActivityZone } from '../core/SceneManager';
import { Heart, Sparkles, Zap, Droplets, Book, Backpack, Volume2, VolumeX, Plane, DollarSign, TrendingDown, HelpCircle, DoorOpen } from 'lucide-react';
import { useAIAssistant } from '../../contexts/AIAssistantContext';

// Building names for display
const BUILDING_NAMES: Record<ActivityZone, string> = {
    shop: 'Gift Shop',
    home: 'Pet House',
    agility: 'Training Center',
    vet: 'Vet Clinic',
    play: 'Play Pavilion',
    rest: 'Rest Area',
    center: 'Info Center',
    market: 'Supermarket',
};

const BUILDING_ICONS: Record<ActivityZone, string> = {
    shop: '🛍️',
    home: '🏠',
    agility: '🏃',
    vet: '🏥',
    play: '🎮',
    rest: '😴',
    center: 'ℹ️',
    market: '🛒',
};

// Pet emotion calculation based on stats
function calculateEmotion(stats: PetStats | null): { emoji: string; text: string; color: string } {
    if (!stats) return { emoji: '😶', text: 'Unknown', color: 'text-gray-400' };

    const hunger = stats.hunger ?? 50;
    const happiness = stats.happiness ?? 50;
    const energy = stats.energy ?? 50;
    const cleanliness = stats.cleanliness ?? stats.hygiene ?? 50;

    // Check for critical states first
    if (hunger < 20 || happiness < 20 || energy < 20 || cleanliness < 20) {
        if (hunger < 20) return { emoji: '😢', text: 'Hungry', color: 'text-red-400' };
        if (happiness < 20) return { emoji: '😭', text: 'Sad', color: 'text-red-400' };
        if (energy < 20) return { emoji: '😴', text: 'Exhausted', color: 'text-purple-400' };
        if (cleanliness < 20) return { emoji: '🤢', text: 'Dirty', color: 'text-yellow-400' };
    }

    // Check for low states
    if (hunger < 40 || happiness < 40 || energy < 40 || cleanliness < 40) {
        return { emoji: '😟', text: 'Needs Care', color: 'text-amber-400' };
    }

    // Check for excellent state
    const avgStat = (hunger + happiness + energy + cleanliness) / 4;
    if (avgStat > 80) return { emoji: '🤩', text: 'Thriving!', color: 'text-green-400' };
    if (avgStat > 60) return { emoji: '😊', text: 'Happy', color: 'text-emerald-400' };

    return { emoji: '😐', text: 'Content', color: 'text-blue-400' };
}

// Budget display component with animation
function BudgetDisplay({ balance, totalSpent, balanceChange }: { balance: number; totalSpent: number; balanceChange?: { amount: number; isPositive: boolean } | null }) {
    return (
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl min-w-[200px]">
            {/* Main Balance */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <DollarSign size={20} className="text-emerald-400" />
                </div>
                <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Balance</p>
                    <p className="text-2xl font-bold text-emerald-400">${balance.toLocaleString()}</p>
                </div>
            </div>

            {/* Total Spent */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <div className="p-1.5 bg-red-500/20 rounded-lg">
                    <TrendingDown size={14} className="text-red-400" />
                </div>
                <div>
                    <p className="text-white/50 text-xs">Total Spent</p>
                    <p className="text-sm font-semibold text-red-300">${totalSpent.toLocaleString()}</p>
                </div>
            </div>

            {/* Balance change animation indicator */}
            {balanceChange && (
                <div
                    className={`mt-2 text-center py-1 rounded-lg text-sm font-bold animate-pulse ${balanceChange.isPositive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'
                        }`}
                >
                    {balanceChange.isPositive ? '+' : ''}{balanceChange.amount}
                </div>
            )}
        </div>
    );
}

// Emotion indicator component
function EmotionIndicator({ petName, emotion }: { petName: string; emotion: { emoji: string; text: string; color: string } }) {
    return (
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-lg">
            <p className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">{emotion.emoji}</span>
                <span>{petName} is</span>
                <span className={`${emotion.color} font-bold`}>{emotion.text}</span>
            </p>
        </div>
    );
}

function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className="text-white/90 text-sm font-semibold flex items-center gap-1.5">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="text-white/70 text-xs font-medium ml-auto">{Math.round(clamped)}%</span>
            </div>
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{
                        width: `${clamped}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                        boxShadow: `0 0 10px ${color}88`
                    }}
                />
            </div>
        </div>
    );
}

function ActionButton({
    label,
    action,
    disabled,
    onAction,
    icon,
    isFree = false
}: {
    label: string;
    action: PetGame2Action;
    disabled: boolean;
    onAction: (action: PetGame2Action) => void;
    icon: React.ReactNode;
    isFree?: boolean;
}) {
    const colors = {
        feed: 'from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400',
        play: 'from-blue-400 to-cyan-500 hover:from-blue-300 hover:to-cyan-400',
        rest: 'from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400',
        bathe: 'from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400'
    };

    return (
        <button
            onClick={() => !disabled && onAction(action)}
            disabled={disabled}
            className={`
        relative px-5 py-3 rounded-xl font-semibold text-white
        bg-gradient-to-br ${colors[action]}
        shadow-lg hover:shadow-xl
        transform transition-all duration-200
        hover:scale-105 hover:-translate-y-0.5
        active:scale-95 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center gap-2
        border ${isFree ? 'border-green-400/60 ring-1 ring-green-400/30' : 'border-white/20'}
      `}
        >
            {icon}
            <span>{label}</span>
            {isFree && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-green-400">
                    FREE
                </span>
            )}
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
        </button>
    );
}

export function PetHUD({
    petName,
    species,
    stats,
    disabled,
    onAction,
    onToggleInventory,
    onToggleDiary,
    onToggleSound,
    soundEnabled,
    onToggleDrone,
    droneActive,
    breed,
    setBreed,
    indoorLocation,
    onExitBuilding,
    onActivity,
    balance = 0,
    totalSpent = 0,
    balanceChange = null,
    nearbyBuilding = null,
    nearbyZoneConfig = null,
    onEnterBuilding,
}: {
    petName: string;
    species: string;
    stats: PetStats | null;
    disabled: boolean;
    onAction: (action: PetGame2Action) => void;
    onToggleInventory?: () => void;
    onToggleDiary?: () => void;
    onToggleSound?: () => void;
    soundEnabled?: boolean;
    onToggleDrone?: () => void;
    droneActive?: boolean;
    breed?: string;
    setBreed?: (breed: string) => void;
    indoorLocation?: string | null;
    onExitBuilding?: () => void;
    onActivity?: (id: string) => void;
    balance?: number;
    totalSpent?: number;
    balanceChange?: { amount: number; isPositive: boolean } | null;
    nearbyBuilding?: ActivityZone | null;
    nearbyZoneConfig?: { label: string; icon?: string } | null;
    onEnterBuilding?: (zone: ActivityZone) => void;
}) {
    const { sendMessage, toggleOpen, isOpen } = useAIAssistant();
    const hunger = stats?.hunger ?? 50;
    const happiness = stats?.happiness ?? 50;
    const energy = stats?.energy ?? 50;
    const cleanliness = stats?.cleanliness ?? stats?.hygiene ?? 50;

    const speciesEmoji = species === 'panda' ? '🐼' : species === 'cat' ? '🐱' : '🐶';

    // Calculate pet emotion
    const emotion = useMemo(() => calculateEmotion(stats), [stats]);

    return (
        <>
            {/* Top-left: Pet Info + Emotion */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <div className="flex flex-col gap-3">
                    <div className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl">{speciesEmoji}</div>
                            <div>
                                <h2 className="text-2xl font-bold text-white drop-shadow-lg">{petName}</h2>
                                <p className="text-sm text-white/70 capitalize">{species}</p>
                            </div>
                        </div>
                    </div>
                    {/* Emotion Indicator */}
                    <EmotionIndicator petName={petName} emotion={emotion} />
                </div>
            </div>

            {/* Top-right: Budget Display */}
            <div className="absolute top-6 right-6 z-10 pointer-events-none">
                <div className="flex flex-col gap-3 items-end">
                    <BudgetDisplay balance={balance} totalSpent={totalSpent} balanceChange={balanceChange} />
                    {/* Tools row below budget */}
                    <div className="flex gap-2 pointer-events-auto flex-wrap justify-end">
                        <button
                            onClick={onToggleDiary}
                            className="p-2.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800/80 transition-all hover:scale-105 active:scale-95 shadow-lg"
                            title="Pet Diary"
                        >
                            <Book size={18} />
                        </button>
                        <button
                            onClick={onToggleInventory}
                            className="p-2.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800/80 transition-all hover:scale-105 active:scale-95 shadow-lg"
                            title="Inventory"
                        >
                            <Backpack size={18} />
                        </button>
                        <button
                            onClick={onToggleDrone}
                            className={`p-2.5 rounded-xl backdrop-blur-md border border-white/10 text-white transition-all hover:scale-105 active:scale-95 shadow-lg ${droneActive ? 'bg-amber-500/60' : 'bg-slate-900/60 hover:bg-slate-800/80'}`}
                            title={droneActive ? "Exit Drone Mode" : "Enter Drone Mode"}
                        >
                            <Plane size={18} className={droneActive ? "animate-[pulse_2s_infinite]" : ""} />
                        </button>
                        <button
                            onClick={onToggleSound}
                            className="p-2.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800/80 transition-all hover:scale-105 active:scale-95 shadow-lg"
                            title={soundEnabled ? "Mute" : "Unmute"}
                        >
                            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>

                        {/* Breed Selector for dogs */}
                        {species === 'dog' && (
                            <div className="relative group">
                                <button className="px-3 py-2 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800/80 transition-all hover:scale-105 shadow-lg flex items-center gap-2">
                                    <span className="text-xs font-bold opacity-60">BREED:</span>
                                    <span className="text-xs font-bold text-amber-400 capitalize">{breed || 'labrador'}</span>
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-36 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                                    {['labrador', 'shepherd', 'pug'].map((b) => (
                                        <button
                                            key={b}
                                            onClick={() => setBreed?.(b)}
                                            className="px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 rounded-lg capitalize transition-colors"
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Exit Building Button */}
                        {indoorLocation && (
                            <button
                                onClick={onExitBuilding}
                                className="px-3 py-2 rounded-xl bg-red-500/80 backdrop-blur-md border border-white/10 text-white font-bold text-sm hover:bg-red-600 transition-all hover:scale-105 active:scale-95 shadow-lg"
                            >
                                EXIT
                            </button>
                        )}
                    </div>
                </div>
            </div>



            {/* Right Sidebar: Stats - moved from bottom-left to avoid overlapping viewport */}
            <div className="absolute top-48 right-6 z-20 pointer-events-none">
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-2xl w-[220px]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white/70 text-xs font-bold uppercase tracking-widest">Pet Stats</h3>
                        <button
                            onClick={() => {
                                sendMessage("How do I improve my pet's stats?");
                                if (!isOpen) toggleOpen();
                            }}
                            className="text-white/50 hover:text-white transition-colors"
                        >
                            <HelpCircle size={14} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        <StatBar
                            label="Hunger"
                            value={hunger}
                            color="#fbbf24"
                            icon={<Heart size={16} className="text-amber-400" />}
                        />
                        <StatBar
                            label="Happiness"
                            value={happiness}
                            color="#60a5fa"
                            icon={<Sparkles size={16} className="text-blue-400" />}
                        />
                        <StatBar
                            label="Energy"
                            value={energy}
                            color="#34d399"
                            icon={<Zap size={16} className="text-emerald-400" />}
                        />
                        <StatBar
                            label="Clean"
                            value={cleanliness}
                            color="#38bdf8"
                            icon={<Droplets size={16} className="text-sky-400" />}
                        />
                    </div>
                </div>
            </div>

            {/* Enter Building Button - above actions when near a building */}
            {nearbyBuilding && !indoorLocation && !droneActive && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                    <button
                        onClick={() => onEnterBuilding?.(nearbyBuilding)}
                        className="
                            flex items-center gap-3 px-8 py-4
                            bg-gradient-to-r from-green-600 to-emerald-600
                            hover:from-green-500 hover:to-emerald-500
                            text-white font-bold text-lg
                            rounded-2xl shadow-2xl
                            border-2 border-green-400/50
                            transform transition-all duration-200
                            hover:scale-105 hover:-translate-y-1
                            active:scale-95
                            animate-pulse
                        "
                        style={{
                            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4), 0 0 0 4px rgba(34, 197, 94, 0.2)'
                        }}
                    >
                        <span className="text-2xl">{nearbyZoneConfig?.icon ? (nearbyZoneConfig.icon.length < 3 ? nearbyZoneConfig.icon : BUILDING_ICONS[nearbyBuilding] || '📍') : (BUILDING_ICONS[nearbyBuilding] || '📍')}</span>
                        <span>{nearbyZoneConfig?.label || `Enter ${BUILDING_NAMES[nearbyBuilding] || 'Building'}`}</span>
                        <DoorOpen size={24} />
                    </button>
                </div>
            )}

            {/* Bottom-center: Actions - centered to not overlap viewport */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                <div className="flex gap-3 bg-slate-900/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl">
                    {!indoorLocation ? (
                        <>
                            <ActionButton
                                label="Feed ($5)"
                                action="feed"
                                disabled={!!(disabled || droneActive)}
                                onAction={onAction}
                                icon={<Heart size={20} />}
                            />
                            <ActionButton
                                label="Play ($10)"
                                action="play"
                                disabled={!!(disabled || droneActive)}
                                onAction={onAction}
                                icon={<Sparkles size={20} />}
                            />
                            <ActionButton
                                label="Rest"
                                action="rest"
                                disabled={!!(disabled || droneActive)}
                                onAction={onAction}
                                icon={<Zap size={20} />}
                                isFree={true}
                            />
                            <ActionButton
                                label="Bathe ($3)"
                                action="bathe"
                                disabled={!!(disabled || droneActive)}
                                onAction={onAction}
                                icon={<Droplets size={20} />}
                            />
                        </>
                    ) : (
                        <div className="flex flex-col gap-2 bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl">
                            <h4 className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">Building Activity</h4>
                            <div className="flex gap-3">
                                {indoorLocation === 'agility' && (
                                    <button
                                        onClick={() => onActivity?.('agility')}
                                        className="px-6 py-3 bg-indigo-600 rounded-xl text-white font-bold hover:bg-indigo-500 transition-all shadow-lg border border-white/10"
                                    >
                                        Start Agility Drill
                                    </button>
                                )}
                                {indoorLocation === 'center' && (
                                    <>
                                        <button
                                            onClick={() => onActivity?.('budget')}
                                            className="px-6 py-3 bg-emerald-600 rounded-xl text-white font-bold hover:bg-emerald-500 transition-all shadow-lg border border-white/10"
                                        >
                                            View Budget Plan
                                        </button>
                                        <button
                                            onClick={() => onActivity?.('savings')}
                                            className="px-6 py-3 bg-sky-600 rounded-xl text-white font-bold hover:bg-sky-500 transition-all shadow-lg border border-white/10"
                                        >
                                            Open Savings Goal
                                        </button>
                                    </>
                                )}
                                {indoorLocation === 'vet' && (
                                    <button
                                        onClick={() => onActivity?.('vet')}
                                        className="px-6 py-3 bg-red-600 rounded-xl text-white font-bold hover:bg-red-500 transition-all shadow-lg border border-white/10"
                                    >
                                        Perform Health Scan
                                    </button>
                                )}
                                {indoorLocation === 'play' && (
                                    <button
                                        onClick={() => onActivity?.('play_session')}
                                        className="px-6 py-3 bg-blue-600 rounded-xl text-white font-bold hover:bg-blue-500 transition-all shadow-lg border border-white/10"
                                    >
                                        Join Play Session
                                    </button>
                                )}
                                {indoorLocation === 'rest' && (
                                    <button
                                        onClick={() => onActivity?.('hibernate')}
                                        className="px-6 py-3 bg-amber-600 rounded-xl text-white font-bold hover:bg-amber-500 transition-all shadow-lg border border-white/10"
                                    >
                                        Deep Hibernate
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Drone Instructions Overlay */}
            {droneActive && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
                        <h3 className="text-xl font-bold text-amber-400 mb-2">DRONE MODE ACTIVE</h3>
                        <div className="flex flex-col gap-1 text-white/90 text-sm">
                            <p>Click to Lock Mouse & Start Flying</p>
                            <div className="mt-4 flex gap-4 justify-center text-xs text-white/60">
                                <div className="flex flex-col items-center">
                                    <span className="px-2 py-1 bg-white/20 rounded mb-1">WASD / ARROWS</span>
                                    <span>Move</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="px-2 py-1 bg-white/20 rounded mb-1">MOUSE</span>
                                    <span>Look</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="px-2 py-1 bg-white/20 rounded mb-1">SPACE/SHIFT</span>
                                    <span>Up/Down</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="px-2 py-1 bg-white/20 rounded mb-1">ESC</span>
                                    <span>Unlock Mouse</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
