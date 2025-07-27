import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');
  const apiKey = process.env.NEXT_PUBLIC_CENSUS_API_KEY;

  if (!endpoint) {
    return NextResponse.json({ error: 'No endpoint specified' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'Census API key not configured' }, { status: 500 });
  }

  try {
    // Construct the full Census API URL
    const censusUrl = `https://api.census.gov/data/${endpoint}`;
    const url = new URL(censusUrl);
    
    // Copy all search params except 'endpoint'
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        url.searchParams.append(key, value);
      }
    });
    
    // Always append the API key
    url.searchParams.append('key', apiKey);

    console.log('Proxying Census API request:', url.toString());

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('Census API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return NextResponse.json(
          { error: `Census API error: ${response.status}`, details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Census API request timed out');
        return NextResponse.json(
          { error: 'Census API request timed out' },
          { status: 504 }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Census API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Census data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}