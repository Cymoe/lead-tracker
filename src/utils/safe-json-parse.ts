export async function safeJsonParse(response: Response): Promise<{ data: any; error?: string }> {
  try {
    const text = await response.text();
    
    // If empty response, return empty object
    if (!text) {
      return { data: {} };
    }
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      return { data };
    } catch (parseError) {
      // If JSON parsing fails, return the text as error
      console.error('Failed to parse JSON response:', text);
      return { 
        data: null, 
        error: `Invalid JSON response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`
      };
    }
  } catch (readError) {
    console.error('Failed to read response body:', readError);
    return { 
      data: null, 
      error: 'Failed to read response body' 
    };
  }
}