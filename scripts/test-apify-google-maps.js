#!/usr/bin/env node

// Test script for Apify Google Maps integration
// Usage: node scripts/test-apify-google-maps.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

if (!APIFY_TOKEN) {
  console.error('❌ APIFY_API_TOKEN environment variable not set');
  console.error('Please add it to your .env.local file:');
  console.error('APIFY_API_TOKEN=your_token_here');
  process.exit(1);
}

async function testApifyGoogleMaps() {
  console.log('🚀 Testing Apify Google Maps Scraper...\n');

  const input = {
    searchStringsArray: ['plumber in Phoenix, AZ'],
    locationQuery: 'Phoenix, AZ',
    maxCrawledPlacesPerSearch: 10,
    language: 'en',
    scrapePlaceDetailPage: true,
    skipClosedPlaces: true,
    website: 'withoutWebsite', // Only businesses without websites
    scrapeContacts: true
  };

  try {
    // Start the actor
    console.log('📍 Starting Apify actor...');
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      }
    );

    if (!runResponse.ok) {
      throw new Error(`Failed to start actor: ${await runResponse.text()}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log(`✅ Actor started with run ID: ${runId}`);

    // Wait for completion
    console.log('\n⏳ Waiting for results (this may take 30-60 seconds)...');
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30; // 2.5 minutes max

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/compass~crawler-google-places/runs/${runId}?token=${APIFY_TOKEN}`
      );
      
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
      
      process.stdout.write(`\r⏳ Status: ${status} (${attempts * 5}s elapsed)`);
    }

    console.log('\n');

    if (status !== 'SUCCEEDED') {
      throw new Error(`Actor run failed with status: ${status}`);
    }

    // Get results
    console.log('📊 Fetching results...');
    const datasetId = runData.data.defaultDatasetId;
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
    );

    const results = await resultsResponse.json();
    
    console.log(`\n✅ Found ${results.length} businesses!\n`);

    // Display sample results
    results.slice(0, 3).forEach((place, index) => {
      console.log(`📍 Business ${index + 1}:`);
      console.log(`   Name: ${place.title}`);
      console.log(`   Address: ${place.address}`);
      console.log(`   Phone: ${place.phone || 'N/A'}`);
      console.log(`   Website: ${place.website || '❌ No website'}`);
      console.log(`   Rating: ${place.totalScore || 'N/A'} ⭐ (${place.reviewsCount || 0} reviews)`);
      
      if (place.emails && place.emails.length > 0) {
        console.log(`   Email: ✅ ${place.emails[0]}`);
      }
      
      console.log('');
    });

    // Cost calculation
    const placeCount = results.length;
    const baseCost = 0.007 + (placeCount * 0.004); // Actor start + places
    const detailsCost = placeCount * 0.002; // Place details
    const contactsCost = placeCount * 0.002; // Contact enrichment
    const totalCost = baseCost + detailsCost + contactsCost;

    console.log('💰 Cost Estimate:');
    console.log(`   Places scraped: ${placeCount}`);
    console.log(`   Cost per lead: $${(totalCost / placeCount).toFixed(4)}`);
    console.log(`   Total cost: $${totalCost.toFixed(4)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the test
testApifyGoogleMaps();