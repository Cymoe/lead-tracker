#!/usr/bin/env node

// Full flow test for Apify contact extraction

require('dotenv').config({ path: '.env.local' });

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

if (!APIFY_TOKEN) {
  console.error('❌ APIFY_API_TOKEN not found in .env.local');
  process.exit(1);
}

async function testFullFlow() {
  console.log('🚀 Testing Full Apify Flow with Contact Extraction...\n');

  const input = {
    searchStringsArray: ['turf in Phoenix, AZ'],
    locationQuery: 'Phoenix, AZ',
    maxCrawledPlacesPerSearch: 5,
    language: 'en',
    scrapePlaceDetailPage: true,
    skipClosedPlaces: true,
    scrapeContacts: true // Contact extraction enabled
  };

  try {
    // Start the actor
    console.log('📍 Starting actor...');
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
    console.log('\n⏳ Waiting for results (contact extraction may take 5-10 minutes)...');
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max

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

    // Display results with contact info
    let contactsFound = 0;
    results.forEach((place, index) => {
      console.log(`📍 Business ${index + 1}: ${place.title}`);
      console.log(`   Address: ${place.address}`);
      console.log(`   Website: ${place.website || '❌ No website'}`);
      
      // Check for extracted contacts
      if (place.emails && place.emails.length > 0) {
        console.log(`   ✅ Emails: ${place.emails.join(', ')}`);
        contactsFound++;
      }
      
      if (place.phones && place.phones.length > 0) {
        console.log(`   ✅ Phones: ${place.phones.join(', ')}`);
      }
      
      const socialMedia = [];
      if (place.facebooks?.length) socialMedia.push(`Facebook: ${place.facebooks[0]}`);
      if (place.instagrams?.length) socialMedia.push(`Instagram: ${place.instagrams[0]}`);
      if (place.linkedIns?.length) socialMedia.push(`LinkedIn: ${place.linkedIns[0]}`);
      if (place.twitters?.length) socialMedia.push(`Twitter: ${place.twitters[0]}`);
      
      if (socialMedia.length > 0) {
        console.log(`   ✅ Social Media:`);
        socialMedia.forEach(sm => console.log(`      - ${sm}`));
      }
      
      console.log('');
    });

    console.log(`📧 Contact extraction summary: ${contactsFound}/${results.length} businesses with email contacts`);

    // Cost calculation
    const placeCount = results.length;
    const baseCost = 0.007 + (placeCount * 0.004);
    const detailsCost = placeCount * 0.002;
    const contactsCost = placeCount * 0.002;
    const totalCost = baseCost + detailsCost + contactsCost;

    console.log('\n💰 Cost Estimate:');
    console.log(`   Places scraped: ${placeCount}`);
    console.log(`   With contact extraction: $${contactsCost.toFixed(4)}`);
    console.log(`   Total cost: $${totalCost.toFixed(4)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the test
testFullFlow();