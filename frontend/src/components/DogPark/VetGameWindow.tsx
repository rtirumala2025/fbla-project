/**
 * VetGameWindow.tsx
 * 
 * Vet Clinic Service Menu
 * Replaces the reaction minigame.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Heart, Zap, Sparkles } from 'lucide-react';
import { BuildingInteractionWindow } from './BuildingInteractionWindow';
import { usePet } from '@/context/PetContext';
import { ACTIONS } from '@/config/gameConfig';
import './building-windows.css';

interface VetGameWindowProps {
    isOpen: boolean;
    onClose: () => void;
    petName?: string;
    walletBalance?: number;
}

const SERVICES = [
    {
        key: 'VET_CHECKUP',
        label: 'General Checkup',
        desc: 'Routine health exam.',
        icon: '📋',
        action: ACTIONS.VET_CHECKUP
    },
    {
        key: 'VET_MEDICINE',
        label: 'Medicine',
        desc: 'Treat sickness and boost health.',
        icon: '💊',
        action: ACTIONS.VET_MEDICINE
    },
    {
        key: 'VET_SURGERY',
        label: 'Emergency Surgery',
        desc: 'Major operation for critical health.',
        icon: '🏥',
        action: ACTIONS.VET_SURGERY
    },
] as const;

export function VetGameWindow({
    isOpen,
    onClose,
    petName = 'Your pet',
    walletBalance = 0
}: VetGameWindowProps) {
    const { performAction, pet } = usePet();

    const handleService = async (key: string, cost: number) => {
        if (walletBalance < cost) {
            // Should be handled by UI disable state, but double check
            return;
        }
        await performAction(key as any);
        // Optional: Keep window open or close?
        // User might want to buy multiple things?
        // Let's keep it open but show feedback?
        // performAction handles alerts for success/fail usually via performAction wrapper or we add logic?
        // PetContext performAction calls statAction which calls updateStats.
        // It does NOT show UI feedback (toast).
        // Maybe we should add a toast here or use the existing successToast in parent?

        // For now, close on success is simple 
        onClose();
    };

    return (
        <BuildingInteractionWindow
            isOpen={isOpen}
            onClose={onClose}
            title="Vet Clinic"
            icon={<Stethoscope />}
            width={500}
            minHeight={400}
        >
            <div style={{ padding: 20, textAlign: 'center', color: '#fff' }}>
                <h2 style={{ marginBottom: 8 }}>🏥 City Vet Clinic</h2>
                <p style={{ color: '#94a3b8', marginBottom: 24 }}>
                    Welcome! How can we help {petName} today?
                </p>

                {/* Balance Display */}
                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '8px 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 32,
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <span>💳 Balance:</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '1.1rem' }}>${walletBalance}</span>
                </div>

                {/* Services Grid */}
                <div style={{ display: 'grid', gap: 16 }}>
                    {SERVICES.map((service) => {
                        const canAfford = walletBalance >= service.action.cost;
                        return (
                            <motion.button
                                key={service.key}
                                whileHover={canAfford ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
                                whileTap={canAfford ? { scale: 0.98 } : {}}
                                onClick={() => canAfford && handleService(service.key, service.action.cost)}
                                disabled={!canAfford}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'rgba(30, 41, 59, 0.6)',
                                    border: `1px solid ${canAfford ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.3)'}`,
                                    borderRadius: 16,
                                    padding: 16,
                                    cursor: canAfford ? 'pointer' : 'not-allowed',
                                    opacity: canAfford ? 1 : 0.6,
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ fontSize: '2rem' }}>{service.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: canAfford ? '#fff' : '#ef4444' }}>
                                            {service.label}
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                            {service.desc}
                                            <span style={{ marginLeft: 8, color: '#10b981' }}>
                                                (+{service.action.effects.health} Health)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: 700,
                                    color: canAfford ? '#fbbf24' : '#ef4444',
                                    fontSize: '1.1rem',
                                    minWidth: 80,
                                    textAlign: 'right'
                                }}>
                                    ${service.action.cost}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <p style={{ marginTop: 24, fontSize: '0.85rem', color: '#64748b' }}>
                    Emergency services available 24/7.
                </p>
            </div>
        </BuildingInteractionWindow>
    );
}

export default VetGameWindow;
