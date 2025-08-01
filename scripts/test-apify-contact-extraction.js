#!/usr/bin/env node

// Test script for Apify Google Maps contact extraction
// This tests different parameter combinations to identify the issue

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

if (!APIFY_TOKEN) {
  console.error('❌ APIFY_API_TOKEN environment variable not set');
  process.exit(1);
}

async function testContactExtraction() {
  console.log('🚀 Testing Apify Google Maps Contact Extraction...\n');

  // Test 1: Without contact extraction
  console.log('Test 1: Basic search WITHOUT contact extraction');
  const basicInput = {
    searchStringsArray: ['turf in Phoenix, AZ'],
    locationQuery: 'Phoenix, AZ',
    maxCrawledPlacesPerSearch: 5,
    language: 'en',
    scrapePlaceDetailPage: true,
    skipClosedPlaces: true
  };

  try {
    const response1 = await startApifyRun(basicInput);
    console.log('✅ Basic search started successfully\n');
  } catch (error) {
    console.error('❌ Basic search failed:', error.message, '\n');
  }

  // Test 2: With scrapeContacts parameter
  console.log('Test 2: Search WITH scrapeContacts: true');
  const contactInput = {
    ...basicInput,
    scrapeContacts: true
  };

  try {
    const response2 = await startApifyRun(contactInput);
    console.log('✅ Contact extraction search started successfully\n');
  } catch (error) {
    console.error('❌ Contact extraction search failed:', error.message, '\n');
  }

  // Test 3: Try alternative parameter names
  console.log('Test 3: Search with alternative parameter names');
  const alternativeInput = {
    ...basicInput,
    extractContacts: true,
    contactDetails: true,
    enrichContacts: true
  };

  try {
    const response3 = await startApifyRun(alternativeInput);
    console.log('✅ Alternative parameter search started successfully\n');
  } catch (error) {
    console.error('❌ Alternative parameter search failed:', error.message, '\n');
  }
}

async function startApifyRun(input) {
  console.log('Input:', JSON.stringify(input, null, 2));
  
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    }
  );

  if (!runResponse.ok) {
    const errorText = await runResponse.text();
    let errorMessage = 'Failed to start actor';
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error) {
        errorMessage = errorData.error.message || errorData.error;
      }
    } catch (e) {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  const runData = await runResponse.json();
  console.log(`Run ID: ${runData.data.id}`);
  return runData;
}

// Run the tests
testContactExtraction();