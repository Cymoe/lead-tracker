// Simple script to call the fix endpoint
async function fixSearchQueries() {
  try {
    console.log('Calling fix-missing-search-queries endpoint...');
    
    const response = await fetch('http://localhost:3001/api/fix-missing-search-queries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error('Request failed:', response.status, response.statusText);
      return;
    }
    
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

console.log('Note: This script requires the dev server to be running on port 3001');
console.log('You also need to be logged in to the app in your browser');
console.log('Open the app in your browser first, then run this script\n');

// Give user time to read the message
setTimeout(fixSearchQueries, 3000);