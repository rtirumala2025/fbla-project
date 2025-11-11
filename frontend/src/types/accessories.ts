export interface Accessory {
  accessory_id: string;
  name: string;
  type: string;
  rarity: string;
  effects: Record<string, unknown>;
  color_palette: Record<string, string>;
  preview_url?: string | null;
}

export interface AccessoryListResponse {
  accessories: Accessory[];
}

export interface AccessoryEquipPayload {
  accessory_id: string;
  pet_id?: string | null;
  equipped: boolean;
}

export interface AccessoryEquipResponse {
  accessory_id: string;
  pet_id?: string | null;
  equipped: boolean;
  equipped_color?: string | null;
  equipped_slot?: string | null;
  applied_mood?: string | null;
  updated_at: string;
}

