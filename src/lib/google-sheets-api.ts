import { Lead } from '@/types';
import toast from 'react-hot-toast';

interface GoogleSheetsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data?: any;
}

export class GoogleSheetsAPI {
  private scriptUrl: string;

  constructor(scriptUrl: string) {
    this.scriptUrl = scriptUrl;
  }

  /**
   * Send a request to the Google Apps Script
   */
  private async sendRequest(data: any): Promise<GoogleSheetsResponse> {
    try {
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script doesn't support CORS
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Since we're using no-cors mode, we can't read the response
      // We'll assume success if no error was thrown
      return {
        success: true,
        message: 'Request sent successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Google Sheets API error:', error);
      throw new Error('Failed to connect to Google Sheets');
    }
  }

  /**
   * Send a request with CORS support (requires script to be configured properly)
   */
  private async sendRequestWithCORS(data: any): Promise<GoogleSheetsResponse> {
    try {
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Google Sheets API error:', error);
      
      // If CORS fails, fall back to no-cors mode
      if (error instanceof TypeError && error.message.includes('CORS')) {
        return this.sendRequest(data);
      }
      
      throw error;
    }
  }

  /**
   * Set up the Google Sheets with required structure
   */
  async setup(): Promise<GoogleSheetsResponse> {
    return this.sendRequestWithCORS({
      action: 'setup',
    });
  }

  /**
   * Add multiple leads to Google Sheets
   */
  async addLeads(leads: Lead[]): Promise<GoogleSheetsResponse> {
    return this.sendRequestWithCORS({
      action: 'addLeads',
      leads: leads,
    });
  }

  /**
   * Update a single lead in Google Sheets
   */
  async updateLead(lead: Lead): Promise<GoogleSheetsResponse> {
    return this.sendRequestWithCORS({
      action: 'updateLead',
      lead: lead,
    });
  }

  /**
   * Get statistics from Google Sheets
   */
  async getStats(): Promise<GoogleSheetsResponse> {
    return this.sendRequestWithCORS({
      action: 'getStats',
    });
  }

  /**
   * Test the connection to Google Sheets
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.scriptUrl);
      return response.ok || response.type === 'opaque'; // opaque means no-cors succeeded
    } catch (error) {
      return false;
    }
  }
}

/**
 * Sync leads to Google Sheets
 */
export async function syncLeadsToGoogleSheets(
  leads: Lead[],
  scriptUrl: string,
  options: {
    onProgress?: (progress: number) => void;
    batchSize?: number;
  } = {}
): Promise<void> {
  const { onProgress, batchSize = 50 } = options;
  const api = new GoogleSheetsAPI(scriptUrl);

  try {
    // Test connection first
    const isConnected = await api.testConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to Google Sheets. Please check your script URL.');
    }

    // Process leads in batches
    const totalBatches = Math.ceil(leads.length / batchSize);
    let processedCount = 0;

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, leads.length);
      const batch = leads.slice(start, end);

      try {
        await api.addLeads(batch);
        processedCount += batch.length;

        if (onProgress) {
          onProgress((processedCount / leads.length) * 100);
        }
      } catch (error) {
        console.error(`Failed to sync batch ${i + 1}:`, error);
        // Continue with next batch even if one fails
      }

      // Add a small delay between batches to avoid rate limiting
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    toast.success(`Synced ${processedCount} leads to Google Sheets`);
  } catch (error) {
    console.error('Sync error:', error);
    toast.error('Failed to sync leads to Google Sheets');
    throw error;
  }
}

/**
 * Set up automatic sync for new leads
 */
export function setupAutoSync(scriptUrl: string) {
  // This would typically use a webhook or polling mechanism
  // For now, we'll provide a manual sync option
  return {
    stop: () => {
      // Stop auto-sync
    },
  };
}