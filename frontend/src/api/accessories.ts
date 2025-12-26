/**
 * API client for accessories feature
 * Handles fetching and equipping pet accessories
 */
import { apiRequest } from './httpClient';
import { cachedRequest } from '../utils/requestCache';
import { getEnv } from '../utils/env';
import type {
  Accessory,
  AccessoryEquipPayload,
  AccessoryEquipResponse,
  AccessoryListResponse,
} from '../types/accessories';

const BASE_PATH = '/api/accessories';
const useMock = getEnv('USE_MOCK', 'false') === 'true';

// Generate mock accessories
function generateMockAccessories(): Accessory[] {
  return [
    {
      accessory_id: 'hat-1',
      name: 'Wizard Hat',
      type: 'hat',
      rarity: 'rare',
      effects: { happiness: 5 },
      color_palette: { primary: '#6366f1', secondary: '#8b5cf6' },
      preview_url: null,
    },
    {
      accessory_id: 'collar-1',
      name: 'Golden Collar',
      type: 'collar',
      rarity: 'epic',
      effects: { health: 3 },
      color_palette: { primary: '#fbbf24', secondary: '#f59e0b' },
      preview_url: null,
    },
    {
      accessory_id: 'outfit-1',
      name: 'Adventure Vest',
      type: 'outfit',
      rarity: 'common',
      effects: { energy: 5 },
      color_palette: { primary: '#10b981', secondary: '#059669' },
      preview_url: null,
    },
  ];
}

export async function fetchAccessories(): Promise<Accessory[]> {
  return cachedRequest(
    'accessories-list',
    async () => {
      // Use mock data if in mock mode or if API fails
      if (useMock) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return generateMockAccessories();
      }

      try {
        const response = await apiRequest<AccessoryListResponse>(BASE_PATH);
        return response.accessories;
      } catch (error) {
        // Fallback to mock data if API fails
        return generateMockAccessories();
      }
    },
    60000 // Cache for 1 minute
  );
}

export async function equipAccessory(payload: AccessoryEquipPayload): Promise<AccessoryEquipResponse> {
  // Use mock response if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      accessory_id: payload.accessory_id,
      pet_id: payload.pet_id || null,
      equipped: payload.equipped,
      equipped_color: '#6366f1',
      equipped_slot: 'hat',
      applied_mood: 'happy',
      updated_at: new Date().toISOString(),
    };
  }

  try {
    return await apiRequest<AccessoryEquipResponse>(`${BASE_PATH}/equip`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Fallback to mock response if API fails
    return {
      accessory_id: payload.accessory_id,
      pet_id: payload.pet_id || null,
      equipped: payload.equipped,
      equipped_color: '#6366f1',
      equipped_slot: 'hat',
      applied_mood: 'happy',
      updated_at: new Date().toISOString(),
    };
  }
}

