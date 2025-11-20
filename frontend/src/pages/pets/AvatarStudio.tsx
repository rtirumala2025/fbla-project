import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, RefreshCcw, WifiOff, Box } from 'lucide-react';

import { fetchPet } from '../../api/pets';
import { fetchAccessories } from '../../api/accessories';
import { generatePetArt } from '../../api/art';
import type { Accessory, AccessoryEquipResponse } from '../../types/accessories';
import type { Pet } from '../../types/pet';
import type { ArtGenerationResponse } from '../../types/art';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Pet3D } from '../../components/pets/Pet3D';
import { Closet } from '../../components/pets/Closet';

const CACHE_PREFIX = 'pet-art-cache:';

export const AvatarStudio: React.FC = () => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [equippedAccessories, setEquippedAccessories] = useState<AccessoryEquipResponse[]>([]);
  const [generatedArt, setGeneratedArt] = useState<ArtGenerationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'closet' | 'art'>('closet');
  const offline = useOfflineStatus();
  const toast = useToast();

  // Handle accessories change from Closet component
  const handleAccessoriesChange = useCallback((accessories: AccessoryEquipResponse[]) => {
    console.log('🔄 AvatarStudio: Accessories updated', {
      count: accessories.length,
      accessories: accessories.map((acc) => acc.accessory_id),
    });
    setEquippedAccessories(accessories);
  }, []);

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
        const [petResponse, accessoryList] = await Promise.all([
          fetchPet().catch(() => null), // Will return mock data
          fetchAccessories().catch(() => []), // Will return mock data
        ]);
        if (petResponse) {
          setPet(petResponse);
        }
        if (accessoryList.length > 0) {
          setAccessories(accessoryList);
        }
      } catch (error) {
        console.error('Failed to load avatar studio', error);
        // Don't show toast - APIs will fallback to mock data automatically
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

    const accessoryIds = equippedAccessories.map((item) => item.accessory_id);
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
      console.error('Failed to generate art', error);
      // Don't show toast - API will fallback to mock data automatically
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

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Closet Panel */}
        <section className="rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <Box size={20} className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Closet</h2>
          </div>
          {pet && (
            <Closet pet={pet} onAccessoriesChange={handleAccessoriesChange} className="h-[600px]" />
          )}
        </section>

        {/* 3D Pet View */}
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">3D Pet View</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('closet')}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                  activeTab === 'closet'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Closet
              </button>
              <button
                onClick={() => setActiveTab('art')}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                  activeTab === 'art'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                AI Art
              </button>
            </div>
          </div>

          {activeTab === 'closet' ? (
            <div className="h-[600px] rounded-xl border border-slate-200 bg-slate-50">
              {pet && (
                <Pet3D pet={pet} accessories={equippedAccessories} className="h-full w-full" />
              )}
            </div>
          ) : (
            <div className="flex min-h-[600px] flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">AI Portrait</h3>
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

              <div className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white">
                {generatedArt ? (
                  <img
                    src={generatedArt.image_base64}
                    alt={`${pet.name} AI avatar`}
                    className="max-h-[500px] max-w-full rounded-xl object-contain shadow-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Sparkles size={28} />
                    <p className="text-sm">Generate your pet's AI portrait to see it here.</p>
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
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default AvatarStudio;

