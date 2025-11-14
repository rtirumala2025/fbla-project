/**
 * API client for AI art generation feature
 * Handles generating pet artwork with accessories
 */
import { apiRequest } from './httpClient';
import type { ArtGenerationRequest, ArtGenerationResponse } from '../types/art';

const BASE_PATH = '/api/art';
const useMock = process.env.REACT_APP_USE_MOCK === 'true';

// Generate mock art (placeholder base64 image - 1x1 transparent pixel)
const MOCK_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Generate mock art response
function generateMockArt(payload: ArtGenerationRequest): ArtGenerationResponse {
  return {
    image_base64: MOCK_IMAGE_BASE64,
    cached: false,
    prompt: `A cute ${payload.accessory_ids.length > 0 ? 'accessorized' : ''} pet portrait in a vibrant, cheerful style`,
    style: 'cartoon',
    accessory_ids: payload.accessory_ids,
    mood: 'happy',
    palette: {
      happy: '#fbbf24',
      calm: '#60a5fa',
      excited: '#f87171',
    },
    created_at: new Date().toISOString(),
  };
}

export async function generatePetArt(payload: ArtGenerationRequest): Promise<ArtGenerationResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate generation time
    return generateMockArt(payload);
  }

  try {
    return await apiRequest<ArtGenerationResponse>(`${BASE_PATH}/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Art generation API unavailable, using mock data', error);
    return generateMockArt(payload);
  }
}

