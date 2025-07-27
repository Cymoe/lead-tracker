import { AdPlatformStatus } from '@/types';

export async function checkAdPlatform(
  leadId: string,
  platform: string,
  companyName: string,
  location?: string
): Promise<AdPlatformStatus> {
  try {
    const response = await fetch('/api/check-ad-platforms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId,
        platforms: [platform],
        companyName,
        location,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check ad platform');
    }

    const data = await response.json();
    return data.results[0];
  } catch (error) {
    console.error('Error checking ad platform:', error);
    throw error;
  }
}

export async function checkMultipleAdPlatforms(
  leadId: string,
  platforms: string[],
  companyName: string,
  location?: string
): Promise<AdPlatformStatus[]> {
  try {
    const response = await fetch('/api/check-ad-platforms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId,
        platforms,
        companyName,
        location,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check ad platforms');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error checking ad platforms:', error);
    throw error;
  }
} 