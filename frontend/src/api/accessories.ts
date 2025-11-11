import { apiRequest } from './httpClient';
import type {
  Accessory,
  AccessoryEquipPayload,
  AccessoryEquipResponse,
  AccessoryListResponse,
} from '@/types/accessories';

const BASE_PATH = '/api/accessories';

export async function fetchAccessories(): Promise<Accessory[]> {
  const response = await apiRequest<AccessoryListResponse>(BASE_PATH);
  return response.accessories;
}

export async function equipAccessory(payload: AccessoryEquipPayload): Promise<AccessoryEquipResponse> {
  return apiRequest<AccessoryEquipResponse>(`${BASE_PATH}/equip`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

