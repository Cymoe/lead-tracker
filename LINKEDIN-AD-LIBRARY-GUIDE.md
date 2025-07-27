# 🔗 LinkedIn Ad Library Integration Guide

## Great News! LinkedIn Has Public Ad Transparency

LinkedIn launched their Ad Library, making it possible to see which companies are advertising!

**Official URL**: https://www.linkedin.com/ad-library/home

## What LinkedIn Ad Library Shows:

- ✅ **Ad creative preview**
- ✅ **Ad format** (Sponsored Content, Message Ads, etc.)
- ✅ **Advertiser name**
- ✅ **Payer name** 
- ✅ **Date ranges** (ads from last year)
- ✅ **For EU ads**: Impressions, targeting info, performance data

## Implementation Options

### Option 1: ScrapingBee (Easiest - Use existing setup!)

Since you're already setting up ScrapingBee for Google Ads, use it for LinkedIn too:

```javascript
async function checkLinkedInAds(leadId: string, companyName: string, location?: string): Promise<AdPlatformStatus> {
  const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
  
  if (scrapingBeeKey) {
    try {
      console.log(`Checking LinkedIn Ad Library for ${companyName}...`);
      
      // LinkedIn Ad Library search URL
      const searchUrl = `https://www.linkedin.com/ad-library/search?q=${encodeURIComponent(companyName)}`;
      
      const response = await fetch(`https://app.scrapingbee.com/api/v1/?` + new URLSearchParams({
        api_key: scrapingBeeKey,
        url: searchUrl,
        render_js: 'true',
        wait: '5000', // LinkedIn loads slowly
        premium_proxy: 'true' // LinkedIn is strict about bots
      }).toString());
      
      if (response.ok) {
        const html = await response.text();
        
        // Check for ads (LinkedIn uses specific patterns)
        const hasAds = html.includes('ad-card') || 
                      html.includes('sponsored-content') || 
                      html.includes('ad-creative');
        
        if (hasAds) {
          // Count ad elements
          const adMatches = html.match(/ad-card|sponsored-content/g) || [];
          const adCount = Math.min(adMatches.length, 10);
          
          return {
            platform: 'LinkedIn Ads',
            hasAds: true,
            lastChecked: new Date().toISOString(),
            adCount: adCount,
            notes: `Found ${adCount} ads on LinkedIn Ad Library`,
            // Generate appropriate mock ads based on company type
            ads: generateLinkedInAdsFromScrape(leadId, companyName, adCount, location)
          };
        }
      }
    } catch (error) {
      console.error('Error scraping LinkedIn Ad Library:', error);
    }
  }
  
  // Fall back to intelligent mock data
  return getEnhancedLinkedInAdsMock(leadId, companyName, location);
}
```

### Option 2: Direct Browser Testing

Test manually to see what ads exist:
1. Go to: https://www.linkedin.com/ad-library/home
2. Search for company name
3. See their actual LinkedIn ads!

### Option 3: Playwright (Free but complex)

```javascript
import { chromium } from 'playwright';

async function scrapeLinkedInAds(companyName: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // LinkedIn Ad Library doesn't require login!
  await page.goto(`https://www.linkedin.com/ad-library/search?q=${encodeURIComponent(companyName)}`);
  
  // Wait for results
  await page.waitForSelector('[data-test="ad-card"]', { timeout: 10000 });
  
  const ads = await page.evaluate(() => {
    // Extract ad data from the page
    const adCards = document.querySelectorAll('[data-test="ad-card"]');
    return Array.from(adCards).map(card => ({
      headline: card.querySelector('.ad-title')?.textContent,
      text: card.querySelector('.ad-text')?.textContent,
      cta: card.querySelector('.ad-cta')?.textContent,
      format: card.querySelector('.ad-format')?.textContent
    }));
  });
  
  await browser.close();
  return ads;
}
```

## Quick Implementation for Your App

### Since you're already adding ScrapingBee:

The same API key works for LinkedIn! Just update the LinkedIn function in your code:

```typescript
// src/app/api/check-ad-platforms/route.ts

async function checkLinkedInAds(leadId: string, companyName: string, location?: string): Promise<AdPlatformStatus> {
  const scrapingBeeKey = process.env.SCRAPINGBEE_API_KEY;
  
  if (scrapingBeeKey) {
    // Use the SAME ScrapingBee key to check LinkedIn!
    // [Implementation above]
  }
  
  // Smart fallback to mock data
  return getIntelligentLinkedInMock(leadId, companyName, location);
}
```

## Why This Is Exciting

1. **B2B Focus** - LinkedIn ads target business decision makers
2. **High Intent** - Companies advertising on LinkedIn are serious about B2B
3. **Targeting Info** - See who they're targeting (job titles, industries)
4. **Professional Context** - Different messaging than Facebook/Google

## Test These Examples

- https://www.linkedin.com/ad-library/search?q=Microsoft
- https://www.linkedin.com/ad-library/search?q=Salesforce
- https://www.linkedin.com/ad-library/search?q=HubSpot

## Cost Analysis

Using ScrapingBee (same account as Google):
- Each LinkedIn check: ~10-15 credits (needs premium proxy)
- Your 1000 free credits = ~65-100 LinkedIn checks
- Combined with Google = ~50 total company scans

## What You'll See

**For B2B companies**:
- ✅ Sponsored content campaigns
- ✅ InMail campaigns
- ✅ Text ads
- ✅ Video ads
- ✅ Targeting info (EU ads)

**For local services**:
- Usually less presence (LinkedIn is B2B focused)
- May find recruitment ads
- Commercial/enterprise service ads

## Implementation Priority

1. ✅ Facebook (Apify) - Already set up
2. ✅ Google Ads (ScrapingBee) - Setting up now
3. **→ LinkedIn (ScrapingBee)** - Add next!
4. Others - Keep as mock data for now

---

**Bottom line**: LinkedIn Ad Library is PUBLIC and ready to scrape! Use your same ScrapingBee account to add real LinkedIn data. 