import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, RefreshCcw, WifiOff, Palette } from 'lucide-react';

import { fetchPet } from '@/api/pets';
import { fetchAccessories, equipAccessory } from '@/api/accessories';
import { generatePetArt } from '@/api/art';
import type { Accessory, AccessoryEquipResponse } from '@/types/accessories';
import type { Pet } from '@/types/pet';
import type { ArtGenerationResponse } from '@/types/art';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const slotPositions: Record<string, React.CSSProperties> = {
  hat: { top: '12%', left: '50%', transform: 'translate(-50%, -50%)' },
  collar: { top: '68%', left: '50%', transform: 'translate(-50%, -50%)' },
  outfit: { top: '55%', left: '50%', transform: 'translate(-50%, -50%)' },
  default: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
};

const CACHE_PREFIX = 'pet-art-cache:';

type EquippedMap = Record<string, AccessoryEquipResponse>;

const fallbackAccessoryEmoji: Record<string, string> = {
  hat: '🎩',
  collar: '🧣',
  outfit: '🛡️',
};

function getAccessorySlotStyle(type: string): React.CSSProperties {
  return slotPositions[type] ?? slotPositions.default;
}

function getAccessoryEmoji(type: string): string {
  return fallbackAccessoryEmoji[type] ?? '✨';
}

export const AvatarStudio: React.FC = () => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [equipped, setEquipped] = useState<EquippedMap>({});
  const [generatedArt, setGeneratedArt] = useState<ArtGenerationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const offline = useOfflineStatus();
  const toast = useToast();

  const accessoryIndex = useMemo(() => {
    const map = new Map<string, Accessory>();
    accessories.forEach((item) => map.set(item.accessory_id, item));
    return map;
  }, [accessories]);

  const activeAccessories = useMemo(
    () => Object.values(equipped).filter((item) => item?.equipped),
    [equipped],
  );

  const cacheKey = pet ? `${CACHE_PREFIX}${pet.id}` : null;

  const loadCachedArt = useCallback(() => {
    if (!cacheKey) return null;
    try {
      const raw = window.localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ArtGenerationResponse;
      setGeneratedArt(parsed);
      return parsed;
    } catch (error) {
      console.warn('Failed to parse cached art', error);
      return null;
    }
  }, [cacheKey]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [petResponse, accessoryList] = await Promise.all([fetchPet(), fetchAccessories()]);
        setPet(petResponse);
        setAccessories(accessoryList);
      } catch (error) {
        console.error(error);
        toast.error('Unable to load avatar studio. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (offline.offline) {
      loadCachedArt();
    }
  }, [offline.offline, loadCachedArt]);

  useEffect(() => {
    if (cacheKey) {
      loadCachedArt();
    }
  }, [cacheKey, loadCachedArt]);

  const handleEquip = useCallback(
    async (accessoryId: string, shouldEquip: boolean) => {
      if (!pet) {
        toast.error('Create a pet to customize its avatar.');
        return;
      }
      try {
        const response = await equipAccessory({
          accessory_id: accessoryId,
          pet_id: pet.id,
          equipped: shouldEquip,
        });
        setEquipped((prev) => ({ ...prev, [accessoryId]: response }));
        const accessory = accessoryIndex.get(accessoryId);
        if (shouldEquip) {
          toast.success(`Equipped ${accessory?.name ?? 'accessory'}!`);
        } else {
          toast.info(`Removed ${accessory?.name ?? 'accessory'}.`);
        }
      } catch (error) {
        console.error(error);
        toast.error('Unable to update accessory. Please try again.');
      }
    },
    [pet, accessoryIndex, toast],
  );

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingId(null);
    const accessoryId = event.dataTransfer.getData('application/accessory-id');
    if (!accessoryId) return;
    await handleEquip(accessoryId, true);
  };

  const handleGenerateArt = async (forceRefresh = false) => {
    if (!pet) {
      toast.error('Create a pet to generate art.');
      return;
    }
    if (offline.offline && !cacheKey) {
      toast.error('Offline and no cached art available.');
      return;
    }
    if (offline.offline) {
      toast.info('Offline mode: displaying cached avatar.');
      loadCachedArt();
      return;
    }

    const accessoryIds = activeAccessories.map((item) => item.accessory_id);
    try {
      setIsGenerating(true);
      const art = await generatePetArt({
        pet_id: pet.id,
        accessory_ids: accessoryIds,
        force_refresh: forceRefresh,
      });
      setGeneratedArt(art);
      if (cacheKey) {
        window.localStorage.setItem(cacheKey, JSON.stringify(art));
      }
      toast.success(art.cached ? 'Loaded avatar from cache.' : 'Generated a fresh avatar!');
    } catch (error) {
      console.error(error);
      toast.error('Unable to generate art. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-10 shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-900">Let’s create a pet first</h2>
        <p className="mt-4 text-gray-600">
          Pet art customization unlocks once you have a companion. Head to the onboarding flow to adopt one!
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Avatar Studio</h1>
          <p className="mt-1 text-slate-600">
            Drag accessories onto {pet.name} and generate a unique AI portrait. Mood-based colors adapt automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {offline.offline && (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-amber-800">
              <WifiOff size={16} />
              Offline mode
            </span>
          )}
          <button
            onClick={() => handleGenerateArt(false)}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"
            disabled={isGenerating}
          >
            {isGenerating ? <LoadingSpinner size="sm" /> : <Sparkles size={18} />}
            {isGenerating ? 'Generating...' : 'Generate AI Avatar'}
          </button>
          <button
            onClick={() => handleGenerateArt(true)}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-4 py-2 text-indigo-600 transition hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-50"
            disabled={isGenerating || offline.offline}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr_1.2fr]">
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Palette size={18} />
            Accessory Drawer
          </h2>
          <p className="mt-1 text-sm text-slate-500">Drag items onto the avatar to equip them.</p>
          <div className="mt-5 flex flex-col gap-4">
            {accessories.map((item) => {
              const equippedState = equipped[item.accessory_id]?.equipped;
              return (
                <div
                  key={item.accessory_id}
                  className={`flex cursor-grab items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-300 ${
                    equippedState ? 'ring-2 ring-indigo-400' : ''
                  }`}
                  draggable
                  onDragStart={(event) => {
                    setDraggingId(item.accessory_id);
                    event.dataTransfer.setData('application/accessory-id', item.accessory_id);
                    event.dataTransfer.effectAllowed = 'copyMove';
                  }}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-inner">
                    {item.preview_url ? (
                      <img
                        src={item.preview_url}
                        alt={item.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      getAccessoryEmoji(item.type)
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{item.type}</p>
                  </div>
                  <button
                    className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
                    onClick={() => handleEquip(item.accessory_id, !equippedState)}
                  >
                    {equippedState ? 'Unequip' : 'Equip'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className={`relative flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 shadow-inner transition ${
            draggingId ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 bg-slate-50'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={handleDrop}
        >
          <div className="relative flex h-72 w-72 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 via-white to-indigo-50 shadow-xl">
            <div className="text-6xl">{pet.species === 'dragon' ? '🐲' : '🐾'}</div>
            <AnimatePresence>
              {activeAccessories.map((item) => {
                const accessory = accessoryIndex.get(item.accessory_id);
                if (!accessory) return null;
                return (
                  <motion.div
                    key={item.accessory_id}
                    initial={{ opacity: 0, scale: 0.8, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="absolute cursor-pointer rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur"
                    style={{
                      ...getAccessorySlotStyle(accessory.type),
                      boxShadow: `0 12px 30px -12px ${item.equipped_color ?? '#6366f1'}`,
                      background: item.equipped_color ?? '#ffffff',
                    }}
                    onClick={() => handleEquip(item.accessory_id, false)}
                    title="Click to unequip"
                  >
                    {accessory.name}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Drop accessories here or tap an equipped tag to remove it.
          </p>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">AI Portrait</h2>
              <p className="text-sm text-slate-500">
                {generatedArt?.cached ? 'Served from cache for instant load.' : 'Generate to see the latest look.'}
              </p>
            </div>
            {generatedArt && (
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {new Date(generatedArt.created_at).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            {generatedArt ? (
              <img
                src={generatedArt.image_base64}
                alt={`${pet.name} AI avatar`}
                className="max-h-[320px] max-w-full rounded-xl object-contain shadow-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Sparkles size={28} />
                <p className="text-sm">Generate your pet’s AI portrait to see it here.</p>
              </div>
            )}
          </div>

          {generatedArt?.palette && Object.keys(generatedArt.palette).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Mood Palette</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {Object.entries(generatedArt.palette).map(([mood, color]) => (
                  <div key={mood} className="flex items-center gap-2">
                    <span
                      className="h-5 w-5 rounded-full shadow-inner"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    <span className="text-xs uppercase tracking-wide text-slate-500">{mood}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-600">Prompt</p>
            <p className="mt-1 leading-relaxed">{generatedArt?.prompt ?? 'Prompt will appear after generation.'}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AvatarStudio;

