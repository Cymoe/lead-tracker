#!/usr/bin/env node

// Simple test to verify Apify contact extraction works

require('dotenv').config({ path: '.env.local' });

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

if (!APIFY_TOKEN) {
  console.error('❌ APIFY_API_TOKEN not found in .env.local');
  process.exit(1);
}

async function testSimpleSearch() {
  console.log('🚀 Testing Apify Contact Extraction...\n');

  // Very minimal search to isolate the issue
  const input = {
    searchStringsArray: ['turf in Phoenix, AZ'],
    locationQuery: 'Phoenix, AZ',
    maxCrawledPlacesPerSearch: 3, // Just 3 results
    language: 'en',
    scrapeContacts: true // The problematic parameter
  };

  try {
    console.log('📍 Starting actor with input:', JSON.stringify(input, null, 2));
    
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      }
    );

    const responseText = await runResponse.text();
    
    if (!runResponse.ok) {
      console.error('❌ Failed to start actor');
      console.error('Status:', runResponse.status);
      console.error('Response:', responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('Raw response:', responseText);
      }
      
      return;
    }

    const runData = JSON.parse(responseText);
    console.log('✅ Actor started successfully!');
    console.log('Run ID:', runData.data.id);
    console.log('Status:', runData.data.status);
    
    // Wait a bit and check status
    console.log('\n⏳ Waiting 10 seconds before checking status...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const statusResponse = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs/${runData.data.id}?token=${APIFY_TOKEN}`
    );
    
    const statusData = await statusResponse.json();
    console.log('\nCurrent status:', statusData.data.status);
    
    if (statusData.data.statusMessage) {
      console.log('Status message:', statusData.data.statusMessage);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testSimpleSearch();