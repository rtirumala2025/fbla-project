/**
 * API client for AI art generation feature
 * Handles generating pet artwork with accessories
 */
import { apiRequest } from './httpClient';
import type { ArtGenerationRequest, ArtGenerationResponse } from '../types/art';

const BASE_PATH = '/api/art';

export async function generatePetArt(payload: ArtGenerationRequest): Promise<ArtGenerationResponse> {
  return apiRequest<ArtGenerationResponse>(`${BASE_PATH}/generate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

