/**
 * Closet Component
 * Allows users to select, equip, and remove accessories
 * Displays available accessories with real-time updates
 * Includes color customization and filtering
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Check, X, Loader2, Sparkles, Search, Filter, Palette, Star } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState<Record<string, string>>({});
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

  // Filter and group accessories
  const filteredAccessories = useMemo(() => {
    return accessories.filter((acc) => {
      const matchesSearch = searchQuery === '' || 
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || acc.type === filterType;
      const matchesRarity = !filterRarity || acc.rarity === filterRarity;
      return matchesSearch && matchesType && matchesRarity;
    });
  }, [accessories, searchQuery, filterType, filterRarity]);

  // Group accessories by type
  const accessoriesByType = useMemo(() => {
    const grouped: Record<string, Accessory[]> = {};
    filteredAccessories.forEach((acc) => {
      if (!grouped[acc.type]) {
        grouped[acc.type] = [];
      }
      grouped[acc.type].push(acc);
    });
    return grouped;
  }, [filteredAccessories]);

  // Get unique types and rarities for filters
  const availableTypes = useMemo(() => {
    const types = new Set(accessories.map(acc => acc.type));
    return Array.from(types).sort();
  }, [accessories]);

  const availableRarities = useMemo(() => {
    const rarities = new Set(accessories.map(acc => acc.rarity));
    return Array.from(rarities).sort();
  }, [accessories]);

  // Handle color customization
  const handleColorChange = useCallback(async (accessoryId: string, color: string) => {
    if (!pet) return;
    
    try {
      setCustomColors(prev => ({ ...prev, [accessoryId]: color }));
      
      // If accessory is equipped, update it with new color
      if (equipped[accessoryId]?.equipped) {
        const response = await equipAccessory({
          accessory_id: accessoryId,
          pet_id: pet.id,
          equipped: true,
        });
        
        setEquipped((prev) => ({
          ...prev,
          [accessoryId]: { ...response, equipped_color: color },
        }));
        
        if (onAccessoriesChange) {
          const allEquipped = Object.values(equipped)
            .filter((acc) => acc.equipped)
            .map((acc) => acc.accessory_id === accessoryId 
              ? { ...acc, equipped_color: color }
              : acc
            );
          onAccessoriesChange(allEquipped);
        }
      }
    } catch (error) {
      console.error('Failed to update color', error);
      toast.error('Failed to update accessory color');
    }
  }, [pet, equipped, onAccessoriesChange, toast]);

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

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search accessories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Filter className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-8 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <select
            value={filterRarity || ''}
            onChange={(e) => setFilterRarity(e.target.value || null)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">All Rarities</option>
            {availableRarities.map((rarity) => (
              <option key={rarity} value={rarity}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.keys(accessoriesByType).length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <Package className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No accessories found</p>
              {(searchQuery || filterType || filterRarity) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType(null);
                    setFilterRarity(null);
                  }}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(accessoriesByType).map(([type, items]) => (
              <div key={type} className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {type} ({items.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {items.map((accessory) => {
                    const isEquipped = equipped[accessory.accessory_id]?.equipped || false;
                    const isEquipping = equipping === accessory.accessory_id;
                    const currentColor = customColors[accessory.accessory_id] || 
                      equipped[accessory.accessory_id]?.equipped_color || 
                      (accessory.color_palette && Object.values(accessory.color_palette)[0]) ||
                      '#6366f1';
                    const isColorPickerOpen = showColorPicker === accessory.accessory_id;

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
                          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                            {accessory.preview_url ? (
                              <img
                                src={accessory.preview_url}
                                alt={accessory.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <Sparkles size={24} className="text-indigo-500" />
                            )}
                            {accessory.rarity === 'legendary' && (
                              <Star className="absolute -right-1 -top-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">{accessory.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${
                                accessory.rarity === 'legendary' ? 'text-yellow-600' :
                                accessory.rarity === 'epic' ? 'text-purple-600' :
                                accessory.rarity === 'rare' ? 'text-blue-600' :
                                'text-slate-500'
                              }`}>
                                {accessory.rarity}
                              </span>
                            </div>
                            {accessory.effects && Object.keys(accessory.effects).length > 0 && (
                              <p className="mt-1 text-xs text-emerald-600">
                                {Object.entries(accessory.effects).map(([key, value]) => 
                                  `+${value} ${key}`
                                ).join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
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
                            {isEquipped && accessory.color_palette && Object.keys(accessory.color_palette).length > 0 && (
                              <button
                                onClick={() => setShowColorPicker(isColorPickerOpen ? null : accessory.accessory_id)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                                title="Customize color"
                              >
                                <Palette size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Color Picker */}
                        {isColorPickerOpen && accessory.color_palette && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3"
                          >
                            <p className="text-xs font-semibold text-slate-700">Choose Color</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(accessory.color_palette).map(([mood, color]) => (
                                <button
                                  key={mood}
                                  onClick={() => {
                                    handleColorChange(accessory.accessory_id, color);
                                    setShowColorPicker(null);
                                  }}
                                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                                    currentColor === color
                                      ? 'border-indigo-600 scale-110 shadow-md'
                                      : 'border-slate-300 hover:border-indigo-400 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  title={mood}
                                />
                              ))}
                              {/* Custom color input */}
                              <div className="relative">
                                <input
                                  type="color"
                                  value={currentColor}
                                  onChange={(e) => handleColorChange(accessory.accessory_id, e.target.value)}
                                  className="h-8 w-8 cursor-pointer rounded-full border-2 border-slate-300 opacity-0 absolute"
                                  style={{ backgroundColor: currentColor }}
                                />
                                <div
                                  className="h-8 w-8 rounded-full border-2 border-slate-300 cursor-pointer flex items-center justify-center"
                                  style={{ backgroundColor: currentColor }}
                                  title="Custom color"
                                >
                                  <Palette size={12} className="text-white drop-shadow" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {isEquipped && currentColor && (
                          <div className="mt-2 flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full border border-slate-300 shadow-sm"
                              style={{ backgroundColor: currentColor }}
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
        )}
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
