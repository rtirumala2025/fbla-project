/**
 * Closet Component
 * Allows users to select, equip, and remove accessories
 * Displays available accessories with real-time updates
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Check, X, Loader2, Sparkles } from 'lucide-react';
import { fetchAccessories, equipAccessory } from '../../api/accessories';
import type { Accessory, AccessoryEquipResponse } from '../../types/accessories';
import type { Pet } from '../../types/pet';
import { useToast } from '../../contexts/ToastContext';
import { useAccessoriesRealtime } from '../../hooks/useAccessoriesRealtime';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ClosetProps {
  pet: Pet;
  onAccessoriesChange?: (accessories: AccessoryEquipResponse[]) => void;
  className?: string;
}

export const Closet: React.FC<ClosetProps> = ({ pet, onAccessoriesChange, className = '' }) => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [equipped, setEquipped] = useState<Record<string, AccessoryEquipResponse>>({});
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState<string | null>(null);
  const toast = useToast();

  // Load initial accessories
  const loadAccessories = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📦 Closet: Loading accessories for pet', pet.id);
      
      const [accessoryList] = await Promise.all([
        fetchAccessories().catch(() => []),
      ]);

      if (accessoryList.length > 0) {
        setAccessories(accessoryList);
        console.log('✅ Closet: Loaded accessories', { count: accessoryList.length });
      }
    } catch (error) {
      console.error('❌ Closet: Failed to load accessories', error);
      toast.error('Failed to load accessories');
    } finally {
      setLoading(false);
    }
  }, [pet.id, toast]);

  // Load equipped accessories from Supabase
  const loadEquippedAccessories = useCallback(async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase
        .from('user_accessories')
        .select('*')
        .eq('pet_id', pet.id)
        .eq('equipped', true);

      if (error) {
        console.error('❌ Closet: Failed to load equipped accessories', error);
        return;
      }

      if (data) {
        const equippedMap: Record<string, AccessoryEquipResponse> = {};
        data.forEach((item) => {
          equippedMap[item.accessory_id] = {
            accessory_id: item.accessory_id,
            pet_id: item.pet_id,
            equipped: item.equipped,
            equipped_color: item.equipped_color,
            equipped_slot: item.equipped_slot,
            applied_mood: item.applied_mood || 'happy',
            updated_at: item.updated_at,
          };
        });
        setEquipped(equippedMap);
        console.log('✅ Closet: Loaded equipped accessories', {
          count: Object.keys(equippedMap).length,
          accessories: Object.keys(equippedMap),
        });
      }
    } catch (error) {
      console.error('❌ Closet: Error loading equipped accessories', error);
    }
  }, [pet.id]);

  // Handle equip/unequip
  const handleToggleEquip = useCallback(
    async (accessoryId: string, shouldEquip: boolean) => {
      if (!pet) {
        toast.error('No pet selected');
        return;
      }

      try {
        setEquipping(accessoryId);
        const accessory = accessories.find((a) => a.accessory_id === accessoryId);
        const action = shouldEquip ? 'equip' : 'unequip';

        console.log(`🔄 Closet: ${action}ing accessory`, {
          accessoryId,
          accessoryName: accessory?.name,
          petId: pet.id,
        });

        const response = await equipAccessory({
          accessory_id: accessoryId,
          pet_id: pet.id,
          equipped: shouldEquip,
        });

        setEquipped((prev) => ({
          ...prev,
          [accessoryId]: response,
        }));

        console.log(`✅ Closet: Accessory ${action}ed successfully`, {
          accessoryId,
          response,
        });

        if (shouldEquip) {
          toast.success(`Equipped ${accessory?.name || 'accessory'}!`);
        } else {
          toast.info(`Removed ${accessory?.name || 'accessory'}.`);
        }

        // Notify parent component
        if (onAccessoriesChange) {
          const allEquipped = Object.values({ ...equipped, [accessoryId]: response }).filter(
            (acc) => acc.equipped
          );
          onAccessoriesChange(allEquipped);
        }
      } catch (error) {
        console.error(`❌ Closet: Failed to ${shouldEquip ? 'equip' : 'unequip'} accessory`, error);
        toast.error(`Failed to ${shouldEquip ? 'equip' : 'remove'} accessory`);
      } finally {
        setEquipping(null);
      }
    },
    [pet, accessories, equipped, toast, onAccessoriesChange]
  );

  // Subscribe to real-time updates
  useAccessoriesRealtime(pet.id, (updatedAccessories) => {
    console.log('🔄 Closet: Real-time update received', updatedAccessories);
    const equippedMap: Record<string, AccessoryEquipResponse> = {};
    updatedAccessories.forEach((acc) => {
      if (acc.equipped) {
        equippedMap[acc.accessory_id] = acc;
      }
    });
    setEquipped(equippedMap);

    if (onAccessoriesChange) {
      onAccessoriesChange(updatedAccessories.filter((acc) => acc.equipped));
    }
  });

  // Load data on mount
  useEffect(() => {
    loadAccessories();
    loadEquippedAccessories();
  }, [loadAccessories, loadEquippedAccessories]);

  // Group accessories by type
  const accessoriesByType = useMemo(() => {
    const grouped: Record<string, Accessory[]> = {};
    accessories.forEach((acc) => {
      if (!grouped[acc.type]) {
        grouped[acc.type] = [];
      }
      grouped[acc.type].push(acc);
    });
    return grouped;
  }, [accessories]);

  // Get equipped accessories list
  const equippedList = useMemo(
    () => Object.values(equipped).filter((acc) => acc.equipped),
    [equipped]
  );

  if (loading) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Package size={20} />
          Pet Closet
        </h2>
        <div className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
          {equippedList.length} equipped
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {Object.entries(accessoriesByType).map(([type, items]) => (
            <div key={type} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {type}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((accessory) => {
                  const isEquipped = equipped[accessory.accessory_id]?.equipped || false;
                  const isEquipping = equipping === accessory.accessory_id;

                  return (
                    <motion.div
                      key={accessory.accessory_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative rounded-lg border-2 p-4 transition-all ${
                        isEquipped
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                          {accessory.preview_url ? (
                            <img
                              src={accessory.preview_url}
                              alt={accessory.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <Sparkles size={24} className="text-indigo-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{accessory.name}</h4>
                          <p className="text-xs text-slate-500">{accessory.rarity}</p>
                          {accessory.effects && Object.keys(accessory.effects).length > 0 && (
                            <p className="mt-1 text-xs text-emerald-600">
                              {`+${Object.values(accessory.effects)[0]} ${Object.keys(accessory.effects)[0]}`}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleEquip(accessory.accessory_id, !isEquipped)}
                          disabled={isEquipping}
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                            isEquipped
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                          } disabled:opacity-50`}
                        >
                          {isEquipping ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : isEquipped ? (
                            <Check size={16} />
                          ) : (
                            <X size={16} />
                          )}
                        </button>
                      </div>
                      {isEquipped && equipped[accessory.accessory_id]?.equipped_color && (
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border border-slate-300"
                            style={{
                              backgroundColor: equipped[accessory.accessory_id].equipped_color || '#6366f1',
                            }}
                          />
                          <span className="text-xs text-slate-600">Equipped</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {equippedList.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-indigo-900">Currently Equipped</h3>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {equippedList.map((acc) => {
                const accessory = accessories.find((a) => a.accessory_id === acc.accessory_id);
                return (
                  <motion.span
                    key={acc.accessory_id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-indigo-700 shadow-sm"
                  >
                    {accessory?.name || 'Accessory'}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default Closet;
