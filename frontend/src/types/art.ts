export interface ArtGenerationRequest {
  pet_id: string;
  accessory_ids: string[];
  style?: string;
  force_refresh?: boolean;
}

export interface ArtGenerationResponse {
  image_base64: string;
  cached: boolean;
  prompt: string;
  style?: string | null;
  accessory_ids: string[];
  mood?: string | null;
  palette: Record<string, string>;
  created_at: string;
}

