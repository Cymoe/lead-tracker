#!/usr/bin/env node
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const runId = process.argv[2];
if (!runId) {
  console.error('Usage: npm run test-apify <run-id>');
  process.exit(1);
}

async function testApifyInput() {
  const apifyApiKey = process.env.APIFY_API_TOKEN || process.env.APIFY_API_KEY;
  
  if (!apifyApiKey) {
    console.error('Apify API key not found in environment');
    return;
  }

  console.log('Testing Apify run:', runId);
  
  // Get run details
  const runUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyApiKey}`;
  const runResponse = await fetch(runUrl);
  
  if (!runResponse.ok) {
    console.error('Failed to fetch run:', runResponse.status);
    return;
  }
  
  const runData = await runResponse.json();
  console.log('\nRun data:', {
    id: runData.data.id,
    actId: runData.data.actId,
    status: runData.data.status,
    defaultKeyValueStoreId: runData.data.defaultKeyValueStoreId
  });
  
  // Get input data
  if (runData.data?.defaultKeyValueStoreId) {
    const inputUrl = `https://api.apify.com/v2/key-value-stores/${runData.data.defaultKeyValueStoreId}/records/INPUT?token=${apifyApiKey}`;
    const inputResponse = await fetch(inputUrl);
    
    if (inputResponse.ok) {
      const inputData = await inputResponse.json();
      console.log('\nInput data keys:', Object.keys(inputData));
      console.log('\nRelevant fields:');
      console.log('- locationQuery:', inputData.locationQuery);
      console.log('- searchString:', inputData.searchString);
      console.log('- location:', inputData.location);
      console.log('- searchStringsArray:', inputData.searchStringsArray);
      console.log('- coordinates:', inputData.coordinates);
      console.log('- customGeolocation:', inputData.customGeolocation);
      
      // Show all fields for debugging
      console.log('\nAll input fields:', JSON.stringify(inputData, null, 2));
    }
  }
}

testApifyInput().catch(console.error);