/**
 * HouseWindow.tsx
 * 
 * Multi-Room Hub for the Pet House building.
 * Features: Living Room (Rest/Play), Kitchen (Feeding), Bathroom (Hygiene), Closet (Accessories)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react';
import { BuildingInteractionWindow } from './BuildingInteractionWindow';
import { getInventory } from '../../api/finance';
import { apiRequest } from '../../api/httpClient';
import type { InventoryEntry } from '../../types/finance';
import './building-windows.css';

// Room components
import {
    RoomSwitcher,
    type RoomType,
    LivingRoom,
    KitchenView,
    BathroomView,
    ClosetView
} from './rooms';

interface HouseWindowProps {
    isOpen: boolean;
    onClose: () => void;
    petName?: string;
    petType?: 'dog' | 'cat' | 'panda';
    petBreed?: string;
    currentEnergy?: number;
    currentHygiene?: number;
    onSleepComplete?: (energyRestored: number) => void;
    onStatsUpdate?: () => void;
}

interface UseItemResponse {
    success: boolean;
    remaining_quantity: number;
    stat_updates: Record<string, number>;
    message: string;
}

interface EquipResponse {
    success: boolean;
    action: 'equipped' | 'unequipped';
    slot: string;
    item_id: string | null;
    equipped_loadout: Record<string, string>;
}

export function HouseWindow({
    isOpen,
    onClose,
    petName = 'Your pet',
    petType = 'dog',
    petBreed = 'labrador',
    currentEnergy = 50,
    currentHygiene = 50,
    onSleepComplete,
    onStatsUpdate,
}: HouseWindowProps) {
    const [activeRoom, setActiveRoom] = useState<RoomType>('living');
    const [inventory, setInventory] = useState<InventoryEntry[]>([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [equippedLoadout, setEquippedLoadout] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Filter inventory by usage type
    const foodItems = inventory.filter(item =>
        item.category?.toLowerCase() === 'food' ||
        item.category?.toLowerCase() === 'consumables'
    );
    const hygieneItems = inventory.filter(item =>
        item.category?.toLowerCase() === 'care' ||
        item.category?.toLowerCase() === 'hygiene' ||
        item.category?.toLowerCase() === 'health'
    );
    const toyItems = inventory.filter(item =>
        item.category?.toLowerCase() === 'toys' ||
        item.category?.toLowerCase() === 'toy'
    );
    const accessoryItems = inventory.filter(item =>
        item.category?.toLowerCase() === 'accessories'
    );

    // Load inventory on open
    useEffect(() => {
        if (isOpen) {
            loadInventory();
            loadEquippedLoadout();
        }
    }, [isOpen]);

    const loadInventory = async () => {
        setLoadingInventory(true);
        try {
            const data = await getInventory();
            setInventory(data);
        } catch (error) {
            console.error('Failed to load inventory:', error);
            setInventory([]);
        } finally {
            setLoadingInventory(false);
        }
    };

    const loadEquippedLoadout = async () => {
        try {
            const response = await apiRequest<Record<string, string>>('/api/pets/equipped', { method: 'GET' });
            setEquippedLoadout(response || {});
        } catch (error) {
            console.error('Failed to load equipped loadout:', error);
            setEquippedLoadout({});
        }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const useItem = useCallback(async (item: InventoryEntry) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const response = await apiRequest<UseItemResponse>(
                `/api/pets/inventory/${item.item_id}/use`,
                {
                    method: 'POST',
                    body: JSON.stringify({ quantity: 1 }),
                }
            );

            if (response.success) {
                showToast(response.message, 'success');

                // Update local inventory
                setInventory(prev => prev.map(i =>
                    i.item_id === item.item_id
                        ? { ...i, quantity: response.remaining_quantity }
                        : i
                ).filter(i => i.quantity > 0));

                // Notify parent to refresh stats
                onStatsUpdate?.();
            }
        } catch (error) {
            console.error('Failed to use item:', error);
            showToast('Failed to use item', 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, onStatsUpdate]);

    const toggleEquip = useCallback(async (item: InventoryEntry, slot: string) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const response = await apiRequest<EquipResponse>(
                `/api/pets/inventory/${item.item_id}/equip`,
                {
                    method: 'POST',
                    body: JSON.stringify({ slot }),
                }
            );

            if (response.success) {
                setEquippedLoadout(response.equipped_loadout);
                showToast(
                    response.action === 'equipped'
                        ? `Equipped ${item.item_name}!`
                        : `Unequipped ${item.item_name}`,
                    'success'
                );
            }
        } catch (error) {
            console.error('Failed to toggle equip:', error);
            showToast('Failed to equip/unequip item', 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing]);

    const handleQuickWash = useCallback(async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            // Call the bathe action
            await apiRequest('/api/pets/actions/bathe', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            showToast('Pet is now clean and fresh! 🫧', 'success');
            onStatsUpdate?.();
        } catch (error) {
            console.error('Quick wash failed:', error);
            showToast('Failed to wash pet', 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, onStatsUpdate]);

    return (
        <BuildingInteractionWindow
            isOpen={isOpen}
            onClose={onClose}
            title="Pet House"
            icon={<Home />}
            width={600}
            minHeight={480}
            fullBleed
        >
            {/* Toast notification */}
            {toast && (
                <div style={{
                    position: 'absolute',
                    top: 60,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: toast.type === 'success'
                        ? 'rgba(16, 185, 129, 0.9)'
                        : 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                    {toast.message}
                </div>
            )}

            {/* Full Container - Gradient background covers everything */}
            <div className={`h-full w-full flex flex-col overflow-hidden bg-gradient-to-b ${activeRoom === 'living' ? 'from-indigo-950 via-purple-900 to-orange-900' :
                    activeRoom === 'kitchen' ? 'from-orange-900 via-orange-600 to-amber-400' :
                        activeRoom === 'bathroom' ? 'from-sky-900 via-cyan-600 to-cyan-300' :
                            'from-slate-950 via-purple-950 to-indigo-950'
                }`}>
                {/* Room Switcher */}
                <div className="shrink-0 bg-black/20 border-b border-white/10">
                    <RoomSwitcher
                        activeRoom={activeRoom}
                        onRoomChange={setActiveRoom}
                    />
                </div>

                {/* Room Content - takes remaining space */}
                <AnimatePresence mode="wait">
                    {activeRoom === 'living' && (
                        <LivingRoom
                            key="living"
                            petName={petName}
                            petType={petType}
                            petBreed={petBreed}
                            currentEnergy={currentEnergy}
                            onSleepComplete={onSleepComplete}
                            toys={toyItems}
                            onUseToy={useItem}
                        />
                    )}

                    {activeRoom === 'kitchen' && (
                        <KitchenView
                            key="kitchen"
                            petName={petName}
                            petType={petType}
                            petBreed={petBreed}
                            foodItems={foodItems}
                            onFeedItem={useItem}
                            isFeeding={isProcessing}
                        />
                    )}

                    {activeRoom === 'bathroom' && (
                        <BathroomView
                            key="bathroom"
                            petName={petName}
                            petType={petType}
                            petBreed={petBreed}
                            hygieneItems={hygieneItems}
                            currentHygiene={currentHygiene}
                            onUseItem={useItem}
                            onQuickWash={handleQuickWash}
                            isWashing={isProcessing}
                        />
                    )}

                    {activeRoom === 'closet' && (
                        <ClosetView
                            key="closet"
                            petName={petName}
                            petType={petType}
                            petBreed={petBreed}
                            accessories={accessoryItems}
                            equippedLoadout={equippedLoadout}
                            onToggleEquip={toggleEquip}
                        />
                    )}
                </AnimatePresence>
            </div>
        </BuildingInteractionWindow>
    );
}

export default HouseWindow;
