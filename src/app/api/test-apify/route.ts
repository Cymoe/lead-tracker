import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { runId } = await request.json();

    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }

    const apifyApiKey = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
    
    if (!apifyApiKey) {
      return NextResponse.json({ error: 'Apify API key not configured' }, { status: 500 });
    }

    // First, get the run details to find the dataset ID
    const runUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyApiKey}`;
    const runResponse = await fetch(runUrl);
    
    if (!runResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch run details' }, { status: runResponse.status });
    }

    const runData = await runResponse.json();
    const datasetId = runData.data?.defaultDatasetId;

    if (!datasetId) {
      return NextResponse.json({ error: 'No dataset found for this run' }, { status: 404 });
    }

    // Fetch first 3 items to see structure
    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?limit=3&token=${apifyApiKey}`;
    const response = await fetch(datasetUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch dataset' }, { status: response.status });
    }

    const results = await response.json();

    // Return raw results to see structure
    return NextResponse.json({ 
      message: 'Raw Apify data structure',
      firstItem: results[0] || null,
      allKeys: results[0] ? Object.keys(results[0]) : [],
      sampleData: results
    });
  } catch (error) {
    console.error('Error testing Apify:', error);
    return NextResponse.json({ error: 'Failed to test Apify data' }, { status: 500 });
  }
}