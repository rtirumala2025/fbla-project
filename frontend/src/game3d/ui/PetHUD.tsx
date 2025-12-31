import React from 'react';
import type { PetStats } from '@/types/pet';
import type { PetGame2Action } from '../core/SceneManager';
import { Heart, Sparkles, Zap } from 'lucide-react';

function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <div className="text-white/80 text-sm font-medium flex items-center gap-1.5">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="text-white/60 text-xs ml-auto">{Math.round(clamped)}%</span>
            </div>
            <div className="w-48 h-2 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{
                        width: `${clamped}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                        boxShadow: `0 0 8px ${color}66`
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
    icon
}: {
    label: string;
    action: PetGame2Action;
    disabled: boolean;
    onAction: (action: PetGame2Action) => void;
    icon: React.ReactNode;
}) {
    const colors = {
        feed: 'from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400',
        play: 'from-blue-400 to-cyan-500 hover:from-blue-300 hover:to-cyan-400',
        rest: 'from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400'
    };

    return (
        <button
            onClick={() => !disabled && onAction(action)}
            disabled={disabled}
            className={`
        relative px-6 py-3 rounded-xl font-semibold text-white
        bg-gradient-to-br ${colors[action]}
        shadow-lg hover:shadow-xl
        transform transition-all duration-200
        hover:scale-105 hover:-translate-y-0.5
        active:scale-95 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center gap-2
        border border-white/20
      `}
        >
            {icon}
            <span>{label}</span>
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
}: {
    petName: string;
    species: string;
    stats: PetStats | null;
    disabled: boolean;
    onAction: (action: PetGame2Action) => void;
}) {
    const hunger = stats?.hunger ?? 50;
    const happiness = stats?.happiness ?? 50;
    const energy = stats?.energy ?? 50;

    const speciesEmoji = species === 'panda' ? '🐼' : species === 'cat' ? '🐱' : '🐶';

    return (
        <>
            {/* Top-left: Pet Info */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <div className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="text-4xl">{speciesEmoji}</div>
                        <div>
                            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{petName}</h2>
                            <p className="text-sm text-white/70 capitalize">{species}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom-left: Stats */}
            <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
                <div className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl">
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
                    </div>
                </div>
            </div>

            {/* Bottom-right: Actions */}
            <div className="absolute bottom-6 right-6 z-10 pointer-events-auto">
                <div className="flex gap-3">
                    <ActionButton
                        label="Feed"
                        action="feed"
                        disabled={disabled}
                        onAction={onAction}
                        icon={<Heart size={20} />}
                    />
                    <ActionButton
                        label="Play"
                        action="play"
                        disabled={disabled}
                        onAction={onAction}
                        icon={<Sparkles size={20} />}
                    />
                    <ActionButton
                        label="Rest"
                        action="rest"
                        disabled={disabled}
                        onAction={onAction}
                        icon={<Zap size={20} />}
                    />
                </div>
            </div>
        </>
    );
}
